// Panadería Bombayashi · servidor Node.js sin dependencias externas.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// .env opcional (sin dotenv)
try {
  for (const l of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !l.trim().startsWith('#') && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {}

const V = require('./lib/views');
const O = require('./lib/orders');
const S = require('./lib/stripe');
const store = require('./lib/store');
const { CONFIG } = require('./lib/catalog');
const A = require('./lib/admin');
const stockLib = require('./lib/stock');
const crypto = require('crypto');

// Login del panel admin (credenciales por defecto de la demo; se pueden cambiar con ADMIN_USER / ADMIN_PASS en .env)
const ADMIN_USER = process.env.ADMIN_USER || 'admin', ADMIN_PASS = process.env.ADMIN_PASS || '123';
const sessions = new Map();
const digest = (v) => crypto.createHash('sha256').update(String(v)).digest();
const same = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));
const getCookie = (req, n) => (req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).find(([k]) => k === n)?.[1];
const isAdmin = (req) => { const e = sessions.get(getCookie(req, 'bbadmin')); return !!e && e > Date.now(); };
const loginTries = new Map();
const tooMany = (req) => { const ip = req.socket.remoteAddress, now = Date.now(); const h = (loginTries.get(ip) || []).filter((t) => now - t < 60_000); h.push(now); loginTries.set(ip, h); return h.length > 8; };

const PORT = Number(process.env.PORT) || 3000;
const BASE = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const PUB = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

const SEC = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; form-action 'self' https://checkout.stripe.com https://wa.me; connect-src 'self'; frame-ancestors 'none'",
};

// Modo desarrollo (npm run dev): recarga automática del navegador al cambiar archivos.
const DEV = process.env.DEV === '1';
const clients = new Set();
const LIVE = `<script>(()=>{let ok=false;const c=()=>{const e=new EventSource('/__live');e.onopen=()=>{if(ok)location.reload();ok=true};e.onmessage=m=>{if(m.data==='css'){document.querySelectorAll('link[rel=stylesheet]').forEach(l=>{const u=new URL(l.href);u.searchParams.set('t',Date.now());l.href=u})}else location.reload()};e.onerror=()=>{e.close();setTimeout(c,500)}};c()})()</script>`;
if (DEV) {
  let t; const ping = (kind) => { clearTimeout(t); t = setTimeout(() => clients.forEach((r) => r.write(`data: ${kind}\n\n`)), 80); };
  try { fs.watch(PUB, { recursive: true }, (_, f) => ping(/\.css$/.test(f || '') ? 'css' : 'full')); } catch (e) { console.error('watch:', e.message); }
}

const send = (res, code, body, type = 'text/html; charset=utf-8', extra = {}) => {
  if (DEV && type.startsWith('text/html') && typeof body === 'string') body = body.replace('</body>', LIVE + '</body>');
  res.writeHead(code, { 'Content-Type': type, ...SEC, ...extra });
  res.end(body);
};
const json = (res, code, obj) => send(res, code, JSON.stringify(obj), 'application/json');
const redirect = (res, to) => { res.writeHead(303, { Location: to, ...SEC }); res.end(); };

function readBody(req, limit = 100_000) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', (c) => { d += c; if (d.length > limit) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => resolve(d));
    req.on('error', reject);
  });
}
const parseJson = async (req) => { try { return JSON.parse(await readBody(req)); } catch { return null; } };

function serveStatic(req, res, pathname) {
  const file = path.normalize(path.join(PUB, decodeURIComponent(pathname)));
  if (!file.startsWith(PUB)) return false;
  let st; try { st = fs.statSync(file); } catch { return false; }
  if (!st.isFile()) return false;
  const ext = path.extname(file);
  const long = /\.(jpg|png|woff2)$/.test(ext);
  res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': long ? 'public, max-age=604800' : 'no-cache', ...SEC });
  fs.createReadStream(file).pipe(res);
  return true;
}

const rate = new Map(); // límite simple por IP para los POST
function limited(req) {
  const ip = req.socket.remoteAddress, now = Date.now();
  const hits = (rate.get(ip) || []).filter((t) => now - t < 60_000); hits.push(now); rate.set(ip, hits);
  return hits.length > 30;
}

async function route(req, res) {
  const url = new URL(req.url, BASE);
  const p = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'GET' || req.method === 'HEAD') {
    if (serveStatic(req, res, p)) return;
    if (DEV && p === '/__live') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write('retry: 500\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
    }
    if (p === '/admin/login') return isAdmin(req) ? redirect(res, '/admin') : send(res, 200, A.login(), 'text/html; charset=utf-8', { 'Cache-Control': 'no-store' });
    if (p === '/admin' || p.startsWith('/admin/')) {
      if (!isAdmin(req)) return redirect(res, '/admin/login');
      const orders = store.all('orders'), H = { 'Cache-Control': 'no-store' };
      if (p === '/admin') return send(res, 200, A.dashboard(orders), 'text/html; charset=utf-8', H);
      if (p === '/admin/transacciones') return send(res, 200, A.transactions(orders, url.searchParams.get('estado') || '', (url.searchParams.get('q') || '').slice(0, 60)), 'text/html; charset=utf-8', H);
      if (p === '/admin/inventario') return send(res, 200, A.inventory(orders), 'text/html; charset=utf-8', H);
      if (p === '/admin/export.csv') return send(res, 200, A.csv(orders), 'text/csv; charset=utf-8', { 'Content-Disposition': 'attachment; filename="transacciones-bombayashi.csv"', ...H });
      return send(res, 404, V.notFound());
    }
    switch (p) {
      case '/': return send(res, 200, V.home());
      case '/nosotros': case '/acerca-de': return send(res, 200, V.about());
      case '/contacto': return send(res, 200, V.contact(url.searchParams.get('enviado') === '1'));
      case '/politicas': return send(res, 200, V.policies());
      case '/pedido': return send(res, 200, V.checkout(url.searchParams.get('cancelado') === '1'));
      case '/health': return json(res, 200, { ok: true, stripe: S.enabled() });
      case '/pago/simulado': {
        const o = O.get(url.searchParams.get('order') || '');
        return o && !S.enabled() ? send(res, 200, V.mockStripe(o)) : send(res, 404, V.notFound());
      }
      case '/gracias': {
        let o = O.get(url.searchParams.get('order') || '');
        if (!o) return send(res, 404, V.notFound());
        const sid = url.searchParams.get('session_id');
        if (sid && S.enabled() && !o.paid) {
          try {
            const s = await S.retrieve(sid);
            if (s.client_reference_id === o.id && s.payment_status === 'paid') o = O.update(o.id, { paid: true, status: 'pagado', stripeSession: s.id });
          } catch (e) { console.error('Stripe retrieve:', e.message); }
        }
        return send(res, 200, V.thanks(o, !S.enabled()));
      }
    }
    return send(res, 404, V.notFound());
  }

  if (req.method === 'POST') {
    if (limited(req)) return json(res, 429, { error: 'Demasiados intentos, esperá un minuto.' });

    if (p === '/admin/login') {
      if (tooMany(req)) return send(res, 429, A.login('Demasiados intentos. Esperá un minuto.'));
      const f = new URLSearchParams(await readBody(req));
      if (same(f.get('user') || '', ADMIN_USER) && same(f.get('pass') || '', ADMIN_PASS)) {
        const t = crypto.randomBytes(24).toString('hex'); sessions.set(t, Date.now() + 8 * 3600_000);
        res.writeHead(303, { Location: '/admin', 'Set-Cookie': `bbadmin=${t}; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=28800`, ...SEC }); return res.end();
      }
      return send(res, 401, A.login('Usuario o contraseña incorrectos.'));
    }
    if (p === '/admin/logout') {
      sessions.delete(getCookie(req, 'bbadmin'));
      res.writeHead(303, { Location: '/admin/login', 'Set-Cookie': 'bbadmin=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0', ...SEC }); return res.end();
    }
    if (p.startsWith('/admin/api/')) {
      if (!isAdmin(req)) return json(res, 401, { ok: false });
      const b = await parseJson(req) || {};
      if (p === '/admin/api/stock') { const n = stockLib.set(String(b.id), b.stock); return n === null ? json(res, 404, { ok: false }) : json(res, 200, { ok: true, stock: n }); }
      if (p === '/admin/api/order') { const o = ['paid', 'delivered', 'cancel'].includes(b.action) && O.setStatus(String(b.id), b.action); return o ? json(res, 200, { ok: true }) : json(res, 404, { ok: false }); }
      return json(res, 404, { ok: false });
    }

    if (p === '/api/checkout') {
      const body = await parseJson(req);
      if (!body) return json(res, 400, { errors: { global: 'Solicitud inválida.' } });
      const { order, errors } = O.buildOrder(body);
      if (errors) return json(res, 422, { errors });
      O.reserve(order);
      if (order.customer.pay !== 'tarjeta') return json(res, 200, { redirect: `/gracias?order=${order.id}` });
      if (!S.enabled()) return json(res, 200, { redirect: `/pago/simulado?order=${order.id}` });
      try {
        const s = await S.createCheckout(order, BASE);
        O.update(order.id, { stripeSession: s.id });
        return json(res, 200, { redirect: s.url });
      } catch (e) {
        console.error('Stripe:', e.message);
        return json(res, 502, { errors: { global: 'No pudimos abrir el pago con tarjeta. Probá de nuevo o elegí otra forma de pago.' } });
      }
    }

    if (p === '/pago/simulado') {
      const f = new URLSearchParams(await readBody(req));
      const o = O.get(f.get('order') || '');
      if (!o || S.enabled()) return send(res, 404, V.notFound());
      const digits = (f.get('card') || '').replace(/\D/g, '');
      if (digits !== '4242424242424242') return send(res, 402, V.mockStripe(o).replace('<p class="test-flag">', '<p class="test-flag">Tarjeta rechazada: usá 4242 4242 4242 4242. '));
      O.update(o.id, { paid: true, status: 'pagado', stripeSession: 'mock_' + o.id });
      return redirect(res, `/gracias?order=${o.id}`);
    }

    if (p === '/api/contact') {
      const b = await parseJson(req);
      const name = O.clean(b?.name, 80), phone = O.clean(b?.phone, 30), message = O.clean(b?.message, 1000);
      const errors = {};
      if (!name) errors.name = 'Decinos tu nombre.';
      if (phone.replace(/\D/g, '').length < 8) errors.phone = 'Poné un WhatsApp válido.';
      if (!message) errors.message = 'Escribí tu mensaje.';
      if (Object.keys(errors).length) return json(res, 422, { errors });
      store.add('messages', { id: Date.now().toString(36), at: new Date().toISOString(), name, phone, reason: O.clean(b.reason, 60), message });
      return json(res, 200, { ok: true });
    }
  }
  send(res, 405, 'Método no permitido', 'text/plain; charset=utf-8');
}

http.createServer((req, res) => {
  route(req, res).catch((e) => { console.error(e); if (!res.headersSent) send(res, 500, 'Error interno', 'text/plain; charset=utf-8'); });
}).listen(PORT, () => {
  console.log(`\n  ${CONFIG.name} → ${BASE}`);
  console.log(`  Pagos con tarjeta: ${S.enabled() ? 'Stripe (modo prueba, llave sk_test detectada)' : 'simulador local (agregá STRIPE_SECRET_KEY en .env para usar Stripe real)'}`);
  if (DEV) console.log('  Modo dev: recarga en vivo activa (HMR de CSS, recarga completa en JS/HTML/servidor)');
  console.log(`  Panel admin:       ${BASE}/admin  (usuario: ${ADMIN_USER})\n`);
});

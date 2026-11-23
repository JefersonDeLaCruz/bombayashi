// Vistas del panel admin (layout propio, separado de la tienda).
const { CONFIG, PRODUCTS, money } = require('./catalog');
const stock = require('./stock');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const shell = (title, path, body, script = '') => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Admin Bombayashi</title><meta name="robots" content="noindex"><link rel="icon" type="image/png" href="/img/favicon.png"><link rel="stylesheet" href="/css/app.css"><link rel="stylesheet" href="/css/admin.css"></head>
<body class="adm"><header class="adm-top"><div class="adm-in"><a class="brand" href="/admin"><img src="/img/logo-isotipo.png" alt="" width="34" height="39"><span>Bombayashi <small>admin</small></span></a>
<nav class="adm-nav" aria-label="Admin">${[['/admin', 'Resumen'], ['/admin/transacciones', 'Transacciones'], ['/admin/inventario', 'Inventario']].map(([h, t]) => `<a href="${h}"${h === path ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
<div class="adm-act"><a class="btn btn-light btn-sm" href="/" target="_blank" rel="noopener">Ver tienda</a><form method="post" action="/admin/logout"><button class="btn btn-dark btn-sm" type="submit">Salir</button></form></div></div></header>
<main class="adm-main">${body}</main><div class="toast" id="toast" role="status"></div>
<script>const say=(m)=>{const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(window._t);window._t=setTimeout(()=>t.classList.remove('show'),1800)};
async function api(u,b){const r=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});if(r.status===401){location.href='/admin/login';return}return r.json()}</script>${script}</body></html>`;

function login(error) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ingresar · Admin Bombayashi</title><meta name="robots" content="noindex"><link rel="icon" type="image/png" href="/img/favicon.png"><link rel="stylesheet" href="/css/app.css"><link rel="stylesheet" href="/css/admin.css"></head>
<body class="adm login-page"><main class="login-card card"><img src="/img/logo-imagotipo.png" alt="Bombayashi" width="170" height="173"><h1>Panel admin</h1><p class="fine">Acceso solo para el equipo.</p>
${error ? `<p class="warn-box" role="alert">${esc(error)}</p>` : ''}
<form method="post" action="/admin/login"><label class="field">Usuario<input name="user" autocomplete="username" required autofocus></label>
<label class="field">Contraseña<input name="pass" type="password" autocomplete="current-password" required></label>
<button class="btn btn-dark btn-block btn-lg" type="submit" style="margin-top:20px">Entrar</button></form><p class="fine"><a href="/">← Volver a la tienda</a></p></main></body></html>`;
}

const STATUS = { pendiente: 'Pendiente', pagado: 'Pagado', entregado: 'Entregado', cancelado: 'Cancelado' };
const badge = (o) => `<span class="pill st-${o.status}">${STATUS[o.status] || o.status}</span>`;
const payBadge = (o) => `<span class="pill ${o.paid ? 'st-pagado' : 'st-pendiente'}">${o.paid ? 'Cobrado' : 'Sin cobrar'}</span>`;

function orderRows(list) {
  return list.map((o) => `<tr data-id="${esc(o.id)}"><td><strong>${esc(o.id)}</strong></td><td>${esc(o.createdAt.slice(0, 16).replace('T', ' '))}</td>
<td>${esc(o.customer.name)}<br><small>${esc(o.customer.phone)}</small></td>
<td>${o.lines.map((l) => `${l.qty}× ${esc(l.name)}`).join('<br>')}</td><td class="num-c"><strong>${money(o.total)}</strong></td>
<td>${esc(o.customer.pay)}<br>${payBadge(o)}</td><td>${esc(o.customer.mode === 'envio' ? 'Envío' : 'Retiro')} · ${esc(o.customer.date)}<br><small>${esc(o.customer.slot)}</small></td><td>${badge(o)}</td>
<td class="acts">${o.status === 'cancelado' || o.status === 'entregado' ? '' : `${o.paid ? '' : `<button class="mini" data-a="paid">Marcar cobrado</button>`}<button class="mini ok" data-a="delivered">Entregado</button><button class="mini bad" data-a="cancel">Cancelar</button>`}</td></tr>`).join('');
}

function dashboard(orders) {
  const valid = orders.filter((o) => o.status !== 'cancelado');
  const cobrado = valid.filter((o) => o.paid).reduce((a, o) => a + o.total, 0);
  const porCobrar = valid.filter((o) => !o.paid).reduce((a, o) => a + o.total, 0);
  const pend = orders.filter((o) => o.status === 'pendiente' || o.status === 'pagado').length;
  const st = stock.all(); const low = PRODUCTS.filter((p) => st[p.id] <= stock.LOW);
  const tile = (n, l, c = '') => `<div class="card tile ${c}"><b>${n}</b><span>${l}</span></div>`;
  return shell('Resumen', '/admin', `<h1>Resumen</h1><div class="tiles">${tile(money(cobrado), 'Cobrado', 'good')}${tile(money(porCobrar), 'Por cobrar')}${tile(orders.length, 'Pedidos en total')}${tile(pend, 'Por entregar')}${tile(low.length, low.length ? 'Productos con poco stock' : 'Stock en orden', low.length ? 'warn' : '')}</div>
${low.length ? `<p class="warn-box">Poco stock: ${low.map((p) => `<strong>${esc(p.name)}</strong> (${st[p.id]})`).join(', ')}. <a href="/admin/inventario">Ajustar inventario →</a></p>` : ''}
<h2>Últimos pedidos</h2>${table(orders.slice(-8).reverse())}`, tableScript());
}

const table = (list) => `<div class="table-wrap"><table class="tbl"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Pago</th><th>Entrega</th><th>Estado</th><th></th></tr></thead><tbody>${orderRows(list) || '<tr><td colspan="9" class="empty-c">Todavía no hay pedidos.</td></tr>'}</tbody></table></div>`;
const tableScript = () => `<script>document.addEventListener('click',async(e)=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.closest('tr').dataset.id;if(a==='cancel'&&!confirm('¿Cancelar el pedido '+id+'? El stock vuelve al inventario.'))return;b.disabled=true;const j=await api('/admin/api/order',{id,action:a});if(j&&j.ok){say('Pedido actualizado');setTimeout(()=>location.reload(),500)}else{say('No se pudo');b.disabled=false}})</script>`;

function transactions(orders, filter, q) {
  const f = ['pendiente', 'pagado', 'entregado', 'cancelado'].includes(filter) ? filter : '';
  let list = orders.slice().reverse();
  if (f) list = list.filter((o) => o.status === f);
  if (q) { const t = q.toLowerCase(); list = list.filter((o) => (o.id + o.customer.name + o.customer.phone).toLowerCase().includes(t)); }
  const sum = list.filter((o) => o.status !== 'cancelado').reduce((a, o) => a + o.total, 0);
  return shell('Transacciones', '/admin/transacciones', `<div class="head-row"><h1>Historial de transacciones</h1><a class="btn btn-light btn-sm" href="/admin/export.csv">Descargar CSV</a></div>
<form class="filters" method="get"><input type="search" name="q" value="${esc(q)}" placeholder="Buscar por pedido, nombre o teléfono" aria-label="Buscar"><select name="estado" aria-label="Estado">${[['', 'Todos'], ['pendiente', 'Pendientes'], ['pagado', 'Pagados'], ['entregado', 'Entregados'], ['cancelado', 'Cancelados']].map(([v, t]) => `<option value="${v}"${v === f ? ' selected' : ''}>${t}</option>`).join('')}</select><button class="btn btn-dark btn-sm" type="submit">Filtrar</button></form>
<p class="fine">${list.length} pedidos · ${money(sum)} sin contar cancelados</p>${table(list)}`, tableScript());
}

function inventory(orders) {
  const st = stock.all();
  const sold = {}; orders.filter((o) => o.status !== 'cancelado').forEach((o) => o.lines.forEach((l) => (sold[l.id] = (sold[l.id] || 0) + l.qty)));
  const rows = PRODUCTS.map((p) => { const n = st[p.id]; const s = n <= 0 ? ['Agotado', 'st-cancelado'] : n <= stock.LOW ? ['Poco', 'st-pendiente'] : ['Disponible', 'st-pagado'];
    return `<tr data-id="${p.id}"><td><strong>${esc(p.name)}</strong><br><small>${p.kind === 'combo' ? 'Combo' : 'Pan'}</small></td><td>${money(p.price)}</td>
<td><div class="qty"><button type="button" data-d="-1" aria-label="Restar uno a ${esc(p.name)}">−</button><input type="number" min="0" max="99999" value="${n}" aria-label="Stock de ${esc(p.name)}"><button type="button" data-d="1" aria-label="Sumar uno a ${esc(p.name)}">+</button></div></td>
<td><button class="mini" data-d="10">+10</button> <button class="mini" data-d="50">+50</button></td><td>${sold[p.id] || 0}</td><td><span class="pill ${s[1]}" data-pill>${s[0]}</span></td></tr>`; }).join('');
  return shell('Inventario', '/admin/inventario', `<h1>Inventario</h1><p class="lead-sm">Cambiá el stock y se guarda al instante. Cuando algo llega a 0, la tienda lo muestra como “Agotado”. Poco stock = ${stock.LOW} o menos.</p>
<div class="table-wrap"><table class="tbl"><thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Reponer</th><th>Vendidos</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    `<script>const LOW=${stock.LOW};function pill(tr,n){const p=tr.querySelector('[data-pill]');const s=n<=0?['Agotado','st-cancelado']:n<=LOW?['Poco','st-pendiente']:['Disponible','st-pagado'];p.textContent=s[0];p.className='pill '+s[1]}
async function save(tr,n){n=Math.max(0,Math.min(99999,Math.floor(+n||0)));const j=await api('/admin/api/stock',{id:tr.dataset.id,stock:n});if(j&&j.ok){tr.querySelector('input').value=j.stock;pill(tr,j.stock);say('Stock guardado: <b>'+j.stock+'</b>')}else say('No se pudo guardar')}
document.addEventListener('click',(e)=>{const b=e.target.closest('[data-d]');if(!b)return;const tr=b.closest('tr'),i=tr.querySelector('input');save(tr,(+i.value||0)+ +b.dataset.d)});
document.addEventListener('change',(e)=>{if(e.target.matches('input[type=number]'))save(e.target.closest('tr'),e.target.value)})</script>`);
}

function csv(orders) {
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const head = ['pedido', 'fecha', 'cliente', 'telefono', 'productos', 'total_usd', 'pago', 'cobrado', 'estado', 'entrega', 'dia', 'horario'];
  return [head.join(','), ...orders.map((o) => [o.id, o.createdAt, o.customer.name, o.customer.phone, o.lines.map((l) => `${l.qty}x ${l.name}`).join('; '), (o.total / 100).toFixed(2), o.customer.pay, o.paid ? 'si' : 'no', o.status, o.customer.mode, o.customer.date, o.customer.slot].map(q).join(','))].join('\n');
}

module.exports = { login, dashboard, transactions, inventory, csv };

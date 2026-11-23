// Reglas de negocio del pedido: se recalcula TODO en el servidor (nunca se confía en el precio del navegador).
const { CONFIG, SLOTS, byId, money } = require('./catalog');
const store = require('./store');
const stock = require('./stock');

const clean = (s, max = 200) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max);

function todayStr(offsetDays = 0) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function buildOrder(body) {
  const errors = {};
  const lines = [];
  let subtotal = 0, hasCombo = false;
  for (const [id, q] of Object.entries(body.items || {})) {
    const p = byId[id]; const qty = Math.floor(Number(q));
    if (!p || !(qty > 0)) continue;
    if (qty > 999) { errors.items = 'Máximo 999 por producto.'; continue; }
    const left = stock.get(id);
    if (qty > left) { errors.items = left <= 0 ? `${p.name} se agotó. Quitalo del carrito para continuar.` : `Solo quedan ${left} de ${p.name}.`; continue; }
    lines.push({ id, name: p.name, qty, unit: p.price, total: p.price * qty });
    subtotal += p.price * qty; if (p.kind === 'combo') hasCombo = true;
  }
  if (!lines.length) errors.items = 'Agregá al menos un producto.';

  const c = body.customer || {};
  const mode = c.mode === 'envio' ? 'envio' : 'retiro';
  const name = clean(c.name, 80), phone = clean(c.phone, 30), address = clean(c.address, 200);
  const date = clean(c.date, 10), slot = SLOTS.find((s) => s.id === c.slot);
  const pay = ['tarjeta', 'efectivo', 'transferencia'].includes(c.pay) ? c.pay : null;

  if (!name) errors.name = 'Decinos tu nombre.';
  if (phone.replace(/\D/g, '').length < 8) errors.phone = 'Poné un WhatsApp válido (8 dígitos).';
  if (mode === 'envio' && !address) errors.address = 'Poné la dirección de entrega.';
  if (mode === 'envio' && subtotal < CONFIG.minDeliveryCents)
    errors.items = `Para envío el pedido mínimo es ${money(CONFIG.minDeliveryCents)}.`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = 'Elegí el día.';
  else {
    const min = todayStr(hasCombo ? 1 : 0);
    if (date < min) errors.date = hasCombo ? 'Los combos se piden con 1 día de anticipación.' : 'Elegí una fecha desde hoy.';
    else if (new Date(date + 'T12:00:00').getDay() === 0 && slot && !slot.sunday) errors.slot = 'Los domingos atendemos hasta las 12:00 m.';
  }
  if (!slot) errors.slot = errors.slot || 'Elegí un horario.';
  if (!pay) errors.pay = 'Elegí la forma de pago.';
  if (Object.keys(errors).length) return { errors };

  const id = 'BB-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
  return {
    order: {
      id, createdAt: new Date().toISOString(), status: 'pendiente', paid: false,
      lines, subtotal, total: subtotal, currency: CONFIG.currency,
      customer: { name, phone, mode, address: mode === 'envio' ? address : '', date, slot: slot.label, pay, notes: clean(c.notes, 300) },
    },
  };
}

function whatsappText(o) {
  const L = o.lines.map((l) => `• ${l.qty} × ${l.name} — ${money(l.total)}`);
  return ['Hola Bombayashi, hice el pedido ' + o.id + ':', '', ...L, '', `Total: ${money(o.total)} (IVA incluido)`,
    `Entrega: ${o.customer.mode === 'envio' ? 'Envío a ' + o.customer.address : 'Retiro en la panadería'}`,
    `Para: ${o.customer.date} · ${o.customer.slot}`, `Pago: ${o.customer.pay}${o.paid ? ' (ya pagado con tarjeta)' : ''}`,
    `A nombre de: ${o.customer.name}`, ...(o.customer.notes ? ['Notas: ' + o.customer.notes] : [])].join('\n');
}

function reserve(o) { o.lines.forEach((l) => stock.adjust(l.id, -l.qty)); return store.add('orders', o); }
function setStatus(id, action) {
  const o = store.find('orders', id); if (!o) return null;
  if (action === 'paid') return store.update('orders', id, { paid: true, status: o.status === 'pendiente' ? 'pagado' : o.status });
  if (action === 'delivered') return store.update('orders', id, { status: 'entregado', ...(o.customer.pay === 'tarjeta' ? {} : { paid: true }) });
  if (action === 'cancel' && o.status !== 'cancelado') { o.lines.forEach((l) => stock.adjust(l.id, l.qty)); return store.update('orders', id, { status: 'cancelado' }); }
  return o;
}
module.exports = { buildOrder, whatsappText, reserve, setStatus, save: (o) => store.add('orders', o), get: (id) => store.find('orders', id), update: (id, p) => store.update('orders', id, p), clean };

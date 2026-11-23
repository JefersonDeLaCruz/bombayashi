// Stripe Checkout en modo prueba, sin SDK: llamadas REST con fetch.
// Con STRIPE_SECRET_KEY=sk_test_... crea sesiones reales de prueba. Sin llave, el servidor usa un simulador local.
const KEY = () => process.env.STRIPE_SECRET_KEY || '';
const enabled = () => /^sk_test_/.test(KEY()) && !/x{6,}/.test(KEY());

async function api(method, path, form) {
  const r = await fetch('https://api.stripe.com' + path, {
    method,
    headers: { Authorization: 'Bearer ' + KEY(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || 'Stripe respondió ' + r.status);
  return j;
}

async function createCheckout(order, baseUrl) {
  const f = {
    mode: 'payment',
    success_url: `${baseUrl}/gracias?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pedido?cancelado=1`,
    client_reference_id: order.id,
    'metadata[order_id]': order.id,
    locale: 'es',
  };
  order.lines.forEach((l, i) => {
    f[`line_items[${i}][quantity]`] = l.qty;
    f[`line_items[${i}][price_data][currency]`] = order.currency;
    f[`line_items[${i}][price_data][unit_amount]`] = l.unit;
    f[`line_items[${i}][price_data][product_data][name]`] = l.name;
  });
  const s = await api('POST', '/v1/checkout/sessions', f);
  return { id: s.id, url: s.url };
}

const retrieve = (id) => api('GET', '/v1/checkout/sessions/' + encodeURIComponent(id));

module.exports = { enabled, createCheckout, retrieve };

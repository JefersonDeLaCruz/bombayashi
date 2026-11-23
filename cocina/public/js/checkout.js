(() => {
  const { BY, CAT, money, esc } = window.BB, B = window.BB;
  const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
  const form = $('#co-form'), MIN = 300;
  const mode = () => form.mode.value;
  const hasCombo = () => Object.keys(B.cart).some((id) => BY[id].kind === 'combo');
  const ymd = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  function render() {
    const ids = Object.keys(B.cart);
    $$('[data-qty]').forEach((el) => { const q = B.cart[el.dataset.qty] || 0; const inp = el.querySelector('input'); if (document.activeElement !== inp) inp.value = q; el.querySelector('[data-m="-1"]').disabled = !q; el.querySelector('[data-m="1"]').disabled = q >= BY[el.dataset.qty].stock; el.closest('.add-row').classList.toggle('has', q > 0); });
    $('#s-lines').innerHTML = ids.length ? ids.map((id) => `<li><span>${B.cart[id]} × ${esc(BY[id].name)}</span><span>${money(BY[id].price * B.cart[id])}</span></li>`).join('') : '<li class="empty">Todavía no agregaste nada.</li>';
    const s = B.subtotal(); $('#s-sub').textContent = money(s); $('#s-tot').textContent = money(s);
    $('#s-ship').textContent = mode() === 'envio' ? 'Se confirma por zona' : 'Gratis (retiro)';
    $('#w-addr').hidden = mode() !== 'envio';
    $('#h-combo').hidden = !hasCombo();
    const min = new Date(); if (hasCombo()) min.setDate(min.getDate() + 1);
    const d = $('#f-date'); d.min = ymd(min); if (d.value && d.value < d.min) d.value = d.min;
    const sun = d.value && new Date(d.value + 'T12:00:00').getDay() === 0;
    [...$('#f-slot').options].forEach((o) => { if (o.dataset.sun) { o.disabled = sun && o.dataset.sun === 'false'; if (o.disabled && o.selected) $('#f-slot').value = ''; } });
    $('#pay-btn').textContent = form.pay.value === 'tarjeta' ? 'Confirmar y pagar con tarjeta' : 'Confirmar pedido';
  }
  $('.add-list').addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; const id = b.parentNode.dataset.qty; B.setQty(id, (B.cart[id] || 0) + +b.dataset.m); });
  $('.add-list').addEventListener('change', (e) => { if (e.target.matches('input')) B.setQty(e.target.parentNode.dataset.qty, e.target.value); });
  $('#clear-cart').addEventListener('click', () => B.clear());
  document.addEventListener('bb:cart', render);
  form.addEventListener('change', render);
  $('#f-date').valueAsDate = null; render();
  // Fecha sugerida: hoy (o mañana si hay combos)
  if (!$('#f-date').value) $('#f-date').value = $('#f-date').min;
  render();

  const field = (name) => document.getElementById('e-' + name);
  function showErrors(errs) {
    $$('.err').forEach((e) => (e.textContent = '')); $$('.field.bad').forEach((f) => f.classList.remove('bad'));
    let first;
    for (const [k, v] of Object.entries(errs)) {
      const el = field(k === 'items' ? 'items' : k) || field('global'); el.textContent = v;
      const f = el.closest('.field'); if (f) { f.classList.add('bad'); first = first || f.querySelector('input,select,textarea'); } else first = first || el;
    }
    if (first && first.scrollIntoView) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus && first.focus({ preventScroll: true }); }
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#pay-btn'), label = btn.textContent;
    const fd = Object.fromEntries(new FormData(form));
    const body = { items: B.cart, customer: { mode: fd.mode, date: fd.date, slot: fd.slot, address: fd.address, name: fd.name, phone: fd.phone, notes: fd.notes, pay: fd.pay } };
    btn.disabled = true; btn.textContent = 'Un momento…';
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (r.ok && j.redirect) { if (fd.pay !== 'tarjeta') B.clear(); location.href = j.redirect; return; }
      showErrors(j.errors || { global: j.error || 'Algo salió mal.' });
    } catch { showErrors({ global: 'Sin conexión. Probá de nuevo.' }); }
    btn.disabled = false; btn.textContent = label;
  });
})();

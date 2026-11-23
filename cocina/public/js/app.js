(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CAT = JSON.parse(document.body.dataset.catalog || '[]'), BY = Object.fromEntries(CAT.map((p) => [p.id, p]));
  const money = (c) => '$' + (c / 100).toFixed(2);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let tt; const toast = $('#toast');
  /* ---- carrito (localStorage) ---- */
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('bb-cart') || '{}'); } catch {}
  for (const k of Object.keys(cart)) { if (!BY[k] || !(cart[k] > 0) || BY[k].stock <= 0) delete cart[k]; else cart[k] = Math.min(cart[k], BY[k].stock); }
  const save = () => { try { localStorage.setItem('bb-cart', JSON.stringify(cart)); } catch {} document.dispatchEvent(new CustomEvent('bb:cart')); };
  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = () => Object.entries(cart).reduce((a, [id, q]) => a + BY[id].price * q, 0);
  function setQty(id, q) { q = Math.max(0, Math.min(999, Math.floor(+q || 0))); if (q > BY[id].stock) { q = BY[id].stock; say(`Solo quedan <b>${q}</b> de ${esc(BY[id].name)}`); } if (q) cart[id] = q; else delete cart[id]; save(); }
  window.BB = { CAT, BY, money, esc, get cart() { return cart; }, setQty, count, subtotal, clear() { cart = {}; save(); } };

  /* ---- toast ---- */
  function say(html) { toast.innerHTML = html; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); }

  /* ---- drawer ---- */
  const drawer = $('#drawer'), scrim = $('#scrim'), badge = $('#badge');
  let lastFocus;
  function openCart() { lastFocus = document.activeElement; scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('show')); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock'); $('#close-cart').focus(); }
  function closeCart() { scrim.classList.remove('show'); drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock'); setTimeout(() => (scrim.hidden = true), 300); lastFocus && lastFocus.focus && lastFocus.focus(); }
  $('#open-cart').addEventListener('click', openCart); $('#close-cart').addEventListener('click', closeCart); scrim.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeCart(); });

  function render() {
    const n = count(), ids = Object.keys(cart);
    badge.hidden = !n; badge.textContent = n;
    $('#d-lines').innerHTML = ids.length ? ids.map((id) => { const p = BY[id], im = p.img ? '/img/' + p.img : '/img/' + p.icon;
      return `<li class="d-line" data-id="${id}"><img src="${im}" alt="" width="56" height="56"><div><div class="nm">${esc(p.name)}</div><div class="pr">${money(p.price * cart[id])}</div></div><span></span>
      <div class="qty"><button type="button" data-m="-1" aria-label="Quitar uno de ${esc(p.name)}">−</button><input inputmode="numeric" value="${cart[id]}" aria-label="Cantidad de ${esc(p.name)}"><button type="button" data-m="1" aria-label="Agregar uno de ${esc(p.name)}"${cart[id] >= p.stock ? " disabled" : ""}>+</button></div></li>`; }).join('')
      : '<li class="d-empty"><img src="/img/i-pedidos.png" alt="" width="64" height="64"><p>Tu carrito está vacío.<br>¡Agregá algo calientito!</p></li>';
    $$('[data-incart]').forEach((el) => { const q = cart[el.dataset.incart] || 0, was = +el.dataset.q || 0;
      el.hidden = !q; el.textContent = q + (q === 1 ? ' en tu carrito' : ' en tu carrito'); el.dataset.q = q;
      const btn = el.closest('.product').querySelector('[data-add]'); if (btn && !btn.disabled && !btn.classList.contains('done')) btn.innerHTML = q ? 'Agregar otro <span aria-hidden="true">+</span>' : 'Agregar <span aria-hidden="true">+</span>';
      if (q !== was && q) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } });
    $('#d-sub').textContent = money(subtotal());
    $('#d-go').toggleAttribute('hidden', !n);
  }
  $('#d-lines').addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; const id = b.closest('.d-line').dataset.id; setQty(id, (cart[id] || 0) + +b.dataset.m); });
  $('#d-lines').addEventListener('change', (e) => { if (e.target.matches('input')) setQty(e.target.closest('.d-line').dataset.id, e.target.value); });
  let prev = count();
  document.addEventListener('bb:cart', () => { render(); const n = count(); if (n > prev) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); } prev = n; });
  render();

  /* ---- botones "Agregar" ---- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const id = b.dataset.add; setQty(id, (cart[id] || 0) + 1);
    say(`<b>+1</b> ${esc(BY[id].name)} (llevás ${cart[id]}) · <a href="#" id="t-open" style="color:#fde93a">ver carrito</a>`);
    const t = $('#t-open'); t && t.addEventListener('click', (ev) => { ev.preventDefault(); openCart(); });
    toast.style.pointerEvents = 'auto';
    b.classList.add('done'); b.innerHTML = '¡Listo! ✓'; setTimeout(() => { b.classList.remove('done'); render(); }, 1100);
  });

  /* ---- navbar ---- */
  const nav = $('#nav'); const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8); onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const burger = $('#burger'), links = $('#links');
  burger.addEventListener('click', () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  links.addEventListener('click', (e) => { if (e.target.closest('a')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });

  /* ---- revelar al hacer scroll ---- */
  const els = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  } else els.forEach((el) => el.classList.add('in'));

  /* ---- contadores ---- */
  $$('[data-count]').forEach((el) => {
    const to = +el.dataset.count, pre = el.dataset.prefix || '', dec = +el.dataset.dec || 0;
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    el.textContent = pre + (0).toFixed(dec);
    new IntersectionObserver(([x], o) => { if (!x.isIntersecting) return; o.disconnect(); const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 1100), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = pre + v.toFixed(dec); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }, { threshold: 0.6 }).observe(el);
  });
})();

(() => {
  const f = document.getElementById('contact-form'), err = document.getElementById('c-err');
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); err.textContent = '';
    const b = Object.fromEntries(new FormData(f)), btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }), j = await r.json();
      if (r.ok) { location.href = '/contacto?enviado=1'; return; }
      err.textContent = Object.values(j.errors || { e: j.error || 'No se pudo enviar.' })[0];
    } catch { err.textContent = 'Sin conexión. Probá de nuevo.'; }
    btn.disabled = false; btn.textContent = 'Enviar mensaje';
  });
})();

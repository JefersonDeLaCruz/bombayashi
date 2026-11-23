const { CONFIG, PRODUCTS, SLOTS, byId, money } = require('./catalog');
const stock = require('./stock');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wa = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const ic = (n, cls = '') => `<span class="ic ${cls}"><img src="/img/i-${n}.png" alt="" width="48" height="48" loading="lazy"></span>`;
const waBtn = (label, msg, cls = 'btn btn-dark') => `<a class="${cls}" href="${wa(msg)}" target="_blank" rel="noopener">${label}</a>`;

const NAV = [['/', 'Inicio'], ['/#menu', 'Menú'], ['/pedido', 'Pedidos'], ['/nosotros', 'Nosotros'], ['/contacto', 'Contacto']];

function layout({ title, desc, path = '/', body, scripts = '' }) {
  const st = stock.all();
  const catalog = esc(JSON.stringify(PRODUCTS.map(({ id, name, price, img, icon, kind }) => ({ id, name, price, img, icon, kind, stock: st[id] }))));
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · ${CONFIG.name}</title>
<meta name="description" content="${esc(desc || 'Pan salvadoreño horneado hoy. Pedilo en línea, paga seguro y pasá a traerlo calientito.')}">
<meta name="theme-color" content="#fde93a">
<link rel="icon" type="image/png" href="/img/favicon.png">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="preload" href="/fonts/baloo2.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/app.css">
</head>
<body data-path="${esc(path)}" data-catalog="${catalog}">
<a class="skip" href="#main">Saltar al contenido</a>
<header class="nav" id="nav">
  <div class="wrap nav-in">
    <a class="brand" href="/" aria-label="Panadería Bombayashi, inicio"><img src="/img/logo-isotipo.png" alt="" width="39" height="44"><span>Bombayashi</span></a>
    <nav class="links" id="links" aria-label="Principal">
      ${NAV.map(([h, t]) => `<a href="${h}"${h === path ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
    </nav>
    <div class="nav-act">
      <button class="cart-btn" id="open-cart" type="button" aria-label="Abrir carrito"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 3.5h2.6l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.1a1.6 1.6 0 0 0 1.6-1.2L20.4 7H6"/><circle cx="9.5" cy="20" r="1.5" fill="currentColor"/><circle cx="17" cy="20" r="1.5" fill="currentColor"/></svg><span class="badge" id="badge" hidden>0</span></button>
      <a class="btn btn-dark cta-nav" href="/pedido">Pedí tu pan</a>
      <button class="burger" id="burger" type="button" aria-label="Menú" aria-expanded="false" aria-controls="links"><i></i><i></i><i></i></button>
    </div>
  </div>
</header>

<main id="main">${body}</main>

<footer class="foot">
  <div class="wrap foot-grid">
    <div>
      <a class="brand brand-foot" href="/"><img src="/img/logo-isotipo.png" alt="" width="39" height="44"><span>Bombayashi</span></a>
      <p>Tres cheros de la UES, un horno y una sola respuesta: “bomba”. Pan salvadoreño fresco, con servicio cercano y honesto.</p>
    </div>
    <div>
      <h3 class="ct">Horario</h3>
      <p>Lunes a sábado<br>6:00 a.m. a 7:00 p.m.<br>Domingo<br>6:00 a.m. a 12:00 m.</p>
    </div>
    <div>
      <h3 class="ct">Escribinos</h3>
      <p><a href="${wa('Hola Bombayashi, quiero hacer un pedido')}" target="_blank" rel="noopener">WhatsApp ${CONFIG.phoneDisplay}</a><br>
      <a href="mailto:${CONFIG.email}">${CONFIG.email}</a><br>
      <a href="${CONFIG.instagram}" target="_blank" rel="noopener">Instagram</a> · <a href="${CONFIG.facebook}" target="_blank" rel="noopener">Facebook</a></p>
    </div>
    <div>
      <h3 class="ct">Tienda</h3>
      <p><a href="/pedido">Hacer un pedido</a><br><a href="/politicas">Políticas de compra</a><br><a href="/nosotros">Quiénes somos</a><br>
      <span class="pay-note">Pagos seguros con Stripe · USD · IVA incluido</span></p>
    </div>
  </div>
  <div class="wrap foot-end">San Miguel, El Salvador · © 2026 ${CONFIG.name} · Proyecto de Comercio Electrónico, UES-FMO</div>
</footer>

<a class="wa-bubble" href="${wa('Hola Bombayashi, quiero hacer un pedido')}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp"><img src="/img/i-whatsapp.png" alt="" width="34" height="34"></a>

<div class="scrim" id="scrim" hidden></div>
<aside class="drawer" id="drawer" aria-label="Tu carrito" aria-hidden="true">
  <div class="drawer-head"><h2>Tu pedido</h2><button id="close-cart" class="x" type="button" aria-label="Cerrar carrito">×</button></div>
  <ul class="d-lines" id="d-lines" aria-live="polite"></ul>
  <div class="drawer-foot">
    <div class="row"><span>Subtotal</span><strong id="d-sub">$0.00</strong></div>
    <p class="fine" id="d-hint">Precios con IVA incluido.</p>
    <a class="btn btn-dark btn-block" id="d-go" href="/pedido">Ir a pagar</a>
  </div>
</aside>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="/js/app.js" defer></script>
${scripts}
</body>
</html>`;
}

/* ---------- piezas reutilizables ---------- */
function productCard(p, i = 0) {
  const left = stock.get(p.id), out = left <= 0, low = !out && left <= stock.LOW;
  const media = p.img
    ? `<div class="p-img"><img src="/img/${p.img}" alt="${esc(p.name)}" width="400" height="400" loading="lazy"></div>`
    : `<div class="p-icon">${ic(p.icon.replace(/^i-|\.png$/g, ''), 'ic-lg')}</div>`;
  return `<article class="card product reveal" style="--d:${(i % 3) * 80}ms">
    ${media}
    <span class="in-cart" data-incart="${p.id}" hidden></span>
    <div class="p-body">
      <span class="tag${p.featured ? ' tag-hot' : ''}">${esc(p.tag)}</span>${low ? `<span class="low">Quedan ${left}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.desc)}</p>
      ${p.note ? `<p class="save">${esc(p.note)}</p>` : ''}
      <div class="p-foot"><span class="price">${money(p.price)}</span>
        ${out ? `<button class="btn btn-add" type="button" disabled>Agotado</button>` : `<button class="btn btn-add" type="button" data-add="${p.id}" aria-label="Agregar ${esc(p.name)} al carrito">Agregar <span aria-hidden="true">+</span></button>`}</div>
    </div>
  </article>`;
}

function hero({ eyebrow, title, text, actions = '' }) {
  return `<section class="hero hero-page"><div class="wrap"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lead">${text}</p>${actions ? `<div class="actions">${actions}</div>` : ''}</div></section>`;
}

const cta = (title, text, extra = '') => `<section class="band band-dark"><div class="wrap center reveal"><h2>${title}</h2><p>${text}</p><div class="actions center-a"><a class="btn btn-yellow" href="/pedido">Pedí tu pan</a>${waBtn('Escribinos por WhatsApp', 'Hola Bombayashi, quiero hacer un pedido', 'btn btn-ghost')}${extra}</div></div></section>`;

/* ---------- páginas ---------- */
function home() {
  const pan = PRODUCTS.filter((p) => p.kind === 'pan'), combos = PRODUCTS.filter((p) => p.kind === 'combo');
  const faq = [
    ['¿Hacen envíos a domicilio?', 'Sí, dentro de San Miguel. El costo del envío depende de la zona y te lo confirmamos junto con el total.'],
    ['¿Cómo pago?', 'Con tarjeta aquí mismo (pago seguro con Stripe), en efectivo al recibir o por transferencia bancaria.'],
    ['¿Con cuánta anticipación pido?', 'Para pan del día, con unas horas basta. Para combos grandes o fiestas, pedí con un día de anticipación.'],
    ['¿Y si se acaba el pan?', 'Horneamos todos los días hasta agotar existencias. Si algo se acabó, te avisamos y te ofrecemos otra opción.'],
  ];
  return layout({
    title: 'Pan salvadoreño, horneado hoy', path: '/', body: `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Panadería Bombayashi · San Miguel</p>
      <h1>¡Juelaaa, chuchi!</h1>
      <p class="lead">Pan salvadoreño, horneado hoy. Armá tu carrito, pagá seguro y pasá a traerlo calientito, o te lo llevamos.</p>
      <div class="actions"><a class="btn btn-dark btn-lg" href="/pedido">Pedí tu pan</a><a class="btn btn-light btn-lg" href="#menu">Ver el menú</a></div>
      <ul class="checks"><li>Horneado hoy</li><li>Precios claros</li><li>Pedidos desde $3.00</li></ul>
    </div>
    <div class="hero-img"><img src="/img/bombayashi-portada-pan-dulce.jpg" alt="Surtido de pan dulce salvadoreño recién horneado" width="1376" height="768" fetchpriority="high"><span class="float-chip"><b>Hoy</b> salió del horno</span></div>
  </div>
</section>
<div class="ribbon" aria-hidden="true"><div class="ribbon-track">${Array(2).fill('<span>Concha</span><span>Semita</span><span>Quesadilla</span><span>Pan francés</span><span>Pan de yema</span><span>Salpores</span><span>Caja familiar</span>').join('')}</div></div>

<section class="band" id="menu"><div class="wrap">
  <header class="sec-head reveal"><h2>Nuestro pan</h2><p>Tocá “Agregar” y se suma a tu carrito. Cambiás las cantidades cuando quieras y pagás en un solo paso.</p></header>
  <div class="grid-3">${pan.map(productCard).join('')}</div>
</div></section>

<section class="band band-cream"><div class="wrap">
  <header class="sec-head reveal"><p class="eyebrow">Oferta bomba</p><h2>Combos para ahorrar</h2></header>
  <div class="grid-3">
    ${combos.map(productCard).join('')}
    <article class="card product quote reveal" style="--d:160ms"><div class="p-icon">${ic('fiesta', 'ic-lg')}</div><div class="p-body"><span class="tag">A tu medida</span><h3>Pedido para fiesta</h3><p>Cumpleaños, reuniones u oficina. Lo armamos a tu medida.</p>
    <div class="p-foot"><span class="price">Cotizá</span>${waBtn('Cotizar', 'Hola Bombayashi, quiero cotizar un pedido para una fiesta o reunión.', 'btn btn-add')}</div></div></article>
  </div>
</div></section>

<section class="band"><div class="wrap">
  <header class="sec-head reveal"><h2>Así de fácil</h2><p>Sin formularios eternos: tres pasos y tu pan ya viene en camino.</p></header>
  <div class="grid-3 steps">
    <div class="card step reveal">${ic('pedidos')}<h3>1. Armás tu carrito</h3><p>Agregá lo que se te antoje, tantos como quieras. Ves el total en vivo.</p></div>
    <div class="card step reveal" style="--d:80ms">${ic('entregas')}<h3>2. Elegís cómo recibirlo</h3><p>Retiro en la panadería sin costo, o envío dentro de San Miguel. Día y hora a tu gusto.</p></div>
    <div class="card step reveal" style="--d:160ms">${ic('pagos')}<h3>3. Pagás y listo</h3><p>Con tarjeta (Stripe), efectivo o transferencia. Te confirmamos por WhatsApp en minutos.</p></div>
  </div>
</div></section>

<section class="band band-cream"><div class="wrap grid-2">
  <div class="card info reveal">${ic('horario')}<h3>Horario</h3><p>Lunes a sábado: 6:00 a.m. a 7:00 p.m.<br>Domingo: 6:00 a.m. a 12:00 m.</p></div>
  <div class="card info reveal" style="--d:80ms">${ic('rapido')}<h3>Bueno saber</h3><p>Pedido mínimo $3.00 para envío. El envío se cobra según la zona. Combos y fiestas: pedí con un día de anticipación.</p></div>
</div></section>

<section class="band"><div class="wrap narrow">
  <header class="sec-head reveal"><h2>Preguntas frecuentes</h2></header>
  <div class="faq reveal">${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
</div></section>
${cta('¡Gracias, chero!', 'Pan fresco, trato cercano y precios sin sorpresas. Pedí hoy y pasá a traerlo calientito.')}`,
  });
}

function about() {
  const val = (i, t, d, n) => `<div class="card step reveal" style="--d:${n * 70}ms">${ic(i)}<h3>${t}</h3><p>${d}</p></div>`;
  return layout({
    title: 'Nosotros', path: '/nosotros', desc: 'Tres amigos de la UES, un horno y un “bomba”. Conocé la historia de Panadería Bombayashi.', body: `
${hero({ eyebrow: 'Nuestra historia', title: 'Todo empezó cuando dijimos “bomba”', text: 'Somos tres amigos de la Facultad Multidisciplinaria Oriental de la UES, en San Miguel. Uno ya sabía hacer pan, y cuando se nos ocurrió emprender ni lo pensamos: dijimos “bomba”.' })}
<section class="band"><div class="wrap story"><img class="logo-big reveal" src="/img/logo-imagotipo.png" alt="Logo de Panadería Bombayashi: un pan con forma de bomba y la frase Juela Chuchi" width="620" height="631" loading="lazy"><p class="big reveal" style="--d:100ms">Entre nosotros, “bomba” quiere decir que sí, y con ganas. Le agregamos un “yashi” al final para que sonara divertido y se quedara en la cabeza. Así nació Bombayashi, en 2026.</p></div></section>
<section class="band band-cream"><div class="wrap"><header class="sec-head reveal"><h2>Cómo llegamos hasta acá</h2></header>
  <ol class="timeline">
    <li class="reveal">${ic('graduacion')}<div><h3>Nos conocimos en la UES</h3><p>Tres amigos de la FMO, en San Miguel.</p></div></li>
    <li class="reveal">${ic('hornear')}<div><h3>Uno ya sabía hacer pan</h3><p>Con recetas de casa.</p></div></li>
    <li class="reveal">${ic('idea')}<div><h3>Dijimos “bomba”</h3><p>Y nos animamos a emprender, sin darle tantas vueltas.</p></div></li>
    <li class="reveal">${ic('horno')}<div><h3>2026: abrimos Bombayashi</h3><p>Desde ese día horneamos pan fresco para vos. ¡Juelaaa, chuchi!</p></div></li>
  </ol></div></section>
<section class="band"><div class="wrap grid-2">
  <div class="card info reveal">${ic('mision')}<p class="eyebrow">Misión</p><h3>El sabor de casa, todos los días</h3><p>Hornear cada día pan salvadoreño fresco y bien hecho, con recetas de siempre e ingredientes bien elegidos, para que tengas en tu mesa el sabor de casa, con un trato cercano y honesto.</p></div>
  <div class="card info reveal" style="--d:80ms">${ic('vision')}<p class="eyebrow">Visión</p><h3>La panadería de referencia en El Salvador</h3><p>Queremos que nos reconozcan por lo fresco de nuestro pan, por lo amable de nuestro servicio y por cuidar la tradición panadera salvadoreña.</p></div>
</div></section>
<section class="band band-cream"><div class="wrap"><header class="sec-head reveal"><h2>En qué creemos</h2></header>
  <div class="grid-4">
    ${val('integridad', 'Integridad', 'Hablamos claro: pan del día, ingredientes de calidad y precios sin sorpresas.', 0)}
    ${val('adaptabilidad', 'Adaptabilidad', 'Escuchamos a cada cliente y nos ajustamos a lo que necesita para su pedido o su celebración.', 1)}
    ${val('atencion', 'Atención personalizada', 'Te tratamos con respeto y cariño, y nos acordamos de lo que te gusta para que cada compra sea un gusto.', 2)}
    ${val('orgullo', 'Orgullo salvadoreño', 'Nos encanta la tradición panadera de El Salvador, aquí y donde sea que haya salvadoreños.', 3)}
  </div></div></section>
<section class="band"><div class="wrap"><header class="sec-head reveal"><h2>Así somos</h2></header>
  <div class="grid-4 center-cards">
    ${val('alegres', 'Alegres', 'Nos gusta bromear, pero sin pasarnos.', 0)}
    ${val('cercanos', 'Cercanos', 'Hablamos como un chero, no como un manual.', 1)}
    ${val('orgullosos', 'Orgullosos', 'De lo nuestro, sin presumir de más.', 2)}
    ${val('sencillos', 'Sencillos', 'Todo claro y sin complicaciones.', 3)}
  </div></div></section>
<section class="band band-cream"><div class="wrap"><header class="sec-head reveal"><h2>Los cheros detrás del pan</h2><p>Cofundadores de Panadería Bombayashi, en San Miguel.</p></header>
  <div class="grid-3 team">
    ${[['MM', 'Manuel Meléndez'], ['CZ', 'César Zuleta'], ['JC', 'Jeferson De la Cruz']].map(([a, n], i) => `<div class="card person reveal" style="--d:${i * 80}ms"><span class="avatar" aria-hidden="true">${a}</span><h3>${n}</h3><p>Cofundador</p></div>`).join('')}
  </div></div></section>
${cta('¿Ya se te antojó?', `El pan de hoy ya salió del horno. Pedilo en línea o escribinos al ${CONFIG.phoneDisplay}.`)}`,
  });
}

function contact(sent) {
  return layout({
    title: 'Contacto', path: '/contacto', desc: 'Escribinos para pedir, cotizar o preguntar. Panadería Bombayashi, San Miguel.', body: `
${hero({ eyebrow: 'Contacto', title: 'Hablemos, chero', text: 'Escribinos para pedir, cotizar o preguntar lo que se te ocurra. Te respondemos rapidito.', actions: `${waBtn('Escribinos por WhatsApp', 'Hola Bombayashi, quiero hacer un pedido', 'btn btn-dark btn-lg')}<a class="btn btn-light btn-lg" href="/pedido">Hacer un pedido</a>` })}
<section class="band"><div class="wrap grid-3">
  <div class="card info reveal">${ic('ubicacion')}<h3>Dónde estamos</h3><p><strong>San Miguel, El Salvador</strong><br>Pasá a retirar tu pedido o pedí que te lo llevemos dentro de la ciudad.</p><a class="link" href="${CONFIG.maps}" target="_blank" rel="noopener">Ver en Google Maps →</a></div>
  <div class="card info reveal" style="--d:80ms">${ic('horario')}<h3>Horario</h3><p><strong>Lunes a sábado</strong><br>6:00 a.m. – 7:00 p.m.<br><strong>Domingo</strong><br>6:00 a.m. – 12:00 m.</p></div>
  <div class="card info reveal" style="--d:160ms">${ic('mensaje')}<h3>Contacto</h3><p><strong>WhatsApp y llamadas</strong><br>${CONFIG.phoneDisplay}<br><strong>Correo</strong><br><a href="mailto:${CONFIG.email}">${CONFIG.email}</a><br><strong>Redes</strong><br><a href="${CONFIG.instagram}" target="_blank" rel="noopener">Instagram</a> · <a href="${CONFIG.facebook}" target="_blank" rel="noopener">Facebook</a></p></div>
</div></section>
<section class="band band-cream"><div class="wrap grid-form">
  <div class="reveal"><h2>Mandanos un mensaje</h2><p class="lead-sm">Para cotizaciones, pedidos grandes, sugerencias o lo que se te ocurra. Te respondemos lo antes posible.</p>
    <div class="card info soft">${ic('rapido')}<h3>¿Con prisa?</h3><p>Escribinos por WhatsApp al ${CONFIG.phoneDisplay} y te respondemos más rápido.</p></div>
    <div class="card info soft">${ic('fiesta')}<h3>Si querés cotizar</h3><p>Contanos para cuándo lo necesitás y para cuántas personas. Con eso te armamos la propuesta.</p></div></div>
  <form class="card form reveal" id="contact-form" novalidate style="--d:80ms">
    ${sent ? '<p class="ok-box" role="status">¡Listo! Recibimos tu mensaje y te escribimos pronto.</p>' : ''}
    <label class="field">Tu nombre<input name="name" required autocomplete="name"></label>
    <label class="field">Tu WhatsApp<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="7000-0000"></label>
    <label class="field">Motivo<select name="reason"><option>Pregunta general</option><option>Cotización o pedido grande</option><option>Sugerencia o comentario</option><option>Otro</option></select></label>
    <label class="field">Mensaje<textarea name="message" rows="4" required></textarea></label>
    <p class="err" id="c-err" role="alert"></p>
    <button class="btn btn-dark btn-block" type="submit">Enviar mensaje</button>
    <p class="fine">${ic('candado', 'ic-sm')} Usamos tu nombre y teléfono solo para responderte.</p>
  </form>
</div></section>`,
    scripts: '<script src="/js/contact.js" defer></script>',
  });
}

function policies() {
  const sec = (n, icon, title, items) => `<section class="card policy reveal">${ic(icon)}<div><h2>${n}. ${title}</h2><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul></div></section>`;
  return layout({
    title: 'Políticas de compra', path: '/politicas', desc: 'Pedidos, entregas, pagos, cancelaciones y privacidad, explicado sin letra chiquita.', body: `
${hero({ eyebrow: 'Así trabajamos', title: 'Políticas de compra', text: `Lo que necesitás saber antes de pedir, explicado sin letra chiquita. Si te queda alguna duda, escribinos al ${CONFIG.phoneDisplay} y te ayudamos.` })}
<section class="band band-dark stats"><div class="wrap"><h2 class="sr">Lo esencial en cuatro datos</h2><div class="grid-4">
  <div class="stat reveal"><b data-count="3" data-prefix="$" data-dec="2">$3.00</b><span>Pedido mínimo para envío a domicilio.</span></div>
  <div class="stat reveal" style="--d:70ms"><b data-count="24">24</b><span>horas de anticipación para combos grandes y fiestas.</span></div>
  <div class="stat reveal" style="--d:140ms"><b data-count="2">2</b><span>horas antes de la entrega podés cancelar sin costo (24 en fiestas).</span></div>
  <div class="stat reveal" style="--d:210ms"><b>Con IVA</b><span>Precios en dólares (USD), IVA incluido.</span></div>
</div></div></section>
<section class="band"><div class="wrap narrow stack">
  ${sec(1, 'pedidos', 'Pedidos', ['Podés pedir con el carrito de esta tienda, con los botones de cada producto o por WhatsApp.', 'Tu pedido queda confirmado cuando te respondemos por WhatsApp con el total y la hora de entrega.', 'El pedido mínimo para envío a domicilio es de $3.00.', 'Para combos grandes y pedidos de fiesta, pedí con al menos 24 horas de anticipación.'])}
  ${sec(2, 'entregas', 'Entregas y envíos', ['Retiro en la panadería: sin costo, en el horario que te confirmemos.', 'Envío a domicilio: solo dentro de San Miguel. El costo depende de la zona y te lo decimos antes de confirmar.', 'Si no hay nadie para recibir, te escribimos para coordinar otra hora.'])}
  ${sec(3, 'pagos', 'Formas de pago', ['Tarjeta: pago seguro con Stripe. Nosotros nunca vemos ni guardamos los datos de tu tarjeta.', 'Efectivo al recibir o al retirar.', 'Transferencia bancaria: te mandamos los datos de la cuenta cuando confirmamos.', 'Todos los precios están en dólares (USD) e incluyen IVA.'])}
  ${sec(4, 'cambios', 'Cancelaciones, cambios y reclamos', ['Podés cancelar o cambiar tu pedido sin costo hasta 2 horas antes de la entrega (24 horas en pedidos de fiesta).', 'Como el pan es un producto fresco, no aceptamos devoluciones de pan entregado en buen estado.', 'Si algo llegó mal o incompleto, avisanos el mismo día con una foto y te lo reponemos o te devolvemos el dinero.'])}
  ${sec(5, 'privacidad', 'Privacidad de tus datos', ['Solo te pedimos lo necesario para tu pedido: nombre, teléfono y, si es envío, la dirección.', 'Los usamos únicamente para confirmar, preparar y entregar tu pedido.', 'No los vendemos ni los compartimos con nadie.', 'Si querés que borremos tus datos, escribinos y lo hacemos.'])}
  <p class="fine center">Última actualización: noviembre de 2026.</p>
</div></section>
${cta('¿Te quedó alguna duda?', `Escribinos por WhatsApp al ${CONFIG.phoneDisplay} y te contestamos.`)}`,
  });
}

function checkout(cancelled) {
  return layout({
    title: 'Armá tu pedido', path: '/pedido', desc: 'Tu carrito, entrega y pago en una sola página.', body: `
<section class="hero hero-page hero-sm"><div class="wrap"><p class="eyebrow">Tu pedido</p><h1>Armá tu pedido</h1><p class="lead">Elegí tu pan, decinos cómo lo querés y pagá. Te confirmamos por WhatsApp en minutos.</p></div></section>
<section class="band"><div class="wrap co-grid">
  <div class="co-main">
    ${cancelled ? '<p class="warn-box" role="status">El pago se canceló. Tu carrito sigue aquí, podés intentarlo de nuevo.</p>' : ''}
    <section class="card co-card" aria-labelledby="h-prod"><h2 id="h-prod"><span class="num">1</span> Tu pan</h2>
      <div class="add-list">${PRODUCTS.map((p) => `<div class="add-row" data-row="${p.id}"><div class="ar-name"><strong>${esc(p.name)}</strong><span>${money(p.price)}${stock.get(p.id) <= 0 ? ' · Agotado' : stock.get(p.id) <= stock.LOW ? ' · Quedan ' + stock.get(p.id) : ''}</span></div>
        <div class="qty" data-qty="${p.id}"><button type="button" data-m="-1" aria-label="Quitar uno de ${esc(p.name)}">−</button><input inputmode="numeric" value="0" aria-label="Cantidad de ${esc(p.name)}"><button type="button" data-m="1" aria-label="Agregar uno de ${esc(p.name)}">+</button></div></div>`).join('')}</div>
      <p class="err" id="e-items" role="alert"></p>
    </section>
    <form id="co-form" novalidate>
    <section class="card co-card" aria-labelledby="h-ent"><h2 id="h-ent"><span class="num">2</span> ¿Cómo lo querés recibir?</h2>
      <div class="seg">
        <label><input type="radio" name="mode" value="retiro" checked><span>Paso a traerlo<small>Sin costo</small></span></label>
        <label><input type="radio" name="mode" value="envio"><span>Envío a domicilio<small>San Miguel · costo según zona</small></span></label>
      </div>
      <div class="two">
        <label class="field">Día<input type="date" name="date" id="f-date" required><em class="err" id="e-date"></em></label>
        <label class="field">Horario<select name="slot" id="f-slot" required><option value="">Elegí un horario</option>${SLOTS.map((s) => `<option value="${s.id}" data-sun="${s.sunday}">${s.label}</option>`).join('')}</select><em class="err" id="e-slot"></em></label>
      </div>
      <label class="field" id="w-addr" hidden>Dirección de entrega<input name="address" id="f-addr" autocomplete="street-address" placeholder="Colonia, calle, casa, referencia"><em class="err" id="e-address"></em></label>
      <p class="fine" id="h-combo" hidden>Tu carrito tiene combos: se piden con 1 día de anticipación.</p>
    </section>
    <section class="card co-card" aria-labelledby="h-dat"><h2 id="h-dat"><span class="num">3</span> Tus datos</h2>
      <div class="two">
        <label class="field">Tu nombre<input name="name" id="f-name" required autocomplete="name"><em class="err" id="e-name"></em></label>
        <label class="field">Tu WhatsApp<input name="phone" id="f-phone" required inputmode="tel" autocomplete="tel" placeholder="7000-0000"><em class="err" id="e-phone"></em></label>
      </div>
      <label class="field">Notas (opcional)<textarea name="notes" rows="2" placeholder="Sin ajonjolí, para un cumpleaños, etc."></textarea></label>
    </section>
    <section class="card co-card" aria-labelledby="h-pay"><h2 id="h-pay"><span class="num">4</span> Forma de pago</h2>
      <div class="seg seg-3">
        <label><input type="radio" name="pay" value="tarjeta" checked><span>Tarjeta<small>Pago seguro con Stripe</small></span></label>
        <label><input type="radio" name="pay" value="efectivo"><span>Efectivo<small>Al recibir o retirar</small></span></label>
        <label><input type="radio" name="pay" value="transferencia"><span>Transferencia<small>Te damos la cuenta</small></span></label>
      </div>
      <em class="err" id="e-pay"></em>
    </section>
    </form>
  </div>
  <aside class="card summary" aria-label="Resumen del pedido">
    <h2>Resumen</h2>
    <ul class="s-lines" id="s-lines" aria-live="polite"></ul>
    <div class="row"><span>Subtotal</span><strong id="s-sub">$0.00</strong></div>
    <div class="row"><span>Envío</span><span id="s-ship">Gratis (retiro)</span></div>
    <div class="row total"><span>Total</span><strong id="s-tot">$0.00</strong></div>
    <p class="err" id="e-global" role="alert"></p>
    <button class="btn btn-dark btn-block btn-lg" id="pay-btn" type="submit" form="co-form">Confirmar y pagar</button>
    <p class="fine">${ic('candado', 'ic-sm')} Precios en USD con IVA. Con tarjeta pagás en Stripe; nunca vemos tus datos. <button type="button" class="linkbtn" id="clear-cart">Vaciar carrito</button></p>
  </aside>
</div></section>`,
    scripts: '<script src="/js/checkout.js" defer></script>',
  });
}

function thanks(o, mockMode) {
  const wl = wa(require('./orders').whatsappText(o));
  const card = o.customer.pay === 'tarjeta';
  return layout({
    title: '¡Gracias por tu pedido!', path: '/gracias', body: `
<section class="band"><div class="wrap narrow">
  <div class="card thanks reveal in">
    <span class="check" aria-hidden="true"><svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 27l8 8 15-17" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <p class="eyebrow">Pedido ${esc(o.id)}</p>
    <h1>¡Gracias, ${esc(o.customer.name.split(' ')[0])}!</h1>
    <p class="lead-sm">${card && o.paid ? `Recibimos tu pago de <strong>${money(o.total)}</strong>${mockMode ? ' (modo prueba)' : ''}.` : card ? 'Tu pago está pendiente de confirmación.' : `Anotamos tu pedido por <strong>${money(o.total)}</strong>. Pagás ${o.customer.pay === 'efectivo' ? 'en efectivo al recibir o retirar' : 'por transferencia: te enviamos la cuenta al confirmar'}.`}</p>
    <ul class="s-lines big">${o.lines.map((l) => `<li><span>${l.qty} × ${esc(l.name)}</span><span>${money(l.total)}</span></li>`).join('')}<li class="t"><span>Total</span><span>${money(o.total)}</span></li></ul>
    <p>${o.customer.mode === 'envio' ? 'Envío a ' + esc(o.customer.address) : 'Retiro en la panadería'} · ${esc(o.customer.date)} · ${esc(o.customer.slot)}</p>
    <p class="fine">Tu pedido queda confirmado cuando te respondemos por WhatsApp con el total y la hora.</p>
    <div class="actions center-a"><a class="btn btn-dark btn-lg" href="${wl}" target="_blank" rel="noopener">Confirmar por WhatsApp</a><a class="btn btn-light btn-lg" href="/">Volver al inicio</a></div>
  </div>
</div></section>`,
    scripts: '<script>try{localStorage.removeItem("bb-cart")}catch(e){}</script>',
  });
}

function mockStripe(o) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pago de prueba · Bombayashi</title><link rel="stylesheet" href="/css/app.css"></head>
<body class="mock"><main class="mock-in"><div class="mock-left"><a class="back" href="/pedido">← Volver a Bombayashi</a><p class="fine">Pagar a Panadería Bombayashi</p><h1 class="big-amt">${money(o.total)}</h1>
<ul class="s-lines">${o.lines.map((l) => `<li><span>${l.qty} × ${esc(l.name)}</span><span>${money(l.total)}</span></li>`).join('')}</ul></div>
<form class="mock-right" method="post" action="/pago/simulado"><input type="hidden" name="order" value="${esc(o.id)}">
<p class="test-flag">MODO PRUEBA · Simulador de Stripe Checkout (sin llave sk_test configurada)</p>
<label class="field">Correo<input type="email" name="email" value="cliente@prueba.com" required></label>
<label class="field">Información de la tarjeta<input name="card" value="4242 4242 4242 4242" inputmode="numeric" aria-label="Número de tarjeta"></label>
<div class="two"><label class="field">Vence<input name="exp" value="12 / 34"></label><label class="field">CVC<input name="cvc" value="123"></label></div>
<button class="btn btn-dark btn-block btn-lg" type="submit">Pagar ${money(o.total)}</button>
<p class="fine">Tarjeta de prueba de Stripe 4242 4242 4242 4242. No se cobra nada. Con <code>STRIPE_SECRET_KEY=sk_test_…</code> este paso es el Checkout real de Stripe.</p></form></main></body></html>`;
}

function notFound() {
  return layout({ title: 'No encontrada', path: '/404', body: `<section class="band"><div class="wrap narrow center"><img src="/img/logo-isotipo.png" alt="" width="105" height="120" style="margin:0 auto 12px"><h1>Esta página se nos quemó</h1><p class="lead-sm">No encontramos lo que buscabas, pero el pan sí está en el horno.</p><div class="actions center-a"><a class="btn btn-dark btn-lg" href="/">Volver al inicio</a></div></div></section>` });
}


module.exports = { home, about, contact, policies, checkout, thanks, mockStripe, notFound };

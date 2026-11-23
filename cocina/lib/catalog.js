// Catálogo de Panadería Bombayashi. Precios en centavos de USD (IVA incluido).
const CONFIG = {
  name: 'Panadería Bombayashi',
  whatsapp: '50375267569',         // número del chat (burbuja y botones)
  phoneDisplay: '6864-0145',       // teléfono que se muestra en el sitio
  email: 'mv23036@ues.edu.sv',
  instagram: 'https://www.instagram.com/mv_mnl/',
  facebook: 'https://www.facebook.com/share/19hqyfxXYb/',
  maps: 'https://www.google.com/maps/search/?api=1&query=San+Miguel+El+Salvador',
  minDeliveryCents: 300,
  currency: 'usd',
};

const PRODUCTS = [
  { id: 'concha', kind: 'pan', name: 'Concha de vainilla', desc: 'Suavecita, con su costra de azúcar de vainilla.', price: 60, img: 'concha-de-vainilla.jpg', tag: 'Recién salido', unit: 'unidad' },
  { id: 'semita', kind: 'pan', name: 'Semita alta de piña', desc: 'La clásica de capas, rellena de jalea de piña.', price: 125, img: 'semita-alta-de-pina.jpg', tag: 'Más vendido', unit: 'unidad' },
  { id: 'quesadilla', kind: 'pan', name: 'Quesadilla salvadoreña', desc: 'Porción de quesadilla con ajonjolí. Perfecta con cafecito.', price: 150, img: 'quesadilla-salvadorena.jpg', tag: 'De todos los días', unit: 'porción' },
  { id: 'frances', kind: 'pan', name: 'Pan francés · bolsa de 10', desc: 'Crujiente por fuera, suave por dentro. Para el desayuno o la cena.', price: 125, img: 'pan-frances.jpg', tag: 'Recién salido', unit: 'bolsa' },
  { id: 'yema', kind: 'pan', name: 'Pan de yema', desc: 'Doradito y esponjoso, con el sabor de casa.', price: 50, img: 'pan-de-yema.jpg', tag: 'De todos los días', unit: 'unidad' },
  { id: 'salpores', kind: 'pan', name: 'Salpores de arroz', desc: 'Galletitas de harina de arroz que se deshacen en la boca.', price: 35, img: 'salpores-de-arroz.jpg', tag: 'De todos los días', unit: 'unidad' },
  { id: 'combo-desayuno', kind: 'combo', name: 'Combo desayuno', desc: '10 panes francés + 2 conchas + 2 panes de yema.', price: 325, icon: 'i-desayuno.png', tag: 'Para la mañana', unit: 'combo', note: 'Ahorrás $0.20 frente a comprarlo por separado.' },
  { id: 'caja-familiar', kind: 'combo', name: 'Caja familiar', desc: '12 piezas de pan dulce surtido, en caja Bombayashi.', price: 750, icon: 'i-caja.png', tag: 'El favorito', unit: 'caja', featured: true },
];

const SLOTS = [
  { id: 'manana', label: 'Mañana · 6:00 a 9:00 a.m.', sunday: true },
  { id: 'media', label: 'Media mañana · 9:00 a.m. a 12:00 m.', sunday: true },
  { id: 'tarde', label: 'Tarde · 12:00 a 4:00 p.m.', sunday: false },
  { id: 'ultima', label: 'Última hora · 4:00 a 7:00 p.m.', sunday: false },
];

const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const money = (cents) => '$' + (cents / 100).toFixed(2);

module.exports = { CONFIG, PRODUCTS, SLOTS, byId, money };

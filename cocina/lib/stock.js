// Inventario en data/stock.json. Valores iniciales por defecto; el panel admin los modifica.
const fs = require('fs');
const path = require('path');
const { PRODUCTS } = require('./catalog');
const FILE = path.join(__dirname, '..', 'data', 'stock.json');
const DEFAULT = (p) => (p.kind === 'combo' ? 20 : 60);

function read() {
  let d = {}; try { d = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
  for (const p of PRODUCTS) if (!Number.isInteger(d[p.id])) d[p.id] = DEFAULT(p);
  return d;
}
function write(d) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }

module.exports = {
  all: read,
  get: (id) => read()[id] ?? 0,
  set(id, n) { const d = read(); if (!(id in d)) return null; d[id] = Math.max(0, Math.min(99999, Math.floor(+n || 0))); write(d); return d[id]; },
  adjust(id, delta) { const d = read(); if (!(id in d)) return; d[id] = Math.max(0, d[id] + delta); write(d); },
  LOW: 5,
};

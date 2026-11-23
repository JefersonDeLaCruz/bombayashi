// Persistencia simple en archivos JSON (suficiente para el showcase local).
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DIR, { recursive: true });

function read(name) {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, name + '.json'), 'utf8')); } catch { return []; }
}
function write(name, data) {
  const f = path.join(DIR, name + '.json');
  fs.writeFileSync(f + '.tmp', JSON.stringify(data, null, 2));
  fs.renameSync(f + '.tmp', f);
}
module.exports = {
  all: (n) => read(n),
  add(n, row) { const a = read(n); a.push(row); write(n, a); return row; },
  find: (n, id) => read(n).find((r) => r.id === id),
  update(n, id, patch) {
    const a = read(n); const i = a.findIndex((r) => r.id === id);
    if (i < 0) return null; a[i] = { ...a[i], ...patch }; write(n, a); return a[i];
  },
};

import assert from 'node:assert/strict';
import { loadRecentColors, rememberColor } from '../app/js/ui/recent-colors.js';

let saved = JSON.stringify(['#AABBCC', '#aabbcc', 'invalid', '#112233']);
globalThis.localStorage = {
  getItem: () => saved,
  setItem: (key, value) => { assert.equal(key, 'trazuvia_recent_colors'); saved = value; }
};
assert.deepEqual(loadRecentColors(), ['#aabbcc', '#112233']);
for (let i = 0; i < 20; i++) rememberColor(`#${i.toString(16).padStart(6, '0')}`);
let colors = JSON.parse(saved);
assert.equal(colors.length, 16);
assert.equal(colors[0], '#000013');
assert.equal(colors.at(-1), '#000004');
colors = rememberColor('#00000A');
assert.equal(colors.length, 16);
assert.equal(colors[0], '#00000a');
assert.equal(colors.filter(value => value === '#00000a').length, 1);
assert.deepEqual(loadRecentColors(), colors, 'Recupera la paleta al reiniciar');
assert.deepEqual(rememberColor('invalid'), colors);
saved = '{bad json';
assert.deepEqual(loadRecentColors(), []);
localStorage.setItem = () => { throw Error('Storage unavailable'); };
assert.deepEqual(rememberColor('#abcdef'), ['#abcdef'], 'Permite usar la paleta aunque no se pueda guardar');
assert.deepEqual(rememberColor('#112233'), ['#112233', '#abcdef']);
console.log('Paleta: últimos 16 colores, sin duplicados, persistencia y datos inválidos verificados.');

import assert from 'node:assert/strict';
import { migrateLegacyStorage } from '../app/js/io/legacy-storage.js';
const values = new Map([
  ['geoflow_autosave', '{"elements":[]}'],
  ['geoflow_theme', 'light'],
  ['geoflow_left_panel_width', '180'],
  ['geoflow_right_panel_width', '300'],
  ['trazuvia_theme', 'dark']
]);
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value)
};
migrateLegacyStorage();
assert.equal(values.get('trazuvia_autosave'), '{"elements":[]}');
assert.equal(values.get('trazuvia_theme'), 'dark');
assert.equal(values.get('trazuvia_left_panel_width'), '180');
assert.equal(values.get('trazuvia_right_panel_width'), '300');
const before = [...values];
migrateLegacyStorage();
assert.deepEqual([...values], before);
console.log('Migración de datos y preferencias: correcta e idempotente.');

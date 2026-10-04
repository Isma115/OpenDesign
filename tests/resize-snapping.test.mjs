import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { getState, loadDocument, setSelection, getElementById, updateElement } from '../app/js/core/state.js';
import { snapResize } from '../app/js/core/snapping.js';
import { snapshotElements } from '../app/js/core/history.js';

const state = getState();
const shape = (id, width, height, extra = {}) => ({
  id, type: 'shape', shape: 'rectangle', x: 100, y: 100, width, height, visible: true, ...extra
});
const moving = shape('moving', 120, 60);
const target = shape('target', 200, 80, { x: 400, y: 400 });
loadDocument({ elements: [moving, target], styles: {}, canvas: {}, metadata: {} });
const bounds = { x: 100, y: 100, width: 197, height: 77 };
let result = snapResize(moving, bounds, 'se');
assert.equal(result.width, 200);
assert.equal(result.height, 80);
assert.equal(result.guides.length, 4);
assert.equal(result.guides[0].y1, 188, 'La guía usa el tamaño final de ambas dimensiones');
assert.deepEqual(bounds, { x: 100, y: 100, width: 197, height: 77 });
for (const handle of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
  result = snapResize(moving, bounds, handle);
  assert.equal(result.width, /[ew]/.test(handle) ? 200 : 197);
  assert.equal(result.height, /[ns]/.test(handle) ? 80 : 77);
  assert.equal(result.x, handle.includes('w') ? 97 : 100);
  assert.equal(result.y, handle.includes('n') ? 97 : 100);
}
assert.equal(snapResize(moving, { ...bounds, height: 70 }, 's').height, 70);
state.viewport.zoom = 2;
assert.equal(snapResize(moving, { ...bounds, height: 76 }, 's').height, 76);
state.viewport.zoom = 0.5;
assert.equal(snapResize(moving, { ...bounds, height: 70 }, 's').height, 80);
state.viewport.zoom = 1;
state.snapping.enabled = false;
assert.equal(snapResize(moving, bounds, 'se').guides.length, 0);
state.snapping.enabled = true;
state.snapping.snapToObjects = false;
assert.equal(snapResize(moving, bounds, 'se').height, 77);
state.snapping.snapToObjects = true;
const closer = shape('closer', 198, 78, { x: 700, y: 700 });
state.document.elements.push(closer);
assert.equal(snapResize(moving, bounds, 'se').height, 78, 'Elige el tamaño más cercano');
closer.visible = false;
assert.equal(snapResize(moving, bounds, 'se').height, 80);
const parent = shape('parent', 198, 78, { type: 'group', children: [moving.id] });
const child = shape('child', 197, 77);
target.type = 'group';
target.children = [child.id];
state.document.elements.push(parent, child);
assert.equal(snapResize(moving, bounds, 'se').height, 80, 'Ignora piezas y grupos que contienen al elemento');
assert.equal(snapResize({ ...moving, shape: 'line' }, bounds, 'se').height, 77);

// Verifica el gesto real: borde norte fijo al sur, guías y un solo paso de historial.
state.document.elements = [moving, target];
setSelection([moving.id]);
let guides = [];
const commits = [];
const source = readFileSync('app/js/editor/tools.js', 'utf8');
const resize = source.slice(source.indexOf('function _startResize('), source.indexOf('function _startRotate('));
const context = vm.createContext({
  getState, getElementById, updateElement, snapResize, snapshotElements,
  commitAction: action => commits.push(action), updateAllConnectorsForElement() {},
  renderDocument() {}, refreshSelection() {},
  renderGuideLines: value => { guides = value; }, clearGuides: () => { guides = []; }
});
vm.runInContext('let _dragData = null; let _shiftHeld = false; let _pointerDownPos = null;\n' + resize, context);
vm.runInContext("_startResize({ x: 100, y: 100 }, 'n'); _doResize({ x: 100, y: 83 });", context);
assert.equal(moving.height, 80);
assert.equal(moving.y, 80);
assert.equal(moving.y + moving.height, 160);
assert.equal(guides.length, 2);
vm.runInContext('_endResize({ x: 100, y: 83 });', context);
assert.equal(guides.length, 0);
assert.equal(commits.length, 1);
assert.equal(commits[0].before.find(el => el.id === moving.id).height, 60);
assert.equal(commits[0].after.find(el => el.id === moving.id).height, 80);
vm.runInContext("_shiftHeld = true; _startResize({ x: 0, y: 0 }, 'e'); _doResize({ x: 77, y: 0 });", context);
assert.equal(moving.width, 197, 'Mayús conserva la proporción sin igualar tamaños');
assert.equal(moving.width / moving.height, 1.5);
assert.equal(guides.length, 0);
console.log('Redimensionado: tamaños iguales, ocho tiradores, zoom, guías, proporción e historial correctos.');

// Dos rectángulos desplazados unos píxeles: igualar anchos no alinea sus bordes.
state.document.elements = [moving, shape('reference', 200, 80, { x: 100, y: 400 })];
result = snapResize(moving, { x: 95, y: 100, width: 202, height: 60 }, 'e');
assert.equal(result.x, 95);
assert.equal(result.x + result.width, 300, 'Alinea exactamente el borde derecho');
assert.equal(result.width, 205, 'La alineación prevalece sobre un ancho parecido');
assert(result.guides.some(guide => guide.type === 'vertical' && guide.position === 300));
result = snapResize(moving, { x: 103, y: 100, width: 197, height: 60 }, 'w');
assert.equal(result.x, 100);
assert.equal(result.x + result.width, 300, 'Mantiene fijo el borde opuesto');
state.document.elements[1].x = 400;
state.document.elements[1].y = 100;
result = snapResize(moving, { x: 100, y: 95, width: 120, height: 82 }, 's');
assert.equal(result.y + result.height, 180, 'Alinea exactamente el borde inferior');
result = snapResize(moving, { x: 100, y: 103, width: 120, height: 77 }, 'n');
assert.equal(result.y, 100);
assert.equal(result.y + result.height, 180);
state.viewport.zoom = 2;
result = snapResize(moving, { x: 100, y: 95, width: 120, height: 82 }, 's');
assert.equal(result.y + result.height, 180, 'Tolerancia medida en píxeles de pantalla');
state.viewport.zoom = 1;
console.log('Bordes: alineación exacta en los cuatro lados, sin mover el lado opuesto.');

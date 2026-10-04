import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createComponentGroup, getPendingChildren } from '../app/js/model/components.js';
import { loadDocument, getState, setSelection, getSelectedElements, getElementById, updateElement } from '../app/js/core/state.js';
import { snapshotElements } from '../app/js/core/history.js';
import { createShapeByTool } from '../app/js/model/shapes.js';

const inputs = new Map([
  ['prop-border-enabled', { checked: true }],
  ['prop-stroke-width', { type: 'number', value: '4' }],
  ['prop-stroke', { type: 'color', value: '#ff0000' }],
  ['prop-fill', { type: 'color', value: '#123456' }]
]);
let theme;
globalThis.document = {
  documentElement: { getAttribute: () => theme },
  getElementById: id => inputs.get(id)
};
const types = ['button', 'input', 'textarea', 'checkbox', 'toggle', 'card', 'avatar',
  'navbar', 'sidebar', 'table', 'image', 'modal', 'db-table', 'db-view',
  'db-primary-key', 'db-foreign-key', 'db-index', 'db-query'];
for (theme of ['dark', 'light']) {
  for (const tool of ['rectangle', 'roundedRectangle', 'ellipse', 'triangle', 'diamond',
    'pentagon', 'hexagon', 'star', 'text', 'note', 'frame', 'flow-start', 'flow-process',
    'flow-decision', 'flow-io', 'flow-database', 'flow-document', 'flow-subprocess']) {
    const shape = createShapeByTool(tool, 0, 0, 120, 80);
    assert.equal(shape.style.strokeWidth, 0, `${theme}: ${tool} empieza sin borde`);
    assert.equal(shape.style.borderWidth, 1);
  }
  for (const tool of ['line', 'arrow']) {
    assert(createShapeByTool(tool, 0, 0, 120, 80).style.strokeWidth > 0, 'Las líneas siguen visibles');
  }
  for (const type of types) {
    const group = createComponentGroup(type, 0, 0);
    const children = getPendingChildren(group.id);
    assert.equal(group.style.strokeWidth, 0, `${theme}: ${type}`);
    for (const child of children.filter(child => child.type !== 'text' && child.style.fill !== 'none')) {
      assert.equal(child.style.strokeWidth, 0, `${type}: superficie sin borde`);
    }
    for (const line of children.filter(child => child.shape === 'line')) {
      assert(line.style.strokeWidth > 0, `${type}: conserva las líneas de contenido`);
    }
  }
}

const group = createComponentGroup('table', 0, 0);
const children = getPendingChildren(group.id);
loadDocument({ elements: [group, ...children], styles: {}, canvas: {}, metadata: {} });
setSelection([group.id]);
const commits = [];
const source = readFileSync('app/js/ui/ui.js', 'utf8');
const extract = (start, end) => source.slice(source.indexOf(`function ${start}`), source.indexOf(`function ${end}`));
const context = vm.createContext({
  document, getState, getSelectedElements, getElementById, updateElement, snapshotElements,
  commitAction: action => commits.push(action),
  renderDocument() {}, refreshSelection() {}, _updatePropertiesPanel() {},
  _snapshotsEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b)
});
vm.runInContext('let _elementPropertyInputSnapshot = null; let _elementPropertyInputKey = null;\n' +
  extract('_updateBorderEnabled()', '_updateTextFromInput(') +
  extract('_beginElementPropertyInput(', 'updateAllConns(') +
  extract('_getGroupSurfaceStyle(', '_fillSpecificCssNameOptions('), context);
vm.runInContext('_updateBorderEnabled();', context);
assert.equal(group.style.strokeWidth, 1);
vm.runInContext("_updateStyleFromInput('strokeWidth', 'prop-stroke-width'); _updateStyleFromInput('stroke', 'prop-stroke');", context);
assert.equal(group.style.strokeWidth, 4);
inputs.get('prop-border-enabled').checked = false;
vm.runInContext('_updateBorderEnabled();', context);
assert.equal(group.style.strokeWidth, 0);
assert.equal(group.style.borderWidth, 4);
vm.runInContext("_updateStyleFromInput('fill', 'prop-fill');", context);
assert.equal(group.style.strokeWidth, 0, 'Cambiar el relleno no activa el borde');
inputs.get('prop-border-enabled').checked = true;
vm.runInContext('_updateBorderEnabled();', context);
assert.equal(group.style.strokeWidth, 4);
assert.equal(group.style.stroke, '#ff0000');
const surfaces = children.filter(child => child.type !== 'text' && child.style.fill !== 'none');
assert(surfaces.every(child => child.style.strokeWidth === 4 && child.style.stroke === '#ff0000'));
assert(children.filter(child => child.shape === 'line').every(child => child.style.strokeWidth === 1));
assert.equal(commits.length, 6, 'Cada acción guarda un único paso para deshacer');
const beforeEnable = commits.at(-1).before.find(el => el.id === group.id);
assert.equal(beforeEnable.style.strokeWidth, 0);
const saved = JSON.parse(JSON.stringify(getState().document));
assert.equal(saved.elements.find(el => el.id === group.id).style.borderWidth, 4);
console.log('Bordes: valores por defecto, activación, ajustes, historial y persistencia correctos.');

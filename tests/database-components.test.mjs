import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

let theme = 'dark';
globalThis.document = { documentElement: { getAttribute: () => theme } };
const { createComponentGroup, getPendingChildren } = await import('../app/js/model/components.js');
const { loadDocument, updateElement } = await import('../app/js/core/state.js');
const { createConnectorElement, getConnectionPoint } = await import('../app/js/model/connectors.js');
const html = readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
const types = ['db-table', 'db-view', 'db-primary-key', 'db-foreign-key', 'db-index', 'db-query'];

for (theme of ['dark', 'light']) {
  const elements = [];
  for (const type of types) {
    assert(html.includes(`data-component="${type}"`));
    const group = createComponentGroup(type, 100, 200);
    const children = getPendingChildren(group.id);
    assert.equal(group.componentType, type);
    assert.deepEqual(group.children, children.map(child => child.id));
    assert.equal(getPendingChildren(group.id).length, 0);
    assert(children.every(child => child.name && child.x >= group.x && child.y >= group.y &&
      child.x + child.width <= group.x + group.width && child.y + child.height <= group.y + group.height));
    assert(children.some(child => child.type === 'text' && child.text.value));
    elements.push(group, ...children);
  }
  assert.equal(new Set(elements.map(element => element.id)).size, elements.length);
  const doc = { elements, styles: {}, canvas: {}, metadata: {} };
  loadDocument(doc);
  const table = elements.find(element => element.componentType === 'db-table');
  const view = elements.find(element => element.componentType === 'db-view');
  const field = elements.find(element => element.id === table.children[2]);
  updateElement(table.id, { x: 400, width: 560, name: 'clientes' });
  assert.equal(field.x, 408);
  assert.equal(field.width, 544);
  updateElement(field.id, { text: { value: 'PK cliente_id : INTEGER' } });
  const connector = createConnectorElement({ elementId: table.id, pointId: 'right' }, { elementId: view.id, pointId: 'left' });
  assert(connector.points.length >= 2);
  assert.deepEqual(connector.points[0], getConnectionPoint(table, 'right'));
  assert.deepEqual(connector.points.at(-1), getConnectionPoint(view, 'left'));
  assert.equal(JSON.parse(JSON.stringify(doc)).elements.find(element => element.id === field.id).text.value, field.text.value);
}

// La exportación HTML conserva los campos y el nombre independiente de la tabla.
let blob;
URL.createObjectURL = value => { blob = value; return 'blob:test'; };
URL.revokeObjectURL = () => {};
document.createElement = () => ({
  textContent: '',
  get innerHTML() { return this.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
  click() {}
});
document.body = { appendChild() {}, removeChild() {} };
const { exportAsHTML } = await import('../app/js/io/export.js');
exportAsHTML();
const exported = await blob.text();
assert(exported.includes('aria-label="clientes"'));
assert(exported.includes('PK cliente_id : INTEGER'));
assert(exported.includes('REFERENCES usuarios(id)'));
console.log('Componentes de base de datos: creación, edición, tamaño, conexiones y exportación correctos en ambos temas.');

import assert from 'node:assert/strict';

globalThis.document = { documentElement: { getAttribute: () => 'dark' } };
const { createExampleDocument } = await import('../app/js/model/example.js');
const doc = createExampleDocument();
const ids = new Set(doc.elements.map(element => element.id));
assert.equal(ids.size, doc.elements.length);
assert.equal(doc.layerCollections.length, 5);
const organizedIds = doc.layerCollections.flatMap(collection => collection.elementIds);
assert.equal(organizedIds.length, ids.size);
assert.deepEqual(new Set(organizedIds), ids);
for (const collection of doc.layerCollections) {
  assert(collection.name.trim());
  assert(collection.elementIds.length > 0);
  // Los grupos funcionales y sus piezas pertenecen a la misma colección visual.
  for (const id of collection.elementIds) {
    const element = doc.elements.find(element => element.id === id);
    for (const childId of element.children || []) assert(collection.elementIds.includes(childId));
  }
}
assert.deepEqual(JSON.parse(JSON.stringify(doc)).layerCollections, doc.layerCollections);
assert.equal(doc.elements[0].style.fill, doc.canvas.background);
assert.equal(doc.elements[0].locked, true);
// Los separadores no deben heredar el mínimo de 20 px de las herramientas.
for (const y of [254, 694]) {
  const separator = doc.elements.find(element => element.shape === 'rectangle' && element.y === y);
  assert.equal(separator.height, 1);
}
const price = doc.elements.find(element => element.text?.value === '189 €');
assert(price.y > 695);
assert.equal(doc.elements.find(element => element.shape === 'rectangle' && element.y === 236).height, 2);

for (const element of doc.elements) {
  assert(element.name?.trim(), `Nombre ausente: ${element.id}`);
  for (const id of element.children || []) assert(ids.has(id));
  if (element.text?.value) assert(element.text.fontFamily.startsWith('Avenir Next'));
  if (element.type !== 'connector') continue;
  assert(ids.has(element.source.elementId));
  assert(ids.has(element.target.elementId));
  assert(element.points.length > 1);
  assert(element.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
}

const mobile = doc.elements.find(element => element.shape === 'frame' && element.name === '02 / MÓVIL · Reservar');
const cta = doc.elements.find(element => element.type === 'group' && element.name === 'Reservar escapada  →');
assert(cta.y + cta.height <= mobile.y + mobile.height - 16);
assert.equal(doc.elements.filter(element => element.type === 'connector').length, 6);
const { loadDocument, updateElement } = await import('../app/js/core/state.js');
const { getCssClassForElement } = await import('../app/js/core/css-template.js');
loadDocument(doc);
const originalClass = getCssClassForElement(cta);
const originalLabel = doc.elements.find(element => element.id === cta.children[0]).text.value;
updateElement(cta.id, { name: 'Móvil · botón de reserva' });
assert.equal(getCssClassForElement(cta), originalClass);
assert.equal(cta.componentType, 'button');
assert.equal(doc.elements.find(element => element.id === cta.children[0]).text.value, originalLabel);
assert.equal(JSON.parse(JSON.stringify(doc)).elements.find(element => element.id === cta.id).name, cta.name);

// El nombre personalizado no transforma un botón exportado en una sección HTML.
let exportedBlob;
URL.createObjectURL = blob => { exportedBlob = blob; return 'blob:test'; };
URL.revokeObjectURL = () => {};
document.createElement = () => ({
  textContent: '',
  get innerHTML() { return this.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
  click() {}
});
document.body = { appendChild() {}, removeChild() {} };
const { exportAsHTML } = await import('../app/js/io/export.js');
exportAsHTML();
assert((await exportedBlob.text()).includes(`<button id="${cta.id}"`));
// Las flechas deben conservar el color del conector al cambiar de tema.
let arrowFill;
const arrowPath = { setAttribute: (name, value) => { if (name === 'fill') arrowFill = value; } };
document.getElementById = id => ({
  canvas: { style: {} },
  'arrow-marker': { querySelector: () => arrowPath }
})[id] || null;
const { updateCanvasTheme } = await import('../app/js/ui/theme.js');
for (const theme of ['dark', 'light']) {
  updateCanvasTheme(theme);
  assert.equal(arrowFill, 'context-stroke');
}
console.log('Ejemplo: nombres independientes, persistencia, exportación, anclajes y márgenes correctos.');

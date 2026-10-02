import assert from 'node:assert/strict';
import { createLayerCollection, moveLayerToCollection } from '../app/js/model/layer-collections.js';

const doc = { elements: [
  { id: 'a', type: 'group', children: ['b'], x: 20, zIndex: 2 },
  { id: 'b', type: 'shape', x: 40, zIndex: 1 }
] };
const elementsBefore = JSON.stringify(doc.elements);
const first = createLayerCollection(doc, 'Cabecera');
const second = createLayerCollection(doc, 'Contenido');
assert.equal(moveLayerToCollection(doc, 'a', first.id), true);
assert.deepEqual(first.elementIds, ['a']);
second.collapsed = true;
assert.equal(moveLayerToCollection(doc, 'a', second.id), true);
assert.deepEqual(first.elementIds, []);
assert.deepEqual(second.elementIds, ['a']);
assert.equal(second.collapsed, false);
assert.equal(moveLayerToCollection(doc, 'a', second.id), true);
assert.deepEqual(second.elementIds, ['a']);
assert.equal(moveLayerToCollection(doc, 'missing', second.id), false);
assert.equal(moveLayerToCollection(doc, 'a', 'missing'), false);
assert.deepEqual(second.elementIds, ['a']);
const saved = JSON.parse(JSON.stringify(doc));
assert.deepEqual(saved.layerCollections, doc.layerCollections);
assert.equal(moveLayerToCollection(saved, 'a'), true);
assert.deepEqual(saved.layerCollections[1].elementIds, []);
doc.layerCollections = doc.layerCollections.filter(group => group.id !== second.id);
assert.equal(JSON.stringify(doc.elements), elementsBefore);
assert.equal(JSON.stringify(saved.elements), elementsBefore);
assert.equal(moveLayerToCollection({ elements: doc.elements }, 'a'), true);
console.log('Layer collections: move, ungroup, persistence and canvas isolation OK');

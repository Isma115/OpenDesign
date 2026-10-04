import { getState, getElementById, removeElement, updateElement, updateDocument, clearSelection } from '../core/state.js';
import { snapshotElements, commitAction } from '../core/history.js';
import { renderDocument } from './renderer.js';
import { refreshSelection } from './selection.js';

export function deleteSelectedElements() {
  const state = getState();
  if (!state.selectedElementIds.length) return;
  const before = snapshotElements();
  const beforeCollections = JSON.parse(JSON.stringify(state.document.layerCollections || []));
  const removed = new Set();
  const collect = id => {
    if (removed.has(id)) return;
    const element = getElementById(id);
    if (!element) return;
    removed.add(id);
    if (element.type === 'group') (element.children || []).forEach(collect);
  };
  state.selectedElementIds.forEach(collect);
  for (const element of state.document.elements) {
    if (element.type === 'connector' &&
      (removed.has(element.source?.elementId) || removed.has(element.target?.elementId))) removed.add(element.id);
  }
  for (const element of state.document.elements) {
    if (!removed.has(element.id) && element.type === 'group' && element.children?.some(id => removed.has(id))) {
      updateElement(element.id, { children: element.children.filter(id => !removed.has(id)) });
    }
  }
  removed.forEach(removeElement);
  updateDocument(doc => {
    for (const collection of doc.layerCollections || []) {
      collection.elementIds = collection.elementIds.filter(id => !removed.has(id));
    }
  });
  clearSelection();
  commitAction({ type: 'snapshot', before, after: snapshotElements(), beforeCollections,
    afterCollections: JSON.parse(JSON.stringify(state.document.layerCollections || [])) });
  renderDocument(state.document);
  refreshSelection();
}

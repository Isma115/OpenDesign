// #region Portapapeles de elementos | Funcionalidad | copiado y pegado consistente de elementos y grupos
import { getState, getSelectedElements, addElement, setSelection } from './state.js';
import { renderDocument } from './renderer.js';
import { refreshSelection } from './selection.js';
import { commitAction, snapshotElements } from './history.js';

const PASTE_OFFSET = 40;

export function copySelectedElements() {
  const state = getState();
  state.clipboard = _collectElementsForClipboard(getSelectedElements(), state.document.elements);
}

export function pasteClipboardElements() {
  const state = getState();
  if (state.clipboard.length === 0) return;

  const before = snapshotElements();
  const { copies, selectedIds } = _createClipboardCopies(state.clipboard);
  for (const copy of copies) {
    addElement(copy);
  }
  setSelection(selectedIds);
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _collectElementsForClipboard(selectedElements, allElements) {
  const idsToCopy = new Set(selectedElements.map(element => element.id));
  const collectChildren = (group) => {
    for (const childId of group.children || []) {
      if (idsToCopy.has(childId)) continue;
      idsToCopy.add(childId);
      const child = allElements.find(element => element.id === childId);
      if (child?.type === 'group') collectChildren(child);
    }
  };

  for (const element of selectedElements) {
    if (element.type === 'group') collectChildren(element);
  }

  return allElements
    .filter(element => idsToCopy.has(element.id))
    .map(element => JSON.parse(JSON.stringify(element)));
}

function _createClipboardCopies(clipboard) {
  const idMap = new Map();
  const copiedChildIds = new Set();
  let nextZ = _getNextBatchZIndex();

  for (const element of clipboard) {
    idMap.set(element.id, _createElementId(element.type));
    if (element.type === 'group') {
      for (const childId of element.children || []) copiedChildIds.add(childId);
    }
  }

  const copies = clipboard.map(element => {
    const copy = JSON.parse(JSON.stringify(element));
    copy.id = idMap.get(element.id);
    copy.zIndex = nextZ++;
    _offsetElement(copy);

    if (copy.type === 'group') {
      copy.children = (copy.children || [])
        .map(childId => idMap.get(childId))
        .filter(Boolean);
    }

    if (copy.type === 'connector') {
      _remapConnectorEndpoint(copy.source, idMap);
      _remapConnectorEndpoint(copy.target, idMap);
    }

    return copy;
  });

  const selectedIds = clipboard
    .filter(element => !copiedChildIds.has(element.id))
    .map(element => idMap.get(element.id))
    .filter(Boolean);

  return { copies, selectedIds };
}

function _offsetElement(element) {
  if (element.points) {
    element.points = element.points.map(point => ({
      x: point.x + PASTE_OFFSET,
      y: point.y + PASTE_OFFSET
    }));
  }
  if (element.x != null) element.x += PASTE_OFFSET;
  if (element.y != null) element.y += PASTE_OFFSET;
}

function _remapConnectorEndpoint(endpoint, idMap) {
  if (endpoint?.elementId && idMap.has(endpoint.elementId)) {
    endpoint.elementId = idMap.get(endpoint.elementId);
  }
}

function _createElementId(type) {
  if (type === 'connector') return 'conn_' + crypto.randomUUID().slice(0, 12);
  if (type === 'group') return 'group_' + crypto.randomUUID().slice(0, 12);
  return 'el_' + crypto.randomUUID().slice(0, 12);
}

function _getNextBatchZIndex() {
  const elements = getState().document.elements;
  if (elements.length === 0) return 1;
  return Math.max(...elements.map(element => element.zIndex || 0)) + 1;
}
// #endregion

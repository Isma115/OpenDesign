// #region Historial de cambios | Funcionalidad | deshacer y rehacer acciones
import { getState, setState, loadDocument, setDirty } from './state.js';
import { renderDocument } from '../editor/renderer.js';
import { refreshSelection } from '../editor/selection.js';

const MAX_HISTORY = 50;

export function commitAction(action) {
  const state = getState();
  state.history.past.push(action);
  if (state.history.past.length > MAX_HISTORY) {
    state.history.past.shift();
  }
  state.history.future = [];
}

export function snapshotElements() {
  const state = getState();
  return JSON.parse(JSON.stringify(state.document.elements));
}

export function undo() {
  const state = getState();
  if (state.history.past.length === 0) return;

  const action = state.history.past.pop();
  const currentSnapshot = snapshotElements();
  const currentCollections = action.beforeCollections ? JSON.parse(JSON.stringify(state.document.layerCollections || [])) : null;
  if (action.type === 'snapshot') {
    state.document.elements = JSON.parse(JSON.stringify(action.before));
    if (action.beforeCollections) state.document.layerCollections = JSON.parse(JSON.stringify(action.beforeCollections));
  } else if (action.type === 'addElement') {
    const idx = state.document.elements.findIndex(e => e.id === action.element.id);
    if (idx !== -1) state.document.elements.splice(idx, 1);
  } else if (action.type === 'removeElement') {
    state.document.elements.push(JSON.parse(JSON.stringify(action.element)));
  } else if (action.type === 'updateElement') {
    const el = state.document.elements.find(e => e.id === action.elementId);
    if (el) {
      Object.assign(el, JSON.parse(JSON.stringify(action.before)));
    }
  } else if (action.type === 'batchUpdate') {
    for (const change of action.changes) {
      const el = state.document.elements.find(e => e.id === change.id);
      if (el) Object.assign(el, JSON.parse(JSON.stringify(change.before)));
    }
  }

  state.history.future.push({
    type: 'snapshot',
    before: snapshotElements(),
    after: currentSnapshot,
    ...(currentCollections ? { beforeCollections: JSON.parse(JSON.stringify(state.document.layerCollections || [])), afterCollections: currentCollections } : {})
  });

  state.document.metadata.updatedAt = new Date().toISOString();
  setDirty(true);
  renderDocument(state.document);
  refreshSelection();
}

export function redo() {
  const state = getState();
  if (state.history.future.length === 0) return;

  const action = state.history.future.pop();
  const currentSnapshot = snapshotElements();
  state.history.past.push({
    type: 'snapshot',
    before: currentSnapshot,
    after: action.after ? JSON.parse(JSON.stringify(action.after)) : currentSnapshot,
    ...(action.afterCollections ? { beforeCollections: JSON.parse(JSON.stringify(state.document.layerCollections || [])),
      afterCollections: JSON.parse(JSON.stringify(action.afterCollections)) } : {})
  });

  if (action.type === 'snapshot') {
    state.document.elements = JSON.parse(JSON.stringify(action.after));
    if (action.afterCollections) state.document.layerCollections = JSON.parse(JSON.stringify(action.afterCollections));
  } else if (action.type === 'addElement') {
    state.document.elements.push(JSON.parse(JSON.stringify(action.element)));
  } else if (action.type === 'removeElement') {
    const idx = state.document.elements.findIndex(e => e.id === action.element.id);
    if (idx !== -1) state.document.elements.splice(idx, 1);
  } else if (action.type === 'updateElement') {
    const el = state.document.elements.find(e => e.id === action.elementId);
    if (el) {
      Object.assign(el, JSON.parse(JSON.stringify(action.after)));
    }
  } else if (action.type === 'batchUpdate') {
    for (const change of action.changes) {
      const el = state.document.elements.find(e => e.id === change.id);
      if (el) Object.assign(el, JSON.parse(JSON.stringify(change.after)));
    }
  }

  state.document.metadata.updatedAt = new Date().toISOString();
  setDirty(true);
  renderDocument(state.document);
  refreshSelection();
}

export function clearHistory() {
  const state = getState();
  state.history.past = [];
  state.history.future = [];
}

export function canUndo() {
  return getState().history.past.length > 0;
}

export function canRedo() {
  return getState().history.future.length > 0;
}
// #endregion

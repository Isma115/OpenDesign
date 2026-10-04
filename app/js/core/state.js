// #region Estado global de la aplicacion | Funcionalidad | gestion del estado y notificaciones a suscriptores
import { createDefaultStyles, ensureDocumentStyles } from './css-template.js';

const _state = {
  document: {
    id: 'doc_' + crypto.randomUUID().slice(0, 8),
    name: 'Nuevo diseno',
    version: '1.0.0',
    canvas: {
      width: 1920,
      height: 1080,
      background: '#ffffff',
      grid: {
        enabled: true,
        size: 4,
        color: '#e5e7eb'
      },
      zoom: 1,
      pan: { x: 0, y: 0 }
    },
    elements: [],
    pages: [],
    styles: createDefaultStyles(),
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  selectedElementIds: [],
  filePath: null,
  activeTool: 'select',
  clipboard: [],
  history: {
    past: [],
    future: []
  },
  viewport: {
    zoom: 1,
    panX: 0,
    panY: 0
  },
  interaction: {
    isDragging: false,
    isDrawing: false,
    isPanning: false,
    isRotating: false,
    isResizing: false,
    isConnecting: false,
    dragStart: null,
    currentPointer: null,
    resizeHandle: null,
    connectSource: null,
    spaceHeld: false
  },
  snapping: {
    enabled: true,
    snapToGrid: true,
    snapToObjects: true,
    tolerance: 6
  },
  dirty: false,
  _listeners: []
};

export function getState() {
  return _state;
}

export function setState(partial) {
  Object.assign(_state, partial);
  _notify();
}

export function updateDocument(updater) {
  if (typeof updater === 'function') {
    updater(_state.document);
  } else {
    Object.assign(_state.document, updater);
  }
  _markDocumentUpdated();
}

export function addElement(element) {
  _state.document.elements.push(element);
  _markDocumentUpdated();
}

export function updateElement(id, patch) {
  const el = getElementById(id);
  if (!el) return false;
  _applyElementPatch(el, patch);
  _markDocumentUpdated();
  return true;
}

export function updateElements(updates) {
  let changed = false;

  for (const update of updates) {
    const el = getElementById(update?.id);
    if (!el || !update?.patch) continue;
    _applyElementPatch(el, update.patch);
    changed = true;
  }

  if (changed) _markDocumentUpdated();
  return changed;
}

export function removeElement(id) {
  const idx = _state.document.elements.findIndex(e => e.id === id);
  if (idx === -1) return null;
  const removed = _state.document.elements.splice(idx, 1)[0];
  _state.selectedElementIds = _state.selectedElementIds.filter(sid => sid !== id);
  _markDocumentUpdated();
  return removed;
}

export function getElementById(id) {
  return _state.document.elements.find(e => e.id === id) || null;
}

export function getSelectedElements() {
  return _state.selectedElementIds
    .map(id => getElementById(id))
    .filter(Boolean);
}

export function setSelection(ids) {
  const selectedGroups = ids.map(getElementById).filter(el => el?.type === 'group');
  const childIds = new Set();
  const collect = group => {
    for (const id of group.children || []) {
      if (childIds.has(id)) continue;
      childIds.add(id);
      const child = getElementById(id);
      if (child?.type === 'group') collect(child);
    }
  };
  selectedGroups.forEach(collect);
  _state.selectedElementIds = [...new Set(ids)].filter(id => !childIds.has(id));
  _notify();
}

export function addToSelection(id) {
  if (!_state.selectedElementIds.includes(id)) {
    _state.selectedElementIds.push(id);
    _notify();
  }
}

export function removeFromSelection(id) {
  _state.selectedElementIds = _state.selectedElementIds.filter(sid => sid !== id);
  _notify();
}

export function clearSelection() {
  _state.selectedElementIds = [];
  _notify();
}

export function setActiveTool(tool) {
  _state.activeTool = tool;
  _notify();
}

export function setViewport(viewport) {
  Object.assign(_state.viewport, viewport);
  _notify();
}

export function getElementsByZIndex() {
  return [..._state.document.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
}

export function getNextZIndex() {
  const elements = _state.document.elements;
  if (elements.length === 0) return 1;
  return Math.max(...elements.map(e => e.zIndex || 0)) + 1;
}

export function subscribe(listener) {
  _state._listeners.push(listener);
  return () => {
    _state._listeners = _state._listeners.filter(l => l !== listener);
  };
}

export function setDirty(dirty) {
  _state.dirty = dirty;
  _notify();
}

function _applyElementPatch(element, patch) {
  if (element.type === 'group' && ['x', 'y', 'width', 'height'].some(key => key in patch)) {
    const x = patch.x ?? element.x;
    const y = patch.y ?? element.y;
    const sx = element.width ? (patch.width ?? element.width) / element.width : 1;
    const sy = element.height ? (patch.height ?? element.height) / element.height : 1;
    for (const id of element.children || []) {
      const child = getElementById(id);
      if (!child || child === element) continue;
      const childPatch = {
        x: x + (child.x - element.x) * sx,
        y: y + (child.y - element.y) * sy,
        width: child.width * sx,
        height: child.height * sy
      };
      if (child._lineData) {
        childPatch._lineData = {
          x1: x + (child._lineData.x1 - element.x) * sx,
          y1: y + (child._lineData.y1 - element.y) * sy,
          x2: x + (child._lineData.x2 - element.x) * sx,
          y2: y + (child._lineData.y2 - element.y) * sy
        };
      }
      _applyElementPatch(child, childPatch);
    }
  }
  const nextPatch = { ...patch };
  if (nextPatch.style && typeof nextPatch.style === 'object') {
    element.style = Object.assign({}, element.style, nextPatch.style);
    delete nextPatch.style;
  }
  if (nextPatch.text && typeof nextPatch.text === 'object') {
    element.text = Object.assign({}, element.text, nextPatch.text);
    delete nextPatch.text;
  }
  if (nextPatch.css && typeof nextPatch.css === 'object') {
    element.css = Object.assign({}, element.css, nextPatch.css);
    delete nextPatch.css;
  }
  Object.assign(element, nextPatch);
}

function _markDocumentUpdated() {
  _state.document.metadata.updatedAt = new Date().toISOString();
  _state.dirty = true;
  _notify();
}

function _notify() {
  for (const listener of _state._listeners) {
    try { listener(_state); } catch (e) { console.error('State listener error:', e); }
  }
}

export function loadDocument(docModel) {
  ensureDocumentStyles(docModel);
  _state.document = docModel;
  _state.filePath = null;
  _state.selectedElementIds = [];
  _state.history = { past: [], future: [] };
  _state.dirty = false;
  _notify();
}

export function resetDocument() {
  _state.filePath = null;
  _state.document = {
    id: 'doc_' + crypto.randomUUID().slice(0, 8),
    name: 'Nuevo diseno',
    version: '1.0.0',
    canvas: {
      width: 1920,
      height: 1080,
      background: '#ffffff',
      grid: { enabled: true, size: 4, color: '#e5e7eb' },
      zoom: 1,
      pan: { x: 0, y: 0 }
    },
    elements: [],
    pages: [],
    styles: createDefaultStyles(),
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
  _state.selectedElementIds = [];
  _state.history = { past: [], future: [] };
  _state.viewport = { zoom: 1, panX: 0, panY: 0 };
  _state.dirty = false;
  _notify();
}
// #endregion

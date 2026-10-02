// #region Atajos de teclado | Funcionalidad | manejo de eventos de teclado y acciones
import { getState, setActiveTool, setSelection, clearSelection, getSelectedElements, addElement, removeElement, updateElements } from '../core/state.js';
import { undo, redo, commitAction, snapshotElements } from '../core/history.js';
import { renderDocument, applyViewport } from './renderer.js';
import { screenToCanvas } from '../core/geometry.js';
import { refreshSelection } from './selection.js';
import { createGroup } from '../model/shapes.js';
import { getMultiSelectionBounds } from '../core/geometry.js';
import { copySelectedElements, pasteClipboardElements } from '../io/clipboard.js';
import { updateAllConnectorsForElements } from '../model/connectors.js';
import { cancelActiveCanvasInteraction } from './tools.js';

export function initKeyboard() {
  document.addEventListener('keydown', _onKeyDown);
  document.addEventListener('keyup', _onKeyUp);
}

function _onKeyDown(e) {
  const state = getState();
  const tag = e.target?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
    return;
  }

  if (e.code === 'Space' && !state.interaction.spaceHeld) {
    state.interaction.spaceHeld = true;
    e.preventDefault();
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'z':
        e.preventDefault();
        if (e.shiftKey) { redo(); } else { undo(); }
        return;
      case 'y':
        e.preventDefault();
        redo();
        return;
      case 'c':
        e.preventDefault();
        _copy();
        return;
      case 'x':
        e.preventDefault();
        _cut();
        return;
      case 'v':
        e.preventDefault();
        _paste();
        return;
      case 'd':
        e.preventDefault();
        _duplicate();
        return;
      case 'a':
        e.preventDefault();
        _selectAll();
        return;
      case 'g':
        e.preventDefault();
        if (e.shiftKey) { _ungroup(); } else { _group(); }
        return;
      case 's':
        e.preventDefault();
        import('./storage.js').then(m => m.saveToLocal());
        return;
    }
  }

  switch (e.key.toLowerCase()) {
    case '1':
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        _activateTool('select');
      }
      break;
    case '2':
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        _activateTool('hand');
      }
      break;
    case 'v': _activateTool('select'); break;
    case 'h': _activateTool('hand'); break;
    case 'r': _activateTool('rectangle'); break;
    case 'o': _activateTool('ellipse'); break;
    case 't': _activateTool('text'); break;
    case 'l': _activateTool('line'); break;
    case 'c': _activateTool('connector'); break;
    case 'delete':
    case 'backspace':
      e.preventDefault();
      _deleteSelected();
      break;
    case 'escape':
      cancelActiveCanvasInteraction();
      clearSelection();
      refreshSelection();
      _activateTool('select');
      break;
    case '=':
    case '+':
      e.preventDefault();
      _zoomBy(0.1);
      break;
    case '-':
      e.preventDefault();
      _zoomBy(-0.1);
      break;
    case '0':
      if (!e.ctrlKey) {
        e.preventDefault();
        _setZoom(1);
      }
      break;
    case 'arrowup':
      e.preventDefault();
      _moveSelected(0, e.shiftKey ? -10 : -1);
      break;
    case 'arrowdown':
      e.preventDefault();
      _moveSelected(0, e.shiftKey ? 10 : 1);
      break;
    case 'arrowleft':
      e.preventDefault();
      _moveSelected(e.shiftKey ? -10 : -1, 0);
      break;
    case 'arrowright':
      e.preventDefault();
      _moveSelected(e.shiftKey ? 10 : 1, 0);
      break;
  }
}

function _activateTool(tool) {
  cancelActiveCanvasInteraction();
  if (_isConnectionTool(tool)) {
    clearSelection();
    refreshSelection();
  }
  setActiveTool(tool);
  _updateToolUI();
}

function _isConnectionTool(tool) {
  return ['line', 'arrow', 'connector'].includes(tool);
}

function _onKeyUp(e) {
  if (e.code === 'Space') {
    getState().interaction.spaceHeld = false;
  }
}

function _copy() {
  copySelectedElements();
}

function _cut() {
  _copy();
  _deleteSelected();
}

function _paste() {
  pasteClipboardElements();
}

function _duplicate() {
  _copy();
  _paste();
}

function _deleteSelected() {
  const state = getState();
  if (state.selectedElementIds.length === 0) return;
  const before = snapshotElements();
  const ids = [...state.selectedElementIds];
  for (const id of ids) {
    removeElement(id);
    const relatedConns = state.document.elements.filter(
      e => e.type === 'connector' && (e.source?.elementId === id || e.target?.elementId === id)
    );
    for (const conn of relatedConns) {
      removeElement(conn.id);
    }
  }
  clearSelection();
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _selectAll() {
  const state = getState();
  const ids = state.document.elements.filter(e => e.visible && !e.locked).map(e => e.id);
  setSelection(ids);
  refreshSelection();
}

function _group() {
  const state = getState();
  const selected = getSelectedElements();
  if (selected.length < 2) return;
  const before = snapshotElements();
  const bounds = getMultiSelectionBounds(selected);
  if (!bounds) return;
  const childIds = selected.map(e => e.id);
  const group = createGroup(childIds, bounds.x, bounds.y, bounds.width, bounds.height);
  addElement(group);
  setSelection([group.id]);
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _ungroup() {
  const state = getState();
  const selected = getSelectedElements();
  if (selected.length !== 1 || selected[0].type !== 'group') return;
  const before = snapshotElements();
  const group = selected[0];
  removeElement(group.id);
  setSelection(group.children || []);
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _moveSelected(dx, dy) {
  const state = getState();
  const selected = getSelectedElements();
  if (selected.length === 0) return;
  const before = snapshotElements();
  const updates = [];
  const connectedElementIds = [];

  for (const el of selected) {
    if (el.locked) continue;
    if (el.type === 'connector') {
      continue;
    } else {
      updates.push({ id: el.id, patch: { x: el.x + dx, y: el.y + dy } });
      connectedElementIds.push(el.id);
    }
  }

  if (!updateElements(updates)) return;
  updateAllConnectorsForElements(connectedElementIds);

  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _zoomBy(delta) {
  const state = getState();
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) { _setZoomRaw(state.viewport.zoom + delta); return; }
  const wrapperRect = wrapper.getBoundingClientRect();

  const centerX = wrapperRect.left + wrapperRect.width / 2;
  const centerY = wrapperRect.top + wrapperRect.height / 2;

  const centerCanvas = screenToCanvas(centerX, centerY, state.viewport);

  const newZoom = Math.min(5, Math.max(0.1, state.viewport.zoom + delta));

  const newPanX = centerCanvas.x - (wrapperRect.width / 2) / newZoom;
  const newPanY = centerCanvas.y - (wrapperRect.height / 2) / newZoom;

  state.viewport.zoom = newZoom;
  state.viewport.panX = newPanX;
  state.viewport.panY = newPanY;
  applyViewport(state.viewport);
  _updateZoomUI(newZoom);
}

function _setZoom(zoom) {
  const state = getState();
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) { _setZoomRaw(zoom); return; }
  const wrapperRect = wrapper.getBoundingClientRect();

  const centerX = wrapperRect.left + wrapperRect.width / 2;
  const centerY = wrapperRect.top + wrapperRect.height / 2;

  const centerCanvas = screenToCanvas(centerX, centerY, state.viewport);

  const newZoom = Math.min(5, Math.max(0.1, zoom));

  const newPanX = centerCanvas.x - (wrapperRect.width / 2) / newZoom;
  const newPanY = centerCanvas.y - (wrapperRect.height / 2) / newZoom;

  state.viewport.zoom = newZoom;
  state.viewport.panX = newPanX;
  state.viewport.panY = newPanY;
  applyViewport(state.viewport);
  _updateZoomUI(newZoom);
}

function _setZoomRaw(zoom) {
  const state = getState();
  state.viewport.zoom = Math.min(5, Math.max(0.1, zoom));
  applyViewport(state.viewport);
  _updateZoomUI(state.viewport.zoom);
}

export function zoomBy(delta) { _zoomBy(delta); }
export function setZoom(zoom) { _setZoom(zoom); }

function _updateZoomUI(zoom) {
  const pct = Math.round(zoom * 100) + '%';
  const zoomDisplay = document.getElementById('zoom-display');
  const statusZoom = document.getElementById('status-zoom');
  if (zoomDisplay) zoomDisplay.textContent = pct;
  if (statusZoom) statusZoom.textContent = pct;
}

function _updateToolUI() {
  const state = getState();
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === state.activeTool);
  });
  const canvas = document.getElementById('canvas');
  canvas.setAttribute('class', '');
  canvas.classList.add(`tool-${state.activeTool}`);
}

export function updateToolUI() { _updateToolUI(); }
// #endregion

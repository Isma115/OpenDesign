// #region Atajos de teclado | Funcionalidad | manejo de eventos de teclado y acciones
import { getState, setActiveTool, setSelection, clearSelection, getSelectedElements, getElementById, addElement, removeElement } from './state.js';
import { undo, redo, commitAction, snapshotElements } from './history.js';
import { renderDocument, applyViewport } from './renderer.js';
import { screenToCanvas } from './geometry.js';
import { refreshSelection } from './selection.js';
import { createGroup } from './shapes.js';
import { getMultiSelectionBounds } from './geometry.js';
import { copySelectedElements, pasteClipboardElements } from './clipboard.js';

export function initKeyboard() {
  document.addEventListener('keydown', _onKeyDown);
  document.addEventListener('keyup', _onKeyUp);
}

function _onKeyDown(e) {
  const state = getState();
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
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
    case 'v': setActiveTool('select'); _updateToolUI(); break;
    case 'h': setActiveTool('hand'); _updateToolUI(); break;
    case 'r': setActiveTool('rectangle'); _updateToolUI(); break;
    case 'o': setActiveTool('ellipse'); _updateToolUI(); break;
    case 't': setActiveTool('text'); _updateToolUI(); break;
    case 'l': setActiveTool('line'); _updateToolUI(); break;
    case 'c': setActiveTool('connector'); _updateToolUI(); break;
    case 'delete':
    case 'backspace':
      e.preventDefault();
      _deleteSelected();
      break;
    case 'escape':
      clearSelection();
      refreshSelection();
      setActiveTool('select');
      _updateToolUI();
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
  for (const el of selected) {
    if (el.locked) continue;
    if (el.type === 'connector') {
      if (el.points) {
        el.points = el.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
      }
    } else {
      el.x += dx;
      el.y += dy;
    }
  }
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

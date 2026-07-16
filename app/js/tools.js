// #region Herramientas de dibujo | Funcionalidad | manejo de interacciones del lienzo
import { getState, setActiveTool, addElement, updateElement, removeElement, setSelection, clearSelection, getElementById } from './state.js';
import { screenToCanvas, getElementBounds } from './geometry.js';
import { createShapeByTool } from './shapes.js';
import { renderDocument, renderElement, updateElementNode, clearPreview, renderPreview, applyViewport, getSvgCanvas, renderGuideLines, clearGuides, SVG_NS } from './renderer.js';
import { handleSelectionClick, handleCanvasClick, hitTest, hitTestHandle, hitTestConnectionPoint, startSelectionBox, updateSelectionBox, endSelectionBox, refreshSelection } from './selection.js';
import { snapElement, snapPoint } from './snapping.js';
import { commitAction, snapshotElements } from './history.js';
import { createConnectorElement, updateAllConnectorsForElement } from './connectors.js';

let _dragData = null;
let _lastClickTime = 0;
let _lastClickPoint = null;
let _pointerDownPos = null;
const DBL_CLICK_THRESHOLD = 400;
const DBL_CLICK_DISTANCE = 5;

export function initTools() {
  const canvas = getSvgCanvas();
  if (!canvas) return;

  canvas.addEventListener('pointerdown', _onPointerDown);
  canvas.addEventListener('pointermove', _onPointerMove);
  canvas.addEventListener('pointerup', _onPointerUp);
  canvas.addEventListener('wheel', _onWheel, { passive: false });

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      if (tool) {
        setActiveTool(tool);
        _updateToolCursor();
      }
    });
  });
}

function _onPointerDown(e) {
  const state = getState();
  const canvas = getSvgCanvas();
  canvas.setPointerCapture(e.pointerId);
  const point = screenToCanvas(e.clientX, e.clientY, state.viewport);
  _pointerDownPos = point;

  if (state.interaction.spaceHeld || state.activeTool === 'hand') {
    _startPan(e);
    return;
  }

  if (state.activeTool === 'select') {
    _handleSelectDown(e, point);
  } else if (state.activeTool === 'connector') {
    _handleConnectorDown(e, point);
  } else if (_isDrawingTool(state.activeTool)) {
    _handleDrawDown(e, point);
  }
}

function _onPointerMove(e) {
  const state = getState();
  const point = screenToCanvas(e.clientX, e.clientY, state.viewport);

  _updateCoords(point);

  if (state.interaction.isPanning) {
    _doPan(e);
    return;
  }

  if (state.interaction.isDragging) {
    _doDrag(point);
    return;
  }

  if (state.interaction.isResizing) {
    _doResize(point);
    return;
  }

  if (state.interaction.isRotating) {
    _doRotate(point);
    return;
  }

  if (state.interaction.isDrawing) {
    _doDraw(point);
    return;
  }

  if (state.interaction.isConnecting) {
    _doConnect(point);
    return;
  }

  if (state.activeTool === 'select') {
    const handle = hitTestHandle(point);
    if (handle) return;
    const hitId = hitTest(point);
    const canvas = getSvgCanvas();
    canvas.style.cursor = hitId ? 'move' : 'default';
  }
}

function _onPointerUp(e) {
  const state = getState();
  const point = screenToCanvas(e.clientX, e.clientY, state.viewport);
  const canvas = getSvgCanvas();
  canvas.releasePointerCapture(e.pointerId);

  const didMove = _pointerDownPos &&
    (Math.abs(point.x - _pointerDownPos.x) > DBL_CLICK_DISTANCE ||
     Math.abs(point.y - _pointerDownPos.y) > DBL_CLICK_DISTANCE);

  if (!didMove) {
    const now = Date.now();
    const isDblClick = state.activeTool === 'select' &&
      _lastClickPoint &&
      Math.abs(point.x - _lastClickPoint.x) < DBL_CLICK_DISTANCE &&
      Math.abs(point.y - _lastClickPoint.y) < DBL_CLICK_DISTANCE &&
      (now - _lastClickTime) < DBL_CLICK_THRESHOLD;

    _lastClickTime = now;
    _lastClickPoint = point;

    if (isDblClick) {
      _cancelActiveInteraction();
      _handleDblClick(point);
      _pointerDownPos = null;
      return;
    }
  }

  if (state.interaction.isPanning) {
    _endPan(e);
    return;
  }

  if (state.interaction.isDragging) {
    _endDrag(point);
    return;
  }

  if (state.interaction.isResizing) {
    _endResize(point);
    return;
  }

  if (state.interaction.isRotating) {
    _endRotate(point);
    return;
  }

  if (state.interaction.isDrawing) {
    _endDraw(point);
    return;
  }

  if (state.interaction.isConnecting) {
    _endConnect(point);
    return;
  }

  _pointerDownPos = null;
}

function _handleDblClick(point) {
  const state = getState();
  const hitId = hitTest(point);
  if (!hitId) return;
  const el = getElementById(hitId);
  if (!el || el.locked) return;
  if (el.type === 'connector') return;
  _startTextEdit(el);
}

function _onWheel(e) {
  e.preventDefault();
  const state = getState();
  const wrapper = document.getElementById('canvas-wrapper');
  const wrapperRect = wrapper.getBoundingClientRect();

  const mouseDisplayX = e.clientX - wrapperRect.left;
  const mouseDisplayY = e.clientY - wrapperRect.top;

  const mouseCanvas = screenToCanvas(e.clientX, e.clientY, state.viewport);

  const oldZoom = state.viewport.zoom;
  const delta = e.deltaY > 0 ? -0.08 : 0.08;
  const newZoom = Math.min(5, Math.max(0.1, oldZoom + delta));

  if (newZoom !== oldZoom) {
    const newPanX = mouseCanvas.x - mouseDisplayX / newZoom;
    const newPanY = mouseCanvas.y - mouseDisplayY / newZoom;

    state.viewport.zoom = newZoom;
    state.viewport.panX = newPanX;
    state.viewport.panY = newPanY;
    applyViewport(state.viewport);
    _updateZoomUI(newZoom);
  }
}

function _handleSelectDown(e, point) {
  const state = getState();

  const handle = hitTestHandle(point);
  if (handle) {
    if (handle === 'rotate') {
      _startRotate(point);
    } else {
      _startResize(point, handle);
    }
    return;
  }

  const hitId = hitTest(point);
  if (hitId) {
    const el = getElementById(hitId);
    if (el && el.locked) {
      handleSelectionClick(hitId, e);
      return;
    }
    handleSelectionClick(hitId, e);
    _startDrag(point);
  } else {
    handleCanvasClick(e);
    startSelectionBox(point);
    state.interaction.isDrawing = true;
    state.interaction._isSelectionBox = true;
    state.interaction.dragStart = point;
  }
}

function _startDrag(point) {
  const state = getState();
  const selected = state.selectedElementIds.map(id => getElementById(id)).filter(Boolean);
  if (selected.length === 0) return;
  state.interaction.isDragging = true;
  state.interaction.dragStart = point;
  _dragData = {
    snapshot: snapshotElements(),
    startPositions: selected.map(el => ({
      id: el.id,
      x: el.x || 0,
      y: el.y || 0,
      lineData: el._lineData ? { ...el._lineData } : null,
      points: el.points ? el.points.map(p => ({ ...p })) : null
    }))
  };
}

function _doDrag(point) {
  const state = getState();
  if (!_dragData) return;
  const dx = point.x - state.interaction.dragStart.x;
  const dy = point.y - state.interaction.dragStart.y;

  for (const start of _dragData.startPositions) {
    const el = getElementById(start.id);
    if (!el || el.locked) continue;
    if (el.type === 'connector' && start.points) {
      el.points = start.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
    } else {
      const snapped = snapElement({ ...el, x: start.x, y: start.y }, dx, dy);
      el.x = snapped.x;
      el.y = snapped.y;
      if (start.lineData) {
        const snappedDx = snapped.x - start.x;
        const snappedDy = snapped.y - start.y;
        _translateLineData(el, start.lineData, snappedDx, snappedDy);
      }
      renderGuideLines(snapped.guides);
    }
  }
  renderDocument(state.document);
  refreshSelection();
}

function _endDrag(point) {
  const state = getState();
  state.interaction.isDragging = false;
  clearGuides();
  _pointerDownPos = null;
  if (_dragData) {
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before: _dragData.snapshot, after });
    for (const start of _dragData.startPositions) {
      updateAllConnectorsForElement(start.id);
    }
    _dragData = null;
  }
  renderDocument(state.document);
  refreshSelection();
}

function _startResize(point, handle) {
  const state = getState();
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  state.interaction.isResizing = true;
  state.interaction.resizeHandle = handle;
  state.interaction.dragStart = point;
  _dragData = {
    snapshot: snapshotElements(),
    startX: el.x,
    startY: el.y,
    startWidth: el.width,
    startHeight: el.height,
    startLineData: el._lineData ? { ...el._lineData } : null
  };
}

function _doResize(point) {
  const state = getState();
  if (!_dragData) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const handle = state.interaction.resizeHandle;
  const dx = point.x - state.interaction.dragStart.x;
  const dy = point.y - state.interaction.dragStart.y;
  const minSize = 20;

  let newX = _dragData.startX;
  let newY = _dragData.startY;
  let newW = _dragData.startWidth;
  let newH = _dragData.startHeight;

  if (handle.includes('e')) { newW = Math.max(minSize, _dragData.startWidth + dx); }
  if (handle.includes('w')) { newX = _dragData.startX + dx; newW = Math.max(minSize, _dragData.startWidth - dx); }
  if (handle.includes('s')) { newH = Math.max(minSize, _dragData.startHeight + dy); }
  if (handle.includes('n')) { newY = _dragData.startY + dy; newH = Math.max(minSize, _dragData.startHeight - dy); }

  if (_shiftHeld) {
    const ratio = _dragData.startWidth / _dragData.startHeight;
    if (handle === 'e' || handle === 'w') {
      newH = newW / ratio;
    } else if (handle === 'n' || handle === 's') {
      newW = newH * ratio;
    } else {
      newH = newW / ratio;
    }
  }

  el.x = newX;
  el.y = newY;
  el.width = newW;
  el.height = newH;
  if (_dragData.startLineData) {
    _resizeLineData(el, _dragData.startLineData, _dragData.startX, _dragData.startY, _dragData.startWidth, _dragData.startHeight);
  }

  renderDocument(state.document);
  refreshSelection();
}

function _translateLineData(element, startLineData, dx, dy) {
  element._lineData = {
    x1: startLineData.x1 + dx,
    y1: startLineData.y1 + dy,
    x2: startLineData.x2 + dx,
    y2: startLineData.y2 + dy
  };
}

function _resizeLineData(element, startLineData, startX, startY, startWidth, startHeight) {
  const scaleX = startWidth ? element.width / startWidth : 1;
  const scaleY = startHeight ? element.height / startHeight : 1;
  element._lineData = {
    x1: element.x + (startLineData.x1 - startX) * scaleX,
    y1: element.y + (startLineData.y1 - startY) * scaleY,
    x2: element.x + (startLineData.x2 - startX) * scaleX,
    y2: element.y + (startLineData.y2 - startY) * scaleY
  };
}

function _endResize(point) {
  const state = getState();
  state.interaction.isResizing = false;
  _pointerDownPos = null;
  if (_dragData) {
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before: _dragData.snapshot, after });
    if (state.selectedElementIds[0]) {
      updateAllConnectorsForElement(state.selectedElementIds[0]);
    }
    _dragData = null;
  }
  renderDocument(state.document);
  refreshSelection();
}

function _startRotate(point) {
  const state = getState();
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  state.interaction.isRotating = true;
  state.interaction.dragStart = point;
  _dragData = {
    snapshot: snapshotElements(),
    startRotation: el.rotation || 0,
    centerX: el.x + el.width / 2,
    centerY: el.y + el.height / 2
  };
}

function _doRotate(point) {
  const state = getState();
  if (!_dragData) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const angle = Math.atan2(
    point.y - _dragData.centerY,
    point.x - _dragData.centerX
  ) * 180 / Math.PI + 90;
  el.rotation = Math.round(angle) % 360;
  if (el.rotation < 0) el.rotation += 360;
  renderDocument(state.document);
  refreshSelection();
}

function _endRotate(point) {
  const state = getState();
  state.interaction.isRotating = false;
  _pointerDownPos = null;
  if (_dragData) {
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before: _dragData.snapshot, after });
    _dragData = null;
  }
  renderDocument(state.document);
  refreshSelection();
}

function _handleConnectorDown(e, point) {
  const state = getState();
  const cp = hitTestConnectionPoint(point);
  if (cp) {
    state.interaction.isConnecting = true;
    state.interaction.connectSource = cp;
    state.interaction.dragStart = point;
  }
}

function _doConnect(point) {
  const state = getState();
  if (!state.interaction.connectSource) return;
  const src = state.interaction.connectSource;
  const previewSvg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  previewSvg.setAttribute('x1', src.x);
  previewSvg.setAttribute('y1', src.y);
  previewSvg.setAttribute('x2', point.x);
  previewSvg.setAttribute('y2', point.y);
  previewSvg.classList.add('connector-preview');
  renderPreview(previewSvg);
}

function _endConnect(point) {
  const state = getState();
  state.interaction.isConnecting = false;
  clearPreview();
  _pointerDownPos = null;
  if (!state.interaction.connectSource) return;

  const cp = hitTestConnectionPoint(point);
  if (cp && cp.elementId !== state.interaction.connectSource.elementId) {
    const before = snapshotElements();
    const connector = createConnectorElement(
      state.interaction.connectSource,
      cp,
      'orthogonal'
    );
    if (connector) {
      addElement(connector);
      const after = snapshotElements();
      commitAction({ type: 'snapshot', before, after });
      setSelection([connector.id]);
      renderDocument(state.document);
      refreshSelection();
    }
  }
  state.interaction.connectSource = null;
}

function _handleDrawDown(e, point) {
  const state = getState();
  state.interaction.isDrawing = true;
  state.interaction._isSelectionBox = false;
  state.interaction.dragStart = point;
  _dragData = { snapshot: snapshotElements() };
}

function _doDraw(point) {
  const state = getState();
  if (state.interaction._isSelectionBox) {
    updateSelectionBox(state.interaction.dragStart, point);
    return;
  }
  const start = state.interaction.dragStart;
  const x = Math.min(start.x, point.x);
  const y = Math.min(start.y, point.y);
  const w = Math.abs(point.x - start.x);
  const h = Math.abs(point.y - start.y);

  if (w < 3 && h < 3) return;

  const previewSvg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  previewSvg.setAttribute('x', x);
  previewSvg.setAttribute('y', y);
  previewSvg.setAttribute('width', w);
  previewSvg.setAttribute('height', h);
  previewSvg.classList.add('shape-preview');
  renderPreview(previewSvg);
}

function _endDraw(point) {
  const state = getState();
  state.interaction.isDrawing = false;

  if (state.interaction._isSelectionBox) {
    endSelectionBox(state.interaction.dragStart, point);
    state.interaction._isSelectionBox = false;
    _dragData = null;
    return;
  }

  clearPreview();
  const start = state.interaction.dragStart;
  let x = Math.min(start.x, point.x);
  let y = Math.min(start.y, point.y);
  let w = Math.abs(point.x - start.x);
  let h = Math.abs(point.y - start.y);

  const tool = state.activeTool;
  if (tool === 'text' || tool === 'note') {
    x = start.x;
    y = start.y;
    w = 0;
    h = 0;
  }

  if (w < 5 && h < 5 && tool !== 'text' && tool !== 'note') {
    w = tool === 'line' || tool === 'arrow' ? 150 : 120;
    h = tool === 'line' || tool === 'arrow' ? 0 : 80;
  }

  const snapped = snapPoint(x, y);
  const element = createShapeByTool(tool, snapped.x, snapped.y, w, h);
  if (element) {
    const before = _dragData ? _dragData.snapshot : snapshotElements();
    addElement(element);
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    setSelection([element.id]);
    renderDocument(state.document);
    refreshSelection();
    setActiveTool('select');
    _updateToolCursor();
  }
  _dragData = null;
  _pointerDownPos = null;
}

function _startPan(e) {
  const state = getState();
  state.interaction.isPanning = true;
  state.interaction.dragStart = { x: e.clientX, y: e.clientY };
  const canvas = getSvgCanvas();
  canvas.classList.add('panning');
  _dragData = {
    panX: state.viewport.panX || 0,
    panY: state.viewport.panY || 0
  };
}

function _doPan(e) {
  const state = getState();
  const dx = e.clientX - state.interaction.dragStart.x;
  const dy = e.clientY - state.interaction.dragStart.y;
  const zoom = state.viewport.zoom;
  state.viewport.panX = _dragData.panX - dx / zoom;
  state.viewport.panY = _dragData.panY - dy / zoom;
  applyViewport(state.viewport);
}

function _endPan(e) {
  const state = getState();
  state.interaction.isPanning = false;
  const canvas = getSvgCanvas();
  canvas.classList.remove('panning');
  _dragData = null;
  _pointerDownPos = null;
}

function _startTextEdit(el) {
  _cancelActiveInteraction();
  const restoreEditedText = _hideRenderedTextForEdit(el.id);
  const bounds = getElementBounds(el);
  const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  fo.setAttribute('x', bounds.x);
  fo.setAttribute('y', bounds.y);
  fo.setAttribute('width', bounds.width);
  fo.setAttribute('height', bounds.height);

  const textarea = document.createElement('textarea');
  textarea.className = 'foreign-text-input';
  textarea.value = el.text?.value || '';
  textarea.style.fontSize = (el.text?.fontSize || 16) + 'px';
  textarea.style.textAlign = el.text?.align || 'center';
  textarea.style.color = el.text?.color || '#111827';
  textarea.style.fontFamily = el.text?.fontFamily || 'Inter, Arial, sans-serif';
  textarea.style.background = el.style?.fill && el.style.fill !== 'none'
    ? el.style.fill
    : 'transparent';

  fo.appendChild(textarea);
  const previewLayer = document.getElementById('preview-layer');
  previewLayer.appendChild(fo);
  textarea.focus();
  textarea.select();

  let cancelled = false;

  const finish = () => {
    if (cancelled) return;
    cancelled = true;
    const before = snapshotElements();
    const newValue = textarea.value;
    updateElement(el.id, { text: { ...el.text, value: newValue } });
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    if (fo.parentNode) previewLayer.removeChild(fo);
    restoreEditedText();
    renderDocument(getState().document);
    refreshSelection();
  };

  ['pointerdown', 'pointermove', 'pointerup', 'click', 'dblclick'].forEach(eventName => {
    textarea.addEventListener(eventName, (e) => {
      e.stopPropagation();
    });
  });

  textarea.addEventListener('blur', finish);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cancelled = true;
      textarea.removeEventListener('blur', finish);
      if (fo.parentNode) previewLayer.removeChild(fo);
      restoreEditedText();
      renderDocument(getState().document);
      refreshSelection();
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      textarea.blur();
    }
    e.stopPropagation();
  });
}

function _hideRenderedTextForEdit(elementId) {
  const hiddenNodes = [];
  document.querySelectorAll('[data-element-id]').forEach(node => {
    if (node.dataset.elementId !== elementId) return;
    if (node.classList?.contains('text-element')) {
      hiddenNodes.push({ node, visibility: node.style.visibility });
    }
    node.querySelectorAll?.('.text-element').forEach(textNode => {
      hiddenNodes.push({ node: textNode, visibility: textNode.style.visibility });
    });
  });

  hiddenNodes.forEach(({ node }) => {
    node.style.visibility = 'hidden';
  });

  return () => {
    hiddenNodes.forEach(({ node, visibility }) => {
      node.style.visibility = visibility;
    });
  };
}

function _cancelActiveInteraction() {
  const state = getState();
  state.interaction.isDragging = false;
  state.interaction.isDrawing = false;
  state.interaction.isPanning = false;
  state.interaction.isRotating = false;
  state.interaction.isResizing = false;
  state.interaction.isConnecting = false;
  state.interaction.dragStart = null;
  state.interaction.resizeHandle = null;
  state.interaction.connectSource = null;
  state.interaction._isSelectionBox = false;
  clearPreview();
  clearGuides();
  const canvas = getSvgCanvas();
  if (canvas) canvas.classList.remove('panning');
  _dragData = null;
  _pointerDownPos = null;
}

function _isDrawingTool(tool) {
  return [
    'rectangle', 'roundedRectangle', 'ellipse', 'triangle', 'diamond',
    'pentagon', 'hexagon', 'star', 'line', 'arrow', 'text', 'note', 'frame',
    'flow-start', 'flow-process', 'flow-decision', 'flow-io',
    'flow-database', 'flow-document', 'flow-subprocess'
  ].includes(tool);
}

function _updateToolCursor() {
  const state = getState();
  const canvas = getSvgCanvas();
  canvas.setAttribute('class', '');
  canvas.classList.add(`tool-${state.activeTool}`);
}

function _updateCoords(point) {
  const coords = document.getElementById('status-coords');
  if (coords) {
    coords.textContent = `X: ${Math.round(point.x)}  Y: ${Math.round(point.y)}`;
  }
}

function _updateZoomUI(zoom) {
  const pct = Math.round(zoom * 100) + '%';
  const zoomDisplay = document.getElementById('zoom-display');
  const statusZoom = document.getElementById('status-zoom');
  if (zoomDisplay) zoomDisplay.textContent = pct;
  if (statusZoom) statusZoom.textContent = pct;
}

let _shiftHeld = false;

document.addEventListener('keydown', (e) => { if (e.key === 'Shift') _shiftHeld = true; });
document.addEventListener('keyup', (e) => { if (e.key === 'Shift') _shiftHeld = false; });
// #endregion

// #region Herramientas de dibujo | Funcionalidad | manejo de interacciones del lienzo
import { getState, setActiveTool, addElement, updateElement, updateElements, removeElement, setSelection, clearSelection, getElementById } from '../core/state.js';
import { screenToCanvas, getElementBounds } from '../core/geometry.js';
import { createShapeByTool } from '../model/shapes.js';
import { createComponentGroup, getPendingChildren } from '../model/components.js';
import { renderDocument, renderElement, updateElementNode, clearPreview, renderPreview, applyViewport, getSvgCanvas, renderGuideLines, clearGuides, SVG_NS } from './renderer.js';
import { handleSelectionClick, handleCanvasClick, hitTest, hitTestHandle, hitTestConnectionPoint, updateSelectionBox, endSelectionBox, refreshSelection } from './selection.js';
import { snapElement, snapPoint } from '../core/snapping.js';
import { commitAction, snapshotElements } from '../core/history.js';
import {
  createConnectorElement,
  getBestConnectionPointId,
  getConnectableElementAtPoint,
  getConnectionPoint,
  getConnectionPointDirection,
  getConnectionPointIdFromClick,
  resolveConnectorEndpoints,
  routeConnector,
  updateAllConnectorsForElement,
  updateAllConnectorsForElements
} from '../model/connectors.js';

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

  document.querySelectorAll('.tool-btn[data-tool], .component-item[data-component]').forEach(btn => {
    if (btn.dataset.component) {
      btn.title = `${btn.getAttribute('aria-label') || btn.dataset.component}: clic para seleccionar y colocar, o arrastra al lienzo`;
    }
    btn.addEventListener('click', () => {
      const tool = btn.dataset.component ? `component:${btn.dataset.component}` : btn.dataset.tool;
      if (tool) {
        _cancelActiveInteraction();
        if (_isConnectionTool(tool)) {
          clearSelection();
          refreshSelection();
        }
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
  } else if (_isConnectionTool(state.activeTool)) {
    _handleConnectionToolDown(e, point);
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

  const didMove = state.interaction.isPanning
    ? Math.abs(e.clientX - state.interaction.dragStart.x) > DBL_CLICK_DISTANCE ||
      Math.abs(e.clientY - state.interaction.dragStart.y) > DBL_CLICK_DISTANCE
    : _pointerDownPos &&
      (Math.abs(point.x - _pointerDownPos.x) > DBL_CLICK_DISTANCE ||
       Math.abs(point.y - _pointerDownPos.y) > DBL_CLICK_DISTANCE);

  if (didMove) {
    _lastClickTime = 0;
    _lastClickPoint = null;
  }

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
    _pointerDownPos = null;
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
  if (!el.text || el.shape === 'image') return;
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
    _startPan(e);
  }
}

function _startDrag(point) {
  const state = getState();
  const selected = state.selectedElementIds
    .map(id => getElementById(id))
    .filter(element => element && element.type !== 'connector');
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
  const updates = [];
  const movedElementIds = [];

  for (const start of _dragData.startPositions) {
    const el = getElementById(start.id);
    if (!el || el.locked) continue;
    const snapped = snapElement({ ...el, x: start.x, y: start.y }, dx, dy);
    const patch = { x: snapped.x, y: snapped.y };
    if (start.lineData) {
      const snappedDx = snapped.x - start.x;
      const snappedDy = snapped.y - start.y;
      patch._lineData = _getTranslatedLineData(start.lineData, snappedDx, snappedDy);
    }
    updates.push({ id: el.id, patch });
    movedElementIds.push(el.id);
    renderGuideLines(snapped.guides);
  }
  if (updateElements(updates)) {
    updateAllConnectorsForElements(movedElementIds);
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

  const patch = { x: newX, y: newY, width: newW, height: newH };
  if (_dragData.startLineData) {
    patch._lineData = _getResizedLineData(
      _dragData.startLineData,
      _dragData.startX,
      _dragData.startY,
      _dragData.startWidth,
      _dragData.startHeight,
      newX,
      newY,
      newW,
      newH
    );
  }
  updateElement(el.id, patch);
  updateAllConnectorsForElement(el.id);

  renderDocument(state.document);
  refreshSelection();
}

function _getTranslatedLineData(startLineData, dx, dy) {
  return {
    x1: startLineData.x1 + dx,
    y1: startLineData.y1 + dy,
    x2: startLineData.x2 + dx,
    y2: startLineData.y2 + dy
  };
}

function _getResizedLineData(startLineData, startX, startY, startWidth, startHeight, x, y, width, height) {
  const scaleX = startWidth ? width / startWidth : 1;
  const scaleY = startHeight ? height / startHeight : 1;
  return {
    x1: x + (startLineData.x1 - startX) * scaleX,
    y1: y + (startLineData.y1 - startY) * scaleY,
    x2: x + (startLineData.x2 - startX) * scaleX,
    y2: y + (startLineData.y2 - startY) * scaleY
  };
}

function _endResize(point) {
  const state = getState();
  state.interaction.isResizing = false;
  _pointerDownPos = null;
  if (_dragData) {
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before: _dragData.snapshot, after });
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
  let rotation = Math.round(angle) % 360;
  if (rotation < 0) rotation += 360;
  updateElement(el.id, { rotation });
  updateAllConnectorsForElement(el.id);
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

function _handleConnectionToolDown(e, point) {
  const state = getState();
  if (state.interaction.isConnecting && state.interaction.connectSource) {
    _completeConnection(point);
    return;
  }

  const sourceTarget = _getConnectionTargetAtPoint(point);
  if (sourceTarget) {
    _startConnection(sourceTarget.element, point, sourceTarget.pointId);
    return;
  }

  // Las líneas libres siguen estando disponibles al empezar sobre un espacio vacío.
  if (state.activeTool === 'line' || state.activeTool === 'arrow') {
    _handleDrawDown(e, point);
  }
}

function _startConnection(sourceElement, point, preferredPointId = null) {
  const state = getState();
  state.interaction.isConnecting = true;
  state.interaction.connectSource = {
    elementId: sourceElement.id,
    preferredPointId: preferredPointId || getConnectionPointIdFromClick(sourceElement, point),
    tool: state.activeTool
  };
  state.interaction.currentPointer = point;

  const canvas = getSvgCanvas();
  if (canvas) {
    canvas.classList.add('connection-pending');
    _setConnectionHighlight(sourceElement.id);
  }
  _doConnect(point);
}

function _doConnect(point) {
  const state = getState();
  const source = state.interaction.connectSource;
  if (!source) return;

  const sourceElement = getElementById(source.elementId);
  if (!sourceElement) {
    _clearConnectionInteraction();
    return;
  }

  state.interaction.currentPointer = point;
  const config = _getConnectionToolConfig(source.tool);
  const target = _getConnectionTargetAtPoint(point, sourceElement.id);
  const targetElement = target?.element || null;

  if (targetElement) {
    const endpoints = resolveConnectorEndpoints(
      sourceElement,
      targetElement,
      source.preferredPointId,
      target.pointId
    );
    if (endpoints) {
      const sourcePoint = getConnectionPoint(sourceElement, endpoints.source.pointId);
      const targetPoint = getConnectionPoint(targetElement, endpoints.target.pointId);
      if (sourcePoint && targetPoint) {
        const points = routeConnector(
          sourcePoint,
          targetPoint,
          config.connectorType,
          getConnectionPointDirection(sourceElement, endpoints.source.pointId),
          getConnectionPointDirection(targetElement, endpoints.target.pointId)
        );
        _renderConnectionPreview(points, config);
        _setConnectionHighlight(sourceElement.id, targetElement.id);
        return;
      }
    }
  }

  const sourcePointId = getBestConnectionPointId(sourceElement, point, source.preferredPointId);
  const sourcePoint = getConnectionPoint(sourceElement, sourcePointId);
  if (!sourcePoint) return;
  const points = routeConnector(
    sourcePoint,
    point,
    config.connectorType,
    getConnectionPointDirection(sourceElement, sourcePointId)
  );
  _renderConnectionPreview(points, config);
  _setConnectionHighlight(sourceElement.id);
}

function _completeConnection(point) {
  const state = getState();
  const source = state.interaction.connectSource;
  const sourceElement = source ? getElementById(source.elementId) : null;
  const target = sourceElement
    ? _getConnectionTargetAtPoint(point, sourceElement.id)
    : null;
  const targetElement = target?.element || null;

  if (!sourceElement || !targetElement) {
    _clearConnectionInteraction();
    return;
  }

  const endpoints = resolveConnectorEndpoints(
    sourceElement,
    targetElement,
    source.preferredPointId,
    target.pointId
  );
  if (!endpoints) {
    _clearConnectionInteraction();
    return;
  }

  const config = _getConnectionToolConfig(source.tool);
  const before = snapshotElements();
  const connector = createConnectorElement(
    endpoints.source,
    endpoints.target,
    config.connectorType,
    config.styleOverrides
  );

  if (connector) {
    addElement(connector);
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    setSelection([connector.id]);
  }

  _clearConnectionInteraction();
  renderDocument(state.document);
  refreshSelection();
}

function _getConnectionTargetAtPoint(point, excludedElementId = null) {
  const connectionPoint = hitTestConnectionPoint(point);
  if (connectionPoint && connectionPoint.elementId !== excludedElementId) {
    const element = getElementById(connectionPoint.elementId);
    if (element) {
      return { element, pointId: connectionPoint.pointId };
    }
  }

  const element = getConnectableElementAtPoint(point, excludedElementId);
  if (!element) return null;
  return {
    element,
    pointId: getConnectionPointIdFromClick(element, point)
  };
}

function _renderConnectionPreview(points, config) {
  const previewSvg = document.createElementNS(SVG_NS, 'path');
  previewSvg.setAttribute('d', _getConnectorPathData(points, config.connectorType));
  if (config.styleOverrides.endMarker === 'arrow') {
    previewSvg.setAttribute('marker-end', 'url(#arrow-marker)');
  }
  previewSvg.classList.add('connector-preview');
  renderPreview(previewSvg);
}

function _getConnectionToolConfig(tool) {
  switch (tool) {
    case 'line':
      return {
        connectorType: 'straight',
        styleOverrides: { endMarker: null }
      };
    case 'arrow':
      return {
        connectorType: 'straight',
        styleOverrides: { endMarker: 'arrow' }
      };
    case 'connector':
    default:
      return {
        connectorType: 'orthogonal',
        styleOverrides: { endMarker: 'arrow' }
      };
  }
}

function _getConnectorPathData(points, connectorType) {
  if (connectorType === 'curved' && points.length >= 4) {
    return `M ${points[0].x} ${points[0].y} C ${points[1].x} ${points[1].y}, ${points[2].x} ${points[2].y}, ${points[3].x} ${points[3].y}`;
  }
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function _setConnectionHighlight(sourceId, targetId = null) {
  const canvas = getSvgCanvas();
  if (!canvas) return;
  canvas.querySelectorAll('.connection-source, .connection-target').forEach(node => {
    node.classList.remove('connection-source', 'connection-target');
  });
  const sourceNode = canvas.querySelector(`[data-element-id="${sourceId}"]`);
  if (sourceNode) sourceNode.classList.add('connection-source');
  if (targetId) {
    const targetNode = canvas.querySelector(`[data-element-id="${targetId}"]`);
    if (targetNode) targetNode.classList.add('connection-target');
  }
}

function _clearConnectionInteraction() {
  const state = getState();
  state.interaction.isConnecting = false;
  state.interaction.connectSource = null;
  state.interaction.currentPointer = null;
  clearPreview();
  const canvas = getSvgCanvas();
  if (canvas) {
    canvas.classList.remove('connection-pending');
    canvas.querySelectorAll('.connection-source, .connection-target').forEach(node => {
      node.classList.remove('connection-source', 'connection-target');
    });
  }
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

  const isLineTool = state.activeTool === 'line' || state.activeTool === 'arrow';
  const previewSvg = document.createElementNS(SVG_NS, isLineTool ? 'line' : 'rect');
  if (isLineTool) {
    previewSvg.setAttribute('x1', start.x);
    previewSvg.setAttribute('y1', start.y);
    previewSvg.setAttribute('x2', point.x);
    previewSvg.setAttribute('y2', point.y);
    if (state.activeTool === 'arrow') previewSvg.setAttribute('marker-end', 'url(#arrow-marker)');
  } else {
    previewSvg.setAttribute('x', x);
    previewSvg.setAttribute('y', y);
    previewSvg.setAttribute('width', w);
    previewSvg.setAttribute('height', h);
  }
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
  const tool = state.activeTool;
  const isLineTool = tool === 'line' || tool === 'arrow';
  let element = null;

  if (isLineTool) {
    const hasLength = Math.hypot(point.x - start.x, point.y - start.y) >= 5;
    const endPoint = hasLength ? point : { x: start.x + 150, y: start.y };
    const snappedStart = snapPoint(start.x, start.y);
    const snappedEnd = snapPoint(endPoint.x, endPoint.y);
    element = createShapeByTool(
      tool,
      snappedStart.x,
      snappedStart.y,
      snappedEnd.x - snappedStart.x,
      snappedEnd.y - snappedStart.y
    );
  }

  let x = Math.min(start.x, point.x);
  let y = Math.min(start.y, point.y);
  let w = Math.abs(point.x - start.x);
  let h = Math.abs(point.y - start.y);

  if (tool === 'text' || tool === 'note') {
    x = start.x;
    y = start.y;
    w = 0;
    h = 0;
  }

  if (!isLineTool && !tool.startsWith('component:') && w < 5 && h < 5 && tool !== 'text' && tool !== 'note') {
    w = 120;
    h = 80;
  }

  if (!element) {
    const snapped = snapPoint(x, y);
    if (tool.startsWith('component:')) {
      placeComponent(tool.slice('component:'.length), snapped.x, snapped.y,
        w >= 5 && h >= 5 ? { width: w, height: h } : null);
      _dragData = null;
      _pointerDownPos = null;
      _lastClickTime = 0;
      _lastClickPoint = null;
      return;
    }
    element = createShapeByTool(tool, snapped.x, snapped.y, w, h);
  }
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
    if (tool === 'text' || tool === 'note') {
      _lastClickTime = 0;
      _lastClickPoint = null;
      _startTextEdit(element);
    }
  }
  _dragData = null;
  _pointerDownPos = null;
}

export function placeComponent(componentType, x, y, size = null) {
  const before = snapshotElements();
  const point = snapPoint(x, y);
  const group = createComponentGroup(componentType, point.x, point.y);
  if (!group) return null;
  addElement(group);
  getPendingChildren(group.id).forEach(addElement);
  if (size) updateElement(group.id, { width: Math.max(20, size.width), height: Math.max(20, size.height) });
  commitAction({ type: 'snapshot', before, after: snapshotElements() });
  setSelection([group.id]);
  setActiveTool('select');
  renderDocument(getState().document);
  refreshSelection();
  _updateToolCursor();
  return group;
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
  state.interaction.dragStart = null;
  state.interaction.resizeHandle = null;
  state.interaction._isSelectionBox = false;
  _clearConnectionInteraction();
  clearGuides();
  const canvas = getSvgCanvas();
  if (canvas) canvas.classList.remove('panning');
  _dragData = null;
  _pointerDownPos = null;
}

export function cancelActiveCanvasInteraction() {
  _cancelActiveInteraction();
  _updateToolCursor();
}

function _isConnectionTool(tool) {
  return ['line', 'arrow', 'connector'].includes(tool);
}

function _isDrawingTool(tool) {
  return tool.startsWith('component:') || [
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
  canvas.classList.add(state.activeTool.startsWith('component:') ? 'tool-component' : `tool-${state.activeTool}`);
  if (state.interaction.isConnecting) canvas.classList.add('connection-pending');
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

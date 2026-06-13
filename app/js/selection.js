// #region Sistema de seleccion | Funcionalidad | seleccion y hit testing de elementos
import { getState, getElementById, getSelectedElements, setSelection, clearSelection } from './state.js';
import { getElementBounds, pointInElement, getMultiSelectionBounds, rectsIntersect } from './geometry.js';
import { renderSelection, clearSelection as clearSelectionRender, clearGuides } from './renderer.js';

let _selectionBox = null;

export function initSelection() {}

export function handleSelectionClick(elementId, event) {
  const state = getState();
  if (event.shiftKey) {
    if (state.selectedElementIds.includes(elementId)) {
      const newSel = state.selectedElementIds.filter(id => id !== elementId);
      setSelection(newSel);
    } else {
      const newSel = [...state.selectedElementIds, elementId];
      setSelection(newSel);
    }
  } else {
    if (!state.selectedElementIds.includes(elementId)) {
      setSelection([elementId]);
    }
  }
  _updateSelectionVisual();
}

export function handleCanvasClick(event) {
  clearSelection();
  clearSelectionRender();
  _updateSelectionVisual();
}

export function startSelectionBox(startPoint) {
  const svg = document.getElementById('canvas');
  const selectionLayer = document.getElementById('selection-layer');
  _selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  _selectionBox.classList.add('selection-box');
  _selectionBox.setAttribute('x', startPoint.x);
  _selectionBox.setAttribute('y', startPoint.y);
  _selectionBox.setAttribute('width', 0);
  _selectionBox.setAttribute('height', 0);
  selectionLayer.appendChild(_selectionBox);
}

export function updateSelectionBox(startPoint, currentPoint) {
  if (!_selectionBox) return;
  const x = Math.min(startPoint.x, currentPoint.x);
  const y = Math.min(startPoint.y, currentPoint.y);
  const w = Math.abs(currentPoint.x - startPoint.x);
  const h = Math.abs(currentPoint.y - startPoint.y);
  _selectionBox.setAttribute('x', x);
  _selectionBox.setAttribute('y', y);
  _selectionBox.setAttribute('width', w);
  _selectionBox.setAttribute('height', h);
}

export function endSelectionBox(startPoint, currentPoint) {
  if (!_selectionBox) return;
  const boxRect = {
    x: Math.min(startPoint.x, currentPoint.x),
    y: Math.min(startPoint.y, currentPoint.y),
    width: Math.abs(currentPoint.x - startPoint.x),
    height: Math.abs(currentPoint.y - startPoint.y),
    right: Math.max(startPoint.x, currentPoint.x),
    bottom: Math.max(startPoint.y, currentPoint.y)
  };

  const state = getState();
  const ids = [];
  for (const el of state.document.elements) {
    if (!el.visible || el.type === 'connector') continue;
    const elBounds = getElementBounds(el);
    if (rectsIntersect(boxRect, elBounds)) {
      ids.push(el.id);
    }
  }
  setSelection(ids);

  _selectionBox.remove();
  _selectionBox = null;
  _updateSelectionVisual();
}

export function hitTest(point) {
  const state = getState();
  const sorted = [...state.document.elements]
    .filter(e => e.visible)
    .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  for (const el of sorted) {
    if (el.locked) continue;
    if (el.type === 'connector') {
      if (_hitTestConnector(el, point)) return el.id;
      continue;
    }
    if (pointInElement(point, el)) return el.id;
  }
  return null;
}

function _hitTestConnector(connector, point) {
  if (!connector.points || connector.points.length < 2) return false;
  const threshold = 8;
  for (let i = 0; i < connector.points.length - 1; i++) {
    const p1 = connector.points[i];
    const p2 = connector.points[i + 1];
    const dist = _pointToSegmentDistance(point, p1, p2);
    if (dist < threshold) return true;
  }
  return false;
}

function _pointToSegmentDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
}

export function hitTestHandle(point) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return null;

  const el = getElementById(state.selectedElementIds[0]);
  if (!el || el.type === 'connector') return null;

  const bounds = getElementBounds(el);
  const handleSize = 10;
  const half = handleSize / 2;

  const handlePositions = [
    { handle: 'rotate', x: bounds.x + bounds.width / 2, y: bounds.y - 25 },
    { handle: 'nw', x: bounds.x, y: bounds.y },
    { handle: 'n', x: bounds.x + bounds.width / 2, y: bounds.y },
    { handle: 'ne', x: bounds.x + bounds.width, y: bounds.y },
    { handle: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
    { handle: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { handle: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
    { handle: 'sw', x: bounds.x, y: bounds.y + bounds.height },
    { handle: 'w', x: bounds.x, y: bounds.y + bounds.height / 2 }
  ];

  for (const hp of handlePositions) {
    if (Math.abs(point.x - hp.x) <= half && Math.abs(point.y - hp.y) <= half) {
      return hp.handle;
    }
  }
  return null;
}

export function hitTestConnectionPoint(point) {
  const state = getState();
  const threshold = 10;
  for (const el of state.document.elements) {
    if (!el.visible || el.type === 'connector' || !el.connectionPoints) continue;
    const bounds = getElementBounds(el);
    for (const cp of el.connectionPoints) {
      const cpx = bounds.x + cp.x * bounds.width;
      const cpy = bounds.y + cp.y * bounds.height;
      if (Math.abs(point.x - cpx) < threshold && Math.abs(point.y - cpy) < threshold) {
        return { elementId: el.id, pointId: cp.id, x: cpx, y: cpy };
      }
    }
  }
  return null;
}

function _updateSelectionVisual() {
  const state = getState();
  clearSelectionRender();
  if (state.selectedElementIds.length > 0) {
    renderSelection(state.selectedElementIds, state.document.elements);
  }
}

export function refreshSelection() {
  _updateSelectionVisual();
}

export function hitTestConnectionPointSVG(target) {
  if (target.classList && target.classList.contains('connection-point')) {
    return {
      elementId: target.dataset.elementId,
      pointId: target.dataset.pointId
    };
  }
  return null;
}
// #endregion

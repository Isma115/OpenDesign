// #region Sistema de snapping | Funcionalidad | ajuste a cuadricula y objetos
import { getState } from './state.js';
import { getElementBounds, snapToGrid } from './geometry.js';

export function snapElement(element, dx, dy) {
  const state = getState();
  const config = state.snapping;
  const guides = [];

  let newX = element.x + dx;
  let newY = element.y + dy;

  if (config.enabled && config.snapToGrid) {
    const gridSize = state.document.canvas.grid.size || 4;
    newX = snapToGrid(newX, gridSize);
    newY = snapToGrid(newY, gridSize);
  }

  if (config.enabled && config.snapToObjects) {
    const tolerance = config.tolerance || 6;
    const elBounds = {
      x: newX,
      y: newY,
      width: element.width,
      height: element.height,
      right: newX + element.width,
      bottom: newY + element.height,
      centerX: newX + element.width / 2,
      centerY: newY + element.height / 2
    };

    for (const other of state.document.elements) {
      if (other.id === element.id) continue;
      if (other.type === 'connector') continue;
      if (!other.visible) continue;

      const otherBounds = getElementBounds(other);
      const otherCenterX = otherBounds.x + otherBounds.width / 2;
      const otherCenterY = otherBounds.y + otherBounds.height / 2;

      if (Math.abs(elBounds.x - otherBounds.x) < tolerance) {
        newX = otherBounds.x;
        guides.push({ type: 'vertical', position: otherBounds.x });
      }
      if (Math.abs(elBounds.right - otherBounds.right) < tolerance) {
        newX = otherBounds.right - element.width;
        guides.push({ type: 'vertical', position: otherBounds.right });
      }
      if (Math.abs(elBounds.centerX - otherCenterX) < tolerance) {
        newX = otherCenterX - element.width / 2;
        guides.push({ type: 'vertical', position: otherCenterX });
      }
      if (Math.abs(elBounds.y - otherBounds.y) < tolerance) {
        newY = otherBounds.y;
        guides.push({ type: 'horizontal', position: otherBounds.y });
      }
      if (Math.abs(elBounds.bottom - otherBounds.bottom) < tolerance) {
        newY = otherBounds.bottom - element.height;
        guides.push({ type: 'horizontal', position: otherBounds.bottom });
      }
      if (Math.abs(elBounds.centerY - otherCenterY) < tolerance) {
        newY = otherCenterY - element.height / 2;
        guides.push({ type: 'horizontal', position: otherCenterY });
      }
    }
  }

  return { x: newX, y: newY, guides };
}

export function snapResize(element, bounds, handle, minSize = 20) {
  const state = getState();
  const result = { ...bounds, guides: [] };
  if (!state.snapping.enabled || !state.snapping.snapToObjects) return result;
  if (element.type === 'connector' || ['line', 'arrow'].includes(element.shape)) return result;
  const zoom = state.viewport.zoom || 1;
  const tolerance = (state.snapping.tolerance || 6) / zoom;
  const childIds = new Set(state.document.elements.flatMap(other => other.children || []));
  // No comparar un componente con sus piezas ni con los grupos que lo contienen.
  const excluded = new Set([element.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const other of state.document.elements) {
      if (!excluded.has(other.id) && other.children?.some(id => excluded.has(id))) {
        excluded.add(other.id);
        changed = true;
      }
    }
  }
  const candidates = state.document.elements.filter(other =>
    !excluded.has(other.id) && !childIds.has(other.id) && other.visible !== false &&
    other.type !== 'connector' && !['line', 'arrow'].includes(other.shape)
  );
  const matches = [];
  for (const axis of ['width', 'height']) {
    const horizontal = axis === 'width';
    if (!(horizontal ? /[ew]/ : /[ns]/).test(handle)) continue;
    let nearest = null;
    let distance = tolerance;
    for (const other of candidates) {
      const difference = Math.abs(bounds[axis] - other[axis]);
      if (other[axis] >= minSize && difference <= distance && (!nearest || difference < distance)) {
        nearest = other;
        distance = difference;
      }
    }
    if (!nearest) continue;
    result[axis] = nearest[axis];
    if (horizontal && handle.includes('w')) result.x = bounds.x + bounds.width - result.width;
    if (!horizontal && handle.includes('n')) result.y = bounds.y + bounds.height - result.height;
    matches.push({ axis, nearest });
  }
  const alignedAxes = new Set();
  for (const axis of ['width', 'height']) {
    const horizontal = axis === 'width';
    if (!(horizontal ? /[ew]/ : /[ns]/).test(handle)) continue;
    const position = horizontal ? 'x' : 'y';
    const backwards = handle.includes(horizontal ? 'w' : 'n');
    const fixedEdge = bounds[position] + (backwards ? bounds[axis] : 0);
    const movingEdge = bounds[position] + (backwards ? 0 : bounds[axis]);
    let nearestEdge = null;
    let distance = tolerance;
    for (const other of candidates) {
      for (const edge of [other[position], other[position] + other[axis]]) {
        const size = backwards ? fixedEdge - edge : edge - fixedEdge;
        const difference = Math.abs(movingEdge - edge);
        if (size >= minSize && difference <= distance && (nearestEdge === null || difference < distance)) {
          nearestEdge = edge;
          distance = difference;
        }
      }
    }
    if (nearestEdge === null) continue;
    result[axis] = backwards ? fixedEdge - nearestEdge : nearestEdge - fixedEdge;
    result[position] = backwards ? nearestEdge : fixedEdge;
    alignedAxes.add(axis);
    result.guides.push({ type: horizontal ? 'vertical' : 'horizontal', position: nearestEdge });
  }
  for (const { axis, nearest } of matches) {
    if (alignedAxes.has(axis) && result[axis] !== nearest[axis]) continue;
    const horizontal = axis === 'width';
    for (const target of [result, nearest]) {
      result.guides.push({
        type: 'dimension', axis,
        x1: horizontal ? target.x : target.x + target.width + 8 / zoom,
        y1: horizontal ? target.y + target.height + 8 / zoom : target.y,
        x2: horizontal ? target.x + target.width : target.x + target.width + 8 / zoom,
        y2: horizontal ? target.y + target.height + 8 / zoom : target.y + target.height,
        label: `${Math.round(nearest[axis] * 100) / 100} px`
      });
    }
  }
  return result;
}

export function snapPoint(x, y) {
  const state = getState();
  const config = state.snapping;
  if (!config.enabled || !config.snapToGrid) return { x, y };
  const gridSize = state.document.canvas.grid.size || 4;
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize)
  };
}
// #endregion

export function screenToCanvas(clientX, clientY, viewport) {
  const canvas = document.getElementById('canvas');
  const wrapper = document.getElementById('canvas-wrapper');
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / viewport.zoom;
  const y = (clientY - rect.top) / viewport.zoom;
  return { x, y };
}

export function canvasToScreen(x, y, viewport) {
  const canvas = document.getElementById('canvas');
  const rect = canvas.getBoundingClientRect();
  return {
    x: rect.left + x * viewport.zoom,
    y: rect.top + y * viewport.zoom
  };
}

export function getElementBounds(element) {
  if (element.type === 'connector') {
    return _getConnectorBounds(element);
  }
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    right: element.x + element.width,
    bottom: element.y + element.height
  };
}

function _getConnectorBounds(connector) {
  if (!connector.points || connector.points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0, right: 0, bottom: 0 };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of connector.points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX || 10,
    height: maxY - minY || 10,
    right: maxX,
    bottom: maxY
  };
}

export function getRotatedBounds(element) {
  if (!element.rotation || element.rotation === 0) {
    return getElementBounds(element);
  }
  const bounds = getElementBounds(element);
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const rad = (element.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.right, y: bounds.y },
    { x: bounds.right, y: bounds.bottom },
    { x: bounds.x, y: bounds.bottom }
  ];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const corner of corners) {
    const dx = corner.x - cx;
    const dy = corner.y - cy;
    const rx = cx + dx * cos - dy * sin;
    const ry = cy + dx * sin + dy * cos;
    if (rx < minX) minX = rx;
    if (ry < minY) minY = ry;
    if (rx > maxX) maxX = rx;
    if (ry > maxY) maxY = ry;
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    right: maxX,
    bottom: maxY
  };
}

export function pointInElement(point, element) {
  if (element.rotation && element.rotation !== 0) {
    const bounds = getElementBounds(element);
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const rad = -(element.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = point.x - cx;
    const dy = point.y - cy;
    const localX = cx + dx * cos - dy * sin;
    const localY = cy + dx * sin + dy * cos;
    return localX >= bounds.x && localX <= bounds.right &&
           localY >= bounds.y && localY <= bounds.bottom;
  }
  const bounds = getElementBounds(element);
  return point.x >= bounds.x && point.x <= bounds.right &&
         point.y >= bounds.y && point.y <= bounds.bottom;
}

export function getMultiSelectionBounds(elements) {
  if (elements.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of elements) {
    const bounds = getElementBounds(el);
    if (bounds.x < minX) minX = bounds.x;
    if (bounds.y < minY) minY = bounds.y;
    if (bounds.right > maxX) maxX = bounds.right;
    if (bounds.bottom > maxY) maxY = bounds.bottom;
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    right: maxX,
    bottom: maxY
  };
}

export function distance(p1, p2) {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function snapToGrid(value, gridSize) {
  return Math.round(value / gridSize) * gridSize;
}

export function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

export function getAngleBetweenPoints(p1, p2) {
  return radiansToDegrees(Math.atan2(p2.y - p1.y, p2.x - p1.x));
}

export function rectsIntersect(r1, r2) {
  return !(r1.right < r2.x || r2.right < r1.x || r1.bottom < r2.y || r2.bottom < r1.y);
}

// #region Utilidades geometricas | Funcionalidad | calculos de coordenadas y bounding boxes
export function screenToCanvas(clientX, clientY, viewport) {
  const svg = document.getElementById('canvas');
  if (!svg) return { x: 0, y: 0 };
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const canvasPt = pt.matrixTransform(ctm.inverse());
  return { x: canvasPt.x, y: canvasPt.y };
}

export function canvasToScreen(x, y, viewport) {
  const svg = document.getElementById('canvas');
  if (!svg) return { x: 0, y: 0 };
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const screenPt = pt.matrixTransform(ctm);
  return { x: screenPt.x, y: screenPt.y };
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
// #endregion

// Punto local del contorno; la rotación se aplica al conectar o al dibujar el grupo SVG.
export function getLocalConnectionPoint(element, connectionPoint) {
  const dx = connectionPoint.x - 0.5;
  const dy = connectionPoint.y - 0.5;
  let scale = 1;
  let vertices = null;
  switch (element.shape) {
    case 'triangle': vertices = [[0.5, 0], [1, 1], [0, 1]]; break;
    case 'diamond':
    case 'flow-decision': vertices = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]]; break;
    case 'flow-io': vertices = [[0.15, 0], [1, 0], [0.85, 1], [0, 1]]; break;
    case 'pentagon':
    case 'hexagon':
    case 'star': {
      const sides = element.shape === 'hexagon' ? 6 : 5;
      const star = element.shape === 'star';
      vertices = Array.from({ length: star ? sides * 2 : sides }, (_, i) => {
        const angle = 2 * Math.PI * i / (star ? sides * 2 : sides) - Math.PI / 2;
        const radius = star && i % 2 ? 0.2 : 0.5;
        return [0.5 + radius * Math.cos(angle), 0.5 + radius * Math.sin(angle)];
      });
      break;
    }
    case 'ellipse':
      if (dx || dy) scale = 0.5 / Math.hypot(dx, dy);
      break;
    case 'flow-document':
      // El centro del borde inferior coincide con la unión de las dos curvas.
      if (dx === 0 && dy > 0) scale = 0.76;
      break;
  }
  if (vertices && (dx || dy)) {
    let nearest = Infinity;
    for (let i = 0; i < vertices.length; i++) {
      const [ax, ay] = vertices[i];
      const [bx, by] = vertices[(i + 1) % vertices.length];
      const ex = bx - ax, ey = by - ay;
      const denominator = dx * ey - dy * ex;
      if (Math.abs(denominator) < 1e-10) continue;
      const px = ax - 0.5, py = ay - 0.5;
      const t = (px * ey - py * ex) / denominator;
      const u = (px * dy - py * dx) / denominator;
      if (t >= 0 && u >= -1e-10 && u <= 1 + 1e-10) nearest = Math.min(nearest, t);
    }
    if (Number.isFinite(nearest)) scale = nearest;
  }
  return {
    x: element.x + (0.5 + dx * scale) * element.width,
    y: element.y + (0.5 + dy * scale) * element.height
  };
}

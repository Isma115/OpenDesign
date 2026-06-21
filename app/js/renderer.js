// #region Renderizador SVG | Funcionalidad | renderizado de elementos en el lienzo SVG
import { getElementBounds } from './geometry.js';
import { getState, updateDocument } from './state.js';

export const SVG_NS = 'http://www.w3.org/2000/svg';

let _svgCanvas = null;
let _shapeLayer = null;
let _connectorLayer = null;
let _textLayer = null;
let _selectionLayer = null;
let _guideLayer = null;
let _previewLayer = null;
let _gridLayer = null;
let _defs = null;

export function initRenderer() {
  _svgCanvas = document.getElementById('canvas');
  _shapeLayer = document.getElementById('shape-layer');
  _connectorLayer = document.getElementById('connector-layer');
  _textLayer = document.getElementById('text-layer');
  _selectionLayer = document.getElementById('selection-layer');
  _guideLayer = document.getElementById('guide-layer');
  _previewLayer = document.getElementById('preview-layer');
  _gridLayer = document.getElementById('grid-layer');
  _defs = document.getElementById('svg-defs');

  window.addEventListener('resize', () => {
    const state = getState();
    ensureCanvasSize(state.viewport);
  });
}

export function getSvgCanvas() {
  return _svgCanvas;
}

export function renderDocument(docModel) {
  _svgCanvas.setAttribute('width', docModel.canvas.width);
  _svgCanvas.setAttribute('height', docModel.canvas.height);
  _svgCanvas.style.background = docModel.canvas.background;
  _updateGrid(docModel.canvas.grid);

  _shapeLayer.innerHTML = '';
  _connectorLayer.innerHTML = '';
  _textLayer.innerHTML = '';

  const sorted = [...docModel.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  for (const el of sorted) {
    if (!el.visible) continue;
    if (el.type === 'connector') {
      _renderConnector(el);
    } else if (el.type === 'group') {
      _renderGroup(el, docModel);
    } else {
      _renderShape(el);
    }
  }

  const state = getState();
  ensureCanvasSize(state.viewport);
}

export function renderElement(element) {
  if (!element.visible) return;
  const existing = _svgCanvas.querySelector(`[data-element-id="${element.id}"]`);
  if (existing) existing.remove();
  if (element.type === 'connector') {
    _renderConnector(element);
  } else if (element.type === 'group') {
    _renderGroup(element, null);
  } else {
    _renderShape(element);
  }
}

export function removeElementNode(id) {
  const node = _svgCanvas.querySelector(`[data-element-id="${id}"]`);
  if (node) node.remove();
}

export function updateElementNode(element) {
  removeElementNode(element.id);
  renderElement(element);
}

export function clearSelection() {
  _selectionLayer.innerHTML = '';
}

export function renderSelection(selectedIds, elements) {
  _selectionLayer.innerHTML = '';
  if (selectedIds.length === 0) return;

  for (const id of selectedIds) {
    const el = elements.find(e => e.id === id);
    if (!el) continue;
    const bounds = getElementBounds(el);
    _renderSelectionBox(bounds);
  }

  if (selectedIds.length === 1) {
    const el = elements.find(e => e.id === selectedIds[0]);
    if (el && el.type !== 'connector' && !el.locked) {
      _renderResizeHandles(el);
      _renderRotateHandle(el);
    }
  }
}

export function renderGuideLines(guides) {
  _guideLayer.innerHTML = '';
  if (!guides || guides.length === 0) return;
  const canvasH = parseInt(_svgCanvas.getAttribute('height')) || 1080;
  const canvasW = parseInt(_svgCanvas.getAttribute('width')) || 1920;
  for (const guide of guides) {
    const line = document.createElementNS(SVG_NS, 'line');
    if (guide.type === 'vertical') {
      line.setAttribute('x1', guide.position);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', guide.position);
      line.setAttribute('y2', canvasH);
    } else {
      line.setAttribute('x1', 0);
      line.setAttribute('y1', guide.position);
      line.setAttribute('x2', canvasW);
      line.setAttribute('y2', guide.position);
    }
    line.classList.add('guide-line');
    _guideLayer.appendChild(line);
  }
}

export function clearGuides() {
  _guideLayer.innerHTML = '';
}

export function clearPreview() {
  _previewLayer.innerHTML = '';
}

export function renderPreview(node) {
  _previewLayer.innerHTML = '';
  if (node) _previewLayer.appendChild(node);
}

export function ensureCanvasSize(viewport) {
  const wrapper = document.getElementById('canvas-wrapper');
  if (!_svgCanvas || !wrapper) return;

  const zoom = viewport.zoom;
  const state = getState();

  const screenPadding = 150;
  const padding = Math.ceil(screenPadding / zoom);
  const viewportW = Math.ceil(wrapper.clientWidth / zoom) + padding;
  const viewportH = Math.ceil(wrapper.clientHeight / zoom) + padding;

  let contentMaxW = 0;
  let contentMaxH = 0;
  for (const el of state.document.elements) {
    if (el.type === 'connector' && el.points) {
      for (const p of el.points) {
        if (p.x > contentMaxW) contentMaxW = p.x;
        if (p.y > contentMaxH) contentMaxH = p.y;
      }
    } else if (el.type !== 'connector') {
      const right = (el.x || 0) + (el.width || 0);
      const bottom = (el.y || 0) + (el.height || 0);
      if (right > contentMaxW) contentMaxW = right;
      if (bottom > contentMaxH) contentMaxH = bottom;
    }
  }
  contentMaxW = Math.max(contentMaxW + padding, state.document.canvas.width);
  contentMaxH = Math.max(contentMaxH + padding, state.document.canvas.height);

  const newW = Math.max(viewportW, contentMaxW);
  const newH = Math.max(viewportH, contentMaxH);

  const currentW = parseInt(_svgCanvas.getAttribute('width')) || 1920;
  const currentH = parseInt(_svgCanvas.getAttribute('height')) || 1080;

  if (newW !== currentW || newH !== currentH) {
    _svgCanvas.setAttribute('width', newW);
    _svgCanvas.setAttribute('height', newH);
    updateDocument(doc => {
      doc.canvas.width = newW;
      doc.canvas.height = newH;
    });
  }
}

export function applyViewport(viewport) {
  const container = document.getElementById('canvas-container');
  container.style.transform = `scale(${viewport.zoom})`;
  container.style.transformOrigin = '0 0';
  ensureCanvasSize(viewport);
}

function _updateGrid(grid) {
  const bg = _svgCanvas.querySelector('.grid-bg');
  if (!bg) return;
  if (!grid || !grid.enabled) {
    bg.style.display = 'none';
    return;
  }
  bg.style.display = '';
  const smallPattern = _svgCanvas.querySelector('#grid-pattern');
  const largePattern = _svgCanvas.querySelector('#grid-pattern-large');
  if (smallPattern) {
    smallPattern.setAttribute('width', grid.size);
    smallPattern.setAttribute('height', grid.size);
    const path = smallPattern.querySelector('path');
    if (path) {
      path.setAttribute('d', `M ${grid.size} 0 L 0 0 0 ${grid.size}`);
      path.setAttribute('stroke', grid.color || '#e5e7eb');
    }
  }
  if (largePattern) {
    const largeSize = grid.size * 5;
    largePattern.setAttribute('width', largeSize);
    largePattern.setAttribute('height', largeSize);
    const smallRect = largePattern.querySelector('rect');
    if (smallRect) {
      smallRect.setAttribute('width', largeSize);
      smallRect.setAttribute('height', largeSize);
    }
    const path = largePattern.querySelector('path');
    if (path) {
      path.setAttribute('d', `M ${largeSize} 0 L 0 0 0 ${largeSize}`);
    }
  }
}

function _renderShape(element) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.dataset.elementId = element.id;
  g.classList.add('element-shape');
  if (element.locked) g.classList.add('locked');

  if (element.rotation) {
    const bounds = getElementBounds(element);
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    g.setAttribute('transform', `rotate(${element.rotation} ${cx} ${cy})`);
  }

  const shapeNode = _createShapeSVG(element);
  if (shapeNode) {
    _applyStyle(shapeNode, element.style);
    shapeNode.dataset.elementId = element.id;
    g.appendChild(shapeNode);
  }

  if (element.text && element.text.value) {
    const textNode = _createTextSVG(element);
    g.appendChild(textNode);
  }

  if (element.type !== 'text' && element.shape !== 'frame') {
    _renderConnectionPoints(g, element);
  }

  const targetLayer = element.type === 'text' ? _textLayer : _shapeLayer;
  targetLayer.appendChild(g);
}

function _createShapeSVG(element) {
  const { shape, x, y, width, height } = element;
  switch (shape) {
    case 'rectangle':
    case 'flow-process': {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      return rect;
    }
    case 'roundedRectangle':
    case 'flow-start': {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      rect.setAttribute('rx', Math.min(width, height) * 0.3);
      rect.setAttribute('ry', Math.min(width, height) * 0.3);
      return rect;
    }
    case 'ellipse': {
      const el = document.createElementNS(SVG_NS, 'ellipse');
      el.setAttribute('cx', x + width / 2);
      el.setAttribute('cy', y + height / 2);
      el.setAttribute('rx', width / 2);
      el.setAttribute('ry', height / 2);
      return el;
    }
    case 'triangle': {
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', `${x + width / 2},${y} ${x + width},${y + height} ${x},${y + height}`);
      return polygon;
    }
    case 'diamond':
    case 'flow-decision': {
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', `${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`);
      return polygon;
    }
    case 'pentagon': {
      const pts = _regularPolygonPoints(x, y, width, height, 5);
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', pts);
      return polygon;
    }
    case 'hexagon': {
      const pts = _regularPolygonPoints(x, y, width, height, 6);
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', pts);
      return polygon;
    }
    case 'star': {
      const pts = _starPoints(x, y, width, height, 5);
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', pts);
      return polygon;
    }
    case 'line':
    case 'arrow': {
      const lineData = element._lineData || { x1: x, y1: y, x2: x + width, y2: y + height };
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', lineData.x1);
      line.setAttribute('y1', lineData.y1);
      line.setAttribute('x2', lineData.x2);
      line.setAttribute('y2', lineData.y2);
      line.setAttribute('stroke-linecap', 'round');
      if (shape === 'arrow') {
        line.setAttribute('marker-end', 'url(#arrow-marker)');
      }
      return line;
    }
    case 'note': {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      rect.setAttribute('rx', 4);
      return rect;
    }
    case 'frame': {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      rect.setAttribute('rx', 8);
      return rect;
    }
    case 'flow-io': {
      const offset = width * 0.15;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', `${x + offset},${y} ${x + width},${y} ${x + width - offset},${y + height} ${x},${y + height}`);
      return polygon;
    }
    case 'flow-database': {
      const g = document.createElementNS(SVG_NS, 'g');
      const rx = width / 2;
      const ry = height * 0.12;
      const topEllipse = document.createElementNS(SVG_NS, 'ellipse');
      topEllipse.setAttribute('cx', x + width / 2);
      topEllipse.setAttribute('cy', y + ry);
      topEllipse.setAttribute('rx', rx);
      topEllipse.setAttribute('ry', ry);
      const body = document.createElementNS(SVG_NS, 'path');
      body.setAttribute('d', `M${x},${y + ry} v${height - 2 * ry} a${rx},${ry} 0 0,0 ${width},0 v-${height - 2 * ry}`);
      body.setAttribute('fill', 'inherit');
      const bottomArc = document.createElementNS(SVG_NS, 'path');
      bottomArc.setAttribute('d', `M${x},${y + height - ry} a${rx},${ry} 0 0,0 ${width},0`);
      bottomArc.setAttribute('fill', 'none');
      g.appendChild(body);
      g.appendChild(bottomArc);
      g.appendChild(topEllipse);
      return g;
    }
    case 'flow-document': {
      const path = document.createElementNS(SVG_NS, 'path');
      const waveH = height * 0.12;
      path.setAttribute('d', `M${x},${y} h${width} v${height - waveH} c-${width * 0.25},-${waveH} -${width * 0.5},${waveH} -${width * 0.5},0 c-${width * 0.25},-${waveH} -${width * 0.5},${waveH} -${width * 0.5},0 z`);
      return path;
    }
    case 'flow-subprocess': {
      const g = document.createElementNS(SVG_NS, 'g');
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      const leftLine = document.createElementNS(SVG_NS, 'line');
      leftLine.setAttribute('x1', x + width * 0.08);
      leftLine.setAttribute('y1', y);
      leftLine.setAttribute('x2', x + width * 0.08);
      leftLine.setAttribute('y2', y + height);
      const rightLine = document.createElementNS(SVG_NS, 'line');
      rightLine.setAttribute('x1', x + width * 0.92);
      rightLine.setAttribute('y1', y);
      rightLine.setAttribute('x2', x + width * 0.92);
      rightLine.setAttribute('y2', y + height);
      g.appendChild(rect);
      g.appendChild(leftLine);
      g.appendChild(rightLine);
      return g;
    }
    default: {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      return rect;
    }
  }
}

function _createTextSVG(element) {
  const bounds = getElementBounds(element);
  const text = document.createElementNS(SVG_NS, 'text');
  const padding = 8;
  let textX, textY, anchor, dy;
  const align = element.text?.align || 'center';
  const vAlign = element.text?.verticalAlign || 'middle';

  if (align === 'left') {
    textX = bounds.x + padding;
    anchor = 'start';
  } else if (align === 'right') {
    textX = bounds.x + bounds.width - padding;
    anchor = 'end';
  } else {
    textX = bounds.x + bounds.width / 2;
    anchor = 'middle';
  }

  if (vAlign === 'top') {
    textY = bounds.y + padding + (element.text?.fontSize || 16);
  } else if (vAlign === 'bottom') {
    textY = bounds.y + bounds.height - padding;
  } else {
    textY = bounds.y + bounds.height / 2;
    dy = '0.35em';
  }

  text.setAttribute('x', textX);
  text.setAttribute('y', textY);
  text.setAttribute('text-anchor', anchor);
  text.setAttribute('font-family', element.text?.fontFamily || 'Inter, Arial, sans-serif');
  text.setAttribute('font-size', element.text?.fontSize || 16);
  text.setAttribute('font-weight', element.text?.fontWeight || 400);
  text.setAttribute('fill', element.text?.color || '#111827');
  if (dy) text.setAttribute('dy', dy);
  text.classList.add('text-element');
  text.textContent = _sanitizeText(element.text?.value || '');
  return text;
}

function _renderConnectionPoints(g, element) {
  if (!element.connectionPoints) return;
  const bounds = getElementBounds(element);
  for (const cp of element.connectionPoints) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', bounds.x + cp.x * bounds.width);
    circle.setAttribute('cy', bounds.y + cp.y * bounds.height);
    circle.setAttribute('r', 5);
    circle.classList.add('connection-point');
    circle.dataset.pointId = cp.id;
    circle.dataset.elementId = element.id;
    g.appendChild(circle);
  }
}

function _renderConnector(connector) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.dataset.elementId = connector.id;
  g.classList.add('element-connector');

  if (connector.points && connector.points.length > 1) {
    const path = document.createElementNS(SVG_NS, 'path');
    let d = '';
    if (connector.connectorType === 'curved' && connector.points.length >= 2) {
      d = _buildCurvedPath(connector.points);
    } else {
      d = connector.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    }
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', connector.style.stroke);
    path.setAttribute('stroke-width', connector.style.strokeWidth);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    if (connector.style.dashArray) {
      path.setAttribute('stroke-dasharray', connector.style.dashArray);
    }
    if (connector.style.endMarker === 'arrow') {
      path.setAttribute('marker-end', 'url(#arrow-marker)');
    }
    path.dataset.elementId = connector.id;
    g.appendChild(path);

    const hitArea = document.createElementNS(SVG_NS, 'path');
    hitArea.setAttribute('d', d);
    hitArea.setAttribute('fill', 'none');
    hitArea.setAttribute('stroke', 'transparent');
    hitArea.setAttribute('stroke-width', Math.max(connector.style.strokeWidth + 10, 12));
    hitArea.dataset.elementId = connector.id;
    hitArea.style.cursor = 'pointer';
    g.appendChild(hitArea);
  }

  if (connector.label && connector.label.value) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', connector.label.x);
    text.setAttribute('y', connector.label.y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', connector.label.fontSize || 14);
    text.setAttribute('fill', connector.label.color || '#111827');
    text.setAttribute('font-family', 'Inter, Arial, sans-serif');
    text.textContent = _sanitizeText(connector.label.value);

    const bg = document.createElementNS(SVG_NS, 'rect');
    g.appendChild(bg);
    g.appendChild(text);

    requestAnimationFrame(() => {
      const bbox = text.getBBox();
      bg.setAttribute('x', bbox.x - 4);
      bg.setAttribute('y', bbox.y - 2);
      bg.setAttribute('width', bbox.width + 8);
      bg.setAttribute('height', bbox.height + 4);
      bg.setAttribute('fill', 'white');
      bg.setAttribute('rx', 2);
    });
  }

  _connectorLayer.appendChild(g);
}

function _renderGroup(group, docModel) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.dataset.elementId = group.id;
  g.classList.add('element-group');

  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', group.x);
  rect.setAttribute('y', group.y);
  rect.setAttribute('width', group.width);
  rect.setAttribute('height', group.height);
  rect.setAttribute('fill', 'rgba(37, 99, 235, 0.03)');
  rect.setAttribute('stroke', '#93c5fd');
  rect.setAttribute('stroke-width', 1);
  rect.setAttribute('stroke-dasharray', '6 3');
  rect.setAttribute('rx', 4);
  rect.dataset.elementId = group.id;
  g.appendChild(rect);

  if (group.name) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', group.x + 8);
    text.setAttribute('y', group.y + 16);
    text.setAttribute('font-size', 11);
    text.setAttribute('fill', '#6b7280');
    text.setAttribute('font-family', 'Inter, Arial, sans-serif');
    text.textContent = group.name;
    g.appendChild(text);
  }

  _shapeLayer.appendChild(g);
}

function _renderSelectionBox(bounds) {
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', bounds.x - 1);
  rect.setAttribute('y', bounds.y - 1);
  rect.setAttribute('width', bounds.width + 2);
  rect.setAttribute('height', bounds.height + 2);
  rect.classList.add('selection-border');
  _selectionLayer.appendChild(rect);
}

function _renderResizeHandles(element) {
  const bounds = getElementBounds(element);
  const handleSize = 8;
  const half = handleSize / 2;
  const positions = [
    { handle: 'nw', x: bounds.x, y: bounds.y },
    { handle: 'n', x: bounds.x + bounds.width / 2, y: bounds.y },
    { handle: 'ne', x: bounds.x + bounds.width, y: bounds.y },
    { handle: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
    { handle: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { handle: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
    { handle: 'sw', x: bounds.x, y: bounds.y + bounds.height },
    { handle: 'w', x: bounds.x, y: bounds.y + bounds.height / 2 }
  ];

  for (const pos of positions) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', pos.x - half);
    rect.setAttribute('y', pos.y - half);
    rect.setAttribute('width', handleSize);
    rect.setAttribute('height', handleSize);
    rect.setAttribute('rx', 1);
    rect.classList.add('selection-handle');
    rect.dataset.handle = pos.handle;
    rect.dataset.elementId = element.id;
    _selectionLayer.appendChild(rect);
  }
}

function _renderRotateHandle(element) {
  const bounds = getElementBounds(element);
  const cx = bounds.x + bounds.width / 2;
  const topY = bounds.y;
  const rotateY = topY - 25;

  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', cx);
  line.setAttribute('y1', topY);
  line.setAttribute('x2', cx);
  line.setAttribute('y2', rotateY);
  line.classList.add('selection-rotate-line');
  _selectionLayer.appendChild(line);

  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', cx);
  circle.setAttribute('cy', rotateY);
  circle.setAttribute('r', 5);
  circle.classList.add('selection-handle-rotate');
  circle.dataset.handle = 'rotate';
  circle.dataset.elementId = element.id;
  _selectionLayer.appendChild(circle);
}

function _applyStyle(node, style) {
  if (!style) return;
  if (node.tagName === 'g') {
    const children = node.children;
    for (const child of children) {
      _applyStyle(child, style);
    }
    return;
  }
  if (style.fill && style.fill !== 'none') node.setAttribute('fill', style.fill);
  else if (style.fill === 'none') node.setAttribute('fill', 'none');
  if (style.stroke && style.stroke !== 'none') node.setAttribute('stroke', style.stroke);
  if (style.strokeWidth != null) node.setAttribute('stroke-width', style.strokeWidth);
  if (style.opacity != null && style.opacity !== 1) node.setAttribute('opacity', style.opacity);
  if (style.dashArray) node.setAttribute('stroke-dasharray', style.dashArray);
}

function _regularPolygonPoints(x, y, width, height, sides) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = width / 2;
  const ry = height / 2;
  const points = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    points.push(`${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`);
  }
  return points.join(' ');
}

function _starPoints(x, y, width, height, points) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const outerRx = width / 2;
  const outerRy = height / 2;
  const innerRx = outerRx * 0.4;
  const innerRy = outerRy * 0.4;
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const rx = i % 2 === 0 ? outerRx : innerRx;
    const ry = i % 2 === 0 ? outerRy : innerRy;
    pts.push(`${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function _buildCurvedPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    d += ` L ${points[1].x} ${points[1].y}`;
    return d;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const cpx1 = (prev.x + curr.x) / 2;
    const cpy1 = (prev.y + curr.y) / 2;
    const cpx2 = (curr.x + next.x) / 2;
    const cpy2 = (curr.y + next.y) / 2;
    d += ` Q ${curr.x} ${curr.y} ${cpx2} ${cpy2}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function _sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.textContent;
}
// #endregion

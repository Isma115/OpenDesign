import { getNextZIndex } from './state.js';

const DEFAULT_CONNECTION_POINTS = [
  { id: 'top', x: 0.5, y: 0 },
  { id: 'right', x: 1, y: 0.5 },
  { id: 'bottom', x: 0.5, y: 1 },
  { id: 'left', x: 0, y: 0.5 }
];

const DEFAULT_STYLE = {
  fill: '#ffffff',
  stroke: '#374151',
  strokeWidth: 2,
  opacity: 1,
  dashArray: '',
  shadow: false
};

const DEFAULT_TEXT = {
  value: '',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: 16,
  fontWeight: 400,
  color: '#1f2937',
  align: 'center',
  verticalAlign: 'middle'
};

function _baseElement(overrides) {
  return {
    id: 'el_' + crypto.randomUUID().slice(0, 12),
    type: 'shape',
    shape: 'rectangle',
    x: 0,
    y: 0,
    width: 120,
    height: 80,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: getNextZIndex(),
    style: { ...DEFAULT_STYLE },
    text: { ...DEFAULT_TEXT },
    connectionPoints: DEFAULT_CONNECTION_POINTS.map(p => ({ ...p })),
    ...overrides
  };
}

export function createRectangle(x, y, width, height) {
  return _baseElement({
    shape: 'rectangle',
    x, y,
    width: Math.max(width, 20),
    height: Math.max(height, 20)
  });
}

export function createRoundedRectangle(x, y, width, height) {
  return _baseElement({
    shape: 'roundedRectangle',
    x, y,
    width: Math.max(width, 20),
    height: Math.max(height, 20)
  });
}

export function createEllipse(x, y, width, height) {
  return _baseElement({
    shape: 'ellipse',
    x, y,
    width: Math.max(width, 20),
    height: Math.max(height, 20)
  });
}

export function createTriangle(x, y, width, height) {
  return _baseElement({
    shape: 'triangle',
    x, y,
    width: Math.max(width, 20),
    height: Math.max(height, 20)
  });
}

export function createDiamond(x, y, width, height) {
  return _baseElement({
    shape: 'diamond',
    x, y,
    width: Math.max(width, 20),
    height: Math.max(height, 20)
  });
}

export function createPentagon(x, y, width, height) {
  return _baseElement({
    shape: 'pentagon',
    x, y,
    width: Math.max(width, 20),
    height: Math.max(height, 20)
  });
}

export function createHexagon(x, y, width, height) {
  return _baseElement({
    shape: 'hexagon',
    x, y,
    width: Math.max(width, 20),
    height: Math.max(height, 20)
  });
}

export function createStar(x, y, width, height) {
  return _baseElement({
    shape: 'star',
    x, y,
    width: Math.max(width, 20),
    height: Math.max(height, 20)
  });
}

export function createLine(x1, y1, x2, y2) {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const width = Math.abs(x2 - x1) || 2;
  const height = Math.abs(y2 - y1) || 2;
  return _baseElement({
    type: 'shape',
    shape: 'line',
    x, y,
    width,
    height,
    style: { ...DEFAULT_STYLE, fill: 'none' },
    _lineData: { x1, y1, x2, y2 }
  });
}

export function createArrow(x1, y1, x2, y2) {
  const el = createLine(x1, y1, x2, y2);
  el.shape = 'arrow';
  el.style.stroke = '#111827';
  el.style.fill = 'none';
  return el;
}

export function createText(x, y) {
  return _baseElement({
    type: 'text',
    shape: 'text',
    x, y,
    width: 200,
    height: 40,
    style: { ...DEFAULT_STYLE, fill: 'none', stroke: 'none', strokeWidth: 0 },
    text: { ...DEFAULT_TEXT, value: 'Texto' }
  });
}

export function createNote(x, y) {
  return _baseElement({
    shape: 'note',
    x, y,
    width: 180,
    height: 120,
    style: { ...DEFAULT_STYLE, fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 1 },
    text: { ...DEFAULT_TEXT, value: 'Nota', align: 'left', fontSize: 13, color: '#92400e' }
  });
}

export function createFrame(x, y, width, height) {
  return _baseElement({
    shape: 'frame',
    x, y,
    width: Math.max(width, 100),
    height: Math.max(height, 80),
    style: { ...DEFAULT_STYLE, fill: 'none', stroke: '#64748b', strokeWidth: 1, dashArray: '6 3' },
    text: { ...DEFAULT_TEXT, value: 'Frame', fontSize: 12, verticalAlign: 'top', color: '#94a3b8' }
  });
}

export function createFlowStart(x, y, width, height) {
  return _baseElement({
    shape: 'flow-start',
    x, y,
    width: Math.max(width, 120),
    height: Math.max(height, 50),
    style: { ...DEFAULT_STYLE, fill: '#10b981', stroke: '#059669' },
    text: { ...DEFAULT_TEXT, value: 'Inicio', color: '#ffffff' }
  });
}

export function createFlowProcess(x, y, width, height) {
  return _baseElement({
    shape: 'flow-process',
    x, y,
    width: Math.max(width, 140),
    height: Math.max(height, 60),
    style: { ...DEFAULT_STYLE, fill: '#3b82f6', stroke: '#2563eb' },
    text: { ...DEFAULT_TEXT, value: 'Proceso', color: '#ffffff' }
  });
}

export function createFlowDecision(x, y, width, height) {
  return _baseElement({
    shape: 'flow-decision',
    x, y,
    width: Math.max(width, 120),
    height: Math.max(height, 80),
    style: { ...DEFAULT_STYLE, fill: '#f59e0b', stroke: '#d97706' },
    text: { ...DEFAULT_TEXT, value: 'Decision?', color: '#ffffff' }
  });
}

export function createFlowIO(x, y, width, height) {
  return _baseElement({
    shape: 'flow-io',
    x, y,
    width: Math.max(width, 140),
    height: Math.max(height, 60),
    style: { ...DEFAULT_STYLE, fill: '#8b5cf6', stroke: '#7c3aed' },
    text: { ...DEFAULT_TEXT, value: 'Entrada/Salida', color: '#ffffff' }
  });
}

export function createFlowDatabase(x, y, width, height) {
  return _baseElement({
    shape: 'flow-database',
    x, y,
    width: Math.max(width, 80),
    height: Math.max(height, 100),
    style: { ...DEFAULT_STYLE, fill: '#ec4899', stroke: '#db2777' },
    text: { ...DEFAULT_TEXT, value: 'BD', color: '#ffffff' }
  });
}

export function createFlowDocument(x, y, width, height) {
  return _baseElement({
    shape: 'flow-document',
    x, y,
    width: Math.max(width, 120),
    height: Math.max(height, 80),
    style: { ...DEFAULT_STYLE, fill: '#14b8a6', stroke: '#0d9488' },
    text: { ...DEFAULT_TEXT, value: 'Documento', color: '#ffffff' }
  });
}

export function createFlowSubprocess(x, y, width, height) {
  return _baseElement({
    shape: 'flow-subprocess',
    x, y,
    width: Math.max(width, 140),
    height: Math.max(height, 60),
    style: { ...DEFAULT_STYLE, fill: '#6366f1', stroke: '#4f46e5' },
    text: { ...DEFAULT_TEXT, value: 'Subproceso', color: '#ffffff' }
  });
}

export function createConnector(source, target, connectorType = 'orthogonal') {
  return {
    id: 'conn_' + crypto.randomUUID().slice(0, 12),
    type: 'connector',
    connectorType,
    source: { ...source },
    target: { ...target },
    points: [],
    style: {
      stroke: '#374151',
      strokeWidth: 2,
      dashArray: '',
      startMarker: null,
      endMarker: 'arrow'
    },
    label: {
      value: '',
      x: 0,
      y: 0,
      fontSize: 14,
      color: '#1f2937'
    },
    locked: false,
    visible: true,
    zIndex: getNextZIndex()
  };
}

export function createGroup(children, x, y, width, height) {
  return {
    id: 'group_' + crypto.randomUUID().slice(0, 12),
    type: 'group',
    x, y,
    width, height,
    rotation: 0,
    children: [...children],
    locked: false,
    visible: true,
    zIndex: getNextZIndex()
  };
}

export function createShapeByTool(tool, x, y, width, height) {
  const creators = {
    rectangle: createRectangle,
    roundedRectangle: createRoundedRectangle,
    ellipse: createEllipse,
    triangle: createTriangle,
    diamond: createDiamond,
    pentagon: createPentagon,
    hexagon: createHexagon,
    star: createStar,
    line: createLine,
    arrow: createArrow,
    text: createText,
    note: createNote,
    frame: createFrame,
    'flow-start': createFlowStart,
    'flow-process': createFlowProcess,
    'flow-decision': createFlowDecision,
    'flow-io': createFlowIO,
    'flow-database': createFlowDatabase,
    'flow-document': createFlowDocument,
    'flow-subprocess': createFlowSubprocess
  };
  const creator = creators[tool];
  if (!creator) return null;
  if (tool === 'text' || tool === 'note') {
    return creator(x, y);
  }
  if (tool === 'line' || tool === 'arrow') {
    return creator(x, y, x + width, y + height);
  }
  return creator(x, y, width, height);
}

export function getShapeDisplayName(shape) {
  const names = {
    rectangle: 'Rectangulo',
    roundedRectangle: 'Rectangulo redondeado',
    ellipse: 'Elipse',
    triangle: 'Triangulo',
    diamond: 'Rombo',
    pentagon: 'Pentagono',
    hexagon: 'Hexagono',
    star: 'Estrella',
    line: 'Linea',
    arrow: 'Flecha',
    text: 'Texto',
    note: 'Nota',
    frame: 'Frame',
    'flow-start': 'Inicio/Fin',
    'flow-process': 'Proceso',
    'flow-decision': 'Decision',
    'flow-io': 'Entrada/Salida',
    'flow-database': 'Base de datos',
    'flow-document': 'Documento',
    'flow-subprocess': 'Subproceso'
  };
  return names[shape] || shape;
}

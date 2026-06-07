import { getNextZIndex } from './state.js';

const DEFAULT_CONNECTION_POINTS = [
  { id: 'top', x: 0.5, y: 0 },
  { id: 'right', x: 1, y: 0.5 },
  { id: 'bottom', x: 0.5, y: 1 },
  { id: 'left', x: 0, y: 0.5 }
];

// Paleta para modo claro
const PALETTE_LIGHT = {
  default: { fill: '#ffffff', stroke: '#111827', text: '#111827' },
  flowStart: { fill: '#dcfce7', stroke: '#16a34a', text: '#14532d' },
  flowProcess: { fill: '#dbeafe', stroke: '#2563eb', text: '#1e3a8a' },
  flowDecision: { fill: '#fef3c7', stroke: '#d97706', text: '#78350f' },
  flowIO: { fill: '#ede9fe', stroke: '#7c3aed', text: '#4c1d95' },
  flowDatabase: { fill: '#fce7f3', stroke: '#db2777', text: '#831843' },
  flowDocument: { fill: '#f0fdf4', stroke: '#15803d', text: '#14532d' },
  flowSubprocess: { fill: '#eff6ff', stroke: '#1d4ed8', text: '#1e3a8a' },
  note: { fill: '#fef9c3', stroke: '#eab308', text: '#713f12' },
  frame: { fill: 'none', stroke: '#94a3b8', text: '#64748b' }
};

// Paleta para modo oscuro
const PALETTE_DARK = {
  default: { fill: '#1e293b', stroke: '#475569', text: '#f1f5f9' },
  flowStart: { fill: '#065f46', stroke: '#10b981', text: '#ecfdf5' },
  flowProcess: { fill: '#1e3a8a', stroke: '#3b82f6', text: '#eff6ff' },
  flowDecision: { fill: '#78350f', stroke: '#f59e0b', text: '#fffbeb' },
  flowIO: { fill: '#4c1d95', stroke: '#8b5cf6', text: '#f5f3ff' },
  flowDatabase: { fill: '#831843', stroke: '#ec4899', text: '#fdf2f8' },
  flowDocument: { fill: '#14532d', stroke: '#22c55e', text: '#f0fdf4' },
  flowSubprocess: { fill: '#1e3a8a', stroke: '#60a5fa', text: '#eff6ff' },
  note: { fill: '#713f12', stroke: '#eab308', text: '#fef9c3' },
  frame: { fill: 'none', stroke: '#64748b', text: '#94a3b8' }
};

function getPalette() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  return theme === 'dark' ? PALETTE_DARK : PALETTE_LIGHT;
}

const DEFAULT_STYLE = {
  fill: '#ffffff',
  stroke: '#111827',
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
  color: '#111827',
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
  const palette = getPalette();
  return _baseElement({
    shape: 'note',
    x, y,
    width: 180,
    height: 120,
    style: { ...DEFAULT_STYLE, fill: palette.note.fill, stroke: palette.note.stroke, strokeWidth: 1 },
    text: { ...DEFAULT_TEXT, value: 'Nota', align: 'left', fontSize: 13, color: palette.note.text }
  });
}

export function createFrame(x, y, width, height) {
  const palette = getPalette();
  return _baseElement({
    shape: 'frame',
    x, y,
    width: Math.max(width, 100),
    height: Math.max(height, 80),
    style: { ...DEFAULT_STYLE, fill: palette.frame.fill, stroke: palette.frame.stroke, strokeWidth: 1, dashArray: '6 3' },
    text: { ...DEFAULT_TEXT, value: 'Frame', fontSize: 12, verticalAlign: 'top', color: palette.frame.text }
  });
}

export function createFlowStart(x, y, width, height) {
  const palette = getPalette();
  return _baseElement({
    shape: 'flow-start',
    x, y,
    width: Math.max(width, 120),
    height: Math.max(height, 50),
    style: { ...DEFAULT_STYLE, fill: palette.flowStart.fill, stroke: palette.flowStart.stroke },
    text: { ...DEFAULT_TEXT, value: 'Inicio', color: palette.flowStart.text }
  });
}

export function createFlowProcess(x, y, width, height) {
  const palette = getPalette();
  return _baseElement({
    shape: 'flow-process',
    x, y,
    width: Math.max(width, 140),
    height: Math.max(height, 60),
    style: { ...DEFAULT_STYLE, fill: palette.flowProcess.fill, stroke: palette.flowProcess.stroke },
    text: { ...DEFAULT_TEXT, value: 'Proceso', color: palette.flowProcess.text }
  });
}

export function createFlowDecision(x, y, width, height) {
  const palette = getPalette();
  return _baseElement({
    shape: 'flow-decision',
    x, y,
    width: Math.max(width, 120),
    height: Math.max(height, 80),
    style: { ...DEFAULT_STYLE, fill: palette.flowDecision.fill, stroke: palette.flowDecision.stroke },
    text: { ...DEFAULT_TEXT, value: 'Decision?', color: palette.flowDecision.text }
  });
}

export function createFlowIO(x, y, width, height) {
  const palette = getPalette();
  return _baseElement({
    shape: 'flow-io',
    x, y,
    width: Math.max(width, 140),
    height: Math.max(height, 60),
    style: { ...DEFAULT_STYLE, fill: palette.flowIO.fill, stroke: palette.flowIO.stroke },
    text: { ...DEFAULT_TEXT, value: 'Entrada/Salida', color: palette.flowIO.text }
  });
}

export function createFlowDatabase(x, y, width, height) {
  const palette = getPalette();
  return _baseElement({
    shape: 'flow-database',
    x, y,
    width: Math.max(width, 80),
    height: Math.max(height, 100),
    style: { ...DEFAULT_STYLE, fill: palette.flowDatabase.fill, stroke: palette.flowDatabase.stroke },
    text: { ...DEFAULT_TEXT, value: 'BD', color: palette.flowDatabase.text }
  });
}

export function createFlowDocument(x, y, width, height) {
  const palette = getPalette();
  return _baseElement({
    shape: 'flow-document',
    x, y,
    width: Math.max(width, 120),
    height: Math.max(height, 80),
    style: { ...DEFAULT_STYLE, fill: palette.flowDocument.fill, stroke: palette.flowDocument.stroke },
    text: { ...DEFAULT_TEXT, value: 'Documento', color: palette.flowDocument.text }
  });
}

export function createFlowSubprocess(x, y, width, height) {
  const palette = getPalette();
  return _baseElement({
    shape: 'flow-subprocess',
    x, y,
    width: Math.max(width, 140),
    height: Math.max(height, 60),
    style: { ...DEFAULT_STYLE, fill: palette.flowSubprocess.fill, stroke: palette.flowSubprocess.stroke },
    text: { ...DEFAULT_TEXT, value: 'Subproceso', color: palette.flowSubprocess.text }
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

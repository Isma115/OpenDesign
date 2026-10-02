// #region Creacion de figuras | Funcionalidad | fabricas de formas geometricas y nodos de flujo
import { getNextZIndex } from '../core/state.js';

const DEFAULT_CONNECTION_POINTS = [
  { id: 'top', x: 0.5, y: 0 },
  { id: 'right', x: 1, y: 0.5 },
  { id: 'bottom', x: 0.5, y: 1 },
  { id: 'left', x: 0, y: 0.5 }
];

// Paleta para modo claro
const PALETTE_LIGHT = {
  default: { fill: '#60a5fa', stroke: '#60a5fa', text: '#0f172a' },
  flowStart: { fill: '#4ade80', stroke: '#4ade80', text: '#14532d' },
  flowProcess: { fill: '#60a5fa', stroke: '#60a5fa', text: '#1e3a8a' },
  flowDecision: { fill: '#fbbf24', stroke: '#fbbf24', text: '#78350f' },
  flowIO: { fill: '#a78bfa', stroke: '#a78bfa', text: '#4c1d95' },
  flowDatabase: { fill: '#f472b6', stroke: '#f472b6', text: '#831843' },
  flowDocument: { fill: '#4ade80', stroke: '#4ade80', text: '#14532d' },
  flowSubprocess: { fill: '#60a5fa', stroke: '#60a5fa', text: '#1e3a8a' },
  note: { fill: '#facc15', stroke: '#facc15', text: '#713f12' },
  frame: { fill: 'none', stroke: '#475569', text: '#64748b' }
};

// Paleta para modo oscuro
const PALETTE_DARK = {
  default: { fill: '#64748b', stroke: '#64748b', text: '#f8fafc' },
  flowStart: { fill: '#10b981', stroke: '#10b981', text: '#ecfdf5' },
  flowProcess: { fill: '#3b82f6', stroke: '#3b82f6', text: '#eff6ff' },
  flowDecision: { fill: '#f59e0b', stroke: '#f59e0b', text: '#fffbeb' },
  flowIO: { fill: '#8b5cf6', stroke: '#8b5cf6', text: '#f5f3ff' },
  flowDatabase: { fill: '#ec4899', stroke: '#ec4899', text: '#fdf2f8' },
  flowDocument: { fill: '#22c55e', stroke: '#22c55e', text: '#f0fdf4' },
  flowSubprocess: { fill: '#60a5fa', stroke: '#60a5fa', text: '#eff6ff' },
  note: { fill: '#eab308', stroke: '#eab308', text: '#fef9c3' },
  frame: { fill: 'none', stroke: '#94a3b8', text: '#94a3b8' }
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
  const palette = getPalette().default;
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
    style: { ...DEFAULT_STYLE, fill: palette.fill, stroke: palette.fill },
    text: { ...DEFAULT_TEXT, color: palette.text },
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
    style: { ...DEFAULT_STYLE, fill: 'none', stroke: getPalette().default.stroke },
    _lineData: { x1, y1, x2, y2 }
  });
}

export function createArrow(x1, y1, x2, y2) {
  const el = createLine(x1, y1, x2, y2);
  el.shape = 'arrow';
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
    text: { ...DEFAULT_TEXT, value: 'Texto', color: getPalette().default.text }
  });
}

export function createImage(x, y, width, height, src) {
  return _baseElement({
    shape: 'image',
    x, y,
    width: Math.max(width, 1),
    height: Math.max(height, 1),
    style: { ...DEFAULT_STYLE, fill: 'none', stroke: 'none', strokeWidth: 0 },
    src: src || '',
    preserveAspectRatio: 'xMidYMid meet'
  });
}

export function createNote(x, y) {
  const palette = getPalette();
  return _baseElement({
    shape: 'note',
    x, y,
    width: 180,
    height: 120,
    style: { ...DEFAULT_STYLE, fill: palette.note.fill, stroke: palette.note.fill, strokeWidth: 1 },
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
    style: { ...DEFAULT_STYLE, fill: palette.flowStart.fill, stroke: palette.flowStart.fill },
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
    style: { ...DEFAULT_STYLE, fill: palette.flowProcess.fill, stroke: palette.flowProcess.fill },
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
    style: { ...DEFAULT_STYLE, fill: palette.flowDecision.fill, stroke: palette.flowDecision.fill },
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
    style: { ...DEFAULT_STYLE, fill: palette.flowIO.fill, stroke: palette.flowIO.fill },
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
    style: { ...DEFAULT_STYLE, fill: palette.flowDatabase.fill, stroke: palette.flowDatabase.fill },
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
    style: { ...DEFAULT_STYLE, fill: palette.flowDocument.fill, stroke: palette.flowDocument.fill },
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
    style: { ...DEFAULT_STYLE, fill: palette.flowSubprocess.fill, stroke: palette.flowSubprocess.fill },
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
      stroke: getPalette().default.stroke,
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
      color: getPalette().default.text
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
    'flow-subprocess': 'Subproceso',
    image: 'Imagen'
  };
  return names[shape] || shape;
}
// #endregion

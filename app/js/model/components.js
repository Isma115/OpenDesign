// #region Componentes UI | Funcionalidad | creacion de componentes arrastrables
import { getNextZIndex } from '../core/state.js';

const _id = () => 'el_' + crypto.randomUUID().slice(0, 12);

function getComponentPalette() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  return theme === 'dark' ? {
    button: { fill: '#3b82f6', stroke: '#2563eb', text: '#ffffff' },
    input: { fill: '#334155', stroke: '#94a3b8', text: '#94a3b8' },
    card: { fill: '#334155', stroke: '#94a3b8', text: '#f1f5f9' },
    navbar: { fill: '#0f172a', stroke: '#1e293b', text: '#f1f5f9' },
    sidebar: { fill: '#334155', stroke: '#94a3b8', text: '#94a3b8' },
    table: { fill: '#334155', stroke: '#94a3b8', text: '#f1f5f9', header: '#475569' },
    checkbox: { fill: '#334155', stroke: '#94a3b8', text: '#f1f5f9' },
    toggle: { fill: '#3b82f6', stroke: '#3b82f6' },
    avatar: { fill: '#334155', stroke: '#94a3b8', text: '#94a3b8' },
    modal: { fill: '#334155', stroke: '#94a3b8', text: '#f1f5f9' },
    image: { fill: '#334155', stroke: '#94a3b8', text: '#64748b' },
    textarea: { fill: '#334155', stroke: '#94a3b8', text: '#94a3b8' }
  } : {
    button: { fill: '#2563eb', stroke: '#1d4ed8', text: '#ffffff' },
    input: { fill: '#f1f5f9', stroke: '#475569', text: '#9ca3af' },
    card: { fill: '#f1f5f9', stroke: '#475569', text: '#111827' },
    navbar: { fill: '#111827', stroke: '#111827', text: '#ffffff' },
    sidebar: { fill: '#f9fafb', stroke: '#475569', text: '#6b7280' },
    table: { fill: '#f1f5f9', stroke: '#475569', text: '#111827', header: '#f3f4f6' },
    checkbox: { fill: '#f1f5f9', stroke: '#475569', text: '#111827' },
    toggle: { fill: '#2563eb', stroke: '#2563eb' },
    avatar: { fill: '#e5e7eb', stroke: '#475569', text: '#6b7280' },
    modal: { fill: '#f1f5f9', stroke: '#475569', text: '#111827' },
    image: { fill: '#f9fafb', stroke: '#475569', text: '#9ca3af' },
    textarea: { fill: '#f1f5f9', stroke: '#475569', text: '#9ca3af' }
  };
}

export function createComponentGroup(compType, x, y) {
  const factories = {
    button: _createButton,
    input: _createInput,
    textarea: _createTextarea,
    checkbox: _createCheckbox,
    toggle: _createToggle,
    card: _createCard,
    avatar: _createAvatar,
    navbar: _createNavbar,
    sidebar: _createSidebar,
    table: _createTable,
    image: _createImage,
    modal: _createModal,
    'db-table': (x, y) => _createDatabaseBlock('table', x, y),
    'db-view': (x, y) => _createDatabaseBlock('view', x, y),
    'db-primary-key': (x, y) => _createDatabaseBlock('primary-key', x, y),
    'db-foreign-key': (x, y) => _createDatabaseBlock('foreign-key', x, y),
    'db-index': (x, y) => _createDatabaseBlock('index', x, y),
    'db-query': (x, y) => _createDatabaseBlock('query', x, y)
  };
  if (!Object.hasOwn(factories, compType)) return null;
  const factory = factories[compType];
  const group = factory(x, y);
  group.componentType = compType;
  return group;
}

function _baseStyle(overrides = {}) {
  return { fill: '#ffffff', stroke: '#111827', strokeWidth: 2, opacity: 1, dashArray: '', shadow: false, ...overrides };
}

function _baseText(overrides = {}) {
  return { value: '', fontFamily: 'Inter, Arial, sans-serif', fontSize: 14, fontWeight: 400, color: '#111827', align: 'center', verticalAlign: 'middle', ...overrides };
}

function _componentCss(className) {
  return { className, rules: '' };
}

function _shapeEl(overrides) {
  return {
    id: _id(), type: 'shape', shape: 'rectangle',
    x: 0, y: 0, width: 100, height: 40, rotation: 0,
    locked: false, visible: true, zIndex: getNextZIndex(),
    style: _baseStyle(), text: _baseText(),
    connectionPoints: [
      { id: 'top', x: 0.5, y: 0 }, { id: 'right', x: 1, y: 0.5 },
      { id: 'bottom', x: 0.5, y: 1 }, { id: 'left', x: 0, y: 0.5 }
    ],
    ...overrides
  };
}

function _lineEl(x1, y1, x2, y2, stroke, strokeWidth = 1, opacity = 0.7) {
  return _shapeEl({
    shape: 'line',
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    style: _baseStyle({ fill: 'none', stroke, strokeWidth, opacity }),
    _lineData: { x1, y1, x2, y2 }
  });
}

function _createButton(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'roundedRectangle',
    x, y, width: 120, height: 40,
    style: _baseStyle({ fill: palette.button.fill, stroke: palette.button.stroke, strokeWidth: 1 }),
    text: _baseText({ value: 'Button', color: palette.button.text, fontSize: 14, fontWeight: 600 })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Button',
    x, y, width: 120, height: 40, rotation: 0,
    children: [bgId], css: _componentCss('trazuvia-button'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createInput(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'roundedRectangle',
    x, y, width: 200, height: 36,
    style: _baseStyle({ fill: palette.input.fill, stroke: palette.input.stroke, strokeWidth: 1 }),
    text: _baseText({ value: 'Placeholder...', color: palette.input.text, align: 'left', fontSize: 13 })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Input',
    x, y, width: 200, height: 36, rotation: 0,
    children: [bgId], css: _componentCss('trazuvia-input'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createTextarea(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const line1 = _lineEl(x + 16, y + 28, x + 184, y + 28, palette.textarea.text, 1, 0.7);
  const line2 = _lineEl(x + 16, y + 46, x + 166, y + 46, palette.textarea.text, 1, 0.7);
  const line3 = _lineEl(x + 16, y + 64, x + 142, y + 64, palette.textarea.text, 1, 0.7);
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 200, height: 80,
    style: _baseStyle({ fill: palette.textarea.fill, stroke: palette.textarea.stroke, strokeWidth: 1 }),
    text: _baseText({ value: '', color: palette.textarea.text })
  });
  _pendingChildren.set(groupId, [bg, line1, line2, line3]);
  return {
    id: groupId, type: 'group', name: 'Textarea',
    x, y, width: 200, height: 80, rotation: 0,
    children: [bgId, line1.id, line2.id, line3.id], css: _componentCss('trazuvia-textarea'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createCheckbox(x, y) {
  const palette = getComponentPalette();
  const boxId = _id();
  const labelId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const box = _shapeEl({
    id: boxId, shape: 'roundedRectangle',
    x, y: y + 2, width: 18, height: 18,
    style: _baseStyle({ fill: palette.checkbox.fill, stroke: palette.checkbox.stroke, strokeWidth: 2 })
  });
  const label = _shapeEl({
    id: labelId, shape: 'text', type: 'text',
    x: x + 26, y, width: 100, height: 22,
    style: _baseStyle({ fill: 'none', stroke: 'none', strokeWidth: 0 }),
    text: _baseText({ value: 'Checkbox', align: 'left', fontSize: 13, color: palette.checkbox.text })
  });
  _pendingChildren.set(groupId, [box, label]);
  return {
    id: groupId, type: 'group', name: 'Checkbox',
    x, y, width: 126, height: 22, rotation: 0,
    children: [boxId, labelId], css: _componentCss('trazuvia-checkbox'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createToggle(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const knobId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'roundedRectangle',
    x, y, width: 44, height: 24,
    style: _baseStyle({ fill: palette.toggle.fill, stroke: palette.toggle.stroke, strokeWidth: 0 })
  });
  const knob = _shapeEl({
    id: knobId, shape: 'ellipse',
    x: x + 24, y: y + 3, width: 18, height: 18,
    style: _baseStyle({ fill: '#ffffff', stroke: palette.toggle.stroke, strokeWidth: 1 })
  });
  _pendingChildren.set(groupId, [bg, knob]);
  return {
    id: groupId, type: 'group', name: 'Toggle',
    x, y, width: 44, height: 24, rotation: 0,
    children: [bgId, knobId], css: _componentCss('trazuvia-toggle'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createCard(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const headerId = _id();
  const titleId = _id();
  const line1 = _lineEl(x + 16, y + 78, x + 176, y + 78, palette.card.text, 1, 0.55);
  const line2 = _lineEl(x + 16, y + 102, x + 136, y + 102, palette.card.text, 1, 0.55);
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 240, height: 160,
    style: _baseStyle({ fill: palette.card.fill, stroke: palette.card.stroke, strokeWidth: 1 })
  });
  const header = _shapeEl({
    id: headerId, shape: 'rectangle',
    x, y, width: 240, height: 36,
    style: _baseStyle({ fill: palette.card.stroke, stroke: palette.card.stroke, strokeWidth: 0, opacity: 0.25 })
  });
  const title = _shapeEl({
    id: titleId, shape: 'text', type: 'text',
    x: x + 16, y: y + 16, width: 208, height: 24,
    style: _baseStyle({ fill: 'none', stroke: 'none', strokeWidth: 0 }),
    text: _baseText({ value: 'Card Title', align: 'left', fontSize: 16, fontWeight: 600, color: palette.card.text })
  });
  _pendingChildren.set(groupId, [bg, header, title, line1, line2]);
  return {
    id: groupId, type: 'group', name: 'Card',
    x, y, width: 240, height: 160, rotation: 0,
    children: [bgId, headerId, titleId, line1.id, line2.id], css: _componentCss('trazuvia-card'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createAvatar(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'ellipse',
    x, y, width: 48, height: 48,
    style: _baseStyle({ fill: palette.avatar.fill, stroke: palette.avatar.stroke, strokeWidth: 1 }),
    text: _baseText({ value: 'A', fontSize: 18, fontWeight: 600, color: palette.avatar.text })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Avatar',
    x, y, width: 48, height: 48, rotation: 0,
    children: [bgId], css: _componentCss('trazuvia-avatar'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createNavbar(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const logoId = _id();
  const titleId = _id();
  const link1 = _lineEl(x + 96, y + 24, x + 176, y + 24, palette.navbar.text, 2, 0.85);
  const link2 = _lineEl(x + 216, y + 24, x + 296, y + 24, palette.navbar.text, 2, 0.85);
  const link3 = _lineEl(x + 336, y + 24, x + 416, y + 24, palette.navbar.text, 2, 0.85);
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 600, height: 48,
    style: _baseStyle({ fill: palette.navbar.fill, stroke: palette.navbar.stroke, strokeWidth: 0 }),
    text: _baseText({ value: '', color: palette.navbar.text })
  });
  const logo = _shapeEl({
    id: logoId, shape: 'ellipse',
    x: x + 16, y: y + 12, width: 24, height: 24,
    style: _baseStyle({ fill: palette.navbar.text, stroke: palette.navbar.text, strokeWidth: 0 })
  });
  const title = _shapeEl({
    id: titleId, shape: 'text', type: 'text',
    x: x + 48, y: y + 10, width: 40, height: 28,
    style: _baseStyle({ fill: 'none', stroke: 'none', strokeWidth: 0 }),
    text: _baseText({ value: 'Navbar', align: 'left', fontSize: 14, fontWeight: 600, color: palette.navbar.text })
  });
  _pendingChildren.set(groupId, [bg, logo, title, link1, link2, link3]);
  return {
    id: groupId, type: 'group', name: 'Navbar',
    x, y, width: 600, height: 48, rotation: 0,
    children: [bgId, logoId, titleId, link1.id, link2.id, link3.id], css: _componentCss('trazuvia-navbar'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createSidebar(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const headerId = _id();
  const titleId = _id();
  const menu1 = _lineEl(x + 24, y + 92, x + 168, y + 92, palette.sidebar.text, 2, 0.75);
  const menu2 = _lineEl(x + 24, y + 132, x + 150, y + 132, palette.sidebar.text, 2, 0.75);
  const menu3 = _lineEl(x + 24, y + 172, x + 160, y + 172, palette.sidebar.text, 2, 0.75);
  const menu4 = _lineEl(x + 24, y + 212, x + 132, y + 212, palette.sidebar.text, 2, 0.75);
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 200, height: 400,
    style: _baseStyle({ fill: palette.sidebar.fill, stroke: palette.sidebar.stroke, strokeWidth: 1 }),
    text: _baseText({ value: '', color: palette.sidebar.text })
  });
  const header = _shapeEl({
    id: headerId, shape: 'rectangle',
    x, y, width: 200, height: 48,
    style: _baseStyle({ fill: palette.sidebar.stroke, stroke: palette.sidebar.stroke, strokeWidth: 0, opacity: 0.25 })
  });
  const title = _shapeEl({
    id: titleId, shape: 'text', type: 'text',
    x: x + 16, y: y + 10, width: 168, height: 28,
    style: _baseStyle({ fill: 'none', stroke: 'none', strokeWidth: 0 }),
    text: _baseText({ value: 'Menu lateral', align: 'left', fontSize: 14, fontWeight: 600, color: palette.sidebar.text })
  });
  _pendingChildren.set(groupId, [bg, header, title, menu1, menu2, menu3, menu4]);
  return {
    id: groupId, type: 'group', name: 'Sidebar',
    x, y, width: 200, height: 400, rotation: 0,
    children: [bgId, headerId, titleId, menu1.id, menu2.id, menu3.id, menu4.id], css: _componentCss('trazuvia-sidebar'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createTable(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const headerId = _id();
  const vertical1 = _lineEl(x + 132, y + 36, x + 132, y + 200, palette.table.stroke, 1, 0.8);
  const vertical2 = _lineEl(x + 266, y + 36, x + 266, y + 200, palette.table.stroke, 1, 0.8);
  const horizontal1 = _lineEl(x, y + 90, x + 400, y + 90, palette.table.stroke, 1, 0.8);
  const horizontal2 = _lineEl(x, y + 144, x + 400, y + 144, palette.table.stroke, 1, 0.8);
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 400, height: 200,
    style: _baseStyle({ fill: palette.table.fill, stroke: palette.table.stroke, strokeWidth: 1 })
  });
  const header = _shapeEl({
    id: headerId, shape: 'rectangle',
    x, y, width: 400, height: 36,
    style: _baseStyle({ fill: palette.table.header, stroke: palette.table.stroke, strokeWidth: 1 }),
    text: _baseText({ value: 'Header', fontSize: 13, fontWeight: 600, align: 'left', verticalAlign: 'middle', color: palette.table.text })
  });
  _pendingChildren.set(groupId, [bg, header, vertical1, vertical2, horizontal1, horizontal2]);
  return {
    id: groupId, type: 'group', name: 'Table',
    x, y, width: 400, height: 200, rotation: 0,
    children: [bgId, headerId, vertical1.id, vertical2.id, horizontal1.id, horizontal2.id], css: _componentCss('trazuvia-table'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createImage(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const sunId = _id();
  const mountainId = _id();
  const labelId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 200, height: 150,
    style: _baseStyle({ fill: palette.image.fill, stroke: palette.image.stroke, strokeWidth: 1, dashArray: '6 3' }),
    text: _baseText({ value: '', color: palette.image.text, fontSize: 14 })
  });
  const sun = _shapeEl({
    id: sunId, shape: 'ellipse',
    x: x + 148, y: y + 24, width: 24, height: 24,
    style: _baseStyle({ fill: palette.image.stroke, stroke: palette.image.stroke, strokeWidth: 0, opacity: 0.75 })
  });
  const mountain = _shapeEl({
    id: mountainId, shape: 'triangle',
    x: x + 28, y: y + 44, width: 112, height: 76,
    style: _baseStyle({ fill: palette.image.stroke, stroke: palette.image.stroke, strokeWidth: 1, opacity: 0.65 })
  });
  const label = _shapeEl({
    id: labelId, shape: 'text', type: 'text',
    x: x + 56, y: y + 112, width: 88, height: 24,
    style: _baseStyle({ fill: 'none', stroke: 'none', strokeWidth: 0 }),
    text: _baseText({ value: 'Imagen', fontSize: 14, color: palette.image.text })
  });
  _pendingChildren.set(groupId, [bg, sun, mountain, label]);
  return {
    id: groupId, type: 'group', name: 'Image',
    x, y, width: 200, height: 150, rotation: 0,
    children: [bgId, sunId, mountainId, labelId], css: _componentCss('trazuvia-image'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createModal(x, y) {
  const palette = getComponentPalette();
  const bgId = _id();
  const headerId = _id();
  const titleId = _id();
  const closeId = _id();
  const closeLine1 = _lineEl(x + 333, y + 14, x + 343, y + 24, palette.modal.text, 1.5, 0.8);
  const closeLine2 = _lineEl(x + 343, y + 14, x + 333, y + 24, palette.modal.text, 1.5, 0.8);
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 360, height: 240,
    style: _baseStyle({ fill: palette.modal.fill, stroke: palette.modal.stroke, strokeWidth: 1 })
  });
  const header = _shapeEl({
    id: headerId, shape: 'rectangle',
    x, y, width: 360, height: 44,
    style: _baseStyle({ fill: palette.modal.stroke, stroke: palette.modal.stroke, strokeWidth: 0, opacity: 0.25 })
  });
  const title = _shapeEl({
    id: titleId, shape: 'text', type: 'text',
    x: x + 20, y: y + 16, width: 320, height: 24,
    style: _baseStyle({ fill: 'none', stroke: 'none', strokeWidth: 0 }),
    text: _baseText({ value: 'Modal Title', align: 'left', fontSize: 16, fontWeight: 600, color: palette.modal.text })
  });
  const close = _shapeEl({
    id: closeId, shape: 'ellipse',
    x: x + 326, y: y + 9, width: 24, height: 24,
    style: _baseStyle({ fill: palette.modal.stroke, stroke: palette.modal.stroke, strokeWidth: 0, opacity: 0.4 })
  });
  _pendingChildren.set(groupId, [bg, header, title, close, closeLine1, closeLine2]);
  return {
    id: groupId, type: 'group', name: 'Modal',
    x, y, width: 360, height: 240, rotation: 0,
    children: [bgId, headerId, titleId, closeId, closeLine1.id, closeLine2.id], css: _componentCss('trazuvia-modal'),
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createDatabaseBlock(kind, x, y) {
  const templates = {
    table: ['Tabla', 'usuarios', ['PK  id : INTEGER', 'nombre : VARCHAR(120)', 'email : VARCHAR(255)']],
    view: ['Vista', 'Vista · usuarios_activos', ['id · nombre · email', 'WHERE activo = TRUE']],
    'primary-key': ['Clave primaria', 'PK · Clave primaria', ['id : INTEGER', 'Único · NOT NULL']],
    'foreign-key': ['Clave foránea', 'FK · Clave foránea', ['usuario_id : INTEGER', 'REFERENCES usuarios(id)']],
    index: ['Índice', 'Índice · idx_email', ['usuarios(email)', 'UNIQUE · B-TREE']],
    query: ['Consulta SQL', 'Consulta SQL', ['SELECT id, nombre', 'FROM usuarios', 'WHERE activo = TRUE']]
  };
  const [name, title, rows] = templates[kind];
  const palette = getComponentPalette().table;
  const width = 280;
  const height = 36 + rows.length * 32;
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const children = [
    _shapeEl({
      name: `${name} · fondo`, x, y, width, height,
      style: _baseStyle({ fill: palette.fill, stroke: palette.stroke, strokeWidth: 1 })
    }),
    _shapeEl({
      name: `${name} · título`, x, y, width, height: 36,
      style: _baseStyle({ fill: palette.header, stroke: palette.stroke, strokeWidth: 1 }),
      text: _baseText({ value: title, align: 'left', color: palette.text, fontWeight: 600 })
    })
  ];
  rows.forEach((value, index) => {
    const rowY = y + 36 + index * 32;
    children.push(_shapeEl({
      type: 'text', shape: 'text', name: `${name} · ${value}`,
      x: x + 4, y: rowY, width: width - 8, height: 32,
      style: _baseStyle({ fill: 'none', stroke: 'none', strokeWidth: 0 }),
      text: _baseText({ value, align: 'left', color: palette.text, fontSize: 13,
        fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, monospace' })
    }));
    if (index > 0) {
      const separator = _lineEl(x, rowY, x + width, rowY, palette.stroke, 1, 0.4);
      separator.name = `${name} · separador ${index}`;
      children.push(separator);
    }
  });
  _pendingChildren.set(groupId, children);
  return {
    id: groupId, type: 'group', name, x, y, width, height, rotation: 0,
    children: children.map(child => child.id), css: _componentCss(`trazuvia-db-${kind}`),
    connectionPoints: [
      { id: 'top', x: 0.5, y: 0 }, { id: 'right', x: 1, y: 0.5 },
      { id: 'bottom', x: 0.5, y: 1 }, { id: 'left', x: 0, y: 0.5 }
    ],
    locked: false, visible: true, zIndex: getNextZIndex()
  };
}

const _pendingChildren = new Map();

export function getPendingChildren(groupId) {
  const children = _pendingChildren.get(groupId) || [];
  _pendingChildren.delete(groupId);
  return children;
}
// #endregion

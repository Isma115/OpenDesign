import { getNextZIndex } from './state.js';

const _id = () => 'el_' + crypto.randomUUID().slice(0, 12);

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
    modal: _createModal
  };
  const factory = factories[compType];
  if (!factory) return null;
  return factory(x, y);
}

function _baseStyle(overrides = {}) {
  return { fill: '#ffffff', stroke: '#111827', strokeWidth: 2, opacity: 1, dashArray: '', shadow: false, ...overrides };
}

function _baseText(overrides = {}) {
  return { value: '', fontFamily: 'Inter, Arial, sans-serif', fontSize: 14, fontWeight: 400, color: '#111827', align: 'center', verticalAlign: 'middle', ...overrides };
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

function _createButton(x, y) {
  const bgId = _id();
  const textId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'roundedRectangle',
    x, y, width: 120, height: 40,
    style: _baseStyle({ fill: '#2563eb', stroke: '#1d4ed8', strokeWidth: 1 }),
    text: _baseText({ value: 'Button', color: '#ffffff', fontSize: 14, fontWeight: 600 })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Button',
    x, y, width: 120, height: 40, rotation: 0,
    children: [bgId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createInput(x, y) {
  const bgId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'roundedRectangle',
    x, y, width: 200, height: 36,
    style: _baseStyle({ fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1 }),
    text: _baseText({ value: 'Placeholder...', color: '#9ca3af', align: 'left', fontSize: 13 })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Input',
    x, y, width: 200, height: 36, rotation: 0,
    children: [bgId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createTextarea(x, y) {
  const bgId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'roundedRectangle',
    x, y, width: 200, height: 80,
    style: _baseStyle({ fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1 }),
    text: _baseText({ value: '', align: 'left', verticalAlign: 'top', fontSize: 13 })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Textarea',
    x, y, width: 200, height: 80, rotation: 0,
    children: [bgId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createCheckbox(x, y) {
  const boxId = _id();
  const labelId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const box = _shapeEl({
    id: boxId, shape: 'roundedRectangle',
    x, y: y + 2, width: 18, height: 18,
    style: _baseStyle({ fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 2 })
  });
  const label = _shapeEl({
    id: labelId, shape: 'text', type: 'text',
    x: x + 26, y, width: 100, height: 22,
    style: _baseStyle({ fill: 'none', stroke: 'none', strokeWidth: 0 }),
    text: _baseText({ value: 'Checkbox', align: 'left', fontSize: 13 })
  });
  _pendingChildren.set(groupId, [box, label]);
  return {
    id: groupId, type: 'group', name: 'Checkbox',
    x, y, width: 126, height: 22, rotation: 0,
    children: [boxId, labelId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createToggle(x, y) {
  const bgId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'roundedRectangle',
    x, y, width: 44, height: 24,
    style: _baseStyle({ fill: '#2563eb', stroke: '#2563eb', strokeWidth: 0 })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Toggle',
    x, y, width: 44, height: 24, rotation: 0,
    children: [bgId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createCard(x, y) {
  const bgId = _id();
  const titleId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'roundedRectangle',
    x, y, width: 240, height: 160,
    style: _baseStyle({ fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 })
  });
  const title = _shapeEl({
    id: titleId, shape: 'text', type: 'text',
    x: x + 16, y: y + 16, width: 208, height: 24,
    style: _baseStyle({ fill: 'none', stroke: 'none', strokeWidth: 0 }),
    text: _baseText({ value: 'Card Title', align: 'left', fontSize: 16, fontWeight: 600 })
  });
  _pendingChildren.set(groupId, [bg, title]);
  return {
    id: groupId, type: 'group', name: 'Card',
    x, y, width: 240, height: 160, rotation: 0,
    children: [bgId, titleId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createAvatar(x, y) {
  const bgId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'ellipse',
    x, y, width: 48, height: 48,
    style: _baseStyle({ fill: '#e5e7eb', stroke: '#d1d5db', strokeWidth: 1 }),
    text: _baseText({ value: 'A', fontSize: 18, fontWeight: 600, color: '#6b7280' })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Avatar',
    x, y, width: 48, height: 48, rotation: 0,
    children: [bgId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createNavbar(x, y) {
  const bgId = _id();
  const titleId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 600, height: 48,
    style: _baseStyle({ fill: '#111827', stroke: '#111827', strokeWidth: 0 }),
    text: _baseText({ value: 'Navbar', color: '#ffffff', fontSize: 16, fontWeight: 600, align: 'left' })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Navbar',
    x, y, width: 600, height: 48, rotation: 0,
    children: [bgId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createSidebar(x, y) {
  const bgId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 200, height: 400,
    style: _baseStyle({ fill: '#f9fafb', stroke: '#e5e7eb', strokeWidth: 1 }),
    text: _baseText({ value: 'Sidebar', color: '#6b7280', fontSize: 14, verticalAlign: 'top' })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Sidebar',
    x, y, width: 200, height: 400, rotation: 0,
    children: [bgId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createTable(x, y) {
  const bgId = _id();
  const headerId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 400, height: 200,
    style: _baseStyle({ fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 })
  });
  const header = _shapeEl({
    id: headerId, shape: 'rectangle',
    x, y, width: 400, height: 36,
    style: _baseStyle({ fill: '#f3f4f6', stroke: '#e5e7eb', strokeWidth: 1 }),
    text: _baseText({ value: 'Header', fontSize: 13, fontWeight: 600, align: 'left', verticalAlign: 'middle' })
  });
  _pendingChildren.set(groupId, [bg, header]);
  return {
    id: groupId, type: 'group', name: 'Table',
    x, y, width: 400, height: 200, rotation: 0,
    children: [bgId, headerId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createImage(x, y) {
  const bgId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'rectangle',
    x, y, width: 200, height: 150,
    style: _baseStyle({ fill: '#f9fafb', stroke: '#d1d5db', strokeWidth: 1, dashArray: '6 3' }),
    text: _baseText({ value: 'Imagen', color: '#9ca3af', fontSize: 14 })
  });
  _pendingChildren.set(groupId, [bg]);
  return {
    id: groupId, type: 'group', name: 'Image',
    x, y, width: 200, height: 150, rotation: 0,
    children: [bgId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

function _createModal(x, y) {
  const bgId = _id();
  const titleId = _id();
  const groupId = 'group_' + crypto.randomUUID().slice(0, 12);
  const bg = _shapeEl({
    id: bgId, shape: 'roundedRectangle',
    x, y, width: 360, height: 240,
    style: _baseStyle({ fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 })
  });
  const title = _shapeEl({
    id: titleId, shape: 'text', type: 'text',
    x: x + 20, y: y + 16, width: 320, height: 24,
    style: _baseStyle({ fill: 'none', stroke: 'none', strokeWidth: 0 }),
    text: _baseText({ value: 'Modal Title', align: 'left', fontSize: 16, fontWeight: 600 })
  });
  _pendingChildren.set(groupId, [bg, title]);
  return {
    id: groupId, type: 'group', name: 'Modal',
    x, y, width: 360, height: 240, rotation: 0,
    children: [bgId, titleId], locked: false, visible: true, zIndex: getNextZIndex()
  };
}

const _pendingChildren = new Map();

export function getPendingChildren(groupId) {
  const children = _pendingChildren.get(groupId) || [];
  _pendingChildren.delete(groupId);
  return children;
}

// Ejecutar: node --experimental-vm-modules tests/component-placement.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.style = {};
    this.attributes = new Map();
    this.listeners = new Map();
    const classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      contains: name => classes.has(name),
      toggle: (name, active) => active ? classes.add(name) : classes.delete(name)
    };
  }
  addEventListener(name, handler) {
    const handlers = this.listeners.get(name) || [];
    handlers.push(handler);
    this.listeners.set(name, handlers);
  }
  emit(name, event = {}) { for (const handler of this.listeners.get(name) || []) handler(event); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name) || null; }
  setPointerCapture() {}
  releasePointerCapture() {}
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { left: 100, top: 50, width: 1000, height: 800 }; }
  createSVGPoint() {
    return { x: 0, y: 0, matrixTransform() { return { x: (this.x - 100) / 2, y: (this.y - 50) / 2 }; } };
  }
  getScreenCTM() { return { inverse: () => ({}) }; }
}

const canvas = new Element();
const wrapper = new Element();
const library = readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
const types = [...new Set([...library.matchAll(/data-component="([^"]+)"/g)].map(match => match[1]))];
const components = types.map(component => new Element({ component }));
const rectangle = new Element({ tool: 'rectangle' });
const controls = [rectangle, ...components];
const documentEvents = new Element();
const document = Object.assign(documentEvents, {
  documentElement: { getAttribute: () => 'dark' },
  getElementById: id => ({ canvas, 'canvas-wrapper': wrapper })[id] || null,
  querySelectorAll: selector => selector.includes('data-tool') ? controls
    : selector === '.component-item' ? components : [],
  querySelector: () => null,
  createElementNS: () => new Element()
});
globalThis.document = document;
const { getState, resetDocument, subscribe } = await import('../app/js/core/state.js');
const context = vm.createContext({ document, window: { addEventListener() {} }, console });
const noOp = () => {};
const renderer = {
  SVG_NS: 'http://www.w3.org/2000/svg', getSvgCanvas: () => canvas,
  ...Object.fromEntries(['renderDocument', 'renderElement', 'updateElementNode', 'clearPreview', 'renderPreview',
    'applyViewport', 'renderGuideLines', 'clearGuides'].map(name => [name, noOp]))
};
const selection = {
  ...Object.fromEntries(['handleSelectionClick', 'handleCanvasClick', 'updateSelectionBox', 'endSelectionBox',
    'refreshSelection'].map(name => [name, noOp])),
  hitTest: () => null, hitTestHandle: () => null, hitTestConnectionPoint: () => null
};
const modules = new Map();
async function moduleAt(url) {
  if (modules.has(url.href)) return modules.get(url.href);
  const path = url.pathname;
  const realSource = /\/(tools|keyboard|history|ui)\.js$/.test(path);
  let module;
  if (realSource) {
    module = new vm.SourceTextModule(readFileSync(url, 'utf8'), { context, identifier: url.href });
  } else {
    const exports = path.endsWith('/renderer.js') ? renderer
      : path.endsWith('/selection.js') ? selection : await import(url.href);
    module = new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context, identifier: url.href });
  }
  modules.set(url.href, module);
  await module.link((specifier, parent) => moduleAt(new URL(specifier, parent.identifier)));
  return module;
}
const tools = await moduleAt(new URL('../app/js/editor/tools.js', import.meta.url));
await tools.evaluate();
const keyboard = await moduleAt(new URL('../app/js/editor/keyboard.js', import.meta.url));
await keyboard.evaluate();
const ui = await moduleAt(new URL('../app/js/ui/ui.js', import.meta.url));
await ui.evaluate();
tools.namespace.initTools();
keyboard.namespace.initKeyboard();
ui.namespace.initUI();
subscribe(() => keyboard.namespace.updateToolUI());

const pointer = { pointerId: 1, clientX: 500, clientY: 350 };
for (const item of components) {
  resetDocument();
  getState().snapping.enabled = false;
  item.emit('click');
  assert.equal(getState().activeTool, `component:${item.dataset.component}`);
  assert.equal(item.getAttribute('aria-pressed'), 'true');
  assert.equal(getState().document.elements.length, 0);
  canvas.emit('pointerdown', pointer);
  canvas.emit('pointerup', pointer);
  const group = getState().document.elements.find(element => element.type === 'group');
  assert.equal(group.componentType, item.dataset.component);
  assert.equal(group.x, 200);
  assert.equal(group.y, 150);
  assert.equal(getState().activeTool, 'select');
  assert.equal(getState().selectedElementIds[0], group.id);
  assert.equal(getState().history.past.length, 1);
  assert.equal(getState().document.elements.length, group.children.length + 1);
  if (item.dataset.component === 'button') assert.equal(group.width, 120);
  if (item.dataset.component === 'db-table') assert.equal(group.width, 280);
  const snapshot = JSON.stringify(getState().document.elements);
  document.emit('keydown', { key: 'z', ctrlKey: true, target: { tagName: 'DIV' }, preventDefault() {} });
  assert.equal(getState().document.elements.length, 0);
  document.emit('keydown', { key: 'z', ctrlKey: true, shiftKey: true, target: { tagName: 'DIV' }, preventDefault() {} });
  assert.equal(JSON.stringify(getState().document.elements), snapshot);

  resetDocument();
  item.emit('click');
  document.emit('keydown', { key: 'Escape', target: { tagName: 'DIV' }, preventDefault() {} });
  assert.equal(getState().activeTool, 'select');
  assert.equal(getState().document.elements.length, 0);
  item.emit('click');
  rectangle.emit('click');
  assert.equal(getState().activeTool, 'rectangle');

  const values = new Map();
  const dataTransfer = { files: [], types: ['text/plain'], setData: (key, value) => values.set(key, value), getData: key => values.get(key) };
  item.emit('dragstart', { dataTransfer });
  assert.equal(getState().activeTool, 'select');
  wrapper.emit('drop', { ...pointer, dataTransfer, preventDefault() {} });
  assert.equal(getState().document.elements.filter(element => element.type === 'group').length, 1);
  assert.equal(getState().history.past.length, 1);
  assert.equal(getState().activeTool, 'select');
}

resetDocument();
getState().snapping.enabled = false;
components[0].emit('click');
canvas.emit('pointerdown', pointer);
canvas.emit('pointermove', { ...pointer, clientX: 900, clientY: 550 });
canvas.emit('pointerup', { ...pointer, clientX: 900, clientY: 550 });
const resized = getState().document.elements.find(element => element.type === 'group');
assert.equal(resized.width, 200);
assert.equal(resized.height, 100);
console.log(`${types.length} componentes: clic, colocación, arrastre, tamaño, Escape, cambio de herramienta, deshacer y rehacer correctos.`);

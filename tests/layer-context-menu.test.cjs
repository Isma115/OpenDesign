const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

(async () => {
  const stateAPI = await import('../app/js/core/state.js');
  const { getCssClassForElement } = await import('../app/js/core/css-template.js');
  const strip = path => fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const row = { dataset: { layerId: 'group' }, draggable: true, querySelector: () => ({ textContent: 'Button', replaceWith: input => { row.input = input; } }) };
  const document = {
    querySelectorAll: () => [row],
    createElement: () => ({ value: '', listeners: {}, setAttribute() {}, focus() {}, select() {},
      addEventListener(name, handler) { this.listeners[name] = handler; } })
  };
  const context = vm.createContext({
    ...stateAPI, document, getCssClassForElement,
    renderDocument() {}, refreshSelection() {}, _updateLayersPanel() {}, _updatePropertiesPanel() {}
  });
  vm.runInContext(strip('app/js/core/history.js') + '\n' + strip('app/js/editor/actions.js'), context);
  const ui = fs.readFileSync('app/js/ui/ui.js', 'utf8');
  vm.runInContext(ui.slice(ui.indexOf('function _renameLayer('), ui.indexOf('function _updateLayersPanel()')), context);
  const elements = [
    { id: 'group', type: 'group', name: 'Button', componentType: 'button', children: ['nested'], css: { className: 'trazuvia-button' } },
    { id: 'nested', type: 'group', children: ['child'] },
    { id: 'child', type: 'shape', name: 'Fondo' },
    { id: 'other', type: 'shape', name: 'Otro' },
    { id: 'connection', type: 'connector', source: { elementId: 'child' }, target: { elementId: 'other' } }
  ];
  const collection = { id: 'collection', elementIds: elements.map(el => el.id) };
  stateAPI.loadDocument({ elements, canvas: {}, styles: {}, metadata: {}, layerCollections: [collection] });
  stateAPI.setSelection(['group']);
  vm.runInContext("_startLayerRename('group');", context);
  row.input.value = 'Botón principal';
  row.input.listeners.keydown({ key: 'Enter', stopPropagation() {}, preventDefault() {} });
  row.input.listeners.blur();
  assert.equal(stateAPI.getElementById('group').name, 'Botón principal');
  assert.equal(stateAPI.getElementById('group').componentType, 'button');
  assert.equal(stateAPI.getElementById('group').css.className, 'trazuvia-button');
  assert.equal(stateAPI.getState().history.past.length, 1);
  vm.runInContext('undo();', context);
  assert.equal(stateAPI.getElementById('group').name, 'Button');
  vm.runInContext('redo();', context);
  assert.equal(stateAPI.getElementById('group').name, 'Botón principal');
  vm.runInContext("_startLayerRename('group');", context);
  row.input.value = 'Nombre cancelado';
  row.input.listeners.keydown({ key: 'Escape', stopPropagation() {}, preventDefault() {} });
  row.input.listeners.blur();
  assert.equal(stateAPI.getElementById('group').name, 'Botón principal');
  vm.runInContext('deleteSelectedElements();', context);
  assert.deepEqual(Array.from(stateAPI.getState().document.elements, el => el.id), ['other']);
  assert.deepEqual(Array.from(stateAPI.getState().document.layerCollections[0].elementIds), ['other']);
  vm.runInContext('undo();', context);
  assert.equal(stateAPI.getState().document.elements.length, 5);
  assert.equal(stateAPI.getState().document.layerCollections[0].elementIds.length, 5);
  vm.runInContext('redo();', context);
  assert.deepEqual(Array.from(stateAPI.getState().document.elements, el => el.id), ['other']);
  assert.deepEqual(Array.from(stateAPI.getState().document.layerCollections[0].elementIds), ['other']);
  vm.runInContext('undo();', context);
  stateAPI.setSelection(['child']);
  vm.runInContext('deleteSelectedElements();', context);
  assert.equal(stateAPI.getElementById('nested').children.length, 0, 'Eliminar una pieza no deja referencias colgantes');
  assert.equal(stateAPI.getElementById('connection'), null);
  vm.runInContext('undo();', context);
  assert.equal(stateAPI.getElementById('nested').children[0], 'child');

  const app = new EventEmitter();
  Object.assign(app, { setName() {}, getPath: () => '/unused', whenReady: () => Promise.resolve() });
  const ipcMain = new EventEmitter();
  const handlers = new Map();
  ipcMain.handle = (name, handler) => handlers.set(name, handler);
  let win, choice = 'Renombrar', options;
  class BrowserWindow extends EventEmitter {
    constructor() { super(); win = this; this.webContents = { send() {} }; }
    loadFile() {}
  }
  const electron = { app, ipcMain, BrowserWindow, dialog: {}, Menu: {
    setApplicationMenu() {}, buildFromTemplate: template => ({ popup(value) {
      options = value;
      if (choice) template.find(item => item.label === choice).click();
      value.callback();
    } })
  } };
  vm.runInNewContext(fs.readFileSync('electron-main.js', 'utf8'), {
    require: name => name === 'electron' ? electron : name === 'fs' ? { existsSync: () => true } : require(name),
    process: { platform: 'linux' }, __dirname: process.cwd(), console
  });
  await Promise.resolve();
  const showMenu = handlers.get('layer-context-menu');
  assert.equal(await showMenu({ sender: win.webContents }), 'rename');
  assert.equal(options.window, win);
  choice = 'Eliminar';
  assert.equal(await showMenu({ sender: win.webContents }), 'delete');
  choice = null;
  assert.equal(await showMenu({ sender: win.webContents }), null);
  assert.equal(await showMenu({ sender: {} }), null);
  console.log('Capas: menú contextual, renombrado, cancelación, borrado de grupos y conexiones, deshacer y rehacer verificados.');
})().catch(error => { console.error(error); process.exitCode = 1; });

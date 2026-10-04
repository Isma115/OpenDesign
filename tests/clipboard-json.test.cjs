const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

(async () => {
  const app = new EventEmitter();
  Object.assign(app, { setName() {}, getPath: () => '/unused', whenReady: () => Promise.resolve() });
  const handlers = new Map();
  const ipcMain = new EventEmitter();
  ipcMain.handle = (name, handler) => handlers.set(name, handler);
  let win, menu, copied = '', action;
  class BrowserWindow extends EventEmitter {
    constructor() { super(); win = this; this.webContents = { send: (channel, value) => { action = value; } }; }
    loadFile() {}
  }
  const electron = {
    app, BrowserWindow, ipcMain, dialog: {},
    clipboard: { writeText: text => { copied = text; }, readText: () => copied },
    Menu: { buildFromTemplate: template => template, setApplicationMenu: template => { menu = template; } }
  };
  vm.runInNewContext(fs.readFileSync('electron-main.js', 'utf8'), {
    require: name => name === 'electron' ? electron : name === 'fs' ? { existsSync: () => true } : require(name),
    process: { platform: 'linux' }, __dirname: process.cwd(), console
  });
  await Promise.resolve();
  const fileMenu = menu.find(item => item.label === 'Archivo').submenu;
  const extras = menu.find(item => item.label === 'Ver').submenu.find(item => item.label === 'Funciones extra');
  const aiItems = fileMenu.filter(item => ['prompt-json', 'import-clipboard-json', 'image-json'].includes(item.id));
  assert.equal(aiItems.length, 3);
  assert.equal(extras.checked, false);
  assert(aiItems.every(item => item.visible === false), 'Las funciones de IA están ocultas al iniciar');
  extras.click({ checked: true });
  fileMenu.find(item => item.id === 'image-json').click();
  assert.equal(action, 'image-json');
  assert(aiItems.every(item => item.visible === true));
  assert.equal(extras.checked, true);
  extras.click({ checked: false });
  assert(aiItems.every(item => item.visible === false));
  extras.click({ checked: true });
  for (const [label, expected] of [['Exportar JSON...', 'download-json'], ['Importar JSON...', 'open'], ['Prompt JSON', 'prompt-json'], ['Importar JSON del portapapeles', 'import-clipboard-json']]) {
    fileMenu.find(item => item.label === label).click();
    assert.equal(action, expected);
  }
  let api;
  vm.runInNewContext(fs.readFileSync('preload.js', 'utf8'), {
    require: () => ({
      contextBridge: { exposeInMainWorld: (name, value) => { api = value; } },
      ipcRenderer: { invoke: async (name, text) => handlers.get(name)({ sender: win.webContents }, text) }
    })
  });
  const doc = { name: 'Diseño para chat', version: '1.0.0', canvas: { width: 100, height: 100 }, elements: [{ id: 'rect', text: { value: 'Texto con ñ' } }] };
  const state = { document: doc, dirty: true };
  const status = { textContent: '' };
  const alerts = [];
  const storage = fs.readFileSync('app/js/io/storage.js', 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const context = vm.createContext({
    getState: () => state, window: { electronAPI: api }, document: { getElementById: () => status },
    alert: message => alerts.push(message), console: { error() {} }
  });
  vm.runInContext(fs.readFileSync('app/js/io/json-prompt.js', 'utf8').replace(/^export /gm, ''), context);
  vm.runInContext(storage, context);
  assert.equal(await vm.runInContext("copyJSONPrompt('Usa colores verdes y dos columnas');", context), true);
  assert(copied.includes('Usa colores verdes y dos columnas'));
  assert(copied.includes('Devuelve únicamente el documento JSON completo y válido'));
  assert.equal(copied.split('DOCUMENTO JSON ACTUAL\n')[1], JSON.stringify(doc, null, 2));
  assert.equal(state.dirty, true, 'Copiar no marca el documento como guardado');
  assert.equal(status.textContent, 'Prompt JSON copiado al portapapeles');
  assert.equal(alerts.length, 0);
  const previous = copied;
  assert.equal(handlers.get('clipboard-write-text')({ sender: {} }, 'invalid sender').success, false);
  assert.equal(handlers.get('clipboard-write-text')({ sender: win.webContents }, {}).success, false);
  assert.equal(copied, previous);
  assert.equal(await vm.runInContext("copyJSONPrompt('Usa textos legibles', true);", context), true);
  assert(copied.includes('Usa textos legibles'));
  assert(copied.includes('imagen adjunta'));
  assert(!copied.includes(doc.name), 'El prompt para imagen no incluye el diseño abierto');
  const example = JSON.parse(copied.split('EJEMPLO DE FORMATO (no es el diseño a reproducir)\n')[1]);
  assert.equal(example.version, '1.0.0');
  assert.equal(example.elements[0].style.strokeWidth, 0);
  copied = previous;
  context.window.electronAPI = api;
  context.loadDocument = value => { state.document = value; state.filePath = null; };
  context.setDirty = value => { state.dirty = value; };
  context.renderDocument = () => {};
  context.refreshSelection = () => {};
  let acceptReplacement = false;
  context.confirm = () => acceptReplacement;
  const imported = { ...doc, name: 'Rediseño de IA' };
  copied = '```json\n' + JSON.stringify(imported) + '\n```';
  assert.equal(handlers.get('clipboard-read-text')({ sender: {} }).success, false);
  assert.equal(await vm.runInContext('importClipboardJSON();', context), false);
  assert.equal(state.document, doc, 'Cancelar conserva el diseño actual');
  acceptReplacement = true;
  assert.equal(await vm.runInContext('importClipboardJSON();', context), true);
  assert.equal(state.document.name, imported.name);
  assert.equal(state.dirty, true, 'El JSON pegado queda pendiente de guardar');
  assert.equal(state.filePath, null);
  const loaded = state.document;
  for (const invalid of ['', 'texto', '{"version":"1","canvas":{},"elements":[{"id":"a"},{"id":"a"}]}']) {
    copied = invalid;
    assert(!await vm.runInContext('importClipboardJSON();', context));
    assert.equal(state.document, loaded, 'Un JSON inválido conserva el diseño');
  }
  context.window.electronAPI = undefined;
  context.navigator = { clipboard: { readText: async () => JSON.stringify(imported) } };
  assert.equal(await vm.runInContext('importClipboardJSON();', context), true);
  context.navigator.clipboard.readText = async () => { throw Error('Access denied'); };
  assert.equal(await vm.runInContext('importClipboardJSON();', context), false);
  state.document = doc;
  context.window.electronAPI = undefined;
  context.navigator = { clipboard: { writeText: async text => { copied = text; } } };
  assert.equal(await vm.runInContext("copyJSONPrompt('Usa colores verdes y dos columnas');", context), true);
  assert.equal(copied, previous);
  context.navigator.clipboard.writeText = async () => { throw Error('Access denied'); };
  assert.equal(await vm.runInContext("copyJSONPrompt('Usa colores verdes y dos columnas');", context), false);
  assert.equal(await vm.runInContext("copyJSONPrompt('   ');", context), false);
  assert.equal(copied, previous);
  console.log('Prompt e importación JSON: menú, portapapeles, validación, cancelación, bloques Markdown y errores verificados.');
})().catch(error => { console.error(error); process.exitCode = 1; });

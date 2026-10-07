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
  assert(!fileMenu.some(item => ['prompt-json', 'image-json'].includes(item.id)));
  assert(!menu.find(item => item.label === 'Ver').submenu.some(item => item.label === 'Funciones extra'));
  for (const [label, expected] of [['Exportar JSON...', 'download-json'], ['Importar JSON...', 'open'], ['Importar JSON del portapapeles', 'import-clipboard-json']]) {
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
  const doc = { name: 'Diseño de prueba', version: '1.0.0', canvas: { width: 100, height: 100 }, elements: [{ id: 'rect', text: { value: 'Texto con ñ' } }] };
  const state = { document: doc, dirty: true };
  const status = { textContent: '' };
  const alerts = [];
  const storage = fs.readFileSync('app/js/io/storage.js', 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const context = vm.createContext({
    getState: () => state, window: { electronAPI: api }, document: { getElementById: () => status },
    alert: message => alerts.push(message), console: { error() {} }
  });
  vm.runInContext(storage, context);
  assert.equal(api.writeClipboardText, undefined);
  assert.equal(api.editPromptText, undefined);
  assert.equal(handlers.has('clipboard-write-text'), false);
  assert.equal(ipcMain.listenerCount('edit-prompt-text'), 0);
  context.window.electronAPI = api;
  context.loadDocument = value => { state.document = value; state.filePath = null; };
  context.setDirty = value => { state.dirty = value; };
  context.renderDocument = () => {};
  context.refreshSelection = () => {};
  let acceptReplacement = false;
  context.confirm = () => acceptReplacement;
  const imported = { ...doc, name: 'Diseño importado' };
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
  console.log('Importación JSON: menú, portapapeles, validación, cancelación, bloques Markdown y errores verificados.');
})().catch(error => { console.error(error); process.exitCode = 1; });

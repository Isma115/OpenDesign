import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import { getState, loadDocument, setDirty, resetDocument } from '../app/js/core/state.js';

const require = createRequire(import.meta.url);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'trazuvia-files-test-'));
try {
  const firstFile = path.join(directory, 'first.trazuvia.json');
  const secondFile = path.join(directory, 'second.trazuvia.json');
  const exportFile = path.join(directory, 'export.json');
  const handlers = new Map();
  const app = new EventEmitter();
  Object.assign(app, { setName() {}, getPath: () => directory, whenReady: () => Promise.resolve() });
  const ipcMain = new EventEmitter();
  ipcMain.handle = (name, callback) => handlers.set(name, callback);
  let win, saveDialogs = 0;
  let saveResult = { canceled: false, filePath: firstFile };
  let openResult = { canceled: false, filePaths: [firstFile] };
  class BrowserWindow extends EventEmitter {
    constructor() { super(); win = this; this.webContents = { send() {} }; }
    loadFile() {}
  }
  const electron = {
    app, ipcMain, BrowserWindow, clipboard: {},
    Menu: { buildFromTemplate: x => x, setApplicationMenu() {} },
    dialog: {
      showSaveDialog: async () => { saveDialogs++; return saveResult; },
      showOpenDialog: async () => openResult
    }
  };
  vm.runInNewContext(fs.readFileSync('electron-main.js', 'utf8'), {
    require: name => name === 'electron' ? electron : require(name),
    process: { platform: 'linux' }, __dirname: process.cwd(), console
  });
  await Promise.resolve();
  let api;
  vm.runInNewContext(fs.readFileSync('preload.js', 'utf8'), {
    require: () => ({
      contextBridge: { exposeInMainWorld: (name, value) => { api = value; } },
      ipcRenderer: { invoke: async (name, ...args) => handlers.get(name)({ sender: win.webContents }, ...args) }
    })
  });
  const doc = {
    id: 'design', name: 'Mi diseño', version: '1.0.0', canvas: { width: 400, height: 300, grid: { size: 4 } },
    elements: [{ id: 'rectangle', type: 'shape', shape: 'rectangle', x: 10, y: 20, width: 50, height: 40 }],
    styles: {}, metadata: {}
  };
  loadDocument(doc);
  const fields = { 'doc-name': { value: '' }, 'status-info': { textContent: '' } };
  const alerts = [];
  const context = vm.createContext({
    getState, loadDocument, setDirty, renderDocument() {}, refreshSelection() {},
    window: { electronAPI: api }, document: { getElementById: id => fields[id] },
    alert: message => alerts.push(message), localStorage: { setItem() {} }, console
  });
  vm.runInContext(fs.readFileSync('app/js/io/storage.js', 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), context);
  const call = source => vm.runInContext(source, context);
  setDirty(true);
  assert.equal(call('saveToLocal();'), true);
  assert.equal(getState().dirty, true, 'El autoguardado no oculta cambios pendientes del archivo');
  assert.equal(await call('saveDocument();'), true);
  assert.equal(saveDialogs, 1);
  assert.equal(getState().filePath, firstFile);
  assert.equal(getState().dirty, false);
  assert.equal(JSON.parse(fs.readFileSync(firstFile)).name, 'Mi diseño');
  doc.name = 'Diseño actualizado'; setDirty(true);
  assert.equal(await call('saveDocument();'), true);
  assert.equal(saveDialogs, 1, 'Guardar reutiliza la ubicación elegida');
  assert.equal(JSON.parse(fs.readFileSync(firstFile)).name, 'Diseño actualizado');
  saveResult = { canceled: false, filePath: secondFile };
  assert.equal(await call('saveDocument(true);'), true);
  assert.equal(saveDialogs, 2);
  assert.equal(getState().filePath, secondFile);
  saveResult = { canceled: true };
  setDirty(true);
  assert.equal(await call('saveDocument(true);'), false);
  assert.equal(getState().filePath, secondFile);
  assert.equal(getState().dirty, true);
  saveResult = { canceled: false, filePath: exportFile };
  assert.equal(await call('downloadJSON();'), true);
  assert.equal(getState().filePath, secondFile, 'Exportar no cambia la ruta de Guardar');
  assert.equal(getState().dirty, true);
  assert.equal(await call('openJSON();'), true);
  assert.equal(getState().filePath, firstFile);
  assert.equal(getState().document.name, 'Diseño actualizado');
  getState().document.name = 'Cargado y editado'; setDirty(true);
  const count = saveDialogs;
  assert.equal(await call('saveDocument();'), true);
  assert.equal(saveDialogs, count);
  assert.equal(JSON.parse(fs.readFileSync(firstFile)).name, 'Cargado y editado');
  openResult = { canceled: true, filePaths: [] };
  const current = getState().document;
  assert.equal(await call('openJSON();'), false);
  assert.equal(getState().document, current);
  openResult = { canceled: false, filePaths: [path.join(directory, 'missing.json')] };
  assert.equal(await call('openJSON();'), false);
  assert.equal(getState().document, current);
  assert.equal(alerts.length, 1);
  saveResult = { canceled: false, filePath: path.join(directory, 'missing-folder', 'design.json') };
  setDirty(true);
  assert.equal(await call('saveDocument(true);'), false);
  assert.equal(getState().filePath, firstFile);
  assert.equal(getState().dirty, true);
  assert.equal(alerts.length, 2);
  resetDocument();
  assert.equal(getState().filePath, null, 'Nuevo diseño no sobrescribe el anterior');
  assert.equal(fs.readFileSync(firstFile, 'utf8').includes('Cargado y editado'), true);
  assert.equal((await handlers.get('dialog-save-file')({ sender: {} }, '{}')).success, false);
  console.log('Archivos reales: Guardar, Guardar como, Cargar, exportación, cancelaciones y errores verificados.');
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}

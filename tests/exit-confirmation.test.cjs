const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const app = new EventEmitter();
Object.assign(app, { setName() {}, getPath: () => '/unused', whenReady: () => Promise.resolve(), quit: () => app.emit('before-quit', event()) });
app.exit = code => { assert.equal(code, 0); windows[0].destroy(); };
const ipcMain = new EventEmitter();
ipcMain.handle = () => {};
const windows = [];
function event() { return { prevented: false, preventDefault() { this.prevented = true; } }; }
class BrowserWindow extends EventEmitter {
  constructor() { super(); windows.push(this); this.sent = []; this.webContents = { send: message => this.sent.push(message), session: { flushStorageData() {} } }; }
  show() {}
  focus() {}
  loadFile() {}
  close() { const e = event(); this.emit('close', e); if (!e.prevented) this.emit('closed'); }
  destroy() { this.emit('closed'); }
}
const electron = { app, BrowserWindow, ipcMain, Menu: { buildFromTemplate: x => x, setApplicationMenu() {} }, dialog: {} };
vm.runInNewContext(fs.readFileSync('electron-main.js', 'utf8'), {
  require: name => name === 'electron' ? electron : name === 'fs' ? { existsSync: () => true } : require(name),
  __dirname: path.resolve('.'), process: { platform: 'linux' }, console
});

(async () => {
  await Promise.resolve();
  const win = windows[0];
  win.close();
  win.close();
  assert.deepEqual(win.sent, ['confirm-exit']);
  ipcMain.emit('exit-response', { sender: {} }, true);
  assert.equal(windows.length, 1);
  ipcMain.emit('exit-response', { sender: win.webContents }, false);
  win.close();
  assert.equal(win.sent.length, 2);
  const quit = event();
  app.emit('before-quit', quit);
  assert.equal(quit.prevented, true);
  assert.equal(win.sent.length, 2);
  let closed = false;
  win.on('closed', () => { closed = true; });
  ipcMain.emit('exit-response', { sender: win.webContents }, true);
  // La confirmación de Salir permite before-quit sin volver a preguntar.
  const confirmedQuit = event();
  app.emit('before-quit', confirmedQuit);
  assert.equal(confirmedQuit.prevented, false);
  win.close();
  assert.equal(closed, true);

  // Cerrar la ventana en macOS también debe terminar el proceso.
  for (const platform of ['darwin', 'linux', 'win32']) {
    const desktopApp = new EventEmitter();
    let quitCalls = 0;
    let exitCalls = 0;
    let storageFlushed = false;
    let terminated = false;
    let desktopWindow;
    Object.assign(desktopApp, {
      setName() {}, setAppUserModelId() {}, dock: { setIcon() {} },
      getPath: () => '/unused', whenReady: () => Promise.resolve(),
      quit() {
        quitCalls++;
        const beforeQuit = event();
        desktopApp.emit('before-quit', beforeQuit);
        if (beforeQuit.prevented) return;
        // Reproduce el fallo: el cierre normal queda bloqueado con la ventana negra.
        desktopWindow.black = true;
      },
      exit(code) {
        assert.equal(code, 0);
        assert.equal(storageFlushed, true, 'Volcar el almacenamiento antes de terminar');
        exitCalls++;
        desktopWindow.destroy();
        terminated = true;
      }
    });
    const desktopIpc = new EventEmitter();
    desktopIpc.handle = () => {};
    class DesktopWindow extends BrowserWindow {
      constructor() {
        super(); desktopWindow = this; this.destroyed = false;
        this.webContents.session.flushStorageData = () => { storageFlushed = true; };
      }
      destroy() {
        this.destroyed = true;
        this.emit('closed');
        desktopApp.emit('window-all-closed');
      }
      close() {
        const closing = event();
        this.emit('close', closing);
        if (!closing.prevented) {
          this.destroyed = true;
          this.emit('closed');
          desktopApp.emit('window-all-closed');
        }
      }
    }
    vm.runInNewContext(fs.readFileSync('electron-main.js', 'utf8'), {
      require: name => name === 'electron'
        ? { ...electron, app: desktopApp, ipcMain: desktopIpc, BrowserWindow: DesktopWindow }
        : name === 'fs' ? { existsSync: () => true } : require(name),
      __dirname: path.resolve('.'), process: { platform }, console
    });
    await Promise.resolve();
    desktopWindow.close();
    assert.equal(desktopWindow.destroyed, false);
    desktopIpc.emit('exit-response', { sender: desktopWindow.webContents }, false);
    assert.equal(quitCalls, 0);
    assert.equal(exitCalls, 0);
    assert.equal(storageFlushed, false);
    desktopWindow.close();
    desktopIpc.emit('exit-response', { sender: desktopWindow.webContents }, true);
    assert.equal(quitCalls, 0, platform + ': no repetir el cierre normal bloqueado');
    assert.equal(exitCalls, 1, platform + ': confirmar termina el proceso');
    assert.equal(desktopWindow.black, undefined);
    assert.equal(terminated, true, platform + ': el proceso debe terminar');
    assert.deepEqual(desktopWindow.sent, ['confirm-exit', 'confirm-exit']);
  }

  const listeners = {};
  const form = {};
  const dialog = {
    open: false, returnValue: '',
    showModal() { this.open = true; },
    addEventListener: (name, callback) => { listeners[name] = callback; },
    querySelector: () => form
  };
  form.addEventListener = (name, callback) => { listeners[name] = callback; };
  const error = { hidden: true };
  let request, response, saved = true;
  const source = fs.readFileSync('app/js/ui/exit-dialog.js', 'utf8').replace(/^import.*\n/, '').replace('export function', 'function');
  vm.runInNewContext(source + '\ninitExitDialog();', {
    document: { getElementById: id => id === 'exit-dialog' ? dialog : error },
    window: { electronAPI: { onConfirmExit: cb => { request = cb; }, respondToExit: value => { response = value; } } },
    saveToLocal: () => saved
  });
  request();
  assert.equal(dialog.open, true);
  assert.equal(dialog.returnValue, 'cancel');
  listeners.close();
  assert.equal(response, false);
  saved = false;
  const submit = { ...event(), submitter: { value: 'exit' } };
  listeners.submit(submit);
  assert.equal(submit.prevented, true);
  assert.equal(error.hidden, false);
  saved = true;
  const validSubmit = { ...event(), submitter: { value: 'exit' } };
  listeners.submit(validSubmit);
  assert.equal(validSubmit.prevented, false);
  dialog.returnValue = 'exit';
  listeners.close();
  assert.equal(response, true);
  console.log('Salida: cancelación, error de guardado, volcado del almacenamiento y cierre normal bloqueado verificados');
})().catch(error => { console.error(error); process.exitCode = 1; });

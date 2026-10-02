// #region Proceso principal Electron | Backend | ventana principal, menu y handlers IPC
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('Trazuvia');
if (process.platform === 'win32') app.setAppUserModelId('com.trazuvia.designer');

// Copiar el perfil anterior una sola vez mantiene el autoguardado y las preferencias.
const profilePath = app.getPath('userData');
if (!fs.existsSync(profilePath)) {
  for (const legacyName of ['geoflow-designer', 'GeoFlow Designer']) {
    const legacyPath = path.join(app.getPath('appData'), legacyName);
    if (!fs.existsSync(legacyPath)) continue;
    try { fs.cpSync(legacyPath, profilePath, { recursive: true }); }
    catch (error) { console.error('No se pudo migrar el perfil anterior:', error); }
    break;
  }
}

let mainWindow;
let exitConfirmed = false;
let exitPending = false;

function requestExit() {
  if (exitPending) return;
  exitPending = true;
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send('confirm-exit');
}

app.on('before-quit', event => {
  if (exitConfirmed || !mainWindow) return;
  event.preventDefault();
  requestExit();
});

ipcMain.on('exit-response', (event, confirmed) => {
  if (!mainWindow || event.sender !== mainWindow.webContents || !exitPending) return;
  exitPending = false;
  if (confirmed !== true) {
    return;
  }
  exitConfirmed = true;
  app.quit();
});

function createWindow() {
  exitConfirmed = false;
  if (process.platform === 'darwin') app.dock.setIcon(path.join(__dirname, 'app', 'icon.png'));
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Trazuvia',
    show: false,
    fullscreen: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'app', 'icon.png')
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Menu de la aplicación
  const sendAction = action => () => mainWindow.webContents.send('menu-action', action);
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nuevo',
          accelerator: 'CmdOrCtrl+N',
          click: sendAction('new')
        },
        {
          label: 'Abrir JSON...',
          accelerator: 'CmdOrCtrl+O',
          click: sendAction('open')
        },
        {
          label: 'Proyecto de Ejemplo',
          click: sendAction('example-project')
        },
        { type: 'separator' },
        {
          label: 'Guardar',
          accelerator: 'CmdOrCtrl+S',
          click: sendAction('save')
        },
        {
          label: 'Descargar JSON',
          click: sendAction('download-json')
        },
        ...(process.platform !== 'darwin' ? [
          { type: 'separator' },
          { role: 'quit' }
        ] : [])
      ]
    },
    {
      label: 'Exportar',
      submenu: [
        { label: 'HTML', click: sendAction('export-html') },
        { label: 'SVG', click: sendAction('export-svg') },
        { label: 'PNG', click: sendAction('export-png') }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', accelerator: 'CmdOrCtrl+Z', click: sendAction('undo') },
        { label: 'Rehacer', accelerator: 'CmdOrCtrl+Shift+Z', click: sendAction('redo') },
        { type: 'separator' },
        { label: 'Cortar', accelerator: 'CmdOrCtrl+X', click: sendAction('cut') },
        { label: 'Copiar', accelerator: 'CmdOrCtrl+C', click: sendAction('copy') },
        { label: 'Pegar', accelerator: 'CmdOrCtrl+V', click: sendAction('paste') },
        { label: 'Duplicar', accelerator: 'CmdOrCtrl+D', click: sendAction('duplicate') },
        { label: 'Eliminar', accelerator: 'Delete', click: sendAction('delete') },
        { type: 'separator' },
        { label: 'Seleccionar todo', accelerator: 'CmdOrCtrl+A', click: sendAction('select-all') }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Cuadrícula', click: sendAction('toggle-grid') },
        { label: 'Ajustar a cuadrícula', click: sendAction('toggle-snap') },
        { label: 'Guías', click: sendAction('toggle-guides') },
        { type: 'separator' },
        { label: 'Modo oscuro', click: sendAction('toggle-theme') },
        { type: 'separator' },
        { label: 'Zoom 50%', click: sendAction('zoom-50') },
        { label: 'Zoom 100%', click: sendAction('zoom-100') },
        { label: 'Zoom 200%', click: sendAction('zoom-200') },
        { label: 'Ajustar al contenido', click: sendAction('zoom-fit') },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('close', event => {
    if (exitConfirmed) return;
    event.preventDefault();
    requestExit();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    exitPending = false;
  });
}

// Handlers para diálogos de archivo
ipcMain.handle('dialog-open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'Trazuvia Files', extensions: ['json', 'trazuvia.json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false };
  }

  try {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('dialog-save-file', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Trazuvia Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: 'design.trazuvia.json'
  });

  if (result.canceled) {
    return { success: false };
  }

  try {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
// #endregion

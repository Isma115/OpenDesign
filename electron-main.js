// #region Proceso principal Electron | Backend | ventana principal, menu y handlers IPC
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'GeoFlow Designer',
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
    {
      label: 'Organizar',
      submenu: [
        { label: 'Traer al frente', click: sendAction('bring-front') },
        { label: 'Enviar al fondo', click: sendAction('send-back') },
        { label: 'Adelantar', click: sendAction('bring-forward') },
        { label: 'Atrasar', click: sendAction('send-backward') },
        { type: 'separator' },
        { label: 'Alinear izquierda', click: sendAction('align-left') },
        { label: 'Alinear centro', click: sendAction('align-center') },
        { label: 'Alinear derecha', click: sendAction('align-right') },
        { type: 'separator' },
        { label: 'Distribuir horizontal', click: sendAction('distribute-h') },
        { label: 'Distribuir vertical', click: sendAction('distribute-v') },
        { type: 'separator' },
        { label: 'Agrupar', accelerator: 'CmdOrCtrl+G', click: sendAction('group') },
        { label: 'Desagrupar', accelerator: 'CmdOrCtrl+Shift+G', click: sendAction('ungroup') }
      ]
    },
    { role: 'windowMenu', label: 'Ventana' },
    {
      label: 'Desarrollo',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de GeoFlow Designer',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'GeoFlow Designer',
              message: 'GeoFlow Designer v1.0.0',
              detail: 'Aplicación de escritorio para diseño de interfaces y diagramas de flujo.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handlers para diálogos de archivo
ipcMain.handle('dialog-open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'GeoFlow Files', extensions: ['json', 'geoflow.json'] },
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
      { name: 'GeoFlow Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: 'design.geoflow.json'
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

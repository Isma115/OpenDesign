// #region Puente de Electron | Backend | APIs seguras expuestas al renderer
const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Escuchar acciones del menú
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },
  onConfirmExit: (callback) => ipcRenderer.on('confirm-exit', () => callback()),
  respondToExit: (confirmed) => ipcRenderer.send('exit-response', confirmed),
  
  // Diálogos de archivo
  openFile: () => ipcRenderer.invoke('dialog-open-file'),
  saveFile: (content, options = {}) => ipcRenderer.invoke('dialog-save-file', content, options),
  readClipboardText: () => ipcRenderer.invoke('clipboard-read-text'),
  showLayerContextMenu: () => ipcRenderer.invoke('layer-context-menu'),
  
  // Información de la aplicación
  getAppVersion: () => '1.0.0',
  getPlatform: () => process.platform
});
// #endregion

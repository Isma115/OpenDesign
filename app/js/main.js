import { getState, subscribe } from './state.js';
import { initRenderer, renderDocument, applyViewport } from './renderer.js';
import { initSelection, refreshSelection } from './selection.js';
import { initTools } from './tools.js';
import { initKeyboard, updateToolUI } from './keyboard.js';
import { initUI, refreshPropertiesPanel } from './ui.js';
import { loadFromLocal, initAutoSave } from './storage.js';
import { initTheme, getTheme, updateCanvasTheme } from './theme.js';

function main() {
  initTheme();
  initRenderer();
  initSelection();
  initTools();
  initKeyboard();
  initUI();

  const state = getState();
  const loaded = loadFromLocal();
  if (!loaded) {
    renderDocument(state.document);
  }

  applyViewport(state.viewport);
  updateToolUI();

  // Re-aplicar tema después de renderizar
  const currentTheme = getTheme();
  updateCanvasTheme(currentTheme);

  subscribe(() => {
    refreshPropertiesPanel();
    _updateStatusBar();
  });

  initAutoSave();

  const canvas = document.getElementById('canvas');
  if (canvas) {
    canvas.setAttribute('class', 'tool-select');
  }

  _updateStatusBar();

  // Integración con Electron
  if (window.electronAPI) {
    window.electronAPI.onMenuAction((action) => {
      _handleElectronMenuAction(action);
    });
  }
}

function _handleElectronMenuAction(action) {
  switch (action) {
    case 'new':
      if (confirm('Crear nuevo proyecto? Se perderan cambios no guardados.')) {
        const { resetDocument } = require('./state.js');
        resetDocument();
        renderDocument(getState().document);
        refreshSelection();
        const nameInput = document.getElementById('doc-name');
        if (nameInput) nameInput.value = 'Nuevo diseno';
      }
      break;
    case 'open':
      import('./storage.js').then(m => m.openJSON());
      break;
    case 'save':
      import('./storage.js').then(m => m.saveToLocal());
      break;
    case 'download-json':
      import('./storage.js').then(m => m.downloadJSON());
      break;
    case 'export-svg':
      import('./export.js').then(m => m.exportAsSVG());
      break;
    case 'export-png':
      import('./export.js').then(m => m.exportAsPNG());
      break;
  }
}

function _updateStatusBar() {
  const state = getState();
  const statusInfo = document.getElementById('status-info');
  const statusSaved = document.getElementById('status-saved');
  if (statusInfo) {
    const count = state.selectedElementIds.length;
    const total = state.document.elements.length;
    statusInfo.textContent = count > 0
      ? `${count} seleccionado(s) / ${total} elementos`
      : `${total} elementos`;
  }
  if (statusSaved) {
    statusSaved.textContent = state.dirty ? 'Sin guardar' : 'Guardado';
  }
  const nameInput = document.getElementById('doc-name');
  if (nameInput && nameInput.value !== state.document.name) {
    nameInput.value = state.document.name || 'Sin nombre';
  }
}

main();

// #region Inicializacion de la aplicacion | Funcionalidad | arranque y configuracion inicial
import { getState, subscribe } from './core/state.js';
import { initRenderer, renderDocument, applyViewport } from './editor/renderer.js';
import { initSelection } from './editor/selection.js';
import { initTools } from './editor/tools.js';
import { initKeyboard, updateToolUI } from './editor/keyboard.js';
import { initUI, refreshPropertiesPanel, handleMenuAction } from './ui/ui.js';
import { loadFromLocal, initAutoSave } from './io/storage.js';
import { initTheme, getTheme, updateCanvasTheme } from './ui/theme.js';
import { migrateLegacyStorage } from './io/legacy-storage.js';
import { initExitDialog } from './ui/exit-dialog.js';

function main() {
  migrateLegacyStorage();
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
    updateToolUI();
  });

  initAutoSave();

  const canvas = document.getElementById('canvas');
  if (canvas) {
    canvas.setAttribute('class', 'tool-select');
  }

  _updateStatusBar();

  // Integración con Electron
  if (window.electronAPI) {
    initExitDialog();
    window.electronAPI.onMenuAction(action => {
      if (!document.getElementById('exit-dialog').open) handleMenuAction(action);
    });
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
// #endregion

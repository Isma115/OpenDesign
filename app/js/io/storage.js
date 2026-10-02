// #region Persistencia local | Funcionalidad | guardado y carga de documentos
import { getState, loadDocument, setDirty, updateDocument } from '../core/state.js';
import { renderDocument } from '../editor/renderer.js';
import { refreshSelection } from '../editor/selection.js';

const STORAGE_KEY = 'trazuvia_autosave';

export function saveToLocal() {
  const state = getState();
  try {
    const json = JSON.stringify(state.document);
    localStorage.setItem(STORAGE_KEY, json);
    setDirty(false);
    return true;
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    return false;
  }
}

export function loadFromLocal() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return false;
    const doc = JSON.parse(json);
    if (_validateDocument(doc)) {
      loadDocument(doc);
      renderDocument(doc);
      refreshSelection();
      setDirty(false);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error loading from localStorage:', e);
    return false;
  }
}

export function downloadJSON() {
  const state = getState();
  const json = JSON.stringify(state.document, null, 2);
  
  // Si estamos en Electron, usar diálogo nativo
  if (window.electronAPI) {
    window.electronAPI.saveFile(json).then(result => {
      if (result.success) {
        setDirty(false);
      }
    });
    return;
  }
  
  // Fallback para navegador
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const name = state.document.name || 'design';
  a.download = `${name}.trazuvia.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openJSON() {
  // Si estamos en Electron, usar diálogo nativo
  if (window.electronAPI) {
    window.electronAPI.openFile().then(result => {
      if (result.success && result.content) {
        handleFileContent(result.content);
      }
    });
    return;
  }
  
  // Fallback para navegador
  const input = document.getElementById('file-input');
  input.click();
}

export function handleFileImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    handleFileContent(e.target.result);
  };
  reader.readAsText(file);
}

function handleFileContent(content) {
  try {
    const doc = JSON.parse(content);
    if (!_validateDocument(doc)) {
      alert('Archivo JSON invalido. Verifica que sea un archivo Trazuvia valido.');
      return;
    }
    loadDocument(doc);
    renderDocument(doc);
    refreshSelection();
    setDirty(false);
    const nameInput = document.getElementById('doc-name');
    if (nameInput) nameInput.value = doc.name || 'Sin nombre';
  } catch (err) {
    alert('Error al leer el archivo: ' + err.message);
  }
}

function _validateDocument(doc) {
  if (!doc) return false;
  if (!doc.version) return false;
  if (!Array.isArray(doc.elements)) return false;
  if (!doc.canvas) return false;
  const ids = new Set();
  for (const el of doc.elements) {
    if (!el.id) return false;
    if (ids.has(el.id)) return false;
    ids.add(el.id);
  }
  return true;
}

export function initAutoSave() {
  setInterval(() => {
    const state = getState();
    if (state.dirty) {
      saveToLocal();
    }
  }, 30000);
}
// #endregion

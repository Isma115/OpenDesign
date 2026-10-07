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

export async function saveDocument(saveAs = false) {
  if (!window.electronAPI) return downloadJSON();
  const state = getState();
  const doc = state.document;
  const json = JSON.stringify(doc, null, 2);
  try {
    const result = await window.electronAPI.saveFile(json, {
      filePath: state.filePath, saveAs,
      suggestedName: `${(doc.name || 'design').replace(/[\\/<>:"|?*]/g, '-')}.trazuvia.json`
    });
    if (!result.success) {
      if (result.error) alert('No se pudo guardar el diseño: ' + result.error);
      return false;
    }
    if (getState().document === doc) {
      state.filePath = result.filePath;
      if (JSON.stringify(doc, null, 2) === json) setDirty(false);
      const status = document.getElementById('status-info');
      if (status) status.textContent = `Guardado en ${result.filePath}`;
    }
    return true;
  } catch (error) {
    alert('No se pudo guardar el diseño: ' + error.message);
    return false;
  }
}

export async function downloadJSON() {
  const state = getState();
  const json = JSON.stringify(state.document, null, 2);
  
  // Si estamos en Electron, usar diálogo nativo
  if (window.electronAPI) {
    try {
      const result = await window.electronAPI.saveFile(json, { saveAs: true,
        suggestedName: `${(state.document.name || 'design').replace(/[\\/<>:"|?*]/g, '-')}.trazuvia.json` });
      if (result.error) alert('No se pudo exportar el JSON: ' + result.error);
      return result.success;
    } catch (error) {
      alert('No se pudo exportar el JSON: ' + error.message);
      return false;
    }
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
  return true;
}

export async function importClipboardJSON() {
  try {
    let text;
    if (window.electronAPI) {
      const result = await window.electronAPI.readClipboardText();
      if (!result.success) throw new Error('No se pudo acceder al portapapeles');
      text = result.text;
    } else {
      text = await navigator.clipboard.readText();
    }
    const content = text.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i, '$1');
    if (!content) {
      alert('El portapapeles está vacío. Copia primero el JSON del diseño.');
      return false;
    }
    return handleFileContent(content, null, true);
  } catch (error) {
    alert('No se pudo importar el JSON del portapapeles: ' + error.message);
    return false;
  }
}

export async function openJSON() {
  // Si estamos en Electron, usar diálogo nativo
  if (window.electronAPI) {
    try {
      const result = await window.electronAPI.openFile();
      if (result.success && result.content) {
        return handleFileContent(result.content, result.filePath);
      }
      if (result.error) alert('No se pudo cargar el diseño: ' + result.error);
      return false;
    } catch (error) {
      alert('No se pudo cargar el diseño: ' + error.message);
      return false;
    }
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

function handleFileContent(content, filePath = null, fromClipboard = false) {
  try {
    const doc = JSON.parse(content);
    if (!_validateDocument(doc)) {
      alert('Archivo JSON invalido. Verifica que sea un archivo Trazuvia valido.');
      return;
    }
    if (fromClipboard && getState().dirty && !confirm('Hay cambios sin guardar. ¿Reemplazar el diseño con el JSON del portapapeles?')) {
      return false;
    }
    loadDocument(doc);
    getState().filePath = filePath;
    renderDocument(doc);
    refreshSelection();
    setDirty(fromClipboard);
    const nameInput = document.getElementById('doc-name');
    if (nameInput) nameInput.value = doc.name || 'Sin nombre';
    const status = document.getElementById('status-info');
    if (status) status.textContent = filePath ? `Cargado desde ${filePath}` : 'Diseño importado';
    return true;
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

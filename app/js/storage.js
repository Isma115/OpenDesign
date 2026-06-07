import { getState, loadDocument, setDirty, updateDocument } from './state.js';
import { renderDocument } from './renderer.js';
import { refreshSelection } from './selection.js';

const STORAGE_KEY = 'geoflow_autosave';

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
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const name = state.document.name || 'design';
  a.download = `${name}.geoflow.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openJSON() {
  const input = document.getElementById('file-input');
  input.click();
}

export function handleFileImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const doc = JSON.parse(e.target.result);
      if (!_validateDocument(doc)) {
        alert('Archivo JSON invalido. Verifica que sea un archivo GeoFlow valido.');
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
  };
  reader.readAsText(file);
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

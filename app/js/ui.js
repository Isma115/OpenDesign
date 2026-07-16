// #region Interfaz de usuario | Funcionalidad | inicializacion y gestion de la UI
import { getState, updateElement, updateDocument, setSelection, clearSelection, getElementById, getSelectedElements, setActiveTool, addElement, removeElement, resetDocument } from './state.js';
import { renderDocument, applyViewport } from './renderer.js';
import { refreshSelection } from './selection.js';
import { commitAction, snapshotElements } from './history.js';
import { downloadJSON, openJSON, handleFileImport, saveToLocal } from './storage.js';
import { exportAsHTML, exportAsSVG, exportAsPNG } from './export.js';
import { getShapeDisplayName, createGroup, createImage } from './shapes.js';
import { zoomBy, setZoom, updateToolUI } from './keyboard.js';
import { getElementBounds, getMultiSelectionBounds, screenToCanvas } from './geometry.js';
import { updateConnectorPath, updateAllConnectorsForElement } from './connectors.js';
import { createComponentGroup, getPendingChildren } from './components.js';
import { toggleTheme } from './theme.js';
import { copySelectedElements, pasteClipboardElements } from './clipboard.js';
import {
  getCssClassForElement,
  getSpecificCssForElement
} from './css-template.js';

let _rotationInputSnapshot = null;
let _rotationInputElementId = null;
let _specificCssInputSnapshot = null;
let _elementPropertyInputSnapshot = null;
let _elementPropertyInputKey = null;

export function initUI() {
  _initMenuBars();
  _initPanelTabs();
  _initPropertyInputs();
  _initTopbarActions();
  _initFileInput();
  _initComponentDrag();
  _initDocName();
  _updatePropertiesPanel();
}

function _initMenuBars() {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    const trigger = item.querySelector('.menu-trigger');
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = item.classList.contains('open');
      menuItems.forEach(m => m.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
  document.addEventListener('click', () => {
    menuItems.forEach(m => m.classList.remove('open'));
  });
  document.querySelectorAll('.menu-dropdown button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      _handleAction(btn.dataset.action);
      menuItems.forEach(m => m.classList.remove('open'));
    });
  });
}

function _initPanelTabs() {
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => {
        tc.classList.remove('active');
        tc.style.display = 'none';
      });
      tab.classList.add('active');
      const content = document.getElementById('tab-' + tab.dataset.tab);
      if (content) {
        content.classList.add('active');
        content.style.display = 'block';
      }
      if (tab.dataset.tab === 'layers') _updateLayersPanel();
    });
  });
}

function _initPropertyInputs() {
  const bind = (id, handler, options = {}) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => handler(true));
      if (options.live || el.type === 'range' || el.type === 'color') {
        el.addEventListener('input', () => handler(false));
      }
    }
  };

  bind('prop-x', (commit) => _updatePropFromInput('x', parseFloat, commit), { live: true });
  bind('prop-y', (commit) => _updatePropFromInput('y', parseFloat, commit), { live: true });
  bind('prop-w', (commit) => _updatePropFromInput('width', v => Math.max(10, parseFloat(v)), commit), { live: true });
  bind('prop-h', (commit) => _updatePropFromInput('height', v => Math.max(10, parseFloat(v)), commit), { live: true });
  bind('prop-layer', (commit) => _updateLayerFromInput('prop-layer', commit), { live: true });
  const rotationInput = document.getElementById('prop-rotation');
  if (rotationInput) {
    rotationInput.addEventListener('input', () => _updateRotationFromInput(false));
    rotationInput.addEventListener('change', () => _updateRotationFromInput(true));
  }
  bind('prop-fill', (commit) => _updateStyleFromInput('fill', 'prop-fill', commit), { live: true });
  bind('prop-stroke', (commit) => _updateStyleFromInput('stroke', 'prop-stroke', commit), { live: true });
  bind('prop-stroke-width', (commit) => _updateStyleFromInput('strokeWidth', 'prop-stroke-width', commit), { live: true });
  bind('prop-opacity', (commit) => {
    const val = document.getElementById('prop-opacity').value;
    const label = document.getElementById('prop-opacity-val');
    if (label) label.textContent = Math.round(val * 100) + '%';
    _updateStyleFromInput('opacity', 'prop-opacity', commit);
  });
  bind('prop-dash', (commit) => _updateStyleFromInput('dashArray', 'prop-dash', commit));
  bind('prop-text', (commit) => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el) return;
    _beginElementPropertyInput(el.id, 'text.value');
    updateElement(el.id, { text: { ...el.text, value: document.getElementById('prop-text').value } });
    renderDocument(state.document);
    refreshSelection();
    _commitElementPropertyInput(commit);
  }, { live: true });
  bind('prop-font-family', (commit) => _updateTextFromInput('fontFamily', 'prop-font-family', commit));
  bind('prop-font-size', (commit) => _updateTextFromInput('fontSize', 'prop-font-size', commit), { live: true });
  bind('prop-text-color', (commit) => _updateTextFromInput('color', 'prop-text-color', commit), { live: true });
  bind('prop-text-align', (commit) => _updateTextFromInput('align', 'prop-text-align', commit));
  bind('prop-font-weight', (commit) => _updateTextFromInput('fontWeight', 'prop-font-weight', commit));
  const cssNameInput = document.getElementById('prop-css-class');
  if (cssNameInput) {
    cssNameInput.addEventListener('input', () => _updateSpecificCssNameFromInput(false));
    cssNameInput.addEventListener('change', () => _updateSpecificCssNameFromInput(true));
  }
  const cssRulesInput = document.getElementById('prop-component-css');
  if (cssRulesInput) {
    cssRulesInput.addEventListener('input', () => _updateSpecificCssRulesFromInput(false));
    cssRulesInput.addEventListener('change', () => _updateSpecificCssRulesFromInput(true));
  }

  bind('prop-canvas-width', () => {
    const val = parseInt(document.getElementById('prop-canvas-width').value);
    if (val > 0) {
      updateDocument(doc => { doc.canvas.width = val; });
      renderDocument(getState().document);
    }
  });
  bind('prop-canvas-height', () => {
    const val = parseInt(document.getElementById('prop-canvas-height').value);
    if (val > 0) {
      updateDocument(doc => { doc.canvas.height = val; });
      renderDocument(getState().document);
    }
  });
  bind('prop-canvas-bg', () => {
    const val = document.getElementById('prop-canvas-bg').value;
    updateDocument(doc => { doc.canvas.background = val; });
    renderDocument(getState().document);
  });
  bind('prop-grid-size', () => {
    const val = parseInt(document.getElementById('prop-grid-size').value);
    if (val > 0) {
      updateDocument(doc => { doc.canvas.grid.size = val; });
      renderDocument(getState().document);
    }
  });

  bind('prop-connector-type', () => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el || el.type !== 'connector') return;
    const before = snapshotElements();
    el.connectorType = document.getElementById('prop-connector-type').value;
    updateConnectorPath(el.id);
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    renderDocument(state.document);
    refreshSelection();
  });
  bind('prop-conn-stroke', (commit) => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el || el.type !== 'connector') return;
    _beginElementPropertyInput(el.id, 'connector.stroke');
    el.style.stroke = document.getElementById('prop-conn-stroke').value;
    renderDocument(state.document);
    refreshSelection();
    _commitElementPropertyInput(commit);
  }, { live: true });
  bind('prop-conn-stroke-width', (commit) => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el || el.type !== 'connector') return;
    _beginElementPropertyInput(el.id, 'connector.strokeWidth');
    el.style.strokeWidth = parseFloat(document.getElementById('prop-conn-stroke-width').value);
    renderDocument(state.document);
    refreshSelection();
    _commitElementPropertyInput(commit);
  }, { live: true });
  bind('prop-conn-end-marker', () => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el || el.type !== 'connector') return;
    const before = snapshotElements();
    el.style.endMarker = document.getElementById('prop-conn-end-marker').value || null;
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    renderDocument(state.document);
    refreshSelection();
  });
  bind('prop-conn-dash', () => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el || el.type !== 'connector') return;
    const before = snapshotElements();
    el.style.dashArray = document.getElementById('prop-conn-dash').value;
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    renderDocument(state.document);
    refreshSelection();
  });
  bind('prop-conn-layer', (commit) => _updateLayerFromInput('prop-conn-layer', commit), { live: true });
  bind('prop-conn-label', (commit) => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el || el.type !== 'connector') return;
    _beginElementPropertyInput(el.id, 'connector.label');
    el.label.value = document.getElementById('prop-conn-label').value;
    renderDocument(state.document);
    refreshSelection();
    _commitElementPropertyInput(commit);
  }, { live: true });

  document.querySelectorAll('.prop-actions button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => _handleAction(btn.dataset.action));
  });
}

function _initTopbarActions() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnTheme = document.getElementById('btn-theme');

  if (btnUndo) btnUndo.addEventListener('click', () => _handleAction('undo'));
  if (btnRedo) btnRedo.addEventListener('click', () => _handleAction('redo'));
  if (btnZoomIn) btnZoomIn.addEventListener('click', () => zoomBy(0.1));
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => zoomBy(-0.1));
  if (btnTheme) btnTheme.addEventListener('click', () => toggleTheme());
}

function _initFileInput() {
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileImport(e.target.files[0]);
        e.target.value = '';
      }
    });
  }
}

function _initComponentDrag() {
  document.querySelectorAll('.component-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.dataset.component);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  const wrapper = document.getElementById('canvas-wrapper');
  if (wrapper) {
    wrapper.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.dataTransfer.types.includes('Files') ? 'copy' : 'copy';
    });
    wrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        _handleFileDrop(files, e);
        return;
      }
      const compType = e.dataTransfer.getData('text/plain');
      if (!compType) return;
      const state = getState();
      const point = screenToCanvas(e.clientX, e.clientY, state.viewport);
      _dropComponent(compType, point.x, point.y);
    });
  }
}

function _initDocName() {
  const nameInput = document.getElementById('doc-name');
  if (nameInput) {
    nameInput.addEventListener('change', () => {
      updateDocument(doc => { doc.name = nameInput.value; });
    });
  }
}

const ACCEPTED_IMAGE_TYPES = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
  'image/svg+xml', 'image/bmp', 'image/tiff', 'image/avif'
];

function _handleFileDrop(files, e) {
  const state = getState();
  const point = screenToCanvas(e.clientX, e.clientY, state.viewport);

  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) continue;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        const maxDim = 600;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const before = snapshotElements();
        const el = createImage(point.x - w / 2, point.y - h / 2, w, h, dataUrl);
        addElement(el);
        setSelection([el.id]);
        const after = snapshotElements();
        commitAction({ type: 'snapshot', before, after });
        renderDocument(getState().document);
        refreshSelection();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }
}

function _handleAction(action) {
  const state = getState();
  switch (action) {
    case 'new':
      if (state.dirty && !confirm('Hay cambios sin guardar. Crear nuevo proyecto?')) break;
      resetDocument();
      renderDocument(getState().document);
      refreshSelection();
      const nameInputNew = document.getElementById('doc-name');
      if (nameInputNew) nameInputNew.value = 'Nuevo diseno';
      break;
    case 'open':
      if (state.dirty && !confirm('Hay cambios sin guardar. Abrir otro proyecto?')) break;
      openJSON();
      break;
    case 'save':
      if (!state.dirty) break;
      if (!confirm('Guardar cambios?')) break;
      saveToLocal();
      _updateStatusSaved();
      break;
    case 'download-json': downloadJSON(); break;
    case 'export-html': exportAsHTML(); break;
    case 'export-svg': exportAsSVG(); break;
    case 'export-png': exportAsPNG(); break;
    case 'undo': import('./history.js').then(m => m.undo()); break;
    case 'redo': import('./history.js').then(m => m.redo()); break;
    case 'cut': document.execCommand('cut'); break;
    case 'copy': _handleCopy(); break;
    case 'paste': _handlePaste(); break;
    case 'duplicate': _handleDuplicate(); break;
    case 'delete': _handleDelete(); break;
    case 'select-all': {
      const ids = state.document.elements.filter(e => e.visible && !e.locked).map(e => e.id);
      setSelection(ids);
      refreshSelection();
      break;
    }
    case 'toggle-grid':
      updateDocument(doc => { doc.canvas.grid.enabled = !doc.canvas.grid.enabled; });
      renderDocument(state.document);
      break;
    case 'toggle-snap':
      state.snapping.snapToGrid = !state.snapping.snapToGrid;
      break;
    case 'toggle-guides': break;
    case 'toggle-theme': toggleTheme(); break;
    case 'zoom-50': setZoom(0.5); applyViewport(state.viewport); break;
    case 'zoom-100': setZoom(1); applyViewport(state.viewport); break;
    case 'zoom-200': setZoom(2); applyViewport(state.viewport); break;
    case 'zoom-fit': _zoomToFit(); break;
    case 'bring-front': _changeZIndex('front'); break;
    case 'send-back': _changeZIndex('back'); break;
    case 'bring-forward': _changeZIndex('forward'); break;
    case 'send-backward': _changeZIndex('backward'); break;
    case 'align-left': _alignElements('left'); break;
    case 'align-center': _alignElements('center'); break;
    case 'align-right': _alignElements('right'); break;
    case 'distribute-h': _distributeElements('h'); break;
    case 'distribute-v': _distributeElements('v'); break;
    case 'group': _groupSelected(); break;
    case 'ungroup': _ungroupSelected(); break;
    case 'toggle-lock': _toggleLock(); break;
  }
}

function _handleCopy() {
  copySelectedElements();
}

function _handlePaste() {
  pasteClipboardElements();
}

function _handleDuplicate() {
  _handleCopy();
  _handlePaste();
}

function _handleDelete() {
  const state = getState();
  if (state.selectedElementIds.length === 0) return;
  const before = snapshotElements();
  const ids = [...state.selectedElementIds];
  for (const id of ids) {
    removeElement(id);
  }
  clearSelection();
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _updatePropFromInput(prop, parser, commit = true) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const inputId = { x: 'prop-x', y: 'prop-y', width: 'prop-w', height: 'prop-h', rotation: 'prop-rotation' }[prop];
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = parser(input.value);
  if (isNaN(val)) return;
  _beginElementPropertyInput(el.id, prop);
  updateElement(el.id, { [prop]: val });
  renderDocument(state.document);
  refreshSelection();
  updateAllConns(el.id);
  _commitElementPropertyInput(commit);
}

function _updateRotationFromInput(commit) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const input = document.getElementById('prop-rotation');
  if (!input) return;
  const val = parseFloat(input.value);
  if (isNaN(val)) return;

  const label = document.getElementById('prop-rotation-val');
  if (label) label.innerHTML = val + '&deg;';

  if (!_rotationInputSnapshot || _rotationInputElementId !== el.id) {
    _rotationInputSnapshot = snapshotElements();
    _rotationInputElementId = el.id;
  }

  updateElement(el.id, { rotation: val });
  renderDocument(state.document);
  refreshSelection();
  updateAllConns(el.id);

  if (!commit) return;

  const before = _rotationInputSnapshot;
  const after = snapshotElements();
  _rotationInputSnapshot = null;
  _rotationInputElementId = null;

  if (!_snapshotsEqual(before, after)) {
    commitAction({ type: 'snapshot', before, after });
  }
}

function _snapshotsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function _updateStyleFromInput(prop, inputId, commit = true) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = typeof input.value === 'string' && input.type !== 'range' && input.type !== 'number'
    ? input.value
    : parseFloat(input.value);
  _beginElementPropertyInput(el.id, `style.${prop}`);
  updateElement(el.id, { style: { ...el.style, [prop]: val } });
  _updateGroupSurfaceStyle(el, prop, val);
  renderDocument(state.document);
  refreshSelection();
  _commitElementPropertyInput(commit);
}

function _updateTextFromInput(prop, inputId, commit = true) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const input = document.getElementById(inputId);
  if (!input) return;
  const numericTextProps = new Set(['fontSize', 'fontWeight']);
  const val = numericTextProps.has(prop) ? parseFloat(input.value) : input.value;
  if (numericTextProps.has(prop) && isNaN(val)) return;
  _beginElementPropertyInput(el.id, `text.${prop}`);
  updateElement(el.id, { text: { ...el.text, [prop]: val } });
  renderDocument(state.document);
  refreshSelection();
  _commitElementPropertyInput(commit);
}

function _updateLayerFromInput(inputId, commit = true) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const input = document.getElementById(inputId);
  if (!input) return;
  const layer = parseInt(input.value, 10);
  if (isNaN(layer)) return;
  _beginElementPropertyInput(el.id, 'zIndex');
  _setElementLayer(el, layer);
  renderDocument(state.document);
  refreshSelection();
  _updateLayersPanel();
  _commitElementPropertyInput(commit);
}

function _beginElementPropertyInput(elementId, prop) {
  const key = `${elementId}:${prop}`;
  if (_elementPropertyInputSnapshot && _elementPropertyInputKey === key) return;
  _elementPropertyInputSnapshot = snapshotElements();
  _elementPropertyInputKey = key;
}

function _commitElementPropertyInput(commit) {
  if (!commit || !_elementPropertyInputSnapshot) return;
  const before = _elementPropertyInputSnapshot;
  const after = snapshotElements();
  _elementPropertyInputSnapshot = null;
  _elementPropertyInputKey = null;
  if (!_snapshotsEqual(before, after)) {
    commitAction({ type: 'snapshot', before, after });
  }
}

function updateAllConns(elementId) {
  updateAllConnectorsForElement(elementId);
}

function _updatePropertiesPanel() {
  const state = getState();
  const propCanvas = document.getElementById('properties-canvas');
  const propShape = document.getElementById('properties-shape');
  const propConnector = document.getElementById('properties-connector');
  const propEmpty = document.getElementById('properties-empty');

  if (propCanvas) propCanvas.style.display = 'none';
  if (propShape) propShape.style.display = 'none';
  if (propConnector) propConnector.style.display = 'none';
  if (propEmpty) propEmpty.style.display = 'none';

  if (state.selectedElementIds.length === 0) {
    if (propCanvas) propCanvas.style.display = 'block';
    _fillCanvasProps();
  } else if (state.selectedElementIds.length === 1) {
    const el = getElementById(state.selectedElementIds[0]);
    if (!el) {
      if (propEmpty) propEmpty.style.display = 'block';
      return;
    }
    if (el.type === 'connector') {
      if (propConnector) propConnector.style.display = 'block';
      _fillConnectorProps(el);
    } else {
      if (propShape) propShape.style.display = 'block';
      _fillShapeProps(el);
    }
  } else {
    if (propEmpty) propEmpty.style.display = 'block';
  }
}

function _fillCanvasProps() {
  const state = getState();
  const doc = state.document;
  _setVal('prop-canvas-width', doc.canvas.width);
  _setVal('prop-canvas-height', doc.canvas.height);
  _setVal('prop-canvas-bg', doc.canvas.background);
  _setVal('prop-grid-size', doc.canvas.grid.size);
}

function _fillShapeProps(el) {
  _setVal('prop-x', Math.round(el.x || 0));
  _setVal('prop-y', Math.round(el.y || 0));
  _setVal('prop-w', Math.round(el.width || 0));
  _setVal('prop-h', Math.round(el.height || 0));
  _setVal('prop-layer', el.zIndex || 0);
  _setVal('prop-rotation', el.rotation || 0);
  const rotLabel = document.getElementById('prop-rotation-val');
  if (rotLabel) rotLabel.innerHTML = (el.rotation || 0) + '&deg;';
  const visualStyle = el.style || _getGroupSurfaceStyle(el);
  if (visualStyle) {
    _setVal('prop-fill', visualStyle.fill || '#ffffff');
    _setVal('prop-stroke', visualStyle.stroke || '#111827');
    _setVal('prop-stroke-width', visualStyle.strokeWidth || 2);
    _setVal('prop-opacity', visualStyle.opacity != null ? visualStyle.opacity : 1);
    const opLabel = document.getElementById('prop-opacity-val');
    if (opLabel) opLabel.textContent = Math.round((visualStyle.opacity || 1) * 100) + '%';
    _setVal('prop-dash', visualStyle.dashArray || '');
  }
  if (el.text) {
    _setVal('prop-text', el.text.value || '');
    _setVal('prop-font-family', el.text.fontFamily || 'Inter, Arial, sans-serif');
    _setVal('prop-font-size', el.text.fontSize || 16);
    _setVal('prop-text-color', el.text.color || '#111827');
    _setVal('prop-text-align', el.text.align || 'center');
    _setVal('prop-font-weight', el.text.fontWeight || 400);
  }
  _fillSpecificCssNameOptions();
  _setVal('prop-css-class', getCssClassForElement(el));
  _setVal('prop-component-css', getSpecificCssForElement(el, getState().document));
  const lockBtn = document.getElementById('btn-lock');
  if (lockBtn) lockBtn.textContent = el.locked ? '\uD83D\uDD12' : '\uD83D\uDD13';
}

function _getGroupSurfaceStyle(group) {
  const surface = _getGroupSurfaceElements(group)[0];
  return surface?.style || null;
}

function _updateGroupSurfaceStyle(group, prop, value) {
  if (group.type !== 'group') return;
  for (const child of _getGroupSurfaceElements(group)) {
    updateElement(child.id, { style: { ...child.style, [prop]: value } });
  }
}

function _getGroupSurfaceElements(group) {
  if (group.type !== 'group' || !Array.isArray(group.children)) return [];
  return group.children
    .map(id => getElementById(id))
    .filter(child => child?.style && child.type !== 'text' && child.style.fill !== 'none');
}

function _fillSpecificCssNameOptions() {
  const state = getState();
  const list = document.getElementById('component-css-names');
  if (!list) return;
  const names = new Set(Object.keys(state.document.styles?.componentCss || {}));
  for (const element of state.document.elements || []) {
    const name = getCssClassForElement(element);
    if (name) names.add(name);
  }
  list.innerHTML = [...names].sort().map(name => `<option value="${_escapeAttribute(name)}"></option>`).join('');
}

function _fillConnectorProps(el) {
  _setVal('prop-connector-type', el.connectorType || 'orthogonal');
  _setVal('prop-conn-layer', el.zIndex || 0);
  if (el.style) {
    _setVal('prop-conn-stroke', el.style.stroke || '#111827');
    _setVal('prop-conn-stroke-width', el.style.strokeWidth || 2);
    _setVal('prop-conn-end-marker', el.style.endMarker || '');
    _setVal('prop-conn-dash', el.style.dashArray || '');
  }
  if (el.label) {
    _setVal('prop-conn-label', el.label.value || '');
  }
}

function _setVal(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  const nextValue = String(val ?? '');
  if (el.value === nextValue) return;
  if (document.activeElement === el) return;
  el.value = nextValue;
}

function _updateSpecificCssNameFromInput(commit) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  const input = document.getElementById('prop-css-class');
  if (!el || !input) return;
  const nextName = input.value.trim();
  const currentRules = _getCurrentSpecificCssRules(el);
  _beginSpecificCssInput();
  updateElement(el.id, { css: { ...el.css, className: nextName } });
  _ensureComponentCssRegistry();
  if (nextName && currentRules && !state.document.styles.componentCss[nextName]) {
    state.document.styles.componentCss[nextName] = currentRules;
  }
  const nextRules = nextName && state.document.styles.componentCss[nextName]
    ? state.document.styles.componentCss[nextName]
    : currentRules;
  updateElement(el.id, { css: { ...el.css, rules: nextRules } });
  _fillSpecificCssNameOptions();
  _setVal('prop-component-css', nextRules);
  renderDocument(state.document);
  refreshSelection();
  _commitSpecificCssInput(commit);
}

function _updateSpecificCssRulesFromInput(commit) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  const input = document.getElementById('prop-component-css');
  if (!el || !input) return;
  const cssName = getCssClassForElement(el);
  const rules = _normalizeSpecificCssRulesInput(input.value);
  if (input.value !== rules) input.value = rules;
  _beginSpecificCssInput();
  _ensureComponentCssRegistry();
  if (cssName) {
    state.document.styles.componentCss[cssName] = rules;
    updateDocument(doc => {
      for (const target of doc.elements || []) {
        if (getCssClassForElement(target) === cssName) {
          target.css = { ...target.css, rules };
        }
      }
    });
  } else {
    updateElement(el.id, { css: { ...el.css, rules } });
  }
  _fillSpecificCssNameOptions();
  renderDocument(state.document);
  refreshSelection();
  _commitSpecificCssInput(commit);
}

function _getCurrentSpecificCssRules(element) {
  return getSpecificCssForElement(element, getState().document);
}

function _normalizeSpecificCssRulesInput(rules) {
  const value = String(rules || '').trim();
  if (!value.includes('{')) return value;
  const openIndex = value.indexOf('{');
  const closeIndex = value.lastIndexOf('}');
  if (openIndex === -1 || closeIndex <= openIndex) return value;
  return value.slice(openIndex + 1, closeIndex).trim();
}

function _ensureComponentCssRegistry() {
  const state = getState();
  if (!state.document.styles || typeof state.document.styles !== 'object') {
    state.document.styles = {};
  }
  if (!state.document.styles.componentCss || typeof state.document.styles.componentCss !== 'object') {
    state.document.styles.componentCss = {};
  }
}

function _beginSpecificCssInput() {
  if (!_specificCssInputSnapshot) {
    _specificCssInputSnapshot = snapshotElements();
  }
}

function _commitSpecificCssInput(commit) {
  if (!commit || !_specificCssInputSnapshot) return;
  const before = _specificCssInputSnapshot;
  const after = snapshotElements();
  _specificCssInputSnapshot = null;
  if (!_snapshotsEqual(before, after)) {
    commitAction({ type: 'snapshot', before, after });
  }
}

function _escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _getLayerIconSvg(element) {
  const svg = (content) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${content}</svg>`;
  const strokeShape = (content) => svg(`<g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${content}</g>`);

  if (element.type === 'connector') {
    return strokeShape('<path d="M4 12h14" /><path d="M14 7l5 5-5 5" />');
  }
  if (element.type === 'group') {
    return strokeShape('<rect x="4" y="5" width="16" height="14" rx="2" stroke-dasharray="3 2" />');
  }

  const icons = {
    rectangle: strokeShape('<rect x="4" y="6" width="16" height="12" rx="1" />'),
    roundedRectangle: strokeShape('<rect x="4" y="6" width="16" height="12" rx="4" />'),
    ellipse: strokeShape('<ellipse cx="12" cy="12" rx="8" ry="6" />'),
    triangle: strokeShape('<polygon points="12,4 21,20 3,20" />'),
    diamond: strokeShape('<polygon points="12,3 21,12 12,21 3,12" />'),
    pentagon: strokeShape('<polygon points="12,3 21,10 18,21 6,21 3,10" />'),
    hexagon: strokeShape('<polygon points="12,3 20,8 20,16 12,21 4,16 4,8" />'),
    star: strokeShape('<polygon points="12,3 14.6,8.7 21,9.2 16.2,13.5 17.6,20 12,16.7 6.4,20 7.8,13.5 3,9.2 9.4,8.7" />'),
    line: strokeShape('<path d="M5 19L19 5" />'),
    arrow: strokeShape('<path d="M5 19L18 6" /><path d="M12 6h6v6" />'),
    text: svg('<text x="6" y="17" fill="currentColor" font-size="14" font-weight="700" font-family="Inter, Arial, sans-serif">T</text>'),
    note: strokeShape('<path d="M5 4h11l3 3v13H5z" /><path d="M16 4v4h4" />'),
    frame: strokeShape('<rect x="4" y="5" width="16" height="14" rx="2" stroke-dasharray="4 2" />'),
    image: strokeShape('<rect x="4" y="5" width="16" height="14" rx="2" /><path d="M7 16l4-4 3 3 2-2 2 3" /><circle cx="9" cy="9" r="1" />'),
    'flow-start': strokeShape('<rect x="4" y="7" width="16" height="10" rx="5" />'),
    'flow-process': strokeShape('<rect x="4" y="6" width="16" height="12" />'),
    'flow-decision': strokeShape('<polygon points="12,3 21,12 12,21 3,12" />'),
    'flow-io': strokeShape('<polygon points="7,5 21,5 17,19 3,19" />'),
    'flow-database': strokeShape('<path d="M5 8c0-2 14-2 14 0v8c0 2-14 2-14 0z" /><path d="M5 8c0 2 14 2 14 0" />'),
    'flow-document': strokeShape('<path d="M5 4h14v13c-4-2-6 2-10 0-1.3-.7-2.6-.9-4-.3z" />'),
    'flow-subprocess': strokeShape('<rect x="4" y="6" width="16" height="12" /><path d="M8 6v12M16 6v12" />')
  };

  return icons[element.shape] || icons.rectangle;
}

function _updateLayersPanel() {
  const state = getState();
  const list = document.getElementById('layers-list');
  if (!list) return;
  list.innerHTML = '';
  const sorted = [...state.document.elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
  for (const el of sorted) {
    const item = document.createElement('div');
    item.className = 'layer-item';
    if (state.selectedElementIds.includes(el.id)) item.classList.add('selected');
    const name = el.type === 'connector' ? 'Conector'
      : el.type === 'group' ? (el.name || 'Grupo')
      : getShapeDisplayName(el.shape);
    item.innerHTML = `
      <span class="layer-icon">${_getLayerIconSvg(el)}</span>
      <span class="layer-name">${_escapeAttribute(name)}</span>
      <span class="layer-visibility" data-id="${el.id}">${el.visible !== false ? '\uD83D\uDC41' : '\u2014'}</span>
    `;
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('layer-visibility')) {
        const before = snapshotElements();
        updateElement(el.id, { visible: el.visible === false ? true : false });
        const after = snapshotElements();
        commitAction({ type: 'snapshot', before, after });
        renderDocument(state.document);
        _updateLayersPanel();
        return;
      }
      setSelection([el.id]);
      refreshSelection();
      _updatePropertiesPanel();
      _updateLayersPanel();
    });
    list.appendChild(item);
  }
}

function _changeZIndex(order) {
  const state = getState();
  const selected = getSelectedElements();
  if (selected.length === 0) return;
  const before = snapshotElements();
  const allZ = state.document.elements.map(e => e.zIndex || 0);
  const maxZ = Math.max(...allZ);
  const minZ = Math.min(...allZ);
  for (const el of selected) {
    let nextLayer = el.zIndex || 0;
    switch (order) {
      case 'front': nextLayer = maxZ + 1; break;
      case 'back': nextLayer = minZ - 1; break;
      case 'forward': nextLayer = (el.zIndex || 0) + 1; break;
      case 'backward': nextLayer = (el.zIndex || 0) - 1; break;
    }
    _setElementLayer(el, nextLayer);
  }
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
  _updateLayersPanel();
  _updatePropertiesPanel();
}

function _setElementLayer(element, layer) {
  updateElement(element.id, { zIndex: layer });
  if (element.type !== 'group' || !Array.isArray(element.children)) return;
  for (const childId of element.children) {
    const child = getElementById(childId);
    if (child) updateElement(child.id, { zIndex: layer });
  }
}

function _alignElements(direction) {
  const state = getState();
  const selected = getSelectedElements().filter(e => e.type !== 'connector');
  if (selected.length < 2) return;
  const bounds = getMultiSelectionBounds(selected);
  if (!bounds) return;
  const before = snapshotElements();
  for (const el of selected) {
    switch (direction) {
      case 'left': el.x = bounds.x; break;
      case 'center': el.x = bounds.x + (bounds.width - el.width) / 2; break;
      case 'right': el.x = bounds.right - el.width; break;
    }
  }
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _distributeElements(dir) {
  const state = getState();
  const selected = getSelectedElements().filter(e => e.type !== 'connector');
  if (selected.length < 3) return;
  const before = snapshotElements();
  if (dir === 'h') {
    selected.sort((a, b) => a.x - b.x);
    const totalW = selected.reduce((s, e) => s + e.width, 0);
    const bounds = getMultiSelectionBounds(selected);
    const gap = (bounds.width - totalW) / (selected.length - 1);
    let cx = bounds.x;
    for (const el of selected) {
      el.x = cx;
      cx += el.width + gap;
    }
  } else {
    selected.sort((a, b) => a.y - b.y);
    const totalH = selected.reduce((s, e) => s + e.height, 0);
    const bounds = getMultiSelectionBounds(selected);
    const gap = (bounds.height - totalH) / (selected.length - 1);
    let cy = bounds.y;
    for (const el of selected) {
      el.y = cy;
      cy += el.height + gap;
    }
  }
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _groupSelected() {
  const state = getState();
  const selected = getSelectedElements();
  if (selected.length < 2) return;
  const before = snapshotElements();
  const bounds = getMultiSelectionBounds(selected);
  if (!bounds) return;
  const group = createGroup(selected.map(e => e.id), bounds.x, bounds.y, bounds.width, bounds.height);
  addElement(group);
  setSelection([group.id]);
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _ungroupSelected() {
  const state = getState();
  const selected = getSelectedElements();
  if (selected.length !== 1 || selected[0].type !== 'group') return;
  const before = snapshotElements();
  const group = selected[0];
  removeElement(group.id);
  setSelection(group.children || []);
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _toggleLock() {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const before = snapshotElements();
  updateElement(el.id, { locked: !el.locked });
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
  _updatePropertiesPanel();
}

function _zoomToFit() {
  const state = getState();
  const elements = state.document.elements.filter(e => e.visible && e.type !== 'connector');
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) return;
  const ww = wrapper.clientWidth - 40;
  const wh = wrapper.clientHeight - 40;

  if (elements.length === 0) {
    state.viewport.zoom = 1;
    state.viewport.panX = 0;
    state.viewport.panY = 0;
    applyViewport(state.viewport);
    _updateZoomUI(1);
    return;
  }
  const bounds = getMultiSelectionBounds(elements);
  const scaleX = ww / bounds.width;
  const scaleY = wh / bounds.height;
  const newZoom = Math.max(0.1, Math.min(scaleX, scaleY, 2));

  state.viewport.zoom = newZoom;
  state.viewport.panX = bounds.x - (ww / newZoom - bounds.width) / 2;
  state.viewport.panY = bounds.y - (wh / newZoom - bounds.height) / 2;
  applyViewport(state.viewport);
  _updateZoomUI(newZoom);
}

function _dropComponent(compType, x, y) {
  const state = getState();
  const before = snapshotElements();
  const group = createComponentGroup(compType, x, y);
  if (group) {
    addElement(group);
    const pendingChildren = getPendingChildren(group.id);
    for (const child of pendingChildren) {
      addElement(child);
    }
    setSelection([group.id]);
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    renderDocument(state.document);
    refreshSelection();
  }
}

function _updateStatusSaved() {
  const saved = document.getElementById('status-saved');
  if (saved) saved.textContent = 'Guardado';
}

export function refreshPropertiesPanel() {
  _updatePropertiesPanel();
}

export function refreshLayersPanel() {
  _updateLayersPanel();
}
// #endregion

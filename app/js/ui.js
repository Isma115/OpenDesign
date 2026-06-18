// #region Interfaz de usuario | Funcionalidad | inicializacion y gestion de la UI
import { getState, updateElement, updateDocument, setSelection, clearSelection, getElementById, getSelectedElements, setActiveTool, addElement, removeElement, resetDocument } from './state.js';
import { renderDocument, applyViewport } from './renderer.js';
import { refreshSelection } from './selection.js';
import { commitAction, snapshotElements } from './history.js';
import { downloadJSON, openJSON, handleFileImport, saveToLocal } from './storage.js';
import { exportAsHTML, exportAsSVG, exportAsPNG } from './export.js';
import { getShapeDisplayName, createGroup } from './shapes.js';
import { zoomBy, setZoom, updateToolUI } from './keyboard.js';
import { getElementBounds, getMultiSelectionBounds } from './geometry.js';
import { updateConnectorPath, updateAllConnectorsForElement } from './connectors.js';
import { createComponentGroup, getPendingChildren } from './components.js';
import { toggleTheme } from './theme.js';
import { copySelectedElements, pasteClipboardElements } from './clipboard.js';
import {
  CSS_TEMPLATE_VISUAL_FIELDS,
  getCssClassForElement,
  getSpecificCssForElement,
  getVisualCssValues,
  updateVisualCssValue,
  validateVisualCss
} from './css-template.js';

export function initUI() {
  _initMenuBars();
  _initPanelTabs();
  _initPropertyInputs();
  _initCssTemplateEditor();
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
  const bind = (id, handler) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', handler);
      if (el.type === 'range' || el.type === 'color') {
        el.addEventListener('input', handler);
      }
    }
  };

  bind('prop-x', () => _updatePropFromInput('x', parseFloat));
  bind('prop-y', () => _updatePropFromInput('y', parseFloat));
  bind('prop-w', () => _updatePropFromInput('width', v => Math.max(10, parseFloat(v))));
  bind('prop-h', () => _updatePropFromInput('height', v => Math.max(10, parseFloat(v))));
  bind('prop-rotation', () => {
    const val = document.getElementById('prop-rotation').value;
    const label = document.getElementById('prop-rotation-val');
    if (label) label.innerHTML = val + '&deg;';
    _updatePropFromInput('rotation', parseFloat);
  });
  bind('prop-fill', () => _updateStyleFromInput('fill', 'prop-fill'));
  bind('prop-stroke', () => _updateStyleFromInput('stroke', 'prop-stroke'));
  bind('prop-stroke-width', () => _updateStyleFromInput('strokeWidth', parseFloat));
  bind('prop-opacity', () => {
    const val = document.getElementById('prop-opacity').value;
    const label = document.getElementById('prop-opacity-val');
    if (label) label.textContent = Math.round(val * 100) + '%';
    _updateStyleFromInput('opacity', parseFloat);
  });
  bind('prop-dash', () => _updateStyleFromInput('dashArray', 'prop-dash'));
  bind('prop-text', () => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el) return;
    const before = snapshotElements();
    updateElement(el.id, { text: { ...el.text, value: document.getElementById('prop-text').value } });
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    renderDocument(state.document);
    refreshSelection();
  });
  bind('prop-font-family', () => _updateTextFromInput('fontFamily', 'prop-font-family'));
  bind('prop-font-size', () => _updateTextFromInput('fontSize', parseFloat));
  bind('prop-text-color', () => _updateTextFromInput('color', 'prop-text-color'));
  bind('prop-text-align', () => _updateTextFromInput('align', 'prop-text-align'));
  bind('prop-font-weight', () => _updateTextFromInput('fontWeight', v => parseInt(document.getElementById('prop-font-weight').value)));
  bind('prop-css-class', () => _updateCssFromInput('className', 'prop-css-class'));
  bind('prop-component-css', () => _updateCssFromInput('rules', 'prop-component-css'));

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
  bind('prop-conn-stroke', () => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el || el.type !== 'connector') return;
    const before = snapshotElements();
    el.style.stroke = document.getElementById('prop-conn-stroke').value;
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    renderDocument(state.document);
    refreshSelection();
  });
  bind('prop-conn-stroke-width', () => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el || el.type !== 'connector') return;
    const before = snapshotElements();
    el.style.strokeWidth = parseFloat(document.getElementById('prop-conn-stroke-width').value);
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    renderDocument(state.document);
    refreshSelection();
  });
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
  bind('prop-conn-label', () => {
    const state = getState();
    if (state.selectedElementIds.length !== 1) return;
    const el = getElementById(state.selectedElementIds[0]);
    if (!el || el.type !== 'connector') return;
    const before = snapshotElements();
    el.label.value = document.getElementById('prop-conn-label').value;
    const after = snapshotElements();
    commitAction({ type: 'snapshot', before, after });
    renderDocument(state.document);
    refreshSelection();
  });

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
      e.dataTransfer.dropEffect = 'copy';
    });
    wrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      const compType = e.dataTransfer.getData('text/plain');
      if (!compType) return;
      const state = getState();
      const rect = document.getElementById('canvas').getBoundingClientRect();
      const x = (e.clientX - rect.left) / state.viewport.zoom;
      const y = (e.clientY - rect.top) / state.viewport.zoom;
      _dropComponent(compType, x, y);
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

function _handleAction(action) {
  const state = getState();
  switch (action) {
    case 'new':
      if (confirm('Crear nuevo proyecto? Se perderan cambios no guardados.')) {
        resetDocument();
        renderDocument(getState().document);
        refreshSelection();
        const nameInput = document.getElementById('doc-name');
        if (nameInput) nameInput.value = 'Nuevo diseno';
      }
      break;
    case 'open': openJSON(); break;
    case 'save': saveToLocal(); _updateStatusSaved(); break;
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

function _updatePropFromInput(prop, parser) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const inputId = { x: 'prop-x', y: 'prop-y', width: 'prop-w', height: 'prop-h', rotation: 'prop-rotation' }[prop];
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = parser(input.value);
  if (isNaN(val)) return;
  const before = snapshotElements();
  updateElement(el.id, { [prop]: val });
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
  updateAllConns(el.id);
}

function _updateStyleFromInput(prop, inputId) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = typeof input.value === 'string' && input.type !== 'range' && input.type !== 'number'
    ? input.value
    : parseFloat(input.value);
  const before = snapshotElements();
  updateElement(el.id, { style: { ...el.style, [prop]: val } });
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
}

function _updateTextFromInput(prop, inputIdOrParser) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  if (!el) return;
  const input = document.getElementById(inputIdOrParser);
  if (!input) return;
  const val = input.value;
  const before = snapshotElements();
  updateElement(el.id, { text: { ...el.text, [prop]: isNaN(parseFloat(val)) ? val : parseFloat(val) } });
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
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
  _fillGlobalStylesPanel();

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
  _setVal('prop-rotation', el.rotation || 0);
  const rotLabel = document.getElementById('prop-rotation-val');
  if (rotLabel) rotLabel.innerHTML = (el.rotation || 0) + '&deg;';
  if (el.style) {
    _setVal('prop-fill', el.style.fill || '#ffffff');
    _setVal('prop-stroke', el.style.stroke || '#111827');
    _setVal('prop-stroke-width', el.style.strokeWidth || 2);
    _setVal('prop-opacity', el.style.opacity != null ? el.style.opacity : 1);
    const opLabel = document.getElementById('prop-opacity-val');
    if (opLabel) opLabel.textContent = Math.round((el.style.opacity || 1) * 100) + '%';
    _setVal('prop-dash', el.style.dashArray || '');
  }
  if (el.text) {
    _setVal('prop-text', el.text.value || '');
    _setVal('prop-font-family', el.text.fontFamily || 'Inter, Arial, sans-serif');
    _setVal('prop-font-size', el.text.fontSize || 16);
    _setVal('prop-text-color', el.text.color || '#111827');
    _setVal('prop-text-align', el.text.align || 'center');
    _setVal('prop-font-weight', el.text.fontWeight || 400);
  }
  _setVal('prop-css-class', getCssClassForElement(el));
  _setVal('prop-component-css', getSpecificCssForElement(el));
  const lockBtn = document.getElementById('btn-lock');
  if (lockBtn) lockBtn.textContent = el.locked ? '\uD83D\uDD12' : '\uD83D\uDD13';
}

function _fillGlobalStylesPanel() {
  const state = getState();
  const css = state.document.styles?.globalTemplateCss || '';
  const input = document.getElementById('prop-global-css-template');
  if (input && input.value !== css) input.value = css;
  _syncCssCodeHighlight(css);
  _syncVisualCssFields(css);
  _renderGlobalCssWarnings(css);
}

function _fillConnectorProps(el) {
  _setVal('prop-connector-type', el.connectorType || 'orthogonal');
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
  if (el) el.value = val;
}

function _bindLiveInput(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', handler);
  el.addEventListener('change', handler);
}

function _initCssTemplateEditor() {
  _buildVisualCssEditor();
  _bindLiveInput('prop-global-css-template', _updateGlobalCssTemplate);

  const textarea = document.getElementById('prop-global-css-template');
  const highlight = document.getElementById('global-css-highlight');
  if (textarea && highlight) {
    textarea.addEventListener('scroll', () => {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    });
  }

  document.querySelectorAll('.css-mode-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.css-mode-tab').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('#tab-styles .css-mode-panel').forEach(panel => panel.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(btn.dataset.cssMode === 'code' ? 'css-code-editor' : 'css-visual-editor');
      if (panel) panel.classList.add('active');
    });
  });
}

function _buildVisualCssEditor() {
  const tokenGrid = document.querySelector('[data-css-visual-group="tokens"]');
  const componentGrid = document.querySelector('[data-css-visual-group="components"]');
  if (!tokenGrid || !componentGrid) return;
  tokenGrid.innerHTML = '';
  componentGrid.innerHTML = '';

  for (const field of CSS_TEMPLATE_VISUAL_FIELDS) {
    const wrapper = document.createElement('div');
    wrapper.className = 'css-visual-field';
    const inputType = field.type === 'color' ? 'color' : 'text';
    wrapper.innerHTML = `
      <label for="css-visual-${field.id}">${field.label}</label>
      <input id="css-visual-${field.id}" type="${inputType}" data-css-field="${field.id}" spellcheck="false">
    `;
    const input = wrapper.querySelector('input');
    input.addEventListener('input', () => _updateVisualCssField(field.id, input.value));
    const target = field.selector === ':root' ? tokenGrid : componentGrid;
    target.appendChild(wrapper);
  }
}

function _updateGlobalCssTemplate() {
  const input = document.getElementById('prop-global-css-template');
  if (!input) return;
  updateDocument(doc => {
    if (!doc.styles) doc.styles = {};
    doc.styles.globalTemplateCss = input.value;
  });
  _syncCssCodeHighlight(input.value);
  _syncVisualCssFields(input.value);
  _renderGlobalCssWarnings(input.value);
}

function _updateVisualCssField(fieldId, value) {
  const state = getState();
  const currentCss = state.document.styles?.globalTemplateCss || '';
  const nextCss = updateVisualCssValue(currentCss, fieldId, value);
  updateDocument(doc => {
    if (!doc.styles) doc.styles = {};
    doc.styles.globalTemplateCss = nextCss;
  });
  const input = document.getElementById('prop-global-css-template');
  if (input) input.value = nextCss;
  _syncCssCodeHighlight(nextCss);
  _renderGlobalCssWarnings(nextCss);
}

function _syncVisualCssFields(cssText) {
  const values = getVisualCssValues(cssText);
  for (const field of CSS_TEMPLATE_VISUAL_FIELDS) {
    const input = document.querySelector(`[data-css-field="${field.id}"]`);
    if (!input) continue;
    const value = values[field.id] || field.fallback;
    if (input.type === 'color' && !/^#[0-9a-f]{6}$/i.test(value)) continue;
    if (input.value !== value) input.value = value;
  }
}

function _syncCssCodeHighlight(cssText) {
  const highlight = document.getElementById('global-css-highlight');
  if (!highlight) return;
  highlight.innerHTML = _highlightCss(cssText);
}

function _highlightCss(cssText) {
  const escaped = _escapeForHTML(cssText || '');
  return escaped
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="css-code-token-comment">$1</span>')
    .replace(/(^|\n)([^{}\n]+)(\s*\{)/g, (full, lineStart, selector, brace) => {
      return `${lineStart}<span class="css-code-token-selector">${selector}</span><span class="css-code-token-punctuation">${brace}</span>`;
    })
    .replace(/([\w-]+)(\s*:)(\s*)([^;\n}]+)(;?)/g, (full, property, colon, space, value, semicolon) => {
      return `<span class="css-code-token-property">${property}</span><span class="css-code-token-punctuation">${colon}</span>${space}<span class="css-code-token-value">${value}</span><span class="css-code-token-punctuation">${semicolon}</span>`;
    })
    .replace(/([{}])/g, '<span class="css-code-token-punctuation">$1</span>');
}

function _escapeForHTML(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function _updateCssFromInput(prop, inputId) {
  const state = getState();
  if (state.selectedElementIds.length !== 1) return;
  const el = getElementById(state.selectedElementIds[0]);
  const input = document.getElementById(inputId);
  if (!el || !input) return;
  const before = snapshotElements();
  updateElement(el.id, { css: { ...el.css, [prop]: input.value } });
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
}

function _renderGlobalCssWarnings(cssText) {
  const warning = document.getElementById('global-css-warning');
  if (!warning) return;
  const issues = validateVisualCss(cssText);
  warning.textContent = issues.length
    ? `No se exportaran estas propiedades de layout en la plantilla global: ${[...new Set(issues.map(issue => issue.property))].join(', ')}.`
    : '';
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
      <span class="layer-icon">${el.type === 'connector' ? '\u2192' : '\u25A1'}</span>
      <span class="layer-name">${name}</span>
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
    switch (order) {
      case 'front': el.zIndex = maxZ + 1; break;
      case 'back': el.zIndex = minZ - 1; break;
      case 'forward': el.zIndex = (el.zIndex || 0) + 1; break;
      case 'backward': el.zIndex = (el.zIndex || 0) - 1; break;
    }
  }
  const after = snapshotElements();
  commitAction({ type: 'snapshot', before, after });
  renderDocument(state.document);
  refreshSelection();
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
  if (elements.length === 0) {
    setZoom(1);
    applyViewport(state.viewport);
    return;
  }
  const bounds = getMultiSelectionBounds(elements);
  const wrapper = document.getElementById('canvas-wrapper');
  const ww = wrapper.clientWidth - 40;
  const wh = wrapper.clientHeight - 40;
  const scaleX = ww / bounds.width;
  const scaleY = wh / bounds.height;
  const scale = Math.min(scaleX, scaleY, 2);
  setZoom(Math.max(0.1, scale));
  applyViewport(state.viewport);
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

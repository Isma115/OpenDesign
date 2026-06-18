// #region Exportacion de archivos | Funcionalidad | exportar a JSON, HTML, SVG y PNG
import { getState } from './state.js';
import { buildCssBundle, getExportClassList, getExportLayoutStyle, validateVisualCss } from './css-template.js';

export function exportAsJSON() {
  const state = getState();
  const json = JSON.stringify(state.document, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.document.name || 'design'}.geoflow.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsHTML() {
  const state = getState();
  const doc = state.document;
  const html = _buildHTMLDocument(doc);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.name || 'design'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsSVG() {
  const svg = document.getElementById('canvas');
  const clone = svg.cloneNode(true);

  const selectionLayer = clone.querySelector('#selection-layer');
  if (selectionLayer) selectionLayer.innerHTML = '';
  const guideLayer = clone.querySelector('#guide-layer');
  if (guideLayer) guideLayer.innerHTML = '';
  const previewLayer = clone.querySelector('#preview-layer');
  if (previewLayer) previewLayer.innerHTML = '';

  const connPoints = clone.querySelectorAll('.connection-point');
  connPoints.forEach(cp => cp.remove());

  const state = getState();
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', state.document.canvas.width);
  clone.setAttribute('height', state.document.canvas.height);
  clone.style.background = state.document.canvas.background;

  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `
    text { font-family: Inter, Arial, sans-serif; }
    .selection-border, .selection-handle, .selection-handle-rotate,
    .selection-rotate-line, .selection-box, .guide-line, .shape-preview,
    .connector-preview { display: none; }
  `;
  const defs = clone.querySelector('#svg-defs');
  if (defs) defs.appendChild(styleEl);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.document.name || 'design'}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsPNG() {
  const svg = document.getElementById('canvas');
  const state = getState();
  const width = state.document.canvas.width;
  const height = state.document.canvas.height;

  const clone = svg.cloneNode(true);
  const selectionLayer = clone.querySelector('#selection-layer');
  if (selectionLayer) selectionLayer.innerHTML = '';
  const guideLayer = clone.querySelector('#guide-layer');
  if (guideLayer) guideLayer.innerHTML = '';
  const previewLayer = clone.querySelector('#preview-layer');
  if (previewLayer) previewLayer.innerHTML = '';

  const connPoints = clone.querySelectorAll('.connection-point');
  connPoints.forEach(cp => cp.remove());

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);

  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `
    text { font-family: Inter, Arial, sans-serif; }
    .selection-border, .selection-handle, .selection-handle-rotate,
    .selection-rotate-line, .selection-box, .guide-line, .shape-preview,
    .connector-preview { display: none; }
  `;
  const defs = clone.querySelector('#svg-defs');
  if (defs) defs.appendChild(styleEl);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.fillStyle = state.document.canvas.background || '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${state.document.name || 'design'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pngUrl);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.onerror = () => {
    console.error('Error loading SVG for PNG export');
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function _buildHTMLDocument(doc) {
  const cssIssues = validateVisualCss(doc.styles?.globalTemplateCss || '');
  const warning = cssIssues.length
    ? `\n  <!-- Advertencia: se omitieron propiedades de layout en la plantilla CSS global: ${cssIssues.map(issue => issue.property).join(', ')} -->`
    : '';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${_escapeHTML(doc.name || 'GeoFlow export')}</title>
  <style>
${_indentCss(_buildBaseExportCss(doc))}
  </style>
  <style>
${_indentCss(buildCssBundle(doc))}
  </style>${warning}
</head>
<body>
  <main class="gf-page" aria-label="${_escapeAttribute(doc.name || 'Diseno exportado')}">
${_buildExportElements(doc)}
  </main>
</body>
</html>`;
}

function _buildBaseExportCss(doc) {
  return `.gf-page {
  position: relative;
  width: ${Math.round(doc.canvas?.width || 1920)}px;
  height: ${Math.round(doc.canvas?.height || 1080)}px;
  background: ${doc.canvas?.background || '#ffffff'};
  overflow: hidden;
}

.gf-export-element {
  box-sizing: border-box;
}

.gf-shape {
  border-style: solid;
}

.gf-text {
  background: transparent;
  border-color: transparent;
}

body {
  margin: 0;
}`;
}

function _buildExportElements(doc) {
  const childIds = new Set();
  for (const element of doc.elements || []) {
    if (element.type === 'group') {
      for (const childId of element.children || []) childIds.add(childId);
    }
  }

  return (doc.elements || [])
    .filter(element => element.visible !== false && !childIds.has(element.id) && element.type !== 'connector')
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
    .map(element => element.type === 'group' ? _buildComponentElement(element, doc) : _buildShapeElement(element))
    .join('\n');
}

function _buildComponentElement(group, doc) {
  const classes = getExportClassList(group);
  const style = getExportLayoutStyle(group);
  const text = _getGroupText(group, doc);
  const id = _escapeAttribute(group.id);
  const name = (group.name || '').toLowerCase();

  switch (name) {
    case 'button':
      return `    <button id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}">${_escapeHTML(text || 'Button')}</button>`;
    case 'input':
      return `    <input id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}" placeholder="${_escapeAttribute(text || 'Placeholder...')}">`;
    case 'textarea':
      return `    <textarea id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}" placeholder="${_escapeAttribute(text || '')}"></textarea>`;
    case 'checkbox':
      return `    <label id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}"><input type="checkbox"> <span>${_escapeHTML(text || 'Checkbox')}</span></label>`;
    case 'toggle':
      return `    <button id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}" aria-pressed="true"></button>`;
    case 'card':
      return `    <section id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}"><h2>${_escapeHTML(text || 'Card Title')}</h2></section>`;
    case 'avatar':
      return `    <div id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}" aria-label="${_escapeAttribute(text || 'Avatar')}">${_escapeHTML(text || 'A')}</div>`;
    case 'navbar':
      return `    <nav id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}">${_escapeHTML(text || 'Navbar')}</nav>`;
    case 'sidebar':
      return `    <aside id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}">${_escapeHTML(text || 'Sidebar')}</aside>`;
    case 'table':
      return `    <table id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}"><thead><tr><th>${_escapeHTML(text || 'Header')}</th></tr></thead><tbody></tbody></table>`;
    case 'image':
      return `    <figure id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}">${_escapeHTML(text || 'Imagen')}</figure>`;
    case 'modal':
      return `    <section id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}" role="dialog" aria-modal="true"><h2>${_escapeHTML(text || 'Modal Title')}</h2></section>`;
    default:
      return `    <section id="${id}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}">${_escapeHTML(text || group.name || 'Componente')}</section>`;
  }
}

function _buildShapeElement(element) {
  const classes = `${getExportClassList(element)} ${element.type === 'text' ? 'gf-text' : 'gf-shape'}`;
  const style = getExportLayoutStyle(element);
  const text = element.text?.value || '';
  return `    <div id="${_escapeAttribute(element.id)}" class="${_escapeAttribute(classes)}" style="${_escapeAttribute(style)}">${_escapeHTML(text)}</div>`;
}

function _getGroupText(group, doc) {
  const children = (group.children || [])
    .map(id => doc.elements.find(element => element.id === id))
    .filter(Boolean);
  const textChild = children.find(child => child.text?.value);
  return textChild?.text?.value || '';
}

function _indentCss(cssText) {
  return String(cssText || '').split('\n').map(line => `    ${line}`).join('\n');
}

function _escapeHTML(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function _escapeAttribute(value) {
  return _escapeHTML(value).replace(/"/g, '&quot;');
}
// #endregion

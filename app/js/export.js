import { getState } from './state.js';

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

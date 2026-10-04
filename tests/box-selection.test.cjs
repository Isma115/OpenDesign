const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async () => {
  const state = await import('../app/js/core/state.js');
  let box = null;
  const canvas = {
    style: {}, classList: { remove() {}, add() {} }, querySelectorAll: () => [], setAttribute() {},
    setPointerCapture() {}, releasePointerCapture() {},
    createSVGPoint() { return { x: 0, y: 0, matrixTransform() { return { x: this.x / 2, y: this.y / 2 }; } }; },
    getScreenCTM: () => ({ inverse() {} })
  };
  const context = vm.createContext({ ...state, console,
    document: {
      addEventListener() {},
      getElementById: id => id === 'canvas' ? canvas : id === 'selection-layer' ? { appendChild(node) { box = node; } } : null,
      createElementNS: () => ({ attrs: {}, classList: { add() {} }, setAttribute(k, v) { this.attrs[k] = v; }, remove() { box = null; } })
    },
    getSvgCanvas: () => canvas, clearSelectionRender() {}, renderSelection() {}, clearGuides() {}, clearPreview() {},
    applyViewport() {}
  });
  for (const file of ['core/geometry', 'editor/selection', 'editor/tools']) {
    const source = fs.readFileSync(`app/js/${file}.js`, 'utf8')
      .replace(/^import[\s\S]*?;\s*$/gm, '').replace(/\bexport /g, '');
    vm.runInContext(source, context);
  }
  state.resetDocument();
  const shape = (id, x, extra = {}) => ({ id, type: 'shape', x, y: 20, width: 20, height: 20, visible: true, ...extra });
  state.getState().document.elements = [shape('a', 20), shape('b', 60), shape('outside', 200),
    shape('locked', 30, { locked: true }), shape('hidden', 30, { visible: false }),
    shape('group', 30, { type: 'group', children: ['child'] }), shape('child', 30)];
  const pointer = (x, y) => ({ pointerId: 1, clientX: x * 2, clientY: y * 2 });
  context.down = pointer(0, 0); context.up = pointer(100, 100);
  vm.runInContext('_onPointerDown(down); _onPointerMove(up);', context);
  assert.equal(state.getState().interaction.isPanning, false);
  assert.equal(box.attrs.width, 100);
  vm.runInContext('_onPointerUp(up);', context);
  assert.equal(Array.from(state.getState().selectedElementIds).join(','), 'a,b,group');
  assert.equal(box, null);
  assert.equal(state.getState().history.past.length, 0);
  vm.runInContext('_onPointerDown(up); _onPointerMove(down); _onPointerUp(down);', context);
  assert.equal(Array.from(state.getState().selectedElementIds).join(','), 'a,b,group');
  vm.runInContext('_onPointerDown(down); cancelActiveCanvasInteraction();', context);
  assert.equal(box, null);
  assert.equal(state.getState().interaction.isDrawing, false);
  state.getState().activeTool = 'hand';
  vm.runInContext('_onPointerDown(down);', context);
  assert.equal(state.getState().interaction.isPanning, true);
  assert.equal(box, null);
  console.log('Selección rectangular: ambas direcciones, zoom, grupos, cancelación y herramienta mano verificados.');
})();

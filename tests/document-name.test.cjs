const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async () => {
  const state = await import('../app/js/core/state.js');
  const listeners = {};
  const input = { value: '', addEventListener(name, handler) { listeners[name] = handler; } };
  const context = vm.createContext({ ...state, document: {
    getElementById: id => id === 'doc-name' ? input : null
  } });
  const ui = fs.readFileSync('app/js/ui/ui.js', 'utf8');
  const main = fs.readFileSync('app/js/main.js', 'utf8');
  vm.runInContext(ui.slice(ui.indexOf('function _initDocName()'), ui.indexOf('const ACCEPTED_IMAGE_TYPES')), context);
  vm.runInContext(main.slice(main.indexOf('function _updateStatusBar()'), main.lastIndexOf('main();')), context);
  state.resetDocument();
  state.subscribe(() => vm.runInContext('_updateStatusBar();', context));
  vm.runInContext('_initDocName();', context);
  input.value = 'Diseño actualizado';
  listeners.input();
  assert.equal(state.getState().document.name, 'Diseño actualizado');
  assert.equal(state.getState().dirty, true);
  state.setSelection(['componente']);
  assert.equal(input.value, 'Diseño actualizado', 'Seleccionar en el lienzo no debe recuperar el nombre anterior');
  input.value = '';
  listeners.input();
  assert.equal(input.value, '', 'Se puede borrar el título antes de escribir otro');
  input.value = 'Otro nombre';
  listeners.input();
  state.setSelection([]);
  assert.equal(input.value, 'Otro nombre');
  console.log('Nombre del diseño: edición inmediata, cambios sin guardar y sincronización de la barra verificados.');
})();

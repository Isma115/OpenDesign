const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const fields = new Map();
function input(value = '') {
  const listeners = {};
  return {
    value, listeners, type: 'text', style: {}, children: [],
    appendChild(child) { this.children.push(child); },
    replaceChildren() { this.children = []; },
    addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
    dispatchEvent(event) { for (const callback of listeners[event.type] || []) callback(event); },
    setAttribute() {},
    setCustomValidity(message) { this.error = message; },
    reportValidity() {},
    select() { this.selected = true; },
    after(field) { fields.set(field.id, field); },
    closest() { return { querySelector: () => ({ textContent: 'Relleno' }) }; }
  };
}
const color = Object.assign(input('#123456'), { id: 'prop-fill', type: 'color' });
fields.set(color.id, color);
const document = {
  activeElement: null,
  querySelectorAll: () => [color],
  createElement: () => input(),
  getElementById: id => fields.get(id)
};
const source = fs.readFileSync('app/js/ui/ui.js', 'utf8');
const init = source.slice(source.indexOf('function _initColorInputs()'), source.indexOf('function _initPropertyInputs()'));
const setVal = source.slice(source.indexOf('function _setVal('), source.indexOf('function _updateSpecificCssNameFromInput('));
let recentColors = [];
const context = {
  document, Event,
  loadRecentColors: () => recentColors,
  rememberColor: color => { recentColors = [color, ...recentColors.filter(value => value !== color)].slice(0, 16); return recentColors; }
};
vm.createContext(context);
vm.runInContext(init + setVal + '\n_initColorInputs();', context);
const hex = fields.get('prop-fill-hex');
assert.equal(hex.value, '#123456');
hex.dispatchEvent(new Event('focus'));
assert.equal(hex.selected, true);
let commits = 0;
color.addEventListener('change', () => commits++);
let prevented = false;
hex.dispatchEvent({
  type: 'paste', clipboardData: { getData: () => ' #AbC ' },
  preventDefault() { prevented = true; }
});
assert.equal(prevented, true);
assert.equal(color.value, '#aabbcc');
assert.equal(hex.value, '#aabbcc');
assert.equal(commits, 1);
hex.dispatchEvent(new Event('change'));
assert.equal(commits, 1, 'Pegar y perder el foco no duplica el cambio');
hex.value = 'invalid';
hex.dispatchEvent(new Event('change'));
assert.ok(hex.error);
assert.equal(color.value, '#aabbcc');
vm.runInContext("_setVal('prop-fill', '#654321');", context);
assert.equal(hex.value, '#654321', 'Cambiar de componente sincroniza el código');
assert.equal(hex.error, '');
color.value = '#112233';
color.dispatchEvent(new Event('input'));
assert.equal(hex.value, '#112233', 'El selector nativo sincroniza el código');
hex.value = '#445566';
hex.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {} });
assert.equal(color.value, '#445566');
assert.equal(commits, 2);
assert.deepEqual(recentColors, ['#445566', '#aabbcc']);
const details = [...fields.values()].find(field => field.className === 'recent-colors');
const palette = details.children[1];
assert.equal(palette.children.length, 2);
palette.children[1].dispatchEvent(new Event('click'));
assert.equal(color.value, '#aabbcc', 'Aplicar un color reciente con un clic');
assert.equal(hex.value, '#aabbcc');
assert.equal(commits, 3);
console.log('Colores: selección para copiar, pegado, validación y sincronización correctos.');

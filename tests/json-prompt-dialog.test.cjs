const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async () => {
  const listeners = {};
  const form = { addEventListener: (name, callback) => { listeners[name] = callback; } };
  const buttons = [{ disabled: false }, { disabled: false }];
  const dialog = {
    open: false,
    showModal() { this.open = true; }, close() { this.open = false; },
    addEventListener: (name, callback) => { listeners[name] = callback; },
    querySelector: () => form, querySelectorAll: () => buttons
  };
  const specifications = { value: '', focus() { this.focused = true; } };
  const error = { hidden: true, textContent: '' };
  const fields = { 'prompt-json-dialog': dialog, 'prompt-json-specifications': specifications, 'prompt-json-error': error };
  for (const id of ['prompt-json-title', 'prompt-json-description', 'prompt-json-label', 'prompt-json-copy']) fields[id] = { textContent: '' };
  const copied = [];
  let succeeds = true, finish;
  const context = vm.createContext({
    document: { getElementById: id => fields[id] },
    copyJSONPrompt: async value => { copied.push(value); return finish ? await new Promise(resolve => { finish = resolve; }) : succeeds; }
  });
  vm.runInContext(fs.readFileSync('app/js/ui/json-prompt-dialog.js', 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '') + '\ninitJSONPromptDialog(); openJSONPromptDialog();', context);
  const submit = value => ({ submitter: { value }, preventDefault() { this.prevented = true; } });
  assert.equal(dialog.open, true);
  assert.equal(specifications.focused, true);
  await listeners.submit(submit('cancel'));
  assert.equal(copied.length, 0);
  await listeners.submit(submit('copy'));
  assert.equal(error.hidden, false);
  assert.equal(copied.length, 0);
  assert.equal(dialog.open, true);
  specifications.value = 'Reorganiza en dos columnas';
  await listeners.submit(submit('copy'));
  assert.equal(dialog.open, false);
  assert.equal(copied[0], specifications.value);
  vm.runInContext('openJSONPromptDialog();', context);
  assert.equal(specifications.value, 'Reorganiza en dos columnas', 'Conserva el borrador');
  succeeds = false;
  await listeners.submit(submit('copy'));
  assert.equal(dialog.open, true);
  assert.equal(error.hidden, false);
  assert(buttons.every(button => !button.disabled));
  finish = true;
  const pending = listeners.submit(submit('copy'));
  assert(buttons.every(button => button.disabled));
  const escape = { preventDefault() { this.prevented = true; } };
  listeners.cancel(escape);
  assert.equal(escape.prevented, true);
  const count = copied.length;
  await listeners.submit(submit('copy'));
  assert.equal(copied.length, count, 'No copia dos veces durante una petición pendiente');
  finish(true);
  await pending;
  assert.equal(dialog.open, false);
  assert(buttons.every(button => !button.disabled));
  finish = null;
  succeeds = true;
  vm.runInContext('openJSONPromptDialog(true);', context);
  assert.equal(specifications.value, '', 'Las indicaciones de imagen tienen un borrador independiente');
  assert.equal(fields['prompt-json-title'].textContent, 'Imagen a JSON');
  await listeners.submit(submit('copy'));
  assert.equal(dialog.open, false, 'La imagen no exige indicaciones adicionales');
  vm.runInContext('openJSONPromptDialog();', context);
  assert.equal(specifications.value, 'Reorganiza en dos columnas');
  assert.equal(fields['prompt-json-title'].textContent, 'Prompt JSON');
  console.log('Popup: especificaciones, cancelación, borrador, errores y doble envío verificados.');
})().catch(error => { console.error(error); process.exitCode = 1; });

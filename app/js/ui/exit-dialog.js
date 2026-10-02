import { saveToLocal } from '../io/storage.js';

export function initExitDialog() {
  const dialog = document.getElementById('exit-dialog');
  const error = document.getElementById('exit-error');
  window.electronAPI.onConfirmExit(() => {
    if (dialog.open) return;
    dialog.returnValue = 'cancel';
    error.hidden = true;
    dialog.showModal();
  });
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.querySelector('form').addEventListener('submit', event => {
    if (event.submitter?.value === 'exit' && !saveToLocal()) {
      event.preventDefault();
      error.hidden = false;
    }
  });
  dialog.addEventListener('close', () => {
    window.electronAPI.respondToExit(dialog.returnValue === 'exit');
  });
}

import { copyJSONPrompt } from '../io/storage.js';

let _fromImage = false;
const _drafts = { redesign: '', image: '' };

export function initJSONPromptDialog() {
  const dialog = document.getElementById('prompt-json-dialog');
  if (!dialog) return;
  const specifications = document.getElementById('prompt-json-specifications');
  const error = document.getElementById('prompt-json-error');
  const buttons = [...dialog.querySelectorAll('button')];
  let copying = false;
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('cancel', event => { if (copying) event.preventDefault(); });
  dialog.querySelector('form').addEventListener('submit', async event => {
    if (event.submitter?.value !== 'copy') return;
    event.preventDefault();
    if (copying) return;
    if (!_fromImage && !specifications.value.trim()) {
      error.textContent = 'Escribe las especificaciones del rediseño.';
      error.hidden = false;
      specifications.focus();
      return;
    }
    copying = true;
    buttons.forEach(button => { button.disabled = true; });
    error.hidden = true;
    try {
      if (await copyJSONPrompt(specifications.value, _fromImage)) {
        dialog.close();
      } else {
        error.textContent = 'No se pudo copiar el prompt. Vuelve a intentarlo.';
        error.hidden = false;
      }
    } finally {
      copying = false;
      buttons.forEach(button => { button.disabled = false; });
    }
  });
}

export function openJSONPromptDialog(fromImage = false) {
  const dialog = document.getElementById('prompt-json-dialog');
  if (dialog.open) return;
  const specifications = document.getElementById('prompt-json-specifications');
  _drafts[_fromImage ? 'image' : 'redesign'] = specifications.value;
  _fromImage = fromImage;
  specifications.value = _drafts[fromImage ? 'image' : 'redesign'];
  document.getElementById('prompt-json-title').textContent = fromImage ? 'Imagen a JSON' : 'Prompt JSON';
  document.getElementById('prompt-json-description').textContent = fromImage
    ? 'Copia el prompt y pégalo en una IA junto con la imagen del diseño. La IA devolverá un JSON que podrás cargar con «Importar JSON del portapapeles». Puedes añadir indicaciones opcionales.'
    : 'Describe cómo quieres cambiar el diseño. Se copiarán tus especificaciones, las instrucciones para la IA y el JSON completo para pegarlos en tu chat.';
  document.getElementById('prompt-json-label').textContent = fromImage ? 'Indicaciones adicionales (opcional)' : 'Especificaciones del rediseño';
  document.getElementById('prompt-json-copy').textContent = fromImage ? 'Copiar prompt para imagen' : 'Copiar prompt y JSON';
  specifications.placeholder = fromImage ? 'Por ejemplo: reproduce los colores y textos de la imagen y crea componentes editables.' : 'Por ejemplo: reorganiza la pantalla en dos columnas, usa tonos verdes y aumenta el tamaño del botón principal.';
  document.getElementById('prompt-json-error').hidden = true;
  dialog.showModal();
  document.getElementById('prompt-json-specifications').focus();
}

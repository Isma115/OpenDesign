# Propiedades y organización

## Propósito

Permite ajustar el lienzo, los elementos y sus capas desde un panel contextual y una lista de capas.

## Comportamiento principal

- Sin selección se muestran ancho, alto, fondo y tamaño de cuadrícula del lienzo; con una forma se muestran posición, tamaño, rotación, relleno, borde, opacidad, trazo y propiedades tipográficas.
- El panel de una forma también permite editar clase y reglas CSS, cambiar capa, bloquear, duplicar o eliminar; en un grupo, los cambios visuales se aplican a sus superficies.
- El panel de un conector ofrece tipo de ruta, estilo, marcador, punteado, capa y etiqueta.
- La pestaña Capas ordena los elementos de mayor a menor `zIndex`, permite seleccionarlos y alternar su visibilidad.
- Organizar permite traer al frente, enviar al fondo, avanzar o retroceder, alinear izquierda/centro/derecha, distribuir horizontal/verticalmente y agrupar o desagrupar.

## Criterios de aceptación

- Cambiar una propiedad válida actualiza el lienzo y registra el estado visible del elemento.
- Ocultar un elemento desde Capas lo retira del renderizado y volver a activar su visibilidad lo restaura.
- Las operaciones de alineación, distribución y orden modifican las posiciones o capas seleccionadas sin alterar elementos no seleccionados.

## Evidencia de código

- `app/index.html`
- `app/js/ui.js`
- `app/js/renderer.js`

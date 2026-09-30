# Selección y navegación del lienzo

## Propósito

Permite localizar, seleccionar, mover y revisar elementos dentro del área de trabajo mediante puntero, teclado y zoom.

## Comportamiento principal

- Un clic selecciona un elemento; Shift alterna elementos en la selección y arrastrar sobre un área vacía crea una selección rectangular por intersección.
- El hit testing respeta visibilidad y orden de capa, detecta líneas y conectores por proximidad y limpia la selección al pulsar sobre el lienzo vacío.
- Una selección única muestra marco, ocho manejadores de tamaño y un manejador de rotación; los elementos bloqueados no muestran manejadores editables.
- El movimiento usa ajuste a la cuadrícula cuando está activo y puede alinearse con bordes o centros de otros objetos, mostrando guías temporales.
- La herramienta Mano o la barra espaciadora desplazan la vista. La rueda, los botones y los atajos cambian el zoom entre 10% y 500%; también existe ajuste al contenido.

## Criterios de aceptación

- Seleccionar varios elementos con Shift o con una caja actualiza la selección visual y el contador de estado.
- Arrastrar un elemento con el snapping activo lo aproxima a la cuadrícula y a referencias de objetos dentro de la tolerancia configurada.
- Hacer zoom o pan cambia la vista sin alterar las coordenadas almacenadas de los elementos.

## Evidencia de código

- `app/js/selection.js`
- `app/js/tools.js`
- `app/js/snapping.js`

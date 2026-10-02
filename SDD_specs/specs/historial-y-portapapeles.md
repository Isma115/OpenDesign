# Historial y portapapeles

## Propósito

Permite revertir cambios y reutilizar elementos sin perder sus relaciones internas.

## Comportamiento principal

- Las operaciones editables guardan instantáneas del conjunto de elementos; el historial conserva hasta 50 acciones y una nueva acción vacía la rama de rehacer.
- Deshacer y rehacer restauran las instantáneas, marcan el documento como modificado, vuelven a renderizar y refrescan la selección.
- Copiar incluye los hijos de los grupos seleccionados; pegar genera identificadores nuevos, desplaza la copia 40 unidades, asigna nuevas capas y remapea los extremos de conectores copiados.
- Cortar combina copia y borrado. Duplicar combina copia y pegado. El borrado desde la interfaz también elimina conectores vinculados a los elementos borrados.
- Los atajos cubren deshacer/rehacer, copiar/cortar/pegar, duplicar, seleccionar todo, agrupar/desagrupar, borrar, cambio de herramienta, movimiento por flechas y zoom.

## Criterios de aceptación

- Tras una modificación registrada, Deshacer restaura el estado anterior y Rehacer recupera el estado posterior.
- Pegar un grupo conserva su estructura y hace que sus conectores internos apunten a las copias, no a los originales.
- Copiar o duplicar elementos seleccionados los deja seleccionados en la nueva posición.

## Evidencia de código

- `app/js/core/history.js`
- `app/js/io/clipboard.js`
- `app/js/editor/keyboard.js`

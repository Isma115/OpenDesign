# Tema y shell de escritorio

## Propósito

Proporciona la apariencia clara u oscura y el contenedor Electron que inicia la aplicación y conecta sus menús con el editor.

## Comportamiento principal

- El tema por defecto es oscuro; el usuario puede alternar entre oscuro y claro y la elección se guarda en `localStorage`.
- Los componentes no tendrán radio en los bordes, es decir, todos serán cuadrados
- Cambiar el tema actualiza los estilos de la interfaz, el fondo y patrones de cuadrícula del SVG, y el color del marcador de flecha; las nuevas figuras de flujo, notas, frames y componentes toman la paleta activa.
- Electron abre una ventana GeoFlow maximizable, con tamaño mínimo de 800×600, aislamiento de contexto y un preload dedicado.
- El menú nativo expone acciones de nuevo, abrir, guardar, descargar JSON y exportar HTML/SVG/PNG, enviándolas al renderer mediante eventos.
- El preload limita el puente a acciones de menú, diálogos de abrir/guardar y datos básicos de versión y plataforma.
- Componentes finos, dependiendo del modo (oscuro/claro) se dibujarán con un color por defecto más claro, o más oscuro. Modo claro: Más oscuro, Modo oscuro: Más claro

## Criterios de aceptación

- Reiniciar la aplicación conserva el último tema guardado y actualiza controles y lienzo.
- Ejecutar abrir, guardar o exportar desde el menú de Electron entrega la acción al editor mediante `menu-action`.
- El renderer puede solicitar abrir o guardar contenido mediante las funciones `openFile` y `saveFile` expuestas por el preload.

## Evidencia de código

- `app/js/theme.js`
- `electron-main.js`
- `preload.js`

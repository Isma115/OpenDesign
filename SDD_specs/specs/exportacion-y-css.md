# Exportación y CSS

## Propósito

Permite convertir el documento actual en archivos JSON, HTML, SVG o PNG y conservar estilos visuales reutilizables para los componentes exportados.

## Comportamiento principal

- JSON descarga el modelo completo; SVG clona el lienzo y elimina selección, guías, previsualizaciones y puntos de conexión antes de descargarlo.
- PNG rasteriza una copia del SVG sobre un canvas a doble resolución y usa el fondo del documento.
- HTML genera una página con el tamaño y fondo del lienzo, posiciones absolutas y elementos semánticos para grupos como botones, inputs, tarjetas, tablas, modales e imágenes.
- El panel CSS permite asignar un nombre compartido y reglas específicas; las reglas nombradas se almacenan en `document.styles.componentCss` y se sincronizan entre elementos con la misma clase.
- El bundle exportado combina estilos visuales derivados del modelo, reglas compartidas y reglas locales. El renderer interpreta para el lienzo propiedades visuales reconocidas como fondo, borde, opacidad, radio y tipografía.

## Criterios de aceptación

- Cada formato genera una descarga con el nombre del documento; SVG, PNG y HTML representan el lienzo sin controles de edición, mientras JSON conserva el modelo.
- Una clase CSS compartida aplicada a varios elementos produce una regla reutilizable y la misma apariencia durante el renderizado.
- La exportación HTML incluye geometría, contenido textual y estilos del documento, escapando valores de texto y atributos.

## Evidencia de código

- `app/js/io/export.js`
- `app/js/core/css-template.js`
- `app/js/editor/renderer.js`

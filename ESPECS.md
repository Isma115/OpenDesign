# Especificación técnica: Aplicación web para diseño de interfaces y diagramas de flujo

## 1. Resumen del producto

La aplicación será una herramienta web construida con **HTML, CSS y JavaScript vanilla** para crear diseños visuales de interfaces usando figuras geométricas, conectores, texto, agrupaciones y capas, con una experiencia similar a **Google Drawings / Google Draws**. Además, incluirá funcionalidades específicas para crear **diagramas de flujo**, permitiendo representar procesos con nodos, decisiones, conexiones y rutas condicionales.

El objetivo principal es ofrecer un editor visual en el navegador que permita arrastrar, dibujar, seleccionar, editar, alinear, conectar, exportar y guardar elementos gráficos sin depender inicialmente de frameworks externos.

---

## 2. Objetivos principales

### 2.1 Objetivos funcionales

- Crear diseños de interfaces mediante figuras geométricas.
- Crear diagramas de flujo con nodos conectados.
- Dibujar, mover, redimensionar, rotar y editar elementos visuales.
- Usar una barra de herramientas similar a editores gráficos online.
- Permitir selección múltiple, agrupación, bloqueo y ordenamiento por capas.
- Conectar figuras mediante líneas, flechas y conectores ortogonales.
- Editar estilos: color de relleno, borde, grosor, opacidad, tipografía y sombras.
- Guardar el proyecto en JSON.
- Cargar proyectos guardados.
- Exportar el lienzo como PNG, SVG y JSON.
- Implementar deshacer y rehacer.
- Soportar zoom, desplazamiento, cuadrícula y guías de alineación.

### 2.2 Objetivos no funcionales

- Funcionamiento completo en navegador moderno.
- Arquitectura modular y mantenible.
- Sin backend obligatorio para la primera versión.
- Interfaz responsive para escritorio y tablets.
- Alto rendimiento con múltiples elementos en pantalla.
- Código organizado en módulos JavaScript.
- Separación clara entre estado, renderizado, interacción y persistencia.

---

## 3. Público objetivo

- Diseñadores de interfaces.
- Desarrolladores front-end.
- Product managers.
- Profesores y estudiantes.
- Equipos que necesiten diagramar flujos o wireframes rápidos.
- Usuarios que buscan una alternativa ligera a Google Drawings, Figma básico o draw.io.

---

## 4. Alcance de la primera versión

La primera versión debe permitir crear y editar dibujos 2D básicos con figuras, texto y conectores.

### Incluido en v1

- Lienzo de trabajo.
- Figuras geométricas básicas.
- Herramienta de texto.
- Selección simple y múltiple.
- Movimiento y redimensionado.
- Panel de propiedades.
- Conectores para diagramas.
- Guardado/carga local mediante JSON.
- Exportación a PNG y SVG.
- Deshacer/rehacer.
- Zoom y cuadrícula.

### No incluido en v1

- Colaboración en tiempo real.
- Autenticación de usuarios.
- Backend persistente.
- Comentarios colaborativos.
- Historial remoto de versiones.
- Componentes avanzados tipo Figma.
- Plugins externos.

---

## 5. Tecnologías

### 5.1 Base técnica

- **HTML5** para estructura.
- **CSS3** para estilos, layout y temas.
- **JavaScript ES Modules** para lógica.
- **SVG** como motor principal de dibujo.
- **LocalStorage / IndexedDB** para persistencia local.
- **Canvas 2D** opcional para exportación a PNG.

### 5.2 Decisión de renderizado

Se recomienda usar **SVG** como tecnología principal porque:

- Permite manipular elementos individuales del DOM.
- Facilita selección, edición y eventos por figura.
- Exporta naturalmente a SVG.
- Escala sin pérdida de calidad.
- Es más simple para conectores, texto y formas vectoriales.

Canvas puede utilizarse únicamente como apoyo para exportar imágenes rasterizadas.

---

## 6. Arquitectura general

La aplicación se dividirá en módulos independientes.

```txt
/app
  index.html
  /css
    reset.css
    layout.css
    toolbar.css
    canvas.css
    panels.css
    themes.css
  /js
    main.js
    state.js
    renderer.js
    tools.js
    selection.js
    shapes.js
    connectors.js
    history.js
    storage.js
    export.js
    keyboard.js
    geometry.js
    snapping.js
    ui.js
```

---

## 7. Estructura HTML principal

```html
<body>
  <div id="app">
    <header id="topbar">
      <div class="brand">GeoFlow Designer</div>
      <nav class="menu-bar"></nav>
    </header>

    <main id="workspace">
      <aside id="left-toolbar"></aside>

      <section id="canvas-wrapper">
        <div id="rulers"></div>
        <svg id="canvas" xmlns="http://www.w3.org/2000/svg"></svg>
      </section>

      <aside id="right-panel"></aside>
    </main>

    <footer id="statusbar"></footer>
  </div>
</body>
```

---

## 8. Diseño visual de la interfaz

### 8.1 Zonas principales

1. **Barra superior**  
   Contiene menú de archivo, edición, vista, exportación, nombre del documento y acciones rápidas.

2. **Barra lateral izquierda**  
   Contiene herramientas de dibujo: selección, rectángulo, círculo, texto, línea, conector, mano, zoom.

3. **Lienzo central**  
   Área principal de trabajo con cuadrícula, guías, zoom y desplazamiento.

4. **Panel derecho**  
   Muestra propiedades del elemento seleccionado: posición, tamaño, color, borde, texto, capa, enlaces.

5. **Barra inferior**  
   Muestra coordenadas, zoom actual, número de objetos seleccionados y estado de guardado.

---

## 9. Herramientas de edición

### 9.1 Herramienta de selección

Permite:

- Seleccionar un elemento.
- Seleccionar múltiples elementos con `Shift`.
- Crear selección por arrastre rectangular.
- Mover elementos.
- Mostrar manejadores de redimensión.
- Mostrar manejador de rotación.
- Editar puntos de conexión.

### 9.2 Herramienta de figuras

Figuras disponibles:

- Rectángulo.
- Rectángulo redondeado.
- Círculo.
- Elipse.
- Triángulo.
- Rombo.
- Pentágono.
- Hexágono.
- Línea.
- Flecha.
- Polígono.
- Estrella.
- Contenedor / frame.

### 9.3 Herramientas para diagramas de flujo

Figuras específicas:

- Inicio / fin.
- Proceso.
- Decisión.
- Entrada / salida.
- Documento.
- Subproceso.
- Base de datos.
- Conector circular.
- Nota / comentario.

### 9.4 Herramienta de texto

Permite:

- Insertar texto libre.
- Editar texto dentro de figuras.
- Cambiar fuente, tamaño, peso, alineación y color.
- Ajustar texto automáticamente al tamaño de la figura.
- Crear etiquetas para conectores.

### 9.5 Herramienta de conectores

Permite:

- Unir figuras con líneas.
- Crear flechas direccionales.
- Usar conectores rectos, curvos u ortogonales.
- Anclar conectores a puntos de conexión de figuras.
- Recalcular la posición del conector cuando se mueve una figura.
- Añadir etiquetas sobre el conector.

---

## 10. Modelo de datos

El documento completo se representará como un objeto JSON.

```js
const documentModel = {
  id: "doc_001",
  name: "Nuevo diseño",
  version: "1.0.0",
  canvas: {
    width: 1920,
    height: 1080,
    background: "#ffffff",
    grid: {
      enabled: true,
      size: 16,
      color: "#e5e7eb"
    },
    zoom: 1,
    pan: { x: 0, y: 0 }
  },
  elements: [],
  pages: [],
  metadata: {
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
};
```

---

## 11. Modelo de elemento gráfico

Cada figura debe tener una estructura uniforme.

```js
const shapeElement = {
  id: "el_123",
  type: "shape",
  shape: "rectangle",
  x: 100,
  y: 80,
  width: 240,
  height: 120,
  rotation: 0,
  locked: false,
  visible: true,
  zIndex: 1,
  style: {
    fill: "#ffffff",
    stroke: "#111827",
    strokeWidth: 2,
    opacity: 1,
    dashArray: "",
    shadow: false
  },
  text: {
    value: "Texto",
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 16,
    fontWeight: 400,
    color: "#111827",
    align: "center",
    verticalAlign: "middle"
  },
  connectionPoints: [
    { id: "top", x: 0.5, y: 0 },
    { id: "right", x: 1, y: 0.5 },
    { id: "bottom", x: 0.5, y: 1 },
    { id: "left", x: 0, y: 0.5 }
  ]
};
```

---

## 12. Modelo de conector

```js
const connectorElement = {
  id: "conn_001",
  type: "connector",
  connectorType: "orthogonal",
  source: {
    elementId: "el_123",
    pointId: "right"
  },
  target: {
    elementId: "el_456",
    pointId: "left"
  },
  points: [
    { x: 340, y: 140 },
    { x: 460, y: 140 },
    { x: 460, y: 300 }
  ],
  style: {
    stroke: "#111827",
    strokeWidth: 2,
    dashArray: "",
    startMarker: null,
    endMarker: "arrow"
  },
  label: {
    value: "Sí",
    x: 400,
    y: 130,
    fontSize: 14,
    color: "#111827"
  },
  zIndex: 2
};
```

---

## 13. Estado global de la aplicación

```js
const appState = {
  document: documentModel,
  selectedElementIds: [],
  activeTool: "select",
  clipboard: [],
  history: {
    past: [],
    future: []
  },
  viewport: {
    zoom: 1,
    panX: 0,
    panY: 0
  },
  interaction: {
    isDragging: false,
    isDrawing: false,
    dragStart: null,
    currentPointer: null
  }
};
```

---

## 14. Renderizado SVG

### 14.1 Principio general

El renderizador debe transformar el modelo JSON en nodos SVG.

Responsabilidades del renderizador:

- Limpiar y reconstruir el lienzo cuando sea necesario.
- Actualizar solo elementos modificados cuando sea posible.
- Añadir atributos SVG según tipo de elemento.
- Renderizar controles de selección en una capa separada.
- Renderizar conectores detrás o delante según `zIndex`.

### 14.2 Capas SVG recomendadas

```html
<svg id="canvas">
  <defs id="svg-defs"></defs>
  <g id="grid-layer"></g>
  <g id="background-layer"></g>
  <g id="connector-layer"></g>
  <g id="shape-layer"></g>
  <g id="text-layer"></g>
  <g id="selection-layer"></g>
  <g id="guide-layer"></g>
</svg>
```

---

## 15. Sistema de coordenadas

El sistema debe distinguir entre:

- Coordenadas de pantalla.
- Coordenadas del lienzo.
- Coordenadas locales del elemento.

Funciones necesarias:

```js
function screenToCanvas(clientX, clientY) {}
function canvasToScreen(x, y) {}
function getElementBounds(element) {}
function getRotatedBounds(element) {}
function pointInElement(point, element) {}
```

---

## 16. Interacciones principales

### 16.1 Crear figura

Flujo:

1. Usuario selecciona herramienta de figura.
2. Usuario hace clic y arrastra en el lienzo.
3. Se muestra una previsualización.
4. Al soltar, se crea el elemento definitivo.
5. Se añade al estado.
6. Se guarda una acción en el historial.
7. Se selecciona automáticamente la nueva figura.

### 16.2 Seleccionar elemento

Flujo:

1. Usuario hace clic sobre una figura.
2. Se detecta el elemento objetivo.
3. Se actualiza `selectedElementIds`.
4. Se renderizan bordes y manejadores de selección.
5. Se actualiza el panel de propiedades.

### 16.3 Mover elemento

Flujo:

1. Usuario arrastra un elemento seleccionado.
2. Se calcula el delta de movimiento.
3. Se aplica snapping si está activo.
4. Se actualiza la posición.
5. Se recalculan conectores vinculados.
6. Se actualiza el renderizado.
7. Al soltar, se registra la acción en historial.

### 16.4 Redimensionar elemento

Flujo:

1. Usuario arrastra un manejador.
2. Se calcula nuevo ancho y alto.
3. Se respetan mínimos de tamaño.
4. Con `Shift`, se mantiene proporción.
5. Con `Alt`, se redimensiona desde el centro.
6. Se actualiza el modelo.

---

## 17. Sistema de snapping y guías

Debe incluir:

- Ajuste a cuadrícula.
- Ajuste a bordes de otros elementos.
- Ajuste a centros horizontales y verticales.
- Guías visuales temporales.
- Tolerancia configurable, por ejemplo 6 píxeles.

```js
const snappingConfig = {
  enabled: true,
  snapToGrid: true,
  snapToObjects: true,
  tolerance: 6
};
```

---

## 18. Panel de propiedades

El panel derecho debe cambiar según el tipo de selección.

### 18.1 Sin selección

Mostrar propiedades del lienzo:

- Ancho.
- Alto.
- Color de fondo.
- Cuadrícula activada/desactivada.
- Tamaño de cuadrícula.

### 18.2 Figura seleccionada

Mostrar:

- Posición X/Y.
- Ancho/alto.
- Rotación.
- Relleno.
- Borde.
- Grosor de borde.
- Opacidad.
- Texto.
- Tipografía.
- Alineación.
- Bloquear/desbloquear.
- Orden de capa.

### 18.3 Conector seleccionado

Mostrar:

- Tipo de conector.
- Color de línea.
- Grosor.
- Tipo de flecha.
- Etiqueta.
- Estilo de línea.
- Origen y destino.

---

## 19. Barra de herramientas

Herramientas mínimas:

| Herramienta | Icono sugerido | Acción |
|---|---:|---|
| Selección | Cursor | Seleccionar y mover |
| Mano | Mano | Desplazar lienzo |
| Rectángulo | Cuadrado | Crear rectángulos |
| Círculo | Círculo | Crear círculos |
| Rombo | Diamante | Crear decisiones |
| Texto | T | Insertar texto |
| Línea | Línea | Crear líneas |
| Conector | Flecha | Conectar figuras |
| Zoom | Lupa | Ampliar/reducir |
| Comentario | Nota | Añadir notas |

---

## 20. Menús superiores

### 20.1 Archivo

- Nuevo.
- Abrir JSON.
- Guardar localmente.
- Descargar JSON.
- Exportar PNG.
- Exportar SVG.
- Exportar PDF en versión futura.

### 20.2 Editar

- Deshacer.
- Rehacer.
- Cortar.
- Copiar.
- Pegar.
- Duplicar.
- Eliminar.
- Seleccionar todo.

### 20.3 Ver

- Mostrar cuadrícula.
- Ajustar a cuadrícula.
- Mostrar guías.
- Zoom 50%.
- Zoom 100%.
- Zoom 200%.
- Ajustar al contenido.

### 20.4 Organizar

- Traer al frente.
- Enviar al fondo.
- Adelantar.
- Atrasar.
- Alinear izquierda.
- Alinear centro.
- Alinear derecha.
- Distribuir horizontalmente.
- Distribuir verticalmente.
- Agrupar.
- Desagrupar.

---

## 21. Atajos de teclado

| Atajo | Acción |
|---|---|
| `V` | Selección |
| `R` | Rectángulo |
| `O` | Elipse |
| `T` | Texto |
| `L` | Línea |
| `C` | Conector |
| `Ctrl + Z` | Deshacer |
| `Ctrl + Shift + Z` | Rehacer |
| `Ctrl + C` | Copiar |
| `Ctrl + V` | Pegar |
| `Ctrl + D` | Duplicar |
| `Delete` | Eliminar |
| `Ctrl + A` | Seleccionar todo |
| `Ctrl + G` | Agrupar |
| `Ctrl + Shift + G` | Desagrupar |
| `+` | Zoom in |
| `-` | Zoom out |
| `0` | Zoom 100% |
| `Espacio + arrastrar` | Mover lienzo |

---

## 22. Diagramas de flujo

### 22.1 Tipos de nodos

| Nodo | Figura | Uso |
|---|---|---|
| Inicio / fin | Rectángulo redondeado / óvalo | Marca inicio o cierre |
| Proceso | Rectángulo | Acción o tarea |
| Decisión | Rombo | Condición sí/no |
| Entrada / salida | Paralelogramo | Captura o salida de datos |
| Documento | Rectángulo con borde inferior curvo | Documento generado |
| Base de datos | Cilindro | Almacenamiento |
| Subproceso | Rectángulo doble | Proceso reutilizable |

### 22.2 Reglas de conexión

- Los nodos pueden tener varios conectores entrantes y salientes.
- Los conectores deben poder mostrar flecha final.
- Los nodos de decisión deben permitir etiquetas como `Sí`, `No`, `True`, `False`.
- Al mover un nodo, sus conectores deben actualizarse automáticamente.
- El usuario debe poder reconectar una línea arrastrando sus extremos.

### 22.3 Validación opcional

La aplicación puede incluir una validación básica:

- Detectar nodos sin conexión.
- Detectar decisiones sin dos salidas.
- Detectar ciclos.
- Detectar ausencia de nodo inicial.
- Detectar ausencia de nodo final.

---

## 23. Funcionalidad tipo diseño de interfaces

La aplicación debe permitir diseñar wireframes o mockups básicos usando figuras.

### 23.1 Componentes prediseñados

- Botón.
- Input.
- Textarea.
- Checkbox.
- Radio button.
- Toggle.
- Card.
- Modal.
- Barra superior.
- Menú lateral.
- Avatar.
- Tabla.
- Lista.
- Imagen placeholder.
- Icono genérico.

### 23.2 Librería de componentes

El panel izquierdo o un panel adicional puede incluir una sección de componentes UI que se arrastran al lienzo.

Cada componente se puede representar como un grupo de figuras.

Ejemplo de botón:

```js
const buttonComponent = {
  type: "group",
  name: "Button",
  children: [
    {
      type: "shape",
      shape: "roundedRectangle",
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      style: {
        fill: "#2563eb",
        stroke: "#1d4ed8",
        strokeWidth: 1
      }
    },
    {
      type: "text",
      value: "Button",
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      style: {
        color: "#ffffff",
        fontSize: 14,
        align: "center"
      }
    }
  ]
};
```

---

## 24. Agrupación de elementos

La agrupación permite tratar varios elementos como uno solo.

```js
const groupElement = {
  id: "group_001",
  type: "group",
  x: 100,
  y: 100,
  width: 400,
  height: 300,
  rotation: 0,
  children: ["el_001", "el_002", "el_003"],
  locked: false,
  visible: true,
  zIndex: 10
};
```

Funciones necesarias:

```js
function groupSelectedElements() {}
function ungroupElement(groupId) {}
function moveGroup(groupId, dx, dy) {}
function resizeGroup(groupId, width, height) {}
```

---

## 25. Historial de cambios

Debe implementarse con pilas `past` y `future`.

Cada acción debe guardar suficiente información para revertirse.

```js
const historyAction = {
  id: "action_001",
  type: "updateElement",
  timestamp: Date.now(),
  before: {},
  after: {}
};
```

Acciones registrables:

- Crear elemento.
- Eliminar elemento.
- Mover elemento.
- Redimensionar elemento.
- Cambiar estilo.
- Editar texto.
- Agrupar.
- Desagrupar.
- Cambiar orden de capa.
- Crear conector.
- Eliminar conector.

---

## 26. Persistencia

### 26.1 Guardado local

Opciones:

- `localStorage` para documentos pequeños.
- `IndexedDB` para documentos grandes.
- Descarga manual del archivo JSON.

### 26.2 Formato de archivo

Extensión sugerida:

```txt
.geoflow.json
```

Contenido:

```json
{
  "id": "doc_001",
  "name": "Diagrama de flujo",
  "version": "1.0.0",
  "canvas": {},
  "elements": []
}
```

---

## 27. Exportación

### 27.1 Exportar SVG

Proceso:

1. Clonar el nodo SVG.
2. Insertar estilos inline.
3. Eliminar capas de selección y guías.
4. Serializar con `XMLSerializer`.
5. Crear un `Blob`.
6. Descargar el archivo.

### 27.2 Exportar PNG

Proceso:

1. Generar SVG limpio.
2. Convertir SVG a URL de objeto.
3. Cargarlo en una imagen.
4. Dibujarlo en un `<canvas>`.
5. Usar `canvas.toBlob()`.
6. Descargar PNG.

### 27.3 Exportar JSON

Proceso:

1. Serializar `documentModel`.
2. Formatear con indentación.
3. Crear archivo descargable.

---

## 28. Importación

La aplicación debe permitir importar archivos JSON generados por ella misma.

Validaciones mínimas:

- Verificar que exista `version`.
- Verificar que `elements` sea un array.
- Verificar IDs únicos.
- Ignorar propiedades desconocidas.
- Mostrar error si el archivo es inválido.

---

## 29. CSS y sistema visual

### 29.1 Variables CSS

```css
:root {
  --color-bg: #f3f4f6;
  --color-surface: #ffffff;
  --color-border: #d1d5db;
  --color-text: #111827;
  --color-muted: #6b7280;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --toolbar-width: 56px;
  --right-panel-width: 280px;
  --topbar-height: 48px;
  --statusbar-height: 28px;
}
```

### 29.2 Layout base

```css
#app {
  height: 100vh;
  display: grid;
  grid-template-rows: var(--topbar-height) 1fr var(--statusbar-height);
  background: var(--color-bg);
  color: var(--color-text);
}

#workspace {
  display: grid;
  grid-template-columns: var(--toolbar-width) 1fr var(--right-panel-width);
  overflow: hidden;
}

#canvas-wrapper {
  position: relative;
  overflow: auto;
  background: #e5e7eb;
}

#canvas {
  width: 1920px;
  height: 1080px;
  background: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}
```

---

## 30. Accesibilidad

Requisitos:

- Botones con `aria-label`.
- Navegación por teclado.
- Contraste suficiente.
- Estados focus visibles.
- Atajos documentados.
- Panel de ayuda accesible.
- Textos editables compatibles con lectores de pantalla cuando sea posible.

---

## 31. Rendimiento

Buenas prácticas:

- No rerenderizar todo el SVG en cada movimiento si no es necesario.
- Usar `requestAnimationFrame` durante arrastres.
- Separar estado confirmado de estado temporal de interacción.
- Evitar listeners individuales innecesarios si se puede usar delegación.
- Mantener índices por ID para búsqueda rápida.
- Usar bounding boxes cacheadas para selección múltiple.

---

## 32. Seguridad

Aunque la app sea local, debe evitar riesgos básicos:

- Sanitizar texto insertado por el usuario.
- No ejecutar scripts importados desde JSON.
- No insertar HTML arbitrario con `innerHTML` salvo que esté sanitizado.
- Validar archivos importados.
- Limitar tamaño máximo de archivo.

---

## 33. Módulos JavaScript recomendados

### 33.1 `state.js`

Responsable de almacenar y modificar el estado global.

Funciones:

```js
export function getState() {}
export function setState(partialState) {}
export function updateDocument(updater) {}
export function addElement(element) {}
export function updateElement(id, patch) {}
export function removeElement(id) {}
```

### 33.2 `renderer.js`

Responsable del renderizado SVG.

```js
export function renderDocument(documentModel) {}
export function renderElement(element) {}
export function renderSelection(selectedIds) {}
export function updateElementNode(element) {}
```

### 33.3 `tools.js`

Responsable de activar herramientas e interpretar eventos.

```js
export function setActiveTool(toolName) {}
export function handlePointerDown(event) {}
export function handlePointerMove(event) {}
export function handlePointerUp(event) {}
```

### 33.4 `connectors.js`

Responsable de conectores.

```js
export function createConnector(source, target) {}
export function updateConnectorPath(connectorId) {}
export function getConnectionPoint(element, pointId) {}
export function routeOrthogonalConnector(sourcePoint, targetPoint) {}
```

### 33.5 `history.js`

Responsable de deshacer y rehacer.

```js
export function commitAction(action) {}
export function undo() {}
export function redo() {}
export function clearHistory() {}
```

### 33.6 `export.js`

Responsable de exportaciones.

```js
export function exportAsJSON(documentModel) {}
export function exportAsSVG(svgNode) {}
export function exportAsPNG(svgNode) {}
```

---

## 34. Flujo de inicialización

```js
import { initUI } from "./ui.js";
import { initKeyboard } from "./keyboard.js";
import { renderDocument } from "./renderer.js";
import { getState } from "./state.js";

function main() {
  initUI();
  initKeyboard();
  renderDocument(getState().document);
}

main();
```

---

## 35. Eventos principales

La aplicación debe manejar:

- `pointerdown`
- `pointermove`
- `pointerup`
- `dblclick`
- `keydown`
- `keyup`
- `wheel`
- `input`
- `change`
- `dragstart`
- `drop`

Se recomienda usar Pointer Events para compatibilidad con mouse, stylus y pantallas táctiles.

---

## 36. Casos de uso principales

### 36.1 Crear wireframe simple

1. Usuario crea un frame.
2. Añade barra superior.
3. Añade menú lateral.
4. Añade cards.
5. Añade botones y textos.
6. Exporta como PNG.

### 36.2 Crear diagrama de flujo

1. Usuario añade nodo de inicio.
2. Añade procesos.
3. Añade decisión.
4. Conecta nodos con flechas.
5. Etiqueta salidas `Sí` y `No`.
6. Exporta como SVG o JSON.

### 36.3 Editar documento existente

1. Usuario abre archivo `.geoflow.json`.
2. El sistema valida el documento.
3. Se renderiza el contenido.
4. Usuario modifica elementos.
5. Guarda una nueva versión.

---

## 37. Criterios de aceptación

La primera versión se considera completa si cumple:

- El usuario puede crear al menos 6 tipos de figuras.
- El usuario puede mover y redimensionar figuras.
- El usuario puede editar color, borde y texto.
- El usuario puede conectar dos figuras con una flecha.
- Los conectores se actualizan al mover las figuras.
- El usuario puede hacer undo/redo.
- El usuario puede guardar y cargar JSON.
- El usuario puede exportar SVG y PNG.
- El zoom funciona correctamente.
- La selección múltiple funciona correctamente.
- La aplicación no pierde datos al refrescar si se activó autoguardado.

---

## 38. Roadmap sugerido

### Fase 1: Editor básico

- Lienzo SVG.
- Figuras básicas.
- Selección.
- Movimiento.
- Redimensión.
- Estilos.

### Fase 2: Diagramas

- Conectores.
- Flechas.
- Nodos de flujo.
- Etiquetas de conectores.
- Recalculo automático.

### Fase 3: Productividad

- Undo/redo robusto.
- Agrupación.
- Alineación.
- Distribución.
- Snapping.
- Capas.

### Fase 4: Persistencia y exportación

- Guardado local.
- Importar/exportar JSON.
- Exportar SVG.
- Exportar PNG.

### Fase 5: Funciones avanzadas

- Plantillas.
- Librería de componentes UI.
- Temas.
- Validación de diagramas.
- Exportación PDF.
- Colaboración en tiempo real con backend opcional.

---

## 39. Posible estructura de clases

```js
class ElementModel {
  constructor(data) {
    Object.assign(this, data);
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }
}

class ShapeElement extends ElementModel {
  getConnectionPoint(pointId) {}
  toSVG() {}
}

class ConnectorElement extends ElementModel {
  updatePath() {}
  toSVG() {}
}
```

---

## 40. Ejemplo mínimo de creación de figura

```js
function createRectangle(x, y, width, height) {
  return {
    id: crypto.randomUUID(),
    type: "shape",
    shape: "rectangle",
    x,
    y,
    width,
    height,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: Date.now(),
    style: {
      fill: "#ffffff",
      stroke: "#111827",
      strokeWidth: 2,
      opacity: 1
    },
    text: {
      value: "",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: 16,
      color: "#111827",
      align: "center",
      verticalAlign: "middle"
    }
  };
}
```

---

## 41. Ejemplo mínimo de renderizado

```js
function renderRectangle(svg, element) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

  rect.setAttribute("x", element.x);
  rect.setAttribute("y", element.y);
  rect.setAttribute("width", element.width);
  rect.setAttribute("height", element.height);
  rect.setAttribute("fill", element.style.fill);
  rect.setAttribute("stroke", element.style.stroke);
  rect.setAttribute("stroke-width", element.style.strokeWidth);
  rect.dataset.elementId = element.id;

  svg.appendChild(rect);
}
```

---

## 42. Ejemplo mínimo de conector SVG

```js
function renderConnector(svg, connector) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const d = connector.points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", connector.style.stroke);
  path.setAttribute("stroke-width", connector.style.strokeWidth);
  path.setAttribute("marker-end", "url(#arrow-marker)");
  path.dataset.elementId = connector.id;

  svg.appendChild(path);
}
```

---

## 43. Definición SVG para flechas

```html
<defs>
  <marker
    id="arrow-marker"
    markerWidth="10"
    markerHeight="10"
    refX="10"
    refY="5"
    orient="auto"
    markerUnits="strokeWidth">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#111827"></path>
  </marker>
</defs>
```

---

## 44. Requisitos de pruebas

### 44.1 Pruebas manuales

- Crear cada tipo de figura.
- Mover figuras con y sin snapping.
- Redimensionar figuras desde cada manejador.
- Crear conectores entre figuras.
- Mover figuras conectadas y verificar actualización del conector.
- Guardar JSON.
- Cargar JSON.
- Exportar SVG.
- Exportar PNG.
- Probar undo/redo.
- Probar selección múltiple.

### 44.2 Pruebas unitarias sugeridas

- Conversión de coordenadas.
- Cálculo de bounding boxes.
- Snapping.
- Ruteo de conectores.
- Serialización y deserialización.
- Historial undo/redo.

---

## 45. Riesgos técnicos

| Riesgo | Impacto | Mitigación |
|---|---:|---|
| Bajo rendimiento con muchos nodos SVG | Alto | Render incremental y throttling |
| Complejidad de conectores ortogonales | Medio | Empezar con conectores rectos |
| Exportación PNG inconsistente | Medio | Normalizar estilos inline antes de exportar |
| Edición de texto en SVG compleja | Alto | Usar `foreignObject` o editor HTML flotante |
| Historial pesado | Medio | Guardar diffs en vez de snapshots completos |

---

## 46. Recomendación de implementación inicial

Para construir la aplicación de forma incremental, se recomienda este orden:

1. Crear layout HTML/CSS.
2. Crear SVG central con cuadrícula.
3. Implementar estado global.
4. Implementar creación de rectángulos.
5. Implementar selección y movimiento.
6. Implementar redimensión.
7. Implementar estilos desde panel derecho.
8. Implementar texto.
9. Implementar conectores simples.
10. Implementar conectores anclados.
11. Implementar undo/redo.
12. Implementar importación/exportación.
13. Añadir figuras de diagramas de flujo.
14. Añadir librería de componentes UI.
15. Optimizar rendimiento.

---

## 47. Resultado esperado

Al finalizar, la aplicación debe comportarse como un editor visual web ligero donde el usuario pueda construir interfaces, wireframes y diagramas de flujo arrastrando figuras, editando propiedades y conectando elementos de manera intuitiva.

El producto debe sentirse familiar para usuarios de herramientas como Google Drawings, diagrams.net, Miro o editores de wireframes básicos, pero con una base técnica simple en HTML, CSS y JavaScript.

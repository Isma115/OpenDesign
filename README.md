# Trazuvia

Aplicación de escritorio para diseño de interfaces y diagramas de flujo.

## Requisitos

- Node.js 16 o superior
- npm

## Instalación

```bash
npm install
```

## Desarrollo

Ejecutar la aplicación en modo desarrollo:

```bash
npm start
```

## Construcción

Construir instaladores para tu plataforma:

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Los instaladores se generarán en la carpeta `dist/`.

## Características

- Editor visual con figuras geométricas
- Diagramas de flujo con conectores
- Selección múltiple y agrupación
- Panel de propiedades
- Exportación a HTML, SVG, PNG y JSON
- Plantilla CSS global para estilos visuales reutilizables de componentes HTML
- Modo oscuro/claro
- Guardado automático

## Plantilla CSS global

La pestaña `CSS` del panel derecho permite editar una plantilla global que se guarda dentro del archivo `.trazuvia.json`. Esta plantilla define clases reutilizables como `.trazuvia-button`, `.trazuvia-input`, `.trazuvia-card`, `.trazuvia-navbar`, `.trazuvia-sidebar`, `.trazuvia-table` y `.trazuvia-modal`.

La plantilla tiene dos modos de edicion. `Visual` modifica tokens y reglas frecuentes mediante controles de color y campos simples. `Codigo` permite editar el CSS completo en un editor oscuro con fuente y resaltado de sintaxis inspirado en Visual Studio Code.

La plantilla global debe contener solo reglas visuales: colores, tipografia, padding, bordes, radios, sombras, fondos y estados como `:hover`, `:focus` o `:disabled`. Si se escriben propiedades de layout o posicionamiento como `position`, `display`, `grid`, `flex`, `margin`, `top`, `left`, `width` o `height`, el editor las advierte y las omite al exportar HTML.

Cada elemento seleccionado tiene una seccion `CSS HTML` en sus propiedades. `Clases globales` indica que clases de la plantilla usa el componente. `CSS especifico` permite escribir reglas unicas para ese componente; estas reglas se exportan despues de la plantilla global y por eso pueden sobrescribirla cuando sea necesario.

## Diseños y rediseños con un chat

En el menú **Archivo**, **Cargar diseño…** abre un archivo JSON desde la carpeta
que elijas. **Guardar** pide ubicación la primera vez y después actualiza el
archivo abierto o guardado. **Guardar como…** permite elegir otra carpeta y
nombre. Atajos: Cmd/Ctrl+O, Cmd/Ctrl+S y Cmd/Ctrl+Mayús+S, respectivamente.
El autoguardado mantiene una copia de recuperación local; no sustituye el
guardado del archivo ni marca sus cambios como guardados.

El menú **Archivo** incluye **Exportar JSON** e **Importar JSON**. Activa
**Ver → Funciones extra** para mostrar **Prompt JSON**, **Imagen a JSON** e
**Importar JSON del portapapeles**. Estas funciones están ocultas en cada inicio.
Con **Prompt JSON**, escribe las especificaciones del rediseño en el diálogo y
pulsa **Copiar prompt y JSON**. Se copian tus indicaciones, las reglas del formato
de Trazuvia y el documento completo al portapapeles. Pégalos en tu chat, guarda
su respuesta como archivo JSON e impórtalo para cargar el rediseño. También
puedes exportar el archivo `.trazuvia.json` para adjuntarlo al chat.
Con **Imagen a JSON**, añade indicaciones opcionales y copia el prompt. Pégalo
en tu IA junto con la imagen del diseño. El prompt incluye las reglas y un
ejemplo del formato para generar componentes editables. Copia la respuesta y
usa **Importar JSON del portapapeles** para cargarla; después guarda el diseño.
Para crear un diseño nuevo, puedes cargar el Proyecto de Ejemplo, exportarlo
como referencia del formato y pedir al chat que lo sustituya por tu propuesta.

Ejemplo de instrucciones para el chat:

```text
Rediseña el documento JSON de Trazuvia adjunto siguiendo estas instrucciones:
[describe aquí los cambios de distribución, colores, textos y componentes].

Devuelve únicamente el JSON completo, sin comentarios ni explicaciones.
Conserva el formato y la versión del documento, canvas, styles y metadata.
Usa identificadores únicos y conserva las referencias válidas de children,
layerCollections y conectores. Los hijos de los grupos tienen coordenadas
absolutas del lienzo. Mantén todas las propiedades necesarias de cada elemento
y utiliza los tipos de figuras y componentes que aparecen en el documento.
```

La importación sustituye el diseño abierto; se pide confirmación si hay cambios
sin guardar. Un JSON genérico de otro formato no es un documento de Trazuvia.

## Tecnologías

- Electron
- HTML5
- CSS3
- JavaScript ES Modules
- SVG

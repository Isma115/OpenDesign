"# OpenDesign" 

## Organización del código

Los módulos se agrupan por responsabilidad para mantener localizables las piezas de cada flujo:

```mermaid
flowchart LR
  APP[app]
  APP --> JS[js]
  APP --> CSS[css]
  JS --> CORE[core<br/>estado, geometría, historial, snapping]
  JS --> MODEL[model<br/>figuras, componentes, conectores, ejemplo]
  JS --> EDITOR[editor<br/>renderer, selección, herramientas, teclado]
  JS --> IO[io<br/>persistencia, exportación, portapapeles]
  JS --> UI[ui<br/>interfaz y temas]
  JS --> MAIN[main.js<br/>entrada del renderer]
  CSS --> BASE[base<br/>reset y temas]
  CSS --> LAYOUT[layout<br/>layout y canvas]
  CSS --> COMPONENTS[components<br/>paneles y toolbar]
  APP --> SHELL[index.html, preload.js, electron-main.js]
```

Los puntos de entrada (`main.js`, `index.html`, `preload.js` y `electron-main.js`) permanecen visibles fuera de las categorías para no ocultar el arranque de Electron.

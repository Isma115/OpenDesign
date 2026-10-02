# Trazuvia - Aplicación de Escritorio

## Estructura del Proyecto

```
Diseniador/
├── electron-main.js      # Proceso principal de Electron
├── preload.js            # Script de precarga para APIs seguras
├── package.json          # Configuración del proyecto
├── app/                  # Aplicación web (HTML/CSS/JS)
│   ├── index.html
│   ├── css/
│   └── js/
└── README.md
```

## Ejecutar la Aplicación

### Modo Desarrollo
```bash
npm start
```

Esto abrirá la aplicación de escritorio con Electron.

### Construir Instalador

Para Windows:
```bash
npm run build:win
```

Para macOS:
```bash
npm run build:mac
```

Para Linux:
```bash
npm run build:linux
```

Los instaladores se generarán en la carpeta `dist/`.

## Características de la Aplicación de Escritorio

### Integración Nativa
- Menú de aplicación nativo (Archivo, Editar, Ver, Ayuda)
- Diálogos de archivo nativos para abrir/guardar
- Atajos de teclado del sistema (Ctrl+N, Ctrl+O, Ctrl+S, etc.)
- Icono de aplicación personalizado

### Funcionalidades
- Todas las funciones de la versión web
- Guardado automático en localStorage
- Exportación a JSON, SVG y PNG
- Modo oscuro/claro con persistencia
- Sin necesidad de servidor web

## Diferencias con la Versión Web

1. **No requiere servidor**: La aplicación se ejecuta directamente como programa de escritorio
2. **Diálogos nativos**: Usa los diálogos de archivo del sistema operativo
3. **Menú integrado**: Menú de aplicación en la barra de título
4. **Persistencia**: Los datos se guardan en el sistema de archivos local
5. **Distribución**: Se puede compilar en instaladores para Windows, macOS y Linux

## Desarrollo

La aplicación usa la misma base de código HTML/CSS/JS que la versión web, pero empaquetada con Electron para funcionar como aplicación de escritorio.

### Archivos Principales

- `electron-main.js`: Configura la ventana y el menú de la aplicación
- `preload.js`: Expone APIs seguras del proceso principal al renderer
- `app/`: Contiene toda la lógica de la aplicación (igual que la versión web)

## Notas Técnicas

- La aplicación usa `contextIsolation: true` para seguridad
- `nodeIntegration: false` para prevenir inyección de código
- Las APIs de Node.js se exponen de forma segura mediante `contextBridge`
- Los diálogos de archivo se manejan en el proceso principal

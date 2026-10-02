# Persistencia del ancho del panel derecho

```mermaid
flowchart LR
    A[Inicio de la aplicación] --> B[Leer geoflow_right_panel_width]
    B --> C{¿Hay un ancho válido?}
    C -->|Sí| D[Aplicar variable CSS y actualizar aria-valuenow]
    C -->|No| E[Usar ancho CSS por defecto]
    D --> F[Arrastrar o ajustar con teclado]
    E --> F
    F --> G[Limitar entre 180 y 480 px]
    G --> H[Actualizar --right-panel-width]
    H --> I[Guardar en localStorage al finalizar]
```

El ancho del panel es una preferencia de interfaz local. No se incorpora al JSON del diseño, por lo que cambiar de proyecto no altera la preferencia guardada.

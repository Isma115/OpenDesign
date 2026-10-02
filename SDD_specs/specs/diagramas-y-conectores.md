# Diagramas y conectores

## Propósito

Permite representar flujos mediante símbolos específicos y conexiones ancladas que se mantienen asociadas a sus elementos.

## Comportamiento principal

- La barra de herramientas crea Inicio/Fin, Proceso, Decisión, Entrada/Salida, Base de datos, Documento y Subproceso con estilos iniciales dependientes del tema.
- Los elementos conectables exponen puntos superior, derecho, inferior e izquierdo; texto, frames, imágenes y conectores no actúan como destinos.
- Línea y flecha crean trazos libres; Conector inicia sobre un elemento y termina sobre otro, eligiendo puntos de conexión cercanos o adecuados a la dirección.
- Las rutas disponibles son recta, ortogonal y curva desde las propiedades; la ruta ortogonal usa tramos intermedios y los conectores nuevos llevan flecha final por defecto.
- El panel permite cambiar tipo, color, grosor, punteado, marcador, capa y etiqueta. Mover, redimensionar o rotar un elemento recalcula los conectores relacionados.

## Criterios de aceptación

- Conectar dos elementos compatibles crea un conector visible con referencias a origen y destino.
- Cambiar la geometría de un extremo conectado actualiza el trazado y la posición de la etiqueta.
- Eliminar un elemento desde la interfaz elimina también los conectores que dependían de él.

## Evidencia de código

- `app/js/model/shapes.js`
- `app/js/model/connectors.js`
- `app/js/editor/tools.js`

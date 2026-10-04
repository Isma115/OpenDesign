export function buildImageJSONPrompt(specifications = '') {
  const example = {
    id: 'doc_image', name: 'Diseño desde imagen', version: '1.0.0',
    canvas: { width: 1280, height: 720, background: '#ffffff', grid: { enabled: true, size: 4, color: '#e5e7eb' }, zoom: 1, pan: { x: 0, y: 0 } },
    elements: [{
      id: 'el_button', name: 'Botón', type: 'shape', shape: 'roundedRectangle',
      x: 40, y: 40, width: 160, height: 48, rotation: 0, locked: false, visible: true, zIndex: 1,
      style: { fill: '#2563eb', stroke: '#2563eb', strokeWidth: 0, borderWidth: 1, borderRadius: 8, opacity: 1, dashArray: '', shadow: false },
      text: { value: 'Continuar', fontFamily: 'Inter, Arial, sans-serif', fontSize: 16, fontWeight: 600, color: '#ffffff', align: 'center', verticalAlign: 'middle' },
      connectionPoints: [{ id: 'top', x: 0.5, y: 0 }, { id: 'right', x: 1, y: 0.5 }, { id: 'bottom', x: 0.5, y: 1 }, { id: 'left', x: 0, y: 0.5 }]
    }],
    pages: [], layerCollections: [], styles: { componentCss: {} },
    metadata: { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
  };
  return `Recrea la imagen adjunta como un diseño editable en Trazuvia.
Analiza su distribución, proporciones, colores, tipografía y textos, y genera un documento JSON completo.

REGLAS DEL FORMATO
- Devuelve únicamente JSON válido, sin Markdown, comentarios ni explicaciones.
- Usa exactamente la estructura del ejemplo al final, con version "1.0.0". Sustituye los elementos de ejemplo por los de la imagen y actualiza nombre, tamaño del lienzo y fechas ISO de metadata.
- Ajusta canvas.width y canvas.height a las dimensiones de la imagen; el origen (0,0) está arriba a la izquierda. Todas las posiciones y dimensiones son números en píxeles, sin unidades.
- Construye las piezas visibles con type "shape" y shape "rectangle", "roundedRectangle" o "ellipse". Usa text.value para los textos; para texto independiente usa type "text" y shape "text" con style.fill "none" y strokeWidth 0.
- Mantén los campos del ejemplo en cada pieza, asigna id únicos y zIndex crecientes (fondo primero). Usa colores hexadecimales, opacity entre 0 y 1 y rotation en grados. No inventes tipos de componentes.
- Por defecto strokeWidth es 0 (sin borde). Si la imagen muestra un borde, usa su grosor en strokeWidth y borderWidth, y su color en stroke. Usa borderRadius para las esquinas redondeadas.
- Para componentes con varias piezas puedes usar type "group" con id, name, x, y, width, height, rotation, locked, visible, zIndex y children (lista de id). Sus piezas deben aparecer también en elements, con coordenadas absolutas del lienzo, no relativas al grupo. No incluyas referencias inexistentes ni ciclos.
- Reproduce el contenido con piezas y textos editables; no insertes la captura completa como una imagen ni uses enlaces externos. Si algún detalle no se distingue, aproxima su aspecto sin inventar contenido innecesario.
- Antes de responder, comprueba que el JSON sea válido, que todos los id sean únicos y que las piezas encajen dentro del lienzo. El resultado debe poder importarse directamente en Trazuvia.

INDICACIONES ADICIONALES
${String(specifications || '').trim() || 'Reproduce fielmente la imagen adjunta.'}

EJEMPLO DE FORMATO (no es el diseño a reproducir)
${JSON.stringify(example, null, 2)}`;
}

export function buildJSONPrompt(doc, specifications) {
  const instructions = String(specifications || '').trim();
  if (!instructions) throw new Error('Escribe las especificaciones del rediseño');
  return `Actúa como diseñador de interfaces y editor de documentos JSON de Trazuvia.
Ajusta el diseño incluido al final siguiendo las especificaciones del usuario.

REGLAS DEL FORMATO
- Devuelve únicamente el documento JSON completo y válido, sin Markdown, comentarios ni explicaciones.
- Conserva la versión y la estructura de Trazuvia: canvas, elements, styles, metadata y layerCollections si existe.
- Conserva lo que no se solicite cambiar. Mantén los identificadores de los elementos existentes y usa identificadores únicos para los nuevos.
- Actualiza las referencias de children, colecciones y conectores si añades o eliminas elementos. No dejes referencias a elementos inexistentes.
- Las posiciones x e y de los elementos, incluidos los hijos de grupos, son coordenadas absolutas del lienzo, en píxeles.
- Usa números para posiciones, dimensiones, rotación y grosores; conserva los tipos y propiedades del modelo del documento.
- Los componentes se representan como grupos y sus piezas aparecen también en elements. Si mueves o redimensionas un grupo, ajusta sus piezas y conexiones.
- Aplica los colores y bordes a las piezas visibles de los componentes y conserva sus textos y estilos CSS compatibles.
- El resultado debe poder importarse directamente como un archivo .trazuvia.json.

ESPECIFICACIONES DEL USUARIO
${instructions}

DOCUMENTO JSON ACTUAL
${JSON.stringify(doc, null, 2)}`;
}

// #region Proyecto de ejemplo | Funcionalidad | documento editable de demostracion
import { createComponentGroup, getPendingChildren } from './components.js';
import { createShapeByTool, createConnector, createGroup, getShapeDisplayName } from './shapes.js';
import { createDefaultStyles } from '../core/css-template.js';
import { getConnectionPoint, getConnectionPointDirection, routeConnector } from './connectors.js';
import { createLayerCollection } from './layer-collections.js';

export function createExampleDocument() {
  const elements = [];
  const organization = { layerCollections: [] };
  let collection = createLayerCollection(organization, 'Presentación · Órbita');
  const presentationCollection = collection;
  const ink = '#183b36', muted = '#52685f', paper = '#fffdf7';
  const green = '#d6ef9c', coral = '#efad96', blue = '#bddaea';
  const fontFamily = 'Avenir Next, Avenir, Segoe UI, sans-serif';
  const add = element => {
    element.zIndex = elements.length + 1;
    elements.push(element);
    collection.elementIds.push(element.id);
    return element;
  };
  const shape = (tool, x, y, width, height, fill, value = '') => {
    const el = createShapeByTool(tool, x, y, width, height);
    // Las dimensiones de la maqueta son exactas, también en separadores de 1 px.
    el.width = width;
    el.height = height;
    el.name = value.replace(/\s+/g, ' ').trim() || `${getShapeDisplayName(tool)} · ${elements.length + 1}`;
    el.style = { ...el.style, fill, stroke: 'none', strokeWidth: 0 };
    el.text = { ...el.text, value, color: ink, fontSize: 15, fontFamily };
    if (tool === 'roundedRectangle') el.style.borderRadius = 0;
    return add(el);
  };
  const text = (value, x, y, width, size = 16, color = ink, weight = 400, height = 36) => {
    const el = shape('text', x, y, width, height, 'none', value);
    el.width = width;
    el.height = height;
    el.text = { ...el.text, align: 'left', fontSize: size, fontWeight: weight, color };
    return el;
  };
  const button = (value, x, y, width, secondary = false) => {
    const group = createComponentGroup('button', x, y);
    group.name = value;
    group.width = width;
    group.css.className = secondary ? 'orbita-secondary' : 'orbita-primary';
    const children = getPendingChildren(group.id);
    children[0].width = width;
    children[0].text.value = value;
    children[0].name = `${value} · superficie`;
    children[0].style.fill = secondary ? green : ink;
    children[0].style.stroke = 'none';
    children[0].text.color = secondary ? ink : paper;
    children[0].text.fontFamily = fontFamily;
    children[0].style.borderRadius = 0;
    add(group);
    children.forEach(add);
    return group;
  };
  const frame = (name, x, y, width, height) => {
    text(name, x, y - 38, width, 14, muted, 600);
    const el = shape('frame', x, y, width, height, paper);
    el.name = name;
    el.style = { ...el.style, stroke: '#c8d4c9', strokeWidth: 1, dashArray: '' };
    return el;
  };
  // The landscape is built from native shapes; every part remains editable.
  const landscape = (x, y, width, height, context) => {
    const start = elements.length;
    shape('rectangle', x, y, width, height, blue);
    shape('ellipse', x + width * .66, y + height * .12, width * .18, width * .18, '#fff0b8');
    shape('triangle', x + width * .04, y + height * .20, width * .60, height * .64, '#749a88');
    shape('triangle', x + width * .35, y + height * .34, width * .61, height * .50, ink);
    shape('rectangle', x, y + height * .78, width, height * .22, green);
    shape('ellipse', x + width * .32, y + height * .82, width * .43, height * .12, blue);
    const parts = elements.slice(start);
    const names = ['Cielo', 'Sol', 'Montaña al fondo', 'Montaña en primer plano', 'Pradera', 'Lago'];
    parts.forEach((element, index) => { element.name = `${context} · ${names[index]}`; });
    const group = createGroup(parts.map(el => el.id), x, y, width, height);
    group.name = `${context} · Paisaje`;
    group.css = { className: 'orbita-landscape', rules: '' };
    return add(group);
  };

  // Fondo propio: la presentación conserva su contraste en ambos temas.
  const backdrop = shape('rectangle', 0, 0, 1500, 1380, '#e9eee3');
  backdrop.name = 'Fondo de presentación';
  backdrop.locked = true;
  text('ÓRBITA / Escapadas con otra perspectiva', 40, 28, 1320, 34, ink, 700, 56);
  text('Una marca, dos pantallas y un recorrido. Todo construido con elementos editables de Trazuvia.', 40, 88, 1320, 16, muted);

  collection = createLayerCollection(organization, '01 / Web · Descubrir');
  frame('01 / WEB · Descubrir', 48, 184, 1000, 650);
  shape('hexagon', 76, 204, 30, 30, ink);
  text('órbita', 110, 200, 140, 23, ink, 700);
  text('Destinos', 508, 202, 96, 14, ink, 600);
  shape('rectangle', 516, 236, 56, 2, ink);
  text('Filosofía', 622, 202, 96, 14, muted);
  text('Diario', 736, 202, 80, 14, muted);
  shape('rectangle', 80, 254, 936, 1, '#dce3d8');
  button('Mi cuenta', 910, 202, 112, true);
  shape('rectangle', 80, 286, 226, 28, green, 'MENOS PRISA. MÁS VIDA.').text.fontSize = 12;
  text(`Tu próxima pausa
empieza aquí.`, 72, 336, 510, 46, ink, 700, 126);
  text(`Lugares cerca. Recuerdos lejos de lo habitual.
Escapadas elegidas para reconectar.`, 72, 478, 480, 16, muted, 400, 60);
  button('Explorar escapadas  →', 80, 558, 236);
  text('Desde 89 € / persona · sin prisas, sin sorpresas', 72, 612, 470, 13, muted);
  landscape(610, 286, 406, 318, 'Web');
  const destination = shape('rectangle', 722, 564, 270, 78, paper);
  destination.name = 'Web · ficha de destino';
  destination.style.stroke = '#c8d4c9';
  destination.style.strokeWidth = 1;
  text('Picos de Europa', 736, 572, 238, 18, ink, 600);
  text('Naturaleza · 3 días · 4,9 / 5', 736, 605, 238, 12, muted);
  text('Encuentra tu ritmo', 72, 662, 500, 24, ink, 600);
  text('Tres maneras de desconectar', 738, 664, 278, 13, muted);
  [['Montaña', green, 'Aire puro y caminos nuevos'], ['Costa', blue, 'Sal, sol y sobremesas'], ['Rural', coral, 'Volver a lo esencial']].forEach(([label, fill, caption], index) => {
    const x = 80 + index * 314;
    shape('rectangle', x, 710, 294, 96, '#f1f3eb').name = `Categoría ${label} · fondo`;
    shape('rectangle', x, 710, 4, 96, fill).name = `Categoría ${label} · acento`;
    text(label, x + 10, 718, 220, 21, ink, 600);
    text('↗', x + 248, 719, 36, 21, ink);
    text(caption, x + 10, 756, 270, 13, ink);
  });

  collection = createLayerCollection(organization, '02 / Móvil · Reservar');
  frame('02 / MÓVIL · Reservar', 1088, 184, 360, 650);
  text('órbita', 1104, 204, 220, 23, ink, 700);
  shape('rectangle', 1388, 208, 32, 32, '#eef2e7', '×');
  landscape(1112, 264, 312, 192, 'Móvil');
  text('TU ESCAPADA', 1104, 470, 300, 11, muted, 600);
  text(`Despierta entre
montañas.`, 1104, 502, 312, 29, ink, 700, 78);
  text('Picos de Europa · 3 días / 2 noches', 1104, 588, 320, 13, muted);
  const input = createComponentGroup('input', 1112, 636);
  input.name = 'Fechas de la escapada';
  input.width = 312;
  const inputChildren = getPendingChildren(input.id);
  inputChildren[0].width = 312;
  inputChildren[0].text.value = '12–14 junio · 2 personas';
  inputChildren[0].name = 'Fechas de la escapada · campo';
  inputChildren[0].style = { ...inputChildren[0].style, fill: '#f0f3e9', stroke: '#c8d4c9' };
  inputChildren[0].text.color = ink;
  inputChildren[0].text.fontFamily = fontFamily;
  input.css = { className: 'orbita-dates', rules: '' };
  inputChildren[0].style.borderRadius = 0;
  add(input);
  inputChildren.forEach(add);
  shape('rectangle', 1112, 694, 312, 1, '#dce3d8');
  text('189 €', 1104, 702, 160, 32, ink, 700);
  text('Todo incluido', 1280, 708, 144, 12, muted);
  text('por persona · 3 días / 2 noches', 1104, 738, 310, 12, muted);
  button('Reservar escapada  →', 1112, 776, 312);

  collection = createLayerCollection(organization, '03 / Sistema visual');
  frame('03 / SISTEMA VISUAL', 48, 902, 570, 390);
  text('Natural. Cercano. Optimista.', 64, 918, 520, 24, ink, 600);
  [[ink, 'Bosque'], [green, 'Lima'], [coral, 'Arcilla'], [blue, 'Cielo'], [paper, 'Marfil']].forEach(([fill, label], i) => {
    const swatch = shape('rectangle', 80 + i * 104, 978, 64, 64, fill);
    swatch.name = `Paleta · ${label}`;
    swatch.style.stroke = '#c8d4c9';
    swatch.style.strokeWidth = 1;
    text(label, 64 + i * 104, 1048, 100, 13, muted);
  });
  text('Aa / Un mundo por descubrir', 64, 1104, 530, 27, ink, 600);
  text('Avenir Next · títulos 46 / 29 / 24 · cuerpo 16 / 14', 64, 1150, 530, 14, muted);
  button('Acción principal', 80, 1214, 180);
  button('Acción secundaria', 280, 1214, 200, true);

  collection = createLayerCollection(organization, '04 / Experiencia · Recorrido de reserva');
  frame('04 / EXPERIENCIA · De la inspiración a la reserva', 658, 902, 790, 390);
  text('Un viaje sencillo, también por dentro.', 674, 918, 730, 24, ink, 600);
  const node = (tool, x, y, w, h, label, fill) => {
    const el = shape(tool, x, y, w, h, fill, label);
    el.text.fontSize = 14;
    el.text.fontWeight = 500;
    if (tool === 'flow-start') el.style.borderRadius = 0;
    return el;
  };
  const discover = node('flow-start', 688, 994, 146, 56, 'Explorar', green);
  const choose = node('flow-process', 894, 992, 164, 60, 'Elegir escapada', blue);
  const available = node('flow-decision', 1118, 974, 144, 96, '¿Hay plazas?', coral);
  const booking = node('flow-process', 1110, 1142, 160, 60, 'Reservar', green);
  const saved = node('flow-database', 1300, 1122, 120, 100, 'Reserva', blue);
  const alternative = node('flow-process', 886, 1142, 172, 60, 'Cambiar fechas', paper);
  alternative.style.stroke = '#c8d4c9';
  alternative.style.strokeWidth = 1;
  const connect = (source, sourcePoint, target, targetPoint, label = '') => {
    const el = createConnector({ elementId: source.id, pointId: sourcePoint }, { elementId: target.id, pointId: targetPoint });
    el.points = routeConnector(getConnectionPoint(source, sourcePoint), getConnectionPoint(target, targetPoint), el.connectorType,
      getConnectionPointDirection(source, sourcePoint), getConnectionPointDirection(target, targetPoint));
    el.name = `${source.name} → ${target.name}${label ? ` · ${label}` : ''}`;
    el.style.stroke = ink;
    el.label.value = label;
    el.label.color = ink;
    let index = 0;
    const length = i => Math.hypot(el.points[i + 1].x - el.points[i].x, el.points[i + 1].y - el.points[i].y);
    for (let i = 1; i < el.points.length - 1; i++) if (length(i) > length(index)) index = i;
    el.label.x = (el.points[index].x + el.points[index + 1].x) / 2;
    el.label.y = (el.points[index].y + el.points[index + 1].y) / 2 - 10;
    return add(el);
  };
  connect(discover, 'right', choose, 'left');
  connect(choose, 'right', available, 'left');
  connect(available, 'bottom', booking, 'top', 'Sí');
  connect(available, 'left', alternative, 'right', 'No');
  connect(alternative, 'top', choose, 'bottom');
  connect(booking, 'right', saved, 'left');
  collection = presentationCollection;
  text('Explora capas, desagrupa el paisaje o cambia el CSS compartido de los botones.', 48, 1314, 1400, 15, muted);
  const styles = createDefaultStyles();
  styles.componentCss['orbita-primary'] = 'background: #183b36; color: #fffdf7; border-width: 0; border-radius: 0; font-weight: 600;';
  styles.componentCss['orbita-secondary'] = 'background: #d6ef9c; color: #183b36; border-width: 0; border-radius: 0; font-weight: 600;';
  styles.componentCss['orbita-dates'] = 'background: #f0f3e9; color: #183b36; border: 1px solid #c8d4c9; border-radius: 0;';
  const now = new Date().toISOString();
  return {
    id: 'doc_' + crypto.randomUUID().slice(0, 8), name: 'Órbita · Escapadas con otra perspectiva', version: '1.0.0',
    canvas: { width: 1500, height: 1380, background: '#e9eee3',
      grid: { enabled: false, size: 4, color: '#d3dbcd' }, zoom: 1, pan: { x: 0, y: 0 } },
    elements, layerCollections: organization.layerCollections, pages: [], styles, metadata: { createdAt: now, updatedAt: now }
  };
}
// #endregion

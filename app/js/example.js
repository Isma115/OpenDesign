// #region Proyecto de ejemplo | Funcionalidad | documento editable de demostracion
import { createComponentGroup, getPendingChildren } from './components.js';
import { createShapeByTool, createConnector, createImage } from './shapes.js';
import { createDefaultStyles } from './css-template.js';
import { getConnectionPoint, getConnectionPointDirection, routeConnector } from './connectors.js';

export function createExampleDocument() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  const elements = [];
  const add = element => {
    element.zIndex = elements.length + 1;
    elements.push(element);
    return element;
  };
  const text = (value, x, y, width = 600, size = 18) => {
    const el = createShapeByTool('text', x, y);
    el.width = width;
    el.text = { ...el.text, value, align: 'left', fontSize: size };
    return add(el);
  };
  const component = (type, x, y, label, width, height) => {
    const group = createComponentGroup(type, x, y);
    const children = getPendingChildren(group.id);
    const sx = width ? width / group.width : 1;
    const sy = height ? height / group.height : 1;
    for (const child of children) {
      child.x = x + (child.x - x) * sx;
      child.y = y + (child.y - y) * sy;
      child.width *= sx;
      child.height *= sy;
    }
    group.width *= sx;
    group.height *= sy;
    if (label) {
      const content = children.find(child => child.text?.value);
      if (content) content.text.value = label;
    }
    add(group);
    children.forEach(add);
    return group;
  };

  text('OpenDesign · Proyecto de Ejemplo', 40, 24, 1300, 30);
  text('Selecciona, mueve y redimensiona los grupos. Edita sus hijos desde Capas.', 40, 72, 1300, 16);
  component('navbar', 40, 136, 'OpenDesign     Proyectos     Equipo     Ayuda', 900);
  component('sidebar', 40, 208, 'Panel de proyectos', 200, 520);
  component('avatar', 264, 208, 'OD');
  text('Tu espacio de diseño', 332, 210, 550, 24);
  component('card', 264, 280, 'Proyectos activos', 320, 160);
  component('card', 608, 280, 'Trabajo en equipo', 332, 160);
  component('table', 264, 464, 'Proyecto                 Estado                 Equipo', 676, 264);
  text('Biblioteca de componentes · Formulario y contenido', 40, 784, 900, 22);
  component('input', 40, 848, 'Nombre del proyecto', 280);
  component('textarea', 40, 908, null, 280, 112);
  component('checkbox', 40, 1044, 'Compartir');
  component('toggle', 224, 1044);
  component('button', 40, 1100, 'Crear proyecto', 160);
  component('image', 352, 848, null, 240, 172);
  component('modal', 624, 848, 'Confirmar proyecto', 316, 240);
  component('button', 648, 1020, 'Confirmar');
  const illustration = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140"><rect width="240" height="140" fill="#2563eb"/><circle cx="185" cy="35" r="18" fill="#fbbf24"/><path d="M0 140L80 45L150 140M100 140L180 70L240 140" fill="#bfdbfe"/></svg>';
  add(createImage(352, 1044, 240, 140, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(illustration)));

  text('Diagrama · Del diseño a la entrega', 1000, 136, 620, 24);
  const node = (tool, x, y, width, height, value) => {
    const el = createShapeByTool(tool, x, y, width, height);
    el.text.value = value;
    return add(el);
  };
  const start = node('flow-start', 1160, 208, 180, 56, 'Idea');
  const input = node('flow-io', 1160, 312, 180, 64, 'Requisitos');
  const process = node('flow-process', 1160, 424, 180, 64, 'Diseñar');
  const decision = node('flow-decision', 1170, 544, 160, 96, '¿Aprobado?');
  const deliver = node('flow-subprocess', 1160, 704, 180, 64, 'Exportar');
  const database = node('flow-database', 1450, 416, 120, 120, 'Proyecto');
  const output = node('flow-document', 1450, 696, 140, 96, 'HTML / SVG / PNG');
  const end = node('flow-start', 1160, 840, 180, 56, 'Entrega');
  const connect = (source, sourcePoint, target, targetPoint, label = '') => {
    const connector = createConnector(
      { elementId: source.id, pointId: sourcePoint },
      { elementId: target.id, pointId: targetPoint }
    );
    connector.points = routeConnector(
      getConnectionPoint(source, sourcePoint), getConnectionPoint(target, targetPoint),
      connector.connectorType,
      getConnectionPointDirection(source, sourcePoint), getConnectionPointDirection(target, targetPoint)
    );
    connector.label.value = label;
    const middleIndex = Math.floor((connector.points.length - 1) / 2);
    const first = connector.points[middleIndex];
    const second = connector.points[middleIndex + 1];
    connector.label.x = (first.x + second.x) / 2;
    connector.label.y = (first.y + second.y) / 2 - 10;
    return add(connector);
  };
  connect(start, 'bottom', input, 'top');
  connect(input, 'bottom', process, 'top');
  connect(process, 'bottom', decision, 'top');
  connect(process, 'right', database, 'left', 'Guardar');
  connect(decision, 'bottom', deliver, 'top', 'Sí');
  connect(decision, 'left', process, 'left', 'Revisar');
  connect(deliver, 'right', output, 'left');
  connect(deliver, 'bottom', end, 'top');
  node('note', 1000, 960, 240, 140, 'Los conectores siguen a los nodos al moverlos.');
  text('Formas, estilos y rotación', 1000, 1140, 620, 22);
  ['roundedRectangle', 'ellipse', 'triangle', 'diamond', 'pentagon', 'hexagon', 'star'].forEach((tool, index) => {
    const el = node(tool, 1000 + (index % 4) * 150, 1210 + Math.floor(index / 4) * 140, 104, 88, '');
    if (tool === 'star') el.rotation = 15;
    if (tool === 'roundedRectangle') el.style.shadow = true;
  });
  const now = new Date().toISOString();
  return {
    id: 'doc_' + crypto.randomUUID().slice(0, 8),
    name: 'Proyecto de Ejemplo', version: '1.0.0',
    canvas: {
      width: 1680, height: 1500, background: dark ? '#0f172a' : '#ffffff',
      grid: { enabled: true, size: 16, color: dark ? '#334155' : '#e5e7eb' },
      zoom: 1, pan: { x: 0, y: 0 }
    },
    elements, pages: [], styles: createDefaultStyles(),
    metadata: { createdAt: now, updatedAt: now }
  };
}
// #endregion

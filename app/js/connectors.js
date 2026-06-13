// #region Conectores | Funcionalidad | ruteo y gestion de conectores entre figuras
import { getState, getElementById, updateElement } from './state.js';
import { createConnector } from './shapes.js';
import { commitAction } from './history.js';

export function getConnectionPoint(element, pointId) {
  if (!element || !element.connectionPoints) return null;
  const cp = element.connectionPoints.find(p => p.id === pointId);
  if (!cp) return null;
  return {
    x: element.x + cp.x * element.width,
    y: element.y + cp.y * element.height
  };
}

export function routeOrthogonalConnector(sourcePoint, targetPoint) {
  const points = [];
  points.push({ x: sourcePoint.x, y: sourcePoint.y });

  const dx = targetPoint.x - sourcePoint.x;
  const dy = targetPoint.y - sourcePoint.y;

  if (Math.abs(dx) > 10 && Math.abs(dy) > 10) {
    const midX = sourcePoint.x + dx / 2;
    points.push({ x: midX, y: sourcePoint.y });
    points.push({ x: midX, y: targetPoint.y });
  } else if (Math.abs(dx) > Math.abs(dy)) {
    const midX = sourcePoint.x + dx / 2;
    points.push({ x: midX, y: sourcePoint.y });
    points.push({ x: midX, y: targetPoint.y });
  } else {
    const midY = sourcePoint.y + dy / 2;
    points.push({ x: sourcePoint.x, y: midY });
    points.push({ x: targetPoint.x, y: midY });
  }

  points.push({ x: targetPoint.x, y: targetPoint.y });
  return points;
}

export function routeStraightConnector(sourcePoint, targetPoint) {
  return [
    { x: sourcePoint.x, y: sourcePoint.y },
    { x: targetPoint.x, y: targetPoint.y }
  ];
}

export function routeCurvedConnector(sourcePoint, targetPoint) {
  const dx = targetPoint.x - sourcePoint.x;
  const dy = targetPoint.y - sourcePoint.y;
  const cpOffset = Math.max(Math.abs(dx), Math.abs(dy)) * 0.4;
  return [
    { x: sourcePoint.x, y: sourcePoint.y },
    { x: sourcePoint.x + cpOffset * Math.sign(dx || 1), y: sourcePoint.y },
    { x: targetPoint.x - cpOffset * Math.sign(dx || 1), y: targetPoint.y },
    { x: targetPoint.x, y: targetPoint.y }
  ];
}

export function routeConnector(sourcePoint, targetPoint, connectorType) {
  switch (connectorType) {
    case 'straight': return routeStraightConnector(sourcePoint, targetPoint);
    case 'curved': return routeCurvedConnector(sourcePoint, targetPoint);
    case 'orthogonal':
    default: return routeOrthogonalConnector(sourcePoint, targetPoint);
  }
}

export function createConnectorElement(sourceInfo, targetInfo, connectorType) {
  const sourceEl = getElementById(sourceInfo.elementId);
  const targetEl = getElementById(targetInfo.elementId);
  if (!sourceEl || !targetEl) return null;

  const sourcePoint = getConnectionPoint(sourceEl, sourceInfo.pointId);
  const targetPoint = getConnectionPoint(targetEl, targetInfo.pointId);
  if (!sourcePoint || !targetPoint) return null;

  const connector = createConnector(sourceInfo, targetInfo, connectorType || 'orthogonal');
  connector.points = routeConnector(sourcePoint, targetPoint, connector.connectorType);

  const midIdx = Math.floor(connector.points.length / 2);
  if (connector.points[midIdx]) {
    connector.label.x = connector.points[midIdx].x;
    connector.label.y = connector.points[midIdx].y - 10;
  }

  return connector;
}

export function updateConnectorPath(connectorId) {
  const connector = getElementById(connectorId);
  if (!connector || connector.type !== 'connector') return;

  const sourceEl = getElementById(connector.source.elementId);
  const targetEl = getElementById(connector.target.elementId);
  if (!sourceEl || !targetEl) return;

  const sourcePoint = getConnectionPoint(sourceEl, connector.source.pointId);
  const targetPoint = getConnectionPoint(targetEl, connector.target.pointId);
  if (!sourcePoint || !targetPoint) return;

  connector.points = routeConnector(sourcePoint, targetPoint, connector.connectorType);

  const midIdx = Math.floor(connector.points.length / 2);
  if (connector.points[midIdx]) {
    connector.label.x = connector.points[midIdx].x;
    connector.label.y = connector.points[midIdx].y - 10;
  }
}

export function updateAllConnectorsForElement(elementId) {
  const state = getState();
  for (const el of state.document.elements) {
    if (el.type !== 'connector') continue;
    if (el.source.elementId === elementId || el.target.elementId === elementId) {
      updateConnectorPath(el.id);
    }
  }
}

export function findNearestConnectionPoint(element, point) {
  if (!element || !element.connectionPoints) return null;
  let nearest = null;
  let minDist = Infinity;
  for (const cp of element.connectionPoints) {
    const cpx = element.x + cp.x * element.width;
    const cpy = element.y + cp.y * element.height;
    const dist = Math.sqrt((point.x - cpx) ** 2 + (point.y - cpy) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = cp.id;
    }
  }
  return nearest;
}
// #endregion

// #region Conectores | Funcionalidad | ruteo y gestion de conectores entre figuras
import { getState, getElementById, updateElement, updateElements } from '../core/state.js';
import { pointInElement, getLocalConnectionPoint } from '../core/geometry.js';
import { createConnector } from './shapes.js';

const DEFAULT_DIRECTION = { x: 1, y: 0 };
const MIN_ORTHOGONAL_OFFSET = 28;

export function isConnectableElement(element) {
  return Boolean(
    element &&
    element.type !== 'connector' &&
    element.type !== 'text' &&
    element.shape !== 'frame' &&
    element.shape !== 'image' &&
    Array.isArray(element.connectionPoints) &&
    element.connectionPoints.length > 0
  );
}

export function getConnectableElementAtPoint(point, excludedElementId = null) {
  const state = getState();
  const elements = [...state.document.elements]
    .filter(element => element.visible !== false && element.id !== excludedElementId)
    .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  return elements.find(element => isConnectableElement(element) && pointInElement(point, element)) || null;
}

export function getConnectionPoint(element, pointId) {
  if (!isConnectableElement(element)) return null;
  const connectionPoint = element.connectionPoints.find(point => point.id === pointId);
  if (!connectionPoint) return null;

  const point = getLocalConnectionPoint(element, connectionPoint);

  return _rotatePointAroundElementCenter(point, element);
}

export function getConnectionPointDirection(element, pointId) {
  if (!isConnectableElement(element)) return { ...DEFAULT_DIRECTION };
  const connectionPoint = element.connectionPoints.find(point => point.id === pointId);
  if (!connectionPoint) return { ...DEFAULT_DIRECTION };

  const localDirection = _normalize({
    x: connectionPoint.x - 0.5,
    y: connectionPoint.y - 0.5
  });
  const rotation = (element.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return _normalize({
    x: localDirection.x * cos - localDirection.y * sin,
    y: localDirection.x * sin + localDirection.y * cos
  });
}

export function getConnectionPointIdFromClick(element, point, tolerance = 14) {
  if (!isConnectableElement(element)) return null;
  let nearestId = null;
  let nearestDistance = Infinity;

  for (const connectionPoint of element.connectionPoints) {
    const position = getConnectionPoint(element, connectionPoint.id);
    if (!position) continue;
    const distance = Math.hypot(point.x - position.x, point.y - position.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = connectionPoint.id;
    }
  }

  return nearestDistance <= tolerance ? nearestId : null;
}

export function getBestConnectionPointId(element, referencePoint, preferredPointId = null) {
  if (!isConnectableElement(element)) return null;
  if (preferredPointId && element.connectionPoints.some(point => point.id === preferredPointId)) {
    return preferredPointId;
  }

  const center = _getElementCenter(element);
  const directionToReference = _normalize({
    x: referencePoint.x - center.x,
    y: referencePoint.y - center.y
  });
  let bestPointId = element.connectionPoints[0].id;
  let bestScore = -Infinity;

  for (const connectionPoint of element.connectionPoints) {
    const direction = getConnectionPointDirection(element, connectionPoint.id);
    const score = direction.x * directionToReference.x + direction.y * directionToReference.y;
    if (score > bestScore) {
      bestScore = score;
      bestPointId = connectionPoint.id;
    }
  }

  return bestPointId;
}

export function resolveConnectorEndpoints(sourceElement, targetElement, sourcePointId = null, targetPointId = null) {
  if (!isConnectableElement(sourceElement) || !isConnectableElement(targetElement)) return null;

  const sourceCenter = _getElementCenter(sourceElement);
  const targetCenter = _getElementCenter(targetElement);
  const sourceId = getBestConnectionPointId(sourceElement, targetCenter, sourcePointId);
  const targetId = getBestConnectionPointId(targetElement, sourceCenter, targetPointId);

  if (!sourceId || !targetId) return null;
  return {
    source: { elementId: sourceElement.id, pointId: sourceId },
    target: { elementId: targetElement.id, pointId: targetId }
  };
}

export function routeOrthogonalConnector(sourcePoint, targetPoint, sourceDirection = null, targetDirection = null) {
  if (!sourceDirection || !targetDirection) {
    return _routeSimpleOrthogonal(sourcePoint, targetPoint);
  }

  const sourceLead = _offsetPoint(sourcePoint, sourceDirection, MIN_ORTHOGONAL_OFFSET);
  const targetLead = _offsetPoint(targetPoint, targetDirection, MIN_ORTHOGONAL_OFFSET);
  const sourceIsHorizontal = Math.abs(sourceDirection.x) >= Math.abs(sourceDirection.y);
  const targetIsHorizontal = Math.abs(targetDirection.x) >= Math.abs(targetDirection.y);
  const points = [sourcePoint, sourceLead];

  if (sourceIsHorizontal && targetIsHorizontal) {
    const middleX = (sourceLead.x + targetLead.x) / 2;
    points.push({ x: middleX, y: sourceLead.y });
    points.push({ x: middleX, y: targetLead.y });
  } else if (!sourceIsHorizontal && !targetIsHorizontal) {
    const middleY = (sourceLead.y + targetLead.y) / 2;
    points.push({ x: sourceLead.x, y: middleY });
    points.push({ x: targetLead.x, y: middleY });
  } else if (sourceIsHorizontal) {
    points.push({ x: targetLead.x, y: sourceLead.y });
  } else {
    points.push({ x: sourceLead.x, y: targetLead.y });
  }

  points.push(targetLead, targetPoint);
  return _removeDuplicatePoints(points);
}

export function routeStraightConnector(sourcePoint, targetPoint) {
  return [
    { x: sourcePoint.x, y: sourcePoint.y },
    { x: targetPoint.x, y: targetPoint.y }
  ];
}

export function routeCurvedConnector(sourcePoint, targetPoint, sourceDirection = null, targetDirection = null) {
  const distance = Math.hypot(targetPoint.x - sourcePoint.x, targetPoint.y - sourcePoint.y);
  const controlOffset = Math.max(40, distance * 0.4);
  const sourceVector = sourceDirection || _normalize({ x: targetPoint.x - sourcePoint.x, y: targetPoint.y - sourcePoint.y });
  const targetVector = targetDirection || _normalize({ x: sourcePoint.x - targetPoint.x, y: sourcePoint.y - targetPoint.y });

  return [
    { x: sourcePoint.x, y: sourcePoint.y },
    _offsetPoint(sourcePoint, sourceVector, controlOffset),
    _offsetPoint(targetPoint, targetVector, controlOffset),
    { x: targetPoint.x, y: targetPoint.y }
  ];
}

export function routeConnector(sourcePoint, targetPoint, connectorType, sourceDirection = null, targetDirection = null) {
  switch (connectorType) {
    case 'straight':
      return routeStraightConnector(sourcePoint, targetPoint);
    case 'curved':
      return routeCurvedConnector(sourcePoint, targetPoint, sourceDirection, targetDirection);
    case 'orthogonal':
    default:
      return routeOrthogonalConnector(sourcePoint, targetPoint, sourceDirection, targetDirection);
  }
}

export function createConnectorElement(sourceInfo, targetInfo, connectorType = 'orthogonal', styleOverrides = null) {
  const sourceElement = getElementById(sourceInfo.elementId);
  const targetElement = getElementById(targetInfo.elementId);
  if (!sourceElement || !targetElement) return null;

  const sourcePoint = getConnectionPoint(sourceElement, sourceInfo.pointId);
  const targetPoint = getConnectionPoint(targetElement, targetInfo.pointId);
  if (!sourcePoint || !targetPoint) return null;

  const connector = createConnector(sourceInfo, targetInfo, connectorType);
  if (styleOverrides) {
    connector.style = { ...connector.style, ...styleOverrides };
  }
  _applyConnectorPath(connector, sourceElement, targetElement, sourcePoint, targetPoint);
  return connector;
}

export function updateConnectorPath(connectorId) {
  const connector = getElementById(connectorId);
  const patch = _getConnectorPathPatch(connector);
  if (connector && patch) updateElement(connector.id, patch);
}

export function updateAllConnectorsForElement(elementId) {
  return updateAllConnectorsForElements([elementId]);
}

export function updateAllConnectorsForElements(elementIds) {
  const ids = new Set(elementIds);
  if (ids.size === 0) return false;

  const state = getState();
  const updates = [];
  for (const element of state.document.elements) {
    if (element.type !== 'connector') continue;
    if (!ids.has(element.source?.elementId) && !ids.has(element.target?.elementId)) continue;
    const patch = _getConnectorPathPatch(element);
    if (patch) updates.push({ id: element.id, patch });
  }

  return updateElements(updates);
}

export function findNearestConnectionPoint(element, point) {
  if (!isConnectableElement(element)) return null;
  let nearest = null;
  let minDistance = Infinity;

  for (const connectionPoint of element.connectionPoints) {
    const position = getConnectionPoint(element, connectionPoint.id);
    if (!position) continue;
    const distance = Math.hypot(point.x - position.x, point.y - position.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = connectionPoint.id;
    }
  }

  return nearest;
}

function _getConnectorPathPatch(connector) {
  if (!connector || connector.type !== 'connector') return null;
  const sourceElement = getElementById(connector.source?.elementId);
  const targetElement = getElementById(connector.target?.elementId);
  if (!sourceElement || !targetElement) return null;

  const sourcePoint = getConnectionPoint(sourceElement, connector.source?.pointId);
  const targetPoint = getConnectionPoint(targetElement, connector.target?.pointId);
  if (!sourcePoint || !targetPoint) return null;

  const points = _getConnectorPoints(connector, sourceElement, targetElement, sourcePoint, targetPoint);
  const label = connector.label || {};
  const labelPosition = _getLabelPosition(points);

  return {
    points,
    label: {
      ...label,
      x: labelPosition.x,
      y: labelPosition.y - 10
    }
  };
}

function _applyConnectorPath(connector, sourceElement, targetElement, sourcePoint, targetPoint) {
  connector.points = _getConnectorPoints(connector, sourceElement, targetElement, sourcePoint, targetPoint);
  const labelPosition = _getLabelPosition(connector.points);
  connector.label = {
    ...connector.label,
    x: labelPosition.x,
    y: labelPosition.y - 10
  };
}

function _getConnectorPoints(connector, sourceElement, targetElement, sourcePoint, targetPoint) {
  return routeConnector(
    sourcePoint,
    targetPoint,
    connector.connectorType,
    getConnectionPointDirection(sourceElement, connector.source.pointId),
    getConnectionPointDirection(targetElement, connector.target.pointId)
  );
}

function _getLabelPosition(points) {
  if (!points.length) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  const middleIndex = Math.floor((points.length - 1) / 2);
  const first = points[middleIndex];
  const second = points[middleIndex + 1];
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2
  };
}

function _routeSimpleOrthogonal(sourcePoint, targetPoint) {
  const points = [{ x: sourcePoint.x, y: sourcePoint.y }];
  const dx = targetPoint.x - sourcePoint.x;
  const dy = targetPoint.y - sourcePoint.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    const middleX = sourcePoint.x + dx / 2;
    points.push({ x: middleX, y: sourcePoint.y });
    points.push({ x: middleX, y: targetPoint.y });
  } else {
    const middleY = sourcePoint.y + dy / 2;
    points.push({ x: sourcePoint.x, y: middleY });
    points.push({ x: targetPoint.x, y: middleY });
  }

  points.push({ x: targetPoint.x, y: targetPoint.y });
  return _removeDuplicatePoints(points);
}

function _getElementCenter(element) {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2
  };
}

function _rotatePointAroundElementCenter(point, element) {
  if (!element.rotation) return point;
  const center = _getElementCenter(element);
  const angle = element.rotation * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}

function _offsetPoint(point, direction, offset) {
  return {
    x: point.x + direction.x * offset,
    y: point.y + direction.y * offset
  };
}

function _normalize(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) return { ...DEFAULT_DIRECTION };
  return { x: vector.x / length, y: vector.y / length };
}

function _removeDuplicatePoints(points) {
  return points.filter((point, index) => {
    if (index === 0) return true;
    const previous = points[index - 1];
    return Math.abs(point.x - previous.x) > 0.01 || Math.abs(point.y - previous.y) > 0.01;
  });
}
// #endregion

// #region Sistema de snapping | Funcionalidad | ajuste a cuadricula y objetos
import { getState } from './state.js';
import { getElementBounds, snapToGrid } from './geometry.js';

export function snapElement(element, dx, dy) {
  const state = getState();
  const config = state.snapping;
  const guides = [];

  let newX = element.x + dx;
  let newY = element.y + dy;

  if (config.enabled && config.snapToGrid) {
    const gridSize = state.document.canvas.grid.size || 16;
    newX = snapToGrid(newX, gridSize);
    newY = snapToGrid(newY, gridSize);
  }

  if (config.enabled && config.snapToObjects) {
    const tolerance = config.tolerance || 6;
    const elBounds = {
      x: newX,
      y: newY,
      width: element.width,
      height: element.height,
      right: newX + element.width,
      bottom: newY + element.height,
      centerX: newX + element.width / 2,
      centerY: newY + element.height / 2
    };

    for (const other of state.document.elements) {
      if (other.id === element.id) continue;
      if (other.type === 'connector') continue;
      if (!other.visible) continue;

      const otherBounds = getElementBounds(other);
      const otherCenterX = otherBounds.x + otherBounds.width / 2;
      const otherCenterY = otherBounds.y + otherBounds.height / 2;

      if (Math.abs(elBounds.x - otherBounds.x) < tolerance) {
        newX = otherBounds.x;
        guides.push({ type: 'vertical', position: otherBounds.x });
      }
      if (Math.abs(elBounds.right - otherBounds.right) < tolerance) {
        newX = otherBounds.right - element.width;
        guides.push({ type: 'vertical', position: otherBounds.right });
      }
      if (Math.abs(elBounds.centerX - otherCenterX) < tolerance) {
        newX = otherCenterX - element.width / 2;
        guides.push({ type: 'vertical', position: otherCenterX });
      }
      if (Math.abs(elBounds.y - otherBounds.y) < tolerance) {
        newY = otherBounds.y;
        guides.push({ type: 'horizontal', position: otherBounds.y });
      }
      if (Math.abs(elBounds.bottom - otherBounds.bottom) < tolerance) {
        newY = otherBounds.bottom - element.height;
        guides.push({ type: 'horizontal', position: otherBounds.bottom });
      }
      if (Math.abs(elBounds.centerY - otherCenterY) < tolerance) {
        newY = otherCenterY - element.height / 2;
        guides.push({ type: 'horizontal', position: otherCenterY });
      }
    }
  }

  return { x: newX, y: newY, guides };
}

export function snapPoint(x, y) {
  const state = getState();
  const config = state.snapping;
  if (!config.enabled || !config.snapToGrid) return { x, y };
  const gridSize = state.document.canvas.grid.size || 16;
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize)
  };
}
// #endregion

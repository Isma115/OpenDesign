// #region Gestion de temas | Funcionalidad | cambio entre modo claro y oscuro
const THEME_KEY = 'geoflow_theme';

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === 'light' ? 'light' : 'dark');
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeButton(theme);
  updateCanvasTheme(theme);
}

function updateThemeButton(theme) {
  const btn = document.getElementById('btn-theme');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? '&#9788;' : '&#9789;';
    btn.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  }
  
  const menuItem = document.querySelector('[data-action="toggle-theme"]');
  if (menuItem) {
    menuItem.textContent = theme === 'dark' ? 'Modo claro' : 'Modo oscuro';
  }
}

export function updateCanvasTheme(theme) {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  
  if (theme === 'dark') {
    canvas.style.background = '#1e293b';
    const gridPattern = document.getElementById('grid-pattern');
    const gridPatternLarge = document.getElementById('grid-pattern-large');
    if (gridPattern) {
      const path = gridPattern.querySelector('path');
      if (path) {
        path.setAttribute('stroke', '#475569');
        path.setAttribute('opacity', '0.12');
      }
    }
    if (gridPatternLarge) {
      const path = gridPatternLarge.querySelector('path');
      if (path) {
        path.setAttribute('stroke', '#475569');
        path.setAttribute('opacity', '0.2');
      }
    }
    const arrowMarker = document.getElementById('arrow-marker');
    if (arrowMarker) {
      const path = arrowMarker.querySelector('path');
      if (path) path.setAttribute('fill', '#9ca3af');
    }
  } else {
    canvas.style.background = '#ffffff';
    const gridPattern = document.getElementById('grid-pattern');
    const gridPatternLarge = document.getElementById('grid-pattern-large');
    if (gridPattern) {
      const path = gridPattern.querySelector('path');
      if (path) {
        path.setAttribute('stroke', '#e5e7eb');
        path.setAttribute('opacity', '0.2');
      }
    }
    if (gridPatternLarge) {
      const path = gridPatternLarge.querySelector('path');
      if (path) {
        path.setAttribute('stroke', '#d1d5db');
        path.setAttribute('opacity', '0.3');
      }
    }
    const arrowMarker = document.getElementById('arrow-marker');
    if (arrowMarker) {
      const path = arrowMarker.querySelector('path');
      if (path) path.setAttribute('fill', '#374151');
    }
  }
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}
// #endregion

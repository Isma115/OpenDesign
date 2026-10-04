const STORAGE_KEY = 'trazuvia_recent_colors';
let recentColors = [];

export function loadRecentColors() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    recentColors = Array.isArray(saved)
      ? [...new Set(saved.filter(color => typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)).map(color => color.toLowerCase()))].slice(0, 16)
      : [];
  } catch {
    recentColors = [];
  }
  return [...recentColors];
}

export function rememberColor(color) {
  if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) return [...recentColors];
  color = color.toLowerCase();
  recentColors = [color, ...recentColors.filter(previous => previous !== color)].slice(0, 16);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recentColors)); } catch { /* La paleta sigue disponible durante esta sesión. */ }
  return [...recentColors];
}

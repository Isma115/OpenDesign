// #region Plantilla CSS global | Funcionalidad | gestion de estilos visuales reutilizables
export const DEFAULT_GLOBAL_CSS_TEMPLATE = `:root {
  --gf-color-primary: #2563eb;
  --gf-color-text: #111827;
  --gf-color-muted: #6b7280;
  --gf-color-surface: #ffffff;
  --gf-color-border: #d1d5db;
  --gf-font-family: Inter, Arial, sans-serif;
  --gf-radius-sm: 4px;
  --gf-radius-md: 8px;
  --gf-shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.12);
  --gf-shadow-md: 0 8px 24px rgba(15, 23, 42, 0.16);
}

.gf-component {
  font-family: var(--gf-font-family);
  color: var(--gf-color-text);
  background: var(--gf-color-surface);
  border: 1px solid var(--gf-color-border);
  border-radius: var(--gf-radius-md);
  box-shadow: none;
}

.gf-button {
  color: #ffffff;
  background: var(--gf-color-primary);
  border-color: var(--gf-color-primary);
  border-radius: var(--gf-radius-sm);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
}

.gf-button:hover {
  background: #1d4ed8;
}

.gf-input,
.gf-textarea {
  color: var(--gf-color-text);
  background: var(--gf-color-surface);
  border-color: var(--gf-color-border);
  border-radius: var(--gf-radius-sm);
  font-size: 14px;
  padding: 8px 10px;
}

.gf-input:focus,
.gf-textarea:focus {
  border-color: var(--gf-color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}

.gf-card,
.gf-modal {
  background: var(--gf-color-surface);
  border-color: var(--gf-color-border);
  border-radius: var(--gf-radius-md);
  box-shadow: var(--gf-shadow-md);
  padding: 16px;
}

.gf-navbar {
  color: #ffffff;
  background: #111827;
  border-color: #111827;
  font-weight: 600;
  padding: 12px 16px;
}

.gf-sidebar {
  color: var(--gf-color-muted);
  background: #f9fafb;
  border-color: #e5e7eb;
  padding: 16px;
}

.gf-table {
  background: var(--gf-color-surface);
  border-color: var(--gf-color-border);
  border-radius: var(--gf-radius-sm);
  font-size: 14px;
}

.gf-checkbox {
  color: var(--gf-color-text);
  background: transparent;
  border-color: transparent;
  font-size: 14px;
}

.gf-toggle {
  background: var(--gf-color-primary);
  border-color: var(--gf-color-primary);
  border-radius: 999px;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.35);
}

.gf-avatar {
  color: var(--gf-color-muted);
  background: #e5e7eb;
  border-color: #d1d5db;
  border-radius: 999px;
  font-size: 18px;
  font-weight: 600;
}

.gf-image {
  color: var(--gf-color-muted);
  background: #f9fafb;
  border-color: var(--gf-color-border);
  border-radius: var(--gf-radius-sm);
}

.gf-component:disabled,
.gf-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}`;

const LAYOUT_PROPERTIES = new Set([
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'inset-block',
  'inset-block-start',
  'inset-block-end',
  'inset-inline',
  'inset-inline-start',
  'inset-inline-end',
  'display',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-flow',
  'flex-grow',
  'flex-shrink',
  'flex-wrap',
  'grid',
  'grid-area',
  'grid-auto-columns',
  'grid-auto-flow',
  'grid-auto-rows',
  'grid-column',
  'grid-column-end',
  'grid-column-gap',
  'grid-column-start',
  'grid-gap',
  'grid-row',
  'grid-row-end',
  'grid-row-gap',
  'grid-row-start',
  'grid-template',
  'grid-template-areas',
  'grid-template-columns',
  'grid-template-rows',
  'margin',
  'margin-block',
  'margin-block-start',
  'margin-block-end',
  'margin-inline',
  'margin-inline-start',
  'margin-inline-end',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'transform',
  'translate',
  'scale',
  'rotate',
  'float',
  'clear',
  'z-index'
]);

export const CSS_TEMPLATE_VISUAL_FIELDS = [
  { id: 'colorPrimary', label: 'Primario', type: 'color', selector: ':root', property: '--gf-color-primary', fallback: '#2563eb' },
  { id: 'colorText', label: 'Texto', type: 'color', selector: ':root', property: '--gf-color-text', fallback: '#111827' },
  { id: 'colorMuted', label: 'Texto suave', type: 'color', selector: ':root', property: '--gf-color-muted', fallback: '#6b7280' },
  { id: 'colorSurface', label: 'Superficie', type: 'color', selector: ':root', property: '--gf-color-surface', fallback: '#ffffff' },
  { id: 'colorBorder', label: 'Borde', type: 'color', selector: ':root', property: '--gf-color-border', fallback: '#d1d5db' },
  { id: 'fontFamily', label: 'Fuente global', type: 'text', selector: ':root', property: '--gf-font-family', fallback: 'Inter, Arial, sans-serif' },
  { id: 'radiusSm', label: 'Radio pequeno', type: 'text', selector: ':root', property: '--gf-radius-sm', fallback: '4px' },
  { id: 'radiusMd', label: 'Radio medio', type: 'text', selector: ':root', property: '--gf-radius-md', fallback: '8px' },
  { id: 'shadowSm', label: 'Sombra pequena', type: 'text', selector: ':root', property: '--gf-shadow-sm', fallback: '0 1px 3px rgba(15, 23, 42, 0.12)' },
  { id: 'shadowMd', label: 'Sombra media', type: 'text', selector: ':root', property: '--gf-shadow-md', fallback: '0 8px 24px rgba(15, 23, 42, 0.16)' },
  { id: 'buttonText', label: 'Boton texto', type: 'color', selector: '.gf-button', property: 'color', fallback: '#ffffff' },
  { id: 'buttonBg', label: 'Boton fondo', type: 'text', selector: '.gf-button', property: 'background', fallback: 'var(--gf-color-primary)' },
  { id: 'buttonHoverBg', label: 'Boton hover', type: 'color', selector: '.gf-button:hover', property: 'background', fallback: '#1d4ed8' },
  { id: 'buttonPadding', label: 'Boton padding', type: 'text', selector: '.gf-button', property: 'padding', fallback: '8px 14px' },
  { id: 'inputPadding', label: 'Input padding', type: 'text', selector: '.gf-input,\n.gf-textarea', property: 'padding', fallback: '8px 10px' },
  { id: 'focusShadow', label: 'Focus sombra', type: 'text', selector: '.gf-input:focus,\n.gf-textarea:focus', property: 'box-shadow', fallback: '0 0 0 3px rgba(37, 99, 235, 0.16)' },
  { id: 'cardPadding', label: 'Card padding', type: 'text', selector: '.gf-card,\n.gf-modal', property: 'padding', fallback: '16px' },
  { id: 'navbarBg', label: 'Navbar fondo', type: 'color', selector: '.gf-navbar', property: 'background', fallback: '#111827' },
  { id: 'sidebarBg', label: 'Sidebar fondo', type: 'color', selector: '.gf-sidebar', property: 'background', fallback: '#f9fafb' }
];

export function createDefaultStyles() {
  return {
    globalTemplateCss: DEFAULT_GLOBAL_CSS_TEMPLATE
  };
}

export function ensureDocumentStyles(docModel) {
  if (!docModel.styles || typeof docModel.styles !== 'object') {
    docModel.styles = createDefaultStyles();
    return docModel.styles;
  }
  if (typeof docModel.styles.globalTemplateCss !== 'string') {
    docModel.styles.globalTemplateCss = DEFAULT_GLOBAL_CSS_TEMPLATE;
  }
  return docModel.styles;
}

export function validateVisualCss(cssText) {
  const issues = [];
  if (typeof cssText !== 'string' || cssText.trim() === '') return issues;
  const declarationRegex = /([a-z-]+)\s*:/gi;
  let match;
  while ((match = declarationRegex.exec(cssText)) !== null) {
    const property = match[1].toLowerCase();
    if (!LAYOUT_PROPERTIES.has(property)) continue;
    const line = cssText.slice(0, match.index).split('\n').length;
    issues.push({
      property,
      line,
      message: `"${property}" controla layout o posicionamiento y no se exportara desde la plantilla visual.`
    });
  }
  return issues;
}

export function sanitizeVisualCss(cssText) {
  if (typeof cssText !== 'string') return '';
  return cssText.replace(/(^|[;{\n]\s*)([a-z-]+)\s*:\s*([^;{}]+)(;?)/gi, (full, prefix, property, value, suffix) => {
    return LAYOUT_PROPERTIES.has(property.toLowerCase()) ? prefix : `${prefix}${property}: ${value}${suffix}`;
  });
}

export function getVisualCssValues(cssText) {
  const values = {};
  for (const field of CSS_TEMPLATE_VISUAL_FIELDS) {
    values[field.id] = _readDeclaration(cssText, field.selector, field.property) || field.fallback;
  }
  return values;
}

export function updateVisualCssValue(cssText, fieldId, value) {
  const field = CSS_TEMPLATE_VISUAL_FIELDS.find(item => item.id === fieldId);
  if (!field) return cssText;
  return _writeDeclaration(cssText || DEFAULT_GLOBAL_CSS_TEMPLATE, field.selector, field.property, value);
}

export function getCssClassForElement(element) {
  if (element.css?.className) return element.css.className.trim();
  if (element.type === 'group' && element.name) {
    return `gf-${_normalizeClassName(element.name)}`;
  }
  return '';
}

export function getSpecificCssForElement(element) {
  return typeof element.css?.rules === 'string' ? element.css.rules : '';
}

export function buildCssBundle(docModel) {
  ensureDocumentStyles(docModel);
  const globalCss = sanitizeVisualCss(docModel.styles.globalTemplateCss);
  const generatedCss = [];
  const customCss = [];

  for (const element of docModel.elements || []) {
    const className = _elementSpecificClass(element);
    const visualCss = _buildVisualCss(element);
    if (visualCss.length) {
      generatedCss.push(`.${className} {\n${visualCss.map(rule => `  ${rule}`).join('\n')}\n}`);
    }
    const rules = getSpecificCssForElement(element).trim();
    if (rules) customCss.push(`/* ${_cssCommentName(element)} */\n${rules}`);
  }

  return [
    '/* Plantilla visual global: solo apariencia, sin layout. */',
    globalCss.trim(),
    '',
    '/* Estilos visuales generados desde el diseno. */',
    generatedCss.join('\n\n'),
    '',
    '/* Estilos especificos por componente: tienen precedencia sobre la plantilla. */',
    customCss.join('\n\n')
  ].filter(Boolean).join('\n\n');
}

export function getExportClassList(element) {
  const classes = ['gf-export-element'];
  const globalClass = getCssClassForElement(element);
  if (globalClass) classes.push(...globalClass.split(/\s+/).filter(Boolean));
  classes.push(_elementSpecificClass(element));
  return classes.join(' ');
}

export function getExportLayoutStyle(element) {
  const rules = [
    ['position', 'absolute'],
    ['left', `${Math.round(element.x || 0)}px`],
    ['top', `${Math.round(element.y || 0)}px`],
    ['width', `${Math.round(element.width || 0)}px`],
    ['height', `${Math.round(element.height || 0)}px`]
  ];
  if (element.rotation) {
    rules.push(['transform', `rotate(${element.rotation}deg)`]);
    rules.push(['transform-origin', 'center']);
  }
  return rules.map(([property, value]) => `${property}: ${value};`).join(' ');
}

function _buildVisualCss(element) {
  const rules = [];
  if (element.style) {
    if (element.style.fill && element.style.fill !== 'none') rules.push(`background: ${element.style.fill};`);
    if (element.style.stroke && element.style.stroke !== 'none') rules.push(`border-color: ${element.style.stroke};`);
    if (element.style.strokeWidth != null) rules.push(`border-width: ${element.style.strokeWidth}px;`);
    if (element.style.opacity != null && element.style.opacity !== 1) rules.push(`opacity: ${element.style.opacity};`);
    if (element.style.shadow) rules.push('box-shadow: var(--gf-shadow-sm);');
  }
  if (element.shape === 'roundedRectangle' || element.shape === 'flow-start') {
    rules.push('border-radius: var(--gf-radius-md);');
  } else if (element.shape === 'ellipse') {
    rules.push('border-radius: 999px;');
  }
  if (element.text) {
    if (element.text.fontFamily) rules.push(`font-family: ${element.text.fontFamily};`);
    if (element.text.fontSize) rules.push(`font-size: ${element.text.fontSize}px;`);
    if (element.text.fontWeight) rules.push(`font-weight: ${element.text.fontWeight};`);
    if (element.text.color) rules.push(`color: ${element.text.color};`);
    if (element.text.align) rules.push(`text-align: ${element.text.align};`);
  }
  return rules;
}

function _elementSpecificClass(element) {
  return `gf-el-${String(element.id || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function _normalizeClassName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'component';
}

function _cssCommentName(element) {
  return `${element.name || element.shape || element.type || 'Elemento'} (${element.id})`.replace(/\*\//g, '');
}

function _readDeclaration(cssText, selector, property) {
  const block = _findRuleBlock(cssText, selector);
  if (!block) return '';
  const match = block.body.match(new RegExp(`(?:^|;)\\s*${_escapeRegExp(property)}\\s*:\\s*([^;]+)`, 'i'));
  return match ? match[1].trim() : '';
}

function _writeDeclaration(cssText, selector, property, value) {
  const block = _findRuleBlock(cssText, selector);
  if (!block) {
    return `${cssText.trim()}\n\n${selector} {\n  ${property}: ${value};\n}`;
  }
  const declarationRegex = new RegExp(`(^|[;\\n]\\s*)(${_escapeRegExp(property)}\\s*:\\s*)([^;\\n]+)(;?)`, 'i');
  let nextBody;
  if (declarationRegex.test(block.body)) {
    nextBody = block.body.replace(declarationRegex, (full, prefix, propStart, oldValue, suffix) => `${prefix}${propStart}${value}${suffix || ';'}`);
  } else {
    const trimmed = block.body.trimEnd();
    nextBody = `${trimmed}${trimmed ? '\n' : ''}  ${property}: ${value};\n`;
  }
  return `${cssText.slice(0, block.bodyStart)}${nextBody}${cssText.slice(block.bodyEnd)}`;
}

function _findRuleBlock(cssText, selector) {
  const selectorIndex = cssText.indexOf(selector);
  if (selectorIndex === -1) return null;
  const openIndex = cssText.indexOf('{', selectorIndex);
  if (openIndex === -1) return null;
  const closeIndex = cssText.indexOf('}', openIndex);
  if (closeIndex === -1) return null;
  return {
    bodyStart: openIndex + 1,
    bodyEnd: closeIndex,
    body: cssText.slice(openIndex + 1, closeIndex)
  };
}

function _escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// #endregion

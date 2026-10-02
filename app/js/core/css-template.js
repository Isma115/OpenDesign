// #region CSS especifico compartido | Funcionalidad | gestion de estilos reutilizables por nombre
export function createDefaultStyles() {
  return {
    componentCss: {}
  };
}

export function ensureDocumentStyles(docModel) {
  if (!docModel.styles || typeof docModel.styles !== 'object') {
    docModel.styles = createDefaultStyles();
  }
  if (!docModel.styles.componentCss || typeof docModel.styles.componentCss !== 'object') {
    docModel.styles.componentCss = {};
  }
  _syncNamedSpecificCss(docModel);
  return docModel.styles;
}

export function getCssClassForElement(element) {
  if (element.css?.className) return element.css.className.trim();
  if (element.type === 'group' && element.name) {
    return `gf-${_normalizeClassName(element.name)}`;
  }
  return '';
}

export function getSpecificCssForElement(element, docModel = null) {
  if (typeof element.css?.rules === 'string' && element.css.rules.trim()) {
    return element.css.rules;
  }
  const cssName = getCssClassForElement(element);
  if (cssName && docModel?.styles?.componentCss?.[cssName]) {
    return docModel.styles.componentCss[cssName];
  }
  return typeof element.css?.rules === 'string' ? element.css.rules : '';
}

export function buildCssBundle(docModel) {
  ensureDocumentStyles(docModel);
  const generatedCss = [];
  const sharedCss = [];
  const localCss = [];
  const exportedNames = new Set();

  for (const element of docModel.elements || []) {
    const className = _elementSpecificClass(element);
    const visualCss = _buildVisualCss(element);
    if (visualCss.length) {
      generatedCss.push(`.${className} {\n${visualCss.map(rule => `  ${rule}`).join('\n')}\n}`);
    }
    const cssName = getCssClassForElement(element);
    const rules = getSpecificCssForElement(element, docModel).trim();
    if (!rules) continue;
    if (cssName) {
      if (exportedNames.has(cssName)) continue;
      exportedNames.add(cssName);
      sharedCss.push(`/* CSS especifico compartido: ${_escapeCssComment(cssName)} */\n${_formatSpecificCss(cssName, rules)}`);
    } else {
      localCss.push(`/* ${_cssCommentName(element)} */\n${rules}`);
    }
  }

  return [
    '/* Estilos visuales generados desde el diseno. */',
    generatedCss.join('\n\n'),
    '',
    '/* CSS especifico compartido por nombre. */',
    sharedCss.join('\n\n'),
    '',
    '/* CSS especifico local por componente. */',
    localCss.join('\n\n')
  ].filter(Boolean).join('\n\n');
}

export function getExportClassList(element) {
  const classes = ['gf-export-element'];
  const specificClass = getCssClassForElement(element);
  if (specificClass) classes.push(_cssNameToClass(specificClass));
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

function _cssNameToClass(value) {
  return _normalizeClassName(value);
}

function _syncNamedSpecificCss(docModel) {
  const registry = docModel.styles.componentCss;
  for (const element of docModel.elements || []) {
    const cssName = getCssClassForElement(element);
    const rules = _normalizeSpecificCssRules(typeof element.css?.rules === 'string' ? element.css.rules : '');
    if (cssName && rules && !registry[cssName]) {
      registry[cssName] = rules;
    }
  }
}

function _formatSpecificCss(cssName, rules) {
  const className = _cssNameToClass(cssName);
  const body = _normalizeSpecificCssRules(rules);
  return `.${className} {\n${body.split('\n').map(line => `  ${line}`).join('\n')}\n}`;
}

function _normalizeSpecificCssRules(rules) {
  const value = String(rules || '').trim();
  if (!value.includes('{')) return value;
  const openIndex = value.indexOf('{');
  const closeIndex = value.lastIndexOf('}');
  if (openIndex === -1 || closeIndex <= openIndex) return value;
  return value.slice(openIndex + 1, closeIndex).trim();
}

function _escapeCssComment(value) {
  return String(value).replace(/\*\//g, '');
}

function _cssCommentName(element) {
  return `${element.name || element.shape || element.type || 'Elemento'} (${element.id})`.replace(/\*\//g, '');
}

// #endregion

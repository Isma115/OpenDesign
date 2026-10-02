// Los nombres anteriores solo se conservan para recuperar proyectos y preferencias.
export function migrateLegacyStorage() {
  for (const suffix of ['autosave', 'theme', 'left_panel_width', 'right_panel_width']) {
    const key = `trazuvia_${suffix}`;
    if (localStorage.getItem(key) !== null) continue;
    const value = localStorage.getItem(`geoflow_${suffix}`);
    if (value !== null) localStorage.setItem(key, value);
  }
}

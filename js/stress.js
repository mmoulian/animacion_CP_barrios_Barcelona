/** 6 niveles de estrés térmico — posición 0 = abajo, 5 = arriba */
export const STRESS_LEVELS = {
  'No vulnerable · riesgo de calor bajo': 0,
  'Vulnerable · riesgo de calor bajo': 1,
  'No vulnerable · riesgo de calor medio': 2,
  'Vulnerable · riesgo de calor medio': 3,
  'No vulnerable · riesgo de calor alto': 4,
  'Vulnerable · riesgo de calor alto': 5,
};

/** Posición vertical normalizada (0 = abajo, 1 = arriba) — alineada con filas de escala */
export const STRESS_POSITIONS = [0.04, 0.22, 0.41, 0.59, 0.78, 0.96];

export function getStressIndex(categoria) {
  if (categoria in STRESS_LEVELS) return STRESS_LEVELS[categoria];

  const vuln = categoria.startsWith('Vulnerable');
  let heat = 2;

  if (categoria.includes('riesgo de calor bajo')) heat = 0;
  else if (categoria.includes('riesgo de calor alto')) heat = 4;
  else heat = 2;

  return Math.min(5, heat + (vuln ? 1 : 0));
}

export function getStressLevel(categoria) {
  return STRESS_POSITIONS[getStressIndex(categoria)];
}

export function getStressLabel(categoria) {
  return categoria;
}

export function getVulnerabilityLabel(categoria) {
  return categoria.startsWith('Vulnerable')
    ? 'BARRIO VULNERABLE'
    : 'BARRIO NO VULNERABLE';
}

export function getThermalStressLabel(categoria) {
  if (categoria.includes('riesgo de calor bajo')) return 'BAJO ESTRÉS TÉRMICO';
  if (categoria.includes('riesgo de calor alto')) return 'ALTO ESTRÉS TÉRMICO';
  return 'MEDIO ESTRÉS TÉRMICO';
}

export function getVulnerabilityIcon(categoria) {
  return categoria.startsWith('Vulnerable') ? 'icons/alto.png' : 'icons/bajo.png';
}

export function getThermalStressIcon(categoria) {
  if (categoria.includes('riesgo de calor bajo')) return 'icons/bajo.png';
  if (categoria.includes('riesgo de calor alto')) return 'icons/alto.png';
  return 'icons/medio.png';
}

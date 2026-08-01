/** Datos parseados de BARRIOS_CODIGO_CAT.csv */
export async function loadBarrios() {
  try {
    const res = await fetch('BARRIOS_CODIGO_CAT.csv');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseCSV(await res.text());
  } catch (err) {
    const res = await fetch('barrios.json');
    if (!res.ok) throw new Error('No se pudo cargar BARRIOS_CODIGO_CAT.csv — inicia un servidor local.');
    return res.json();
  }
}

export function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split('\n');
  const barrios = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const sep = line.indexOf(';');
    const lastSep = line.lastIndexOf(';');
    if (sep === -1 || lastSep === sep) continue;

    barrios.push({
      nombre: line.slice(0, sep).trim(),
      codigo: line.slice(sep + 1, lastSep).trim(),
      categoria: line.slice(lastSep + 1).trim(),
    });
  }

  return barrios;
}

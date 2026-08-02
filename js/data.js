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
  const header = lines[0].split(';').map((h) => h.trim().toUpperCase());
  const iBarri = header.indexOf('BARRI');
  const iCodigo = header.indexOf('CODIGO');
  const iCat = header.indexOf('CATEGORIA');

  if (iBarri === -1 || iCodigo === -1 || iCat === -1) {
    throw new Error('CSV debe incluir columnas BARRI, CATEGORIA y CODIGO');
  }

  const barrios = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(';');
    barrios.push({
      nombre: cols[iBarri]?.trim() ?? '',
      codigo: cols[iCodigo]?.trim() ?? '',
      categoria: cols[iCat]?.trim() ?? '',
    });
  }

  return barrios;
}

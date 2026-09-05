// Helper bersama untuk mapel guru (array <-> CSV di kolom Teacher.mapel).
export function mapelToCsv(mapel: unknown): string {
  const arr = Array.isArray(mapel)
    ? mapel.map((m) => String(m).trim()).filter(Boolean)
    : String(mapel ?? '')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
  return arr.join(', ');
}

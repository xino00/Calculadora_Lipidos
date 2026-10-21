export function format(value: number | null, decimals = 1): string {
  return value === null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat('es-ES', { maximumFractionDigits: decimals }).format(value);
}
export function parseNumber(text: string): number | null {
  if (!text.trim()) return null;
  if (!/^\d+(?:[.,]\d+)?$/.test(text.trim())) return NaN;
  return Number(text.trim().replace(',', '.'));
}

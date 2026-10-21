import type { LpaUnit } from './types';
export function interpretLpa(value: number | null, unit: LpaUnit) {
  if (value === null) return { level: 'missing', title: 'Sin determinación', elevated: false, detail: 'Considerar al menos una determinación en la vida adulta.' };
  if (!Number.isFinite(value) || value < 0 || value > (unit === 'mg/dL' ? 500 : 1500)) return { level: 'invalid', title: 'Valor no válido', elevated: false, detail: 'Revisa el valor y la unidad del laboratorio. Este prototipo admite hasta 500 mg/dL o 1500 nmol/L.' };
  const lower = unit === 'mg/dL' ? 30 : 62;
  const upper = unit === 'mg/dL' ? 50 : 105;
  // > follows Recommendation Table 4 and Box 1. Exactly at the threshold is reported explicitly.
  if (value > upper) return { level: 'high', title: 'Modificador de riesgo presente', elevated: true, detail: 'Puede apoyar una reclasificación clínica, especialmente cerca de umbrales de decisión. No asigna por sí sola riesgo alto o muy alto.' };
  if (value === upper) return { level: 'boundary', title: 'En el umbral de referencia', elevated: false, detail: 'El riesgo es continuo. La tabla de recomendación usa «por encima»; el texto presenta una variación ≥105 nmol/L. Valorar el contexto y la variabilidad analítica.' };
  if (value >= lower) return { level: 'intermediate', title: 'Zona de aumento progresivo del riesgo', elevated: false, detail: 'Interpretar junto a los demás factores de riesgo; no implica una categoría automática.' };
  return { level: 'low', title: 'Por debajo del rango de aumento descrito', elevated: false, detail: 'No excluye riesgo cardiovascular por otros factores.' };
}

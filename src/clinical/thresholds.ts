import type { RiskCategory } from './types';
import { validLdl } from './targets';
export type TreatmentIndication = { level: 'recommended' | 'consider' | 'individualize' | 'lifestyle' | 'unknown'; title: string; detail: string; strength: string };
export function treatmentThreshold(category: RiskCategory | null, baseline: number | null, secondary: boolean): TreatmentIndication {
  if (secondary) return { level: 'recommended', title: 'Tratamiento hipolipemiante indicado', detail: 'Prevención secundaria: la indicación no depende del LDL basal. Ajustar la intensidad al objetivo y a la tolerancia.', strength: 'ESC/EAS · tabla 4' };
  if (!category || !validLdl(baseline)) return { level: 'unknown', title: 'Faltan datos para valorar el inicio', detail: 'Se necesitan categoría de riesgo y LDL-c basal sin tratamiento. El LDL actual bajo tratamiento no sustituye al basal.', strength: 'ESC/EAS · rec. 1' };
  // A caller cannot treat an untreated LDL >=190 as low/moderate risk.
  if (baseline >= 190 && (category === 'low' || category === 'moderate')) category = 'high';
  const recommended = (category === 'very-high' && baseline >= 70) || (category === 'high' && baseline >= 100);
  if (recommended) return { level: 'recommended', title: 'Se recomienda iniciar tratamiento', detail: 'En prevención primaria, tras optimizar las medidas no farmacológicas, manteniéndolas junto al tratamiento.', strength: 'Clase I · evidencia A' };
  const consider = (category === 'very-high' && baseline >= 55) || (category === 'high' && baseline >= 70) || (category === 'moderate' && baseline >= 100) || (category === 'low' && baseline >= 116);
  if (consider) return { level: 'consider', title: 'Se debe considerar tratamiento', detail: 'Tras optimizar hábitos, decidir junto al paciente según riesgo, beneficio esperado y preferencias.', strength: 'Clase IIa · evidencia A' };
  if (category === 'very-high') return { level: 'individualize', title: 'Individualizar el tratamiento', detail: 'Con LDL basal <55 mg/dL no se alcanza el umbral de la recomendación IIa de inicio. La tabla 4 contempla valorar fármacos en riesgo muy alto.', strength: 'Tabla 4 + rec. 1' };
  return { level: 'lifestyle', title: 'Priorizar hábitos y seguimiento', detail: 'No se alcanza el umbral de inicio farmacológico de esta matriz. Revisar modificadores y evolución. No es una indicación de retirar un tratamiento existente.', strength: 'ESC/EAS · tabla 4' };
}

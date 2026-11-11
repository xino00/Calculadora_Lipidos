import type { ClinicalInput } from './types';
import type { TargetResult } from './targets';
import { validLdl } from './targets';
import { treatmentThreshold } from './thresholds';
import { DRUG_GROUPS, type DrugGroupId } from './drugs';
// Approximate combination averages directly from ESC/EAS 2025 Figure 2.
// Do not add component percentages or apply these total reductions to treated LDL.
const SCENARIOS = [
  { id: 'moderate', components: ['moderate'], reduction: 30, statin: true },
  { id: 'high', components: ['high'], reduction: 50, statin: true },
  { id: 'eze', components: ['eze'], reduction: 20, statin: false },
  { id: 'ba', components: ['ba'], reduction: 23, statin: false },
  { id: 'eze-ba', components: ['eze', 'ba'], reduction: 38, statin: false },
  { id: 'high-eze', components: ['high', 'eze'], reduction: 60, statin: true },
  { id: 'high-ba', components: ['high', 'ba'], reduction: 58, statin: true },
  { id: 'high-eze-ba', components: ['high', 'eze', 'ba'], reduction: 68, statin: true },
  { id: 'pcsk9', components: ['pcsk9'], reduction: 60, statin: false },
  { id: 'pcsk9-eze', components: ['pcsk9', 'eze'], reduction: 70, statin: false },
  { id: 'pcsk9-eze-ba', components: ['pcsk9', 'eze', 'ba'], reduction: 75, statin: false },
  { id: 'high-pcsk9', components: ['high', 'pcsk9'], reduction: 75, statin: true },
  { id: 'high-eze-pcsk9', components: ['high', 'eze', 'pcsk9'], reduction: 80, statin: true },
  { id: 'all', components: ['high', 'eze', 'ba', 'pcsk9'], reduction: 86, statin: true },
] as const;
export const REGIMENS = SCENARIOS.map(scenario => ({
  ...scenario,
  name: scenario.components.map(id => DRUG_GROUPS[id].name).join(' + '),
}));
export type RegimenId = typeof REGIMENS[number]['id'];
export function availableRegimens(tolerance: ClinicalInput['tolerance']) {
  return REGIMENS.filter(regimen => tolerance !== 'none' || !regimen.statin);
}
export function selectedRegimen(tolerance: ClinicalInput['tolerance'], id: RegimenId | null) {
  return availableRegimens(tolerance).find(regimen => regimen.id === id) ?? null;
}
/** Presentation only: groups describe alternatives, never a selected regimen or dose. */
export function treatmentOptions(i: ClinicalInput, target: TargetResult | null) {
  const plan = treatmentPlan(i, target);
  const groups: DrugGroupId[] = i.tolerance === 'none' ? ['eze', 'ba', 'pcsk9'] : ['high', 'moderate', 'eze', 'ba', 'pcsk9'];
  const category = target ? target.absoluteTarget <= 55 ? 'very-high' : target.absoluteTarget === 70 ? 'high' : target.absoluteTarget === 100 ? 'moderate' : 'low' : null;
  const indication = treatmentThreshold(category, i.baseline, i.secondary);
  const educationalOnly = (i.onTreatment && target?.overall === 'met') || (!i.onTreatment && !['recommended', 'consider'].includes(indication.level));
  return { groups: plan.blocked ? [] : groups, educationalOnly };
}
export function simulateRegimen(baseline: number | null, id: RegimenId) {
  if (!validLdl(baseline)) return null;
  const regimen = REGIMENS.find(r => r.id === id)!;
  return { ...regimen, ldl: baseline * (100 - regimen.reduction) / 100 };
}
export function treatmentPlan(i: ClinicalInput, target: TargetResult | null) {
  if (i.pregnancy || i.activeLiver || i.dialysis) return {
    blocked: true, title: 'Valoración específica antes de proponer fármacos',
    steps: ['Embarazo/lactancia, hepatopatía activa o diálisis requieren una decisión individual y revisión de fichas técnicas. Este algoritmo no propone una pauta en estas situaciones.'],
  };
  if (i.age === null || i.age < 18 || i.age > 110 || !target) return { blocked: true, title: 'Completa primero la estratificación', steps: ['La elección depende del riesgo, el objetivo y el LDL basal/actual.'] };
  const category = target.absoluteTarget <= 55 ? 'very-high' : target.absoluteTarget === 70 ? 'high' : target.absoluteTarget === 100 ? 'moderate' : 'low';
  const indication = treatmentThreshold(category, i.baseline, i.secondary);
  if (!i.onTreatment && !['recommended', 'consider'].includes(indication.level)) return { blocked: indication.level === 'unknown', title: indication.title, steps: [indication.detail, 'Los escenarios farmacológicos son comparaciones educativas; no implican iniciar tratamiento.'] };
  if (i.onTreatment && target.overall === 'met') return { blocked: false, title: 'Objetivo alcanzado con los datos introducidos', steps: ['Mantener el tratamiento eficaz y tolerado, reforzar adherencia y seguimiento. El simulador permite comparar escenarios, pero no sugiere intensificar si ya se cumple el objetivo.'] };
  if (i.onTreatment && !validLdl(i.current)) return { blocked: true, title: 'Falta el LDL actual', steps: ['Introduce el LDL medido con la pauta actual para valorar la respuesta.'] };
  if (i.tolerance === 'none') return {
    blocked: false, title: 'Vía sin estatinas por intolerancia confirmada',
    steps: ['Revisar la intolerancia y las causas reversibles. Si no puede tomar estatinas, elegir terapias con beneficio cardiovascular según la reducción necesaria (I A).', 'Ezetimiba, ácido bempedoico (I B en intolerancia) o alirocumab/evolocumab (anticuerpos monoclonales anti-PCSK9), solos o combinados. La secuencia depende de la magnitud del descenso, las preferencias y la disponibilidad.'],
  };
  const steps = ['Revisar adherencia, causas secundarias e interacciones; utilizar la dosis de estatina máxima tolerada. Si se precisa ≥50 % de descenso, las opciones de alta intensidad son atorvastatina o rosuvastatina en las dosis de referencia indicadas debajo.'];
  if (i.onTreatment && i.therapy === 'statin-eze-pcsk9') steps.push('Ya usa estatina + ezetimiba + alirocumab/evolocumab: revisar respuesta y derivar a unidad de lípidos; valorar bempedoico según el déficit restante. No duplicar tratamientos.');
  else if (i.onTreatment && i.therapy === 'statin-eze') steps.push('Si sigue fuera de objetivo con estatina máxima tolerada y ezetimiba, valorar alirocumab o evolocumab según riesgo y descenso necesario. Bempedoico es una opción adicional en riesgo alto/muy alto (IIa C).');
  else if (i.onTreatment && (i.therapy === 'unknown' || i.therapy === 'other')) steps.push('Identificar la pauta actual antes de añadir fármacos. Evitar duplicidades y comparar el descenso adicional necesario con la respuesta real.');
  else steps.push('Si la estatina máxima tolerada no alcanza el objetivo, añadir ezetimiba. Si persiste el déficit, valorar alirocumab/evolocumab y/o ácido bempedoico según riesgo y reducción necesaria. No existe una secuencia obligatoria que exija bempedoico antes de alirocumab/evolocumab.');
  if (i.tolerance === 'partial') steps.push('Intolerancia parcial: conservar la dosis de estatina tolerada y completar el descenso con terapia no estatínica.');
  if (i.secondary && i.acuteCoronary) steps.unshift(i.onTreatment
    ? 'SCA: intensificar durante el ingreso si ya recibía tratamiento hipolipemiante (I C); seguir el protocolo hospitalario.'
    : 'SCA sin tratamiento previo: considerar atorvastatina o rosuvastatina de alta intensidad + ezetimiba desde el ingreso si la estatina sola no alcanzará el objetivo (IIa B).');
  return { blocked: false, title: 'Ruta terapéutica orientativa', steps };
}

import { type ClinicalInput, type RiskCategory, type RiskResult } from './types';

export const RANK: Record<RiskCategory, number> = { low: 0, moderate: 1, high: 2, 'very-high': 3 };
export function classifyScore(score: number): RiskCategory {
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new RangeError('SCORE2 fuera de rango');
  // ESC/EAS 2025, table 3. These are NOT the age-specific ESC 2021 thresholds.
  return score >= 20 ? 'very-high' : score >= 10 ? 'high' : score >= 2 ? 'moderate' : 'low';
}
export function scoreModel(age: number | null): RiskResult['model'] {
  if (age === null || !Number.isInteger(age) || age < 40 || age > 89) return null;
  return age < 70 ? 'SCORE2' : 'SCORE2-OP';
}
export function assessRisk(i: ClinicalInput): RiskResult {
  const result: RiskResult = { category: null, original: null, reasons: [], notices: [], scoreEligible: false, model: scoreModel(i.age), error: null, manual: false };
  if (i.age === null) return { ...result, error: 'Introduce la edad para empezar.' };
  if (!Number.isInteger(i.age) || i.age < 18 || i.age > 110) return { ...result, error: 'Ámbito: adultos de 18 a 110 años. Revisa la edad.' };
  const candidates: Array<{ category: RiskCategory; reason: string }> = [];
  const add = (category: RiskCategory, reason: string) => candidates.push({ category, reason });
  if (i.secondary) add('very-high', 'Enfermedad cardiovascular aterosclerótica clínica.');
  if (i.imaging) add('very-high', 'Aterosclerosis inequívoca en imagen según tabla 3 (incluye CAC marcadamente elevado).');
  if (i.familial === 'plus') add('very-high', 'Hipercolesterolemia familiar y otro factor mayor de riesgo.');
  if (i.familial === 'isolated') add('high', 'Hipercolesterolemia familiar sin otros factores mayores.');
  if (i.severeRiskFactor) add('high', 'Factor aislado muy elevado: CT >310 mg/dL o PA ≥180 sistólica o ≥110 diastólica.');
  // Inclusive boundary chosen from table 4 footnote (table 3 prints >190).
  if (i.baseline !== null && i.baseline >= 190) add('high', 'LDL-c basal ≥190 mg/dL: al menos riesgo alto (tabla 4, nota a).');
  let incomplete = false;
  if (i.ckd) {
    if (i.egfr === null || !Number.isFinite(i.egfr) || i.egfr <= 0 || i.egfr > 200) {
      result.notices.push('Falta un FG válido en la ERC conocida. La categoría puede estar infraestimada.'); incomplete = true;
    } else if (i.egfr < 30) add('very-high', 'ERC confirmada con FG <30 mL/min/1,73 m².');
    else if (i.egfr < 60) add('high', 'ERC confirmada con FG de 30 a <60 mL/min/1,73 m².');
    else result.notices.push('ERC con FG ≥60: esta tabla no asigna una categoría por FG. Valora albuminuria y la guía específica de ERC; no uses SCORE2 general.');
  }
  if (i.diabetes !== 'no') {
    if (i.organDamage || (i.diabetesRiskFactors !== null && i.diabetesRiskFactors >= 3) ||
      (i.diabetes === 'type1' && i.earlyType1 && i.diabetesDuration !== null && i.diabetesDuration > 20)) {
      add('very-high', 'Diabetes con lesión de órgano, ≥3 factores mayores o DM1 precoz de >20 años.');
    } else if (i.diabetesDuration === null || i.diabetesRiskFactors === null || i.diabetesDuration < 0 || i.diabetesDuration > i.age) {
      result.notices.push('Completa duración y factores de riesgo de la diabetes.'); incomplete = true;
    } else if (i.diabetesDuration >= 10 || i.diabetesRiskFactors >= 1) {
      add('high', 'Diabetes de ≥10 años o con al menos otro factor de riesgo.');
    } else if ((i.diabetes === 'type1' && i.age < 35) || (i.diabetes === 'type2' && i.age < 50)) {
      add('moderate', 'Diabetes de <10 años, edad joven y sin otros factores de riesgo.');
    } else {
      result.notices.push('Diabetes fuera de las categorías explícitas de la tabla 3. Requiere valoración específica; en DM2, consultar SCORE2-Diabetes/ESC 2023.');
    }
    result.notices.push('Se aplican los criterios de diabetes de ESC/EAS 2025, tabla 3. No se calcula ni se interpreta SCORE2-Diabetes.');
  }
  const hasCondition = i.secondary || i.imaging || i.ckd || i.diabetes !== 'no' || i.familial !== 'no' || i.severeRiskFactor || (i.baseline !== null && i.baseline >= 190);
  result.scoreEligible = !hasCondition && result.model !== null;
  if (result.scoreEligible && i.score !== null) {
    if (!i.scoreConfirmed) result.notices.push('Confirma que el porcentaje procede de la herramienta oficial y de la región seleccionada.');
    else if (i.onTreatment && !i.scorePretreatment) result.notices.push('No uses SCORE2 con lípidos bajo tratamiento. Solo se admite un resultado histórico documentado previo al tratamiento.');
    else if (!Number.isFinite(i.score) || i.score < 0 || i.score > 100) result.notices.push('SCORE2 debe estar entre 0 y 100 %.');
    else add(classifyScore(i.score), `${result.model} oficial introducido: ${i.score} %${i.onTreatment ? ' (histórico previo al tratamiento)' : ''}.`);
  }
  if (!hasCondition && !result.model) result.notices.push('SCORE2/SCORE2-OP se aplican de 40 a 89 años. Fuera de ese intervalo, valoración clínica individual.');
  if (hasCondition && i.score !== null) result.notices.push('El SCORE2 introducido se ignora por existir una condición que exige otra vía de clasificación.');
  candidates.sort((a, b) => RANK[b.category] - RANK[a.category]);
  result.category = candidates[0]?.category ?? null;
  result.reasons = candidates.map(c => c.reason);
  if (incomplete && result.category !== 'very-high') {
    result.category = null;
    result.error = 'Completa los datos de diabetes/ERC antes de fijar el objetivo.';
  }
  result.original = result.category;
  if (i.reclassified && i.reclassificationReason.trim().length >= 8 && !incomplete &&
    (!result.category || RANK[i.reclassified] >= RANK[result.category])) {
    result.category = i.reclassified;
    result.manual = true;
    result.reasons.unshift(`Categoría indicada por el profesional: ${i.reclassificationReason.trim()}`);
  }
  if (i.age >= 75) result.notices.push('En edad avanzada, individualiza según fragilidad, comorbilidad, interacciones y preferencias.');
  return result;
}

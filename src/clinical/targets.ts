import type { RiskCategory } from './types';
export const TARGETS: Record<RiskCategory, number> = { low: 116, moderate: 100, high: 70, 'very-high': 55 };
export function validLdl(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0 && value <= 1000;
}
export function calculateTarget(category: RiskCategory, baseline: number | null, current: number | null, consider40 = false) {
  const absoluteTarget = category === 'very-high' && consider40 ? 40 : TARGETS[category];
  const needs50 = category === 'high' || category === 'very-high';
  const knownBaseline = validLdl(baseline);
  const knownCurrent = validLdl(current);
  const half = knownBaseline && needs50 ? baseline / 2 : null;
  const effectiveTarget = half === null ? absoluteTarget : Math.min(absoluteTarget, half);
  const operator = half !== null && half < absoluteTarget ? '≤' : '<';
  const absoluteMet = knownCurrent ? current < absoluteTarget : null;
  const reductionMet = !needs50 ? true : knownBaseline && knownCurrent ? current <= baseline / 2 : null;
  const overall = absoluteMet === false || reductionMet === false ? 'not-met'
    : absoluteMet === true && reductionMet === true ? 'met' : 'unknown';
  const delta = knownCurrent ? Math.max(0, current - effectiveTarget) : null;
  return {
    absoluteTarget, needs50, effectiveTarget, operator, absoluteMet, reductionMet, overall,
    achievedReduction: knownBaseline && knownCurrent ? (1 - current / baseline) * 100 : null,
    requiredAbsolute: delta,
    requiredPercent: delta !== null && knownCurrent ? delta / current * 100 : null,
    requiredFromBaseline: knownBaseline ? Math.max(0, (1 - effectiveTarget / baseline) * 100) : null,
    baselineUnknown: needs50 && !knownBaseline,
  };
}
export type TargetResult = ReturnType<typeof calculateTarget>;

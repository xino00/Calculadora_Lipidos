import type { Region } from './types';

export type Sex = 'male' | 'female';
export type ScoreModel = 'SCORE2' | 'SCORE2-OP';
export interface Score2Input { model: ScoreModel; region: Region; sex: Sex; age: number; smoker: boolean; sbp: number; totalChol: number; hdl: number }
type Coefficients = { age: number; smoking: number; sbp: number; tc: number; hdl: number; smokingAge: number; sbpAge: number; tcAge: number; hdlAge: number; s0: number; meanLp: number };

// Cholesterol: 1 mmol/L = 38.67 mg/dL. The models use mmol/L.
export const MG_PER_MMOL = 38.67;

// SCORE2: ehab309 Updated Supplementary Material, methods table 2. SCORE2-OP: ehab312 supplementary methods table 3.
// Diabetes is a model term but is always 0 here: SCORE2 is not used in diabetes (table 3).
const COEFFICIENTS: Record<ScoreModel, Record<Sex, Coefficients>> = {
  SCORE2: {
    male: { age: 0.3742, smoking: 0.6012, sbp: 0.2777, tc: 0.1458, hdl: -0.2698, smokingAge: -0.0755, sbpAge: -0.0255, tcAge: -0.0281, hdlAge: 0.0426, s0: 0.9605, meanLp: 0 },
    female: { age: 0.4648, smoking: 0.7744, sbp: 0.3131, tc: 0.1002, hdl: -0.2606, smokingAge: -0.1088, sbpAge: -0.0277, tcAge: -0.0226, hdlAge: 0.0613, s0: 0.9776, meanLp: 0 },
  },
  'SCORE2-OP': {
    male: { age: 0.0634, smoking: 0.3524, sbp: 0.0094, tc: 0.0850, hdl: -0.3564, smokingAge: -0.0247, sbpAge: -0.0005, tcAge: 0.0073, hdlAge: 0.0091, s0: 0.7576, meanLp: 0.0929 },
    female: { age: 0.0789, smoking: 0.4921, sbp: 0.0102, tc: 0.0605, hdl: -0.3040, smokingAge: -0.0255, sbpAge: -0.0004, tcAge: -0.0009, hdlAge: 0.0154, s0: 0.8082, meanLp: 0.2290 },
  },
};
// Region recalibration: risk = 1 − exp(−exp(scale1 + scale2 × ln(−ln(1 − uncalibrated risk)))).
// SCORE2: ehab309 methods table 3. SCORE2-OP: ehab312 methods table 1; its worked example (methods table 3)
// uses other low-region scales (−0.85/0.82 women, −0.61/0.89 men), not applied here.
const SCALES: Record<ScoreModel, Record<Region, Record<Sex, [number, number]>>> = {
  SCORE2: {
    low: { male: [-0.5699, 0.7476], female: [-0.7380, 0.7019] },
    moderate: { male: [-0.1565, 0.8009], female: [-0.3143, 0.7701] },
    high: { male: [0.3207, 0.9360], female: [0.5710, 0.9369] },
    'very-high': { male: [0.5836, 0.8294], female: [0.9412, 0.8329] },
  },
  'SCORE2-OP': {
    low: { male: [-0.34, 1.19], female: [-0.52, 1.01] },
    moderate: { male: [0.01, 1.25], female: [-0.10, 1.10] },
    high: { male: [0.08, 1.15], female: [0.38, 1.09] },
    'very-high': { male: [0.05, 0.70], female: [0.38, 0.69] },
  },
};
// Centring of each model: SCORE2 per 5 years, 20 mmHg, 1 mmol/L and 0.5 mmol/L; SCORE2-OP per year, mmHg and mmol/L.
const CENTRE: Record<ScoreModel, (age: number, sbp: number, tc: number, hdl: number) => [number, number, number, number]> = {
  SCORE2: (age, sbp, tc, hdl) => [(age - 60) / 5, (sbp - 120) / 20, tc - 6, (hdl - 1.3) / 0.5],
  'SCORE2-OP': (age, sbp, tc, hdl) => [age - 73, sbp - 150, tc - 6, hdl - 1.4],
};

/** Core model risk before regional recalibration, as a proportion. Lipids in mg/dL, SBP in mmHg. */
export function uncalibratedScore2(p: Omit<Score2Input, 'region'>): number {
  const values = [p.age, p.sbp, p.totalChol, p.hdl];
  if (values.some(v => !Number.isFinite(v) || v <= 0) || p.hdl >= p.totalChol) throw new RangeError('Datos de SCORE2 no válidos');
  const c = COEFFICIENTS[p.model][p.sex];
  const [age, sbp, tc, hdl] = CENTRE[p.model](p.age, p.sbp, p.totalChol / MG_PER_MMOL, p.hdl / MG_PER_MMOL);
  const smoker = p.smoker ? 1 : 0;
  const lp = c.age * age + c.smoking * smoker + c.sbp * sbp + c.tc * tc + c.hdl * hdl +
    c.smokingAge * age * smoker + c.sbpAge * age * sbp + c.tcAge * age * tc + c.hdlAge * age * hdl;
  return 1 - Math.pow(c.s0, Math.exp(lp - c.meanLp));
}
/** 10-year risk of fatal and non-fatal CVD, in %, rounded to one decimal. Lipids in mg/dL, SBP in mmHg. */
export function calculateScore2(p: Score2Input): number {
  const uncalibrated = uncalibratedScore2(p);
  const [scale1, scale2] = SCALES[p.model][p.region][p.sex];
  const risk = 1 - Math.exp(-Math.exp(scale1 + scale2 * Math.log(-Math.log(1 - uncalibrated))));
  return Math.round(risk * 1000) / 10;
}

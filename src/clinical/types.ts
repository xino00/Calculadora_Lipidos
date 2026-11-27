export type RiskCategory = 'low' | 'moderate' | 'high' | 'very-high';
export type LpaUnit = 'mg/dL' | 'nmol/L';
export type Region = 'low' | 'moderate' | 'high' | 'very-high';
export type DiabetesFactor = 'age' | 'hypertension' | 'dyslipidemia' | 'smoking' | 'obesity';
export interface ClinicalInput {
  age: number | null;
  secondary: boolean;
  imaging: boolean;
  recurrentOrPolyvascular: boolean;
  consider40: boolean;
  acuteCoronary: boolean;
  familial: 'no' | 'isolated' | 'plus';
  severeRiskFactor: boolean;
  ckd: boolean;
  egfr: number | null;
  diabetes: 'no' | 'type1' | 'type2';
  diabetesDuration: number | null;
  diabetesRiskFactors: number | null;
  /** Which major factors were ticked; null = not assessed, [] = none. Its length feeds diabetesRiskFactors. */
  diabetesFactors: DiabetesFactor[] | null;
  organDamage: boolean;
  earlyType1: boolean;
  scoreMode: 'calc' | 'manual';
  sex: 'male' | 'female' | null;
  smoker: boolean | null;
  sbp: number | null;
  totalChol: number | null;
  hdl: number | null;
  score: number | null;
  region: Region;
  scoreConfirmed: boolean;
  scorePretreatment: boolean;
  onTreatment: boolean;
  baseline: number | null;
  current: number | null;
  lpa: number | null;
  lpaUnit: LpaUnit;
  modifier: boolean;
  reclassified: '' | RiskCategory;
  reclassificationReason: string;
  tolerance: 'full' | 'partial' | 'none';
  therapy: 'unknown' | 'statin' | 'statin-eze' | 'statin-eze-pcsk9' | 'other';
  pregnancy: boolean;
  activeLiver: boolean;
  dialysis: boolean;
}
export interface RiskResult {
  category: RiskCategory | null;
  original: RiskCategory | null;
  reasons: string[];
  notices: string[];
  scoreEligible: boolean;
  model: 'SCORE2' | 'SCORE2-OP' | null;
  score: number | null;
  error: string | null;
  manual: boolean;
}
export const EMPTY: ClinicalInput = {
  age: null, secondary: false, imaging: false, recurrentOrPolyvascular: false,
  consider40: false, acuteCoronary: false, familial: 'no', severeRiskFactor: false,
  ckd: false, egfr: null, diabetes: 'no', diabetesDuration: null,
  diabetesRiskFactors: null, diabetesFactors: null, organDamage: false, earlyType1: false,
  scoreMode: 'calc', sex: null, smoker: null, sbp: null, totalChol: null, hdl: null,
  score: null, region: 'low', scoreConfirmed: false, scorePretreatment: false,
  onTreatment: false, baseline: null, current: null, lpa: null, lpaUnit: 'mg/dL',
  modifier: false, reclassified: '', reclassificationReason: '', tolerance: 'full',
  therapy: 'unknown', pregnancy: false, activeLiver: false, dialysis: false,
};
export const RISK_LABEL: Record<RiskCategory, string> = {
  low: 'Bajo', moderate: 'Moderado', high: 'Alto', 'very-high': 'Muy alto',
};
export const REGION_LABEL: Record<Region, string> = {
  low: 'Baja · España', moderate: 'Moderada', high: 'Alta', 'very-high': 'Muy alta',
};

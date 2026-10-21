import { describe, expect, it } from 'vitest';
import { assessRisk, classifyScore, scoreModel } from '../clinical/risk';
import { EMPTY, type ClinicalInput, type RiskCategory } from '../clinical/types';
import { calculateTarget } from '../clinical/targets';
import { treatmentThreshold } from '../clinical/thresholds';
import { interpretLpa } from '../clinical/lpa';
import { REGIMENS, simulateRegimen, treatmentPlan } from '../clinical/medications';
import { parseNumber } from '../clinical/format';
const patient = (overrides: Partial<ClinicalInput> = {}): ClinicalInput => ({ ...EMPTY, age: 55, ...overrides });

describe('SCORE2: límites ESC/EAS 2025, tabla 3', () => {
  it.each([[0, 'low'], [1.999, 'low'], [2, 'moderate'], [9.999, 'moderate'], [10, 'high'], [19.999, 'high'], [20, 'very-high'], [100, 'very-high']] as const)('%s %% → %s', (score, expected) => expect(classifyScore(score)).toBe(expected));
  it.each([-1, 100.1, NaN, Infinity])('rechaza %s', value => expect(() => classifyScore(value)).toThrow());
  it.each([[39, null], [40, 'SCORE2'], [69, 'SCORE2'], [70, 'SCORE2-OP'], [89, 'SCORE2-OP'], [90, null], [null, null], [40.5, null]] as const)('modelo a los %s años', (age, expected) => expect(scoreModel(age)).toBe(expected));
  it('no cambia el corte 10 % según edad ni región', () => {
    for (const age of [45, 60, 75]) for (const region of ['low', 'moderate', 'high', 'very-high'] as const) expect(assessRisk(patient({ age, region, score: 10, scoreConfirmed: true })).category).toBe('high');
  });
  it('no interpreta un SCORE sin confirmación de origen', () => expect(assessRisk(patient({ score: 20 })).category).toBeNull());
  it('bloquea SCORE bajo tratamiento, acepta solo resultado previo documentado', () => {
    const p = patient({ onTreatment: true, score: 10, scoreConfirmed: true });
    expect(assessRisk(p).category).toBeNull();
    expect(assessRisk({ ...p, scorePretreatment: true }).category).toBe('high');
  });
  it.each([null, 17, 111, 35.5, NaN])('no clasifica con edad no válida %s', age => expect(assessRisk(patient({ age, secondary: true })).category).toBeNull());
});

describe('Condiciones clínicas y exclusión de SCORE2', () => {
  it.each([
    [{ secondary: true }, 'very-high'], [{ imaging: true }, 'very-high'],
    [{ familial: 'isolated' }, 'high'], [{ familial: 'plus' }, 'very-high'],
    [{ severeRiskFactor: true }, 'high'], [{ baseline: 190 }, 'high'],
    [{ baseline: 189.9 }, 'low'],
  ] as Array<[Partial<ClinicalInput>, RiskCategory]>)('%j → %s', (overrides, expected) => {
    const p = assessRisk(patient({ score: 1, scoreConfirmed: true, ...overrides }));
    expect(p.category).toBe(expected);
    if (expected !== 'low') expect(p.scoreEligible).toBe(false);
  });
  it.each([[29.9, 'very-high'], [30, 'high'], [59, 'high'], [59.9, 'high'], [60, null], [90, null]] as const)('ERC FG %s', (egfr, expected) => {
    const p = assessRisk(patient({ ckd: true, egfr, score: 1, scoreConfirmed: true }));
    expect(p.category).toBe(expected); expect(p.scoreEligible).toBe(false);
  });
  it('un FG aislado no activa ERC', () => expect(assessRisk(patient({ egfr: 20, score: 1, scoreConfirmed: true })).category).toBe('low'));
  it('ERC incompleta no permite asumir riesgo menor', () => expect(assessRisk(patient({ ckd: true, egfr: null, familial: 'isolated' })).category).toBeNull());
  it('ASCVD clínica tiene prioridad sobre datos renales incompletos', () => expect(assessRisk(patient({ ckd: true, secondary: true })).category).toBe('very-high'));
  it('DM no usa SCORE2 aunque sea de 25 %', () => expect(assessRisk(patient({ age: 45, diabetes: 'type2', diabetesDuration: 5, diabetesRiskFactors: 0, score: 25, scoreConfirmed: true })).category).toBe('moderate'));
  it.each([
    [{ organDamage: true }, 'very-high'], [{ diabetesRiskFactors: 3 }, 'very-high'],
    [{ diabetesRiskFactors: 2 }, 'high'], [{ diabetesRiskFactors: 1 }, 'high'],
    [{ diabetesDuration: 10 }, 'high'], [{ diabetesDuration: 9.9 }, 'moderate'],
    [{ age: 50 }, null], [{ age: 49 }, 'moderate'],
    [{ diabetes: 'type1', age: 34 }, 'moderate'], [{ diabetes: 'type1', age: 35 }, null],
  ] as Array<[Partial<ClinicalInput>, RiskCategory | null]>)('diabetes %j → %s', (overrides, expected) => {
    expect(assessRisk(patient({ age: 45, diabetes: 'type2', diabetesDuration: 5, diabetesRiskFactors: 0, ...overrides })).category).toBe(expected);
  });
  it('DM1 precoz precisa >20 años, no ≥20', () => {
    const p = patient({ diabetes: 'type1', earlyType1: true, diabetesDuration: 20, diabetesRiskFactors: 0 });
    expect(assessRisk(p).category).toBe('high'); expect(assessRisk({ ...p, diabetesDuration: 21 }).category).toBe('very-high');
  });
  it('DM incompleta no impone categoría falsa', () => expect(assessRisk(patient({ diabetes: 'type2' })).category).toBeNull());
  it('los modificadores no reclasifican automáticamente', () => expect(assessRisk(patient({ lpa: 200, modifier: true, score: 1, scoreConfirmed: true })).category).toBe('low'));
  it('reclasificación exige motivo y nunca rebaja la categoría', () => {
    expect(assessRisk(patient({ score: 1, scoreConfirmed: true, reclassified: 'high' })).category).toBe('low');
    expect(assessRisk(patient({ score: 1, scoreConfirmed: true, reclassified: 'high', reclassificationReason: 'Valoración de modificadores' })).category).toBe('high');
    expect(assessRisk(patient({ secondary: true, reclassified: 'low', reclassificationReason: 'No debe rebajarse' })).category).toBe('very-high');
  });
});

describe('Objetivo LDL: basal, actual y desigualdades', () => {
  it.each([['low', 116], ['moderate', 100], ['high', 70], ['very-high', 55]] as const)('el valor exacto %s %s no cumple <', (category, boundary) => expect(calculateTarget(category, 250, boundary).absoluteMet).toBe(false));
  it('no basta con <70 si no se ha reducido ≥50 %', () => {
    const t = calculateTarget('high', 100, 60); expect(t.absoluteMet).toBe(true); expect(t.reductionMet).toBe(false); expect(t.overall).toBe('not-met'); expect(t.effectiveTarget).toBe(50); expect(t.operator).toBe('≤'); expect(t.requiredAbsolute).toBe(10); expect(t.requiredPercent).toBeCloseTo(16.6666667);
  });
  it('el descenso exacto del 50 % sí cumple si está por debajo del objetivo absoluto', () => expect(calculateTarget('high', 100, 50).overall).toBe('met'));
  it('si ambos límites coinciden prevalece <', () => { const t = calculateTarget('high', 140, 70); expect(t.operator).toBe('<'); expect(t.overall).toBe('not-met'); });
  it('sin basal no verifica el objetivo completo de alto riesgo', () => { const t = calculateTarget('high', null, 50); expect(t.absoluteMet).toBe(true); expect(t.overall).toBe('unknown'); expect(t.reductionMet).toBeNull(); });
  it('sin basal y por encima del absoluto sí identifica incumplimiento', () => expect(calculateTarget('high', null, 80).overall).toBe('not-met'));
  it('riesgo moderado no necesita el criterio de 50 %', () => expect(calculateTarget('moderate', null, 90).overall).toBe('met'));
  it('no impone <40 por defecto ni fuera de muy alto', () => { expect(calculateTarget('very-high', 100, 50).absoluteTarget).toBe(55); expect(calculateTarget('very-high', 100, 50, true).absoluteTarget).toBe(40); expect(calculateTarget('high', 100, 50, true).absoluteTarget).toBe(70); });
  it('no divide por cero ni considera válidos LDL imposibles', () => { for (const value of [0, NaN, -1, Infinity, 1001]) { const t = calculateTarget('high', value, value); expect(t.achievedReduction).toBeNull(); expect(t.overall).toBe('unknown'); } });
  it('distingue reducción total y adicional', () => { const t = calculateTarget('very-high', 160, 82); expect(t.requiredAbsolute).toBe(27); expect(t.requiredPercent).toBeCloseTo(32.926829); expect(t.requiredFromBaseline).toBeCloseTo(65.625); expect(t.achievedReduction).toBeCloseTo(48.75); });
  it('no propone una reducción negativa al estar en objetivo', () => expect(calculateTarget('high', 200, 50).requiredAbsolute).toBe(0));
});

describe('Inicio en primaria: recomendación 1 ESC/EAS 2025', () => {
  it.each([
    ['very-high', 54.9, 'individualize'], ['very-high', 55, 'consider'], ['very-high', 69.9, 'consider'], ['very-high', 70, 'recommended'],
    ['high', 69.9, 'lifestyle'], ['high', 70, 'consider'], ['high', 99.9, 'consider'], ['high', 100, 'recommended'],
    ['moderate', 99.9, 'lifestyle'], ['moderate', 100, 'consider'], ['moderate', 189.9, 'consider'], ['moderate', 190, 'recommended'],
    ['low', 115.9, 'lifestyle'], ['low', 116, 'consider'], ['low', 190, 'recommended'],
  ] as const)('%s con LDL %s', (risk, ldl, expected) => expect(treatmentThreshold(risk, ldl, false).level).toBe(expected));
  it('secundaria mantiene indicación con LDL bajo o basal desconocido', () => { for (const ldl of [null, 30, 100]) expect(treatmentThreshold('very-high', ldl, true).level).toBe('recommended'); });
  it('primaria con basal desconocido no usa el LDL actual', () => expect(treatmentThreshold('high', null, false).level).toBe('unknown'));
});

describe('Lp(a): unidades independientes y límite explícito', () => {
  it.each([[29.9,'low'], [30,'intermediate'], [49.9,'intermediate'], [50,'boundary'], [50.1,'high']] as const)('mg/dL %s', (value, level) => expect(interpretLpa(value, 'mg/dL').level).toBe(level));
  it.each([[61.9,'low'], [62,'intermediate'], [104.9,'intermediate'], [105,'boundary'], [105.1,'high']] as const)('nmol/L %s', (value, level) => expect(interpretLpa(value, 'nmol/L').level).toBe(level));
  it('el mismo número en distinta unidad no equivale', () => { expect(interpretLpa(60, 'mg/dL').elevated).toBe(true); expect(interpretLpa(60, 'nmol/L').elevated).toBe(false); });
  it('sin dato no supone valor bajo', () => expect(interpretLpa(null, 'mg/dL').level).toBe('missing'));
  it.each([NaN, -1, Infinity, 501])('rechaza valor mg/dL %s', value => expect(interpretLpa(value, 'mg/dL').level).toBe('invalid'));
});

describe('Escenarios farmacológicos y barreras clínicas', () => {
  it.each([['high', 80], ['high-eze', 64], ['high-eze-ba', 51.2], ['high-eze-pcsk9', 32], ['eze-ba', 99.2], ['all', 22.4]] as const)('basal 160 → %s = %s', (id, ldl) => expect(simulateRegimen(160, id)?.ldl).toBeCloseTo(ldl));
  it('no suma porcentajes ni aplica la combinación al LDL ya tratado', () => { expect(simulateRegimen(160, 'high-eze')?.reduction).toBe(60); expect(simulateRegimen(160, 'high-eze')?.ldl).toBe(64); });
  it('controla el error binario al proyectar exactamente 55', () => { const projected = simulateRegimen(275, 'high-eze-pcsk9')!.ldl; expect(projected).toBe(55); expect(calculateTarget('very-high', 275, projected).overall).toBe('not-met'); });
  it.each([null, 0, -10, NaN])('no simula con basal %s', ldl => expect(simulateRegimen(ldl, 'high')).toBeNull());
  it('las combinaciones mantienen LDL positivo y menor que basal', () => { for (const r of REGIMENS) { expect(simulateRegimen(200, r.id)!.ldl).toBeGreaterThan(0); expect(simulateRegimen(200, r.id)!.ldl).toBeLessThan(200); } });
  it.each(['pregnancy', 'activeLiver', 'dialysis'] as const)('suspende sugerencia en %s', key => expect(treatmentPlan(patient({ [key]: true }), calculateTarget('high', 190, 120)).blocked).toBe(true));
  it('no intensifica por defecto si está en objetivo', () => expect(treatmentPlan(patient({ onTreatment: true, baseline: 200, current: 50 }), calculateTarget('high', 200, 50)).title).toContain('alcanzado'));
  it('no propone ruta de estatina si la matriz solo indica hábitos', () => expect(treatmentPlan(patient({ baseline: 90 }), calculateTarget('low', 90, 90)).title).toContain('hábitos'));
  it('intolerancia completa usa vía sin estatinas', () => expect(treatmentPlan(patient({ secondary: true, tolerance: 'none', baseline: 160 }), calculateTarget('very-high', 160, 160)).title).toContain('sin estatinas'));
  it('tratado sin LDL actual no se intensifica a ciegas', () => expect(treatmentPlan(patient({ onTreatment: true, baseline: 160 }), calculateTarget('high', 160, null)).blocked).toBe(true));
  it('SCA activa intensificación durante el ingreso', () => expect(treatmentPlan(patient({ secondary: true, acuteCoronary: true, baseline: 160 }), calculateTarget('very-high', 160, 160)).steps[0]).toContain('desde el ingreso'));
});

describe('Entrada numérica española', () => {
  it.each([['10,5',10.5], ['10.5',10.5], ['0',0], ['',null], [' 55 ',55]] as const)('%s → %s', (raw, number) => expect(parseNumber(raw)).toBe(number));
  it.each(['1e3', '55 mg/dL', '1,000.0', '-1', 'NaN', 'Infinity'])('rechaza ambigüedad %s', raw => expect(Number.isNaN(parseNumber(raw))).toBe(true));
});

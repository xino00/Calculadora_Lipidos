import { describe, expect, it } from 'vitest';
import { EMPTY, type ClinicalInput } from '../clinical/types';
import { assessRisk } from '../clinical/risk';
import { calculateTarget } from '../clinical/targets';
import { DRUG_GROUPS } from '../clinical/drugs';
import { BA_OPTION, EMPTY_NOTE, applyRegimen, EZE_OPTION, PCSK9_OPTIONS, STATIN_OPTIONS, buildNote, chosenDrugs, defaultAction, noteCautions } from '../clinical/note';

const example: ClinicalInput = { ...EMPTY, age: 58, secondary: true, baseline: 160, onTreatment: true, current: 82, lpa: 72, therapy: 'statin' };
const evaluate = (d: ClinicalInput) => {
  const risk = assessRisk(d);
  const target = risk.category ? calculateTarget(risk.category, d.baseline, d.onTreatment ? d.current : d.baseline) : null;
  return { risk, target };
};

describe('Nota para la historia: opciones de prescripción', () => {
  const all = [...STATIN_OPTIONS, EZE_OPTION, BA_OPTION, ...PCSK9_OPTIONS];
  it('cada principio activo, dosis y vía existe en el catálogo contrastado', () => {
    for (const option of all) {
      const source = DRUG_GROUPS[option.group].options.find(o => o.name === option.drug);
      expect(source, `${option.drug} en ${option.group}`).toBeDefined();
      for (const n of option.dose.match(/\d+/g)!) expect(source!.dose, `${option.id}: ${n}`).toMatch(new RegExp(`\\b${n}\\b`));
      expect(option.text.includes('s.c.')).toBe(source!.route === 'Vía subcutánea');
      expect(option.text.includes('v.o.')).toBe(source!.route === 'Vía oral');
    }
  });
  it('la intensidad de cada estatina coincide con su grupo del catálogo', () => {
    expect(STATIN_OPTIONS.filter(o => o.group === 'high').map(o => o.id)).toEqual(['atorva-40', 'atorva-80', 'rosuva-20', 'rosuva-40']);
  });
  it('identificadores únicos', () => {
    expect(new Set(all.map(o => o.id)).size).toBe(all.length);
  });
});

describe('Nota para la historia: texto', () => {
  it('caso de ejemplo con estatina alta + ezetimiba', () => {
    const { risk, target } = evaluate(example);
    const note = buildNote(example, risk, target, { ...EMPTY_NOTE, statin: 'atorva-80', eze: true }, true);
    expect(note.split('\n')).toEqual([
      '[Caso ficticio]',
      'Riesgo CV: muy alto (prevención secundaria).',
      'LDL-c: 82 mg/dL (basal 160 mg/dL).',
      'Objetivo: <55 mg/dL y ≥50 % del basal; no alcanzado (faltan 27 mg/dL).',
      'Lp(a): 72 mg/dL, elevada (modificador de riesgo).',
      'Tratamiento previo: estatina.',
      'Plan: se ajusta a atorvastatina 80 mg/24 h v.o. + ezetimiba 10 mg/24 h v.o.',
      'Control: perfil lipídico en 4–6 semanas.',
      'Ref.: ESC/EAS 2025.',
    ]);
  });
  it('intolerancia completa: una estatina marcada no llega al plan', () => {
    const d = { ...example, tolerance: 'none' as const };
    expect(chosenDrugs({ ...EMPTY_NOTE, statin: 'atorva-80', eze: true }, d.tolerance).map(o => o.id)).toEqual(['eze-10']);
    const { risk, target } = evaluate(d);
    expect(buildNote(d, risk, target, { ...EMPTY_NOTE, statin: 'atorva-80' })).toContain('Plan: sin fármaco hipolipemiante pautado.');
  });
  it('acción por defecto: iniciar sin tratamiento, mantener si cumple, ajustar si no', () => {
    expect(defaultAction({ ...example, onTreatment: false }, null)).toBe('start');
    expect(defaultAction(example, calculateTarget('very-high', 160, 50))).toBe('keep');
    expect(defaultAction(example, calculateTarget('very-high', 160, 82))).toBe('change');
  });
  it('sin control ni Lp(a) no añade esas líneas; el comentario se recorta', () => {
    const d = { ...example, lpa: null };
    const { risk, target } = evaluate(d);
    const note = buildNote(d, risk, target, { ...EMPTY_NOTE, control: false, comment: '  revisar adherencia  ' });
    expect(note).not.toMatch(/Lp\(a\)|Control:/);
    expect(note).toContain('Comentario: revisar adherencia');
  });
  it('avisos de ficha técnica: rosuvastatina 40 mg y ácido bempedoico', () => {
    expect(noteCautions({ ...EMPTY_NOTE, statin: 'rosuva-40' }, 'full')[0]).toMatch(/^40 mg/);
    expect(noteCautions({ ...EMPTY_NOTE, ba: true }, 'full')[0]).toMatch(/simvastatina/);
    expect(noteCautions({ ...EMPTY_NOTE, statin: 'rosuva-40' }, 'none')).toEqual([]);
  });
  it('aplicar una combinación del nomograma no elige dosis y respeta la ya elegida si encaja', () => {
    expect(applyRegimen(EMPTY_NOTE, ['high', 'eze'])).toMatchObject({ statin: null, eze: true, ba: false, pcsk9: null });
    const chosen = { ...EMPTY_NOTE, statin: 'atorva-80', pcsk9: 'evolo-140', ba: true };
    expect(applyRegimen(chosen, ['high', 'eze'])).toMatchObject({ statin: 'atorva-80', eze: true, ba: false, pcsk9: null });
    expect(applyRegimen(chosen, ['moderate'])).toMatchObject({ statin: null, eze: false });
    expect(applyRegimen(chosen, ['pcsk9', 'eze'])).toMatchObject({ statin: null, pcsk9: 'evolo-140', eze: true });
  });
});

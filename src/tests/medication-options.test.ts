import { describe, expect, it } from 'vitest';
import { EMPTY, type ClinicalInput } from '../clinical/types';
import { calculateTarget } from '../clinical/targets';
import { availableRegimens, selectedRegimen, treatmentOptions } from '../clinical/medications';
import { DRUG_GROUPS } from '../clinical/drugs';
const patient = (overrides: Partial<ClinicalInput> = {}): ClinicalInput => ({ ...EMPTY, age: 55, secondary: true, baseline: 160, ...overrides });

describe('Opciones farmacológicas sin selección automática', () => {
  it('intolerancia completa excluye todos los componentes estatínicos, también en combinaciones', () => {
    const forbidden = ['Atorvastatina', 'Rosuvastatina', 'Simvastatina'];
    const groups = treatmentOptions(patient({ tolerance: 'none' }), calculateTarget('very-high', 160, 160)).groups;
    const allComponents = [...groups, ...availableRegimens('none').flatMap(regimen => regimen.components)];
    expect(allComponents.length).toBeGreaterThan(0);
    for (const id of allComponents) for (const option of DRUG_GROUPS[id].options) expect(forbidden).not.toContain(option.name);
  });
  it('no sustituye una selección incompatible por otra pauta', () => {
    expect(selectedRegimen('full', null)).toBeNull();
    expect(selectedRegimen('none', 'high-eze')).toBeNull();
    expect(selectedRegimen('none', 'eze-ba')?.id).toBe('eze-ba');
  });
  it.each(['pregnancy', 'activeLiver', 'dialysis'] as const)('no ofrece catálogo como tratamiento cuando %s bloquea la ruta', key => {
    expect(treatmentOptions(patient({ [key]: true }), calculateTarget('very-high', 160, 160)).groups).toEqual([]);
  });
  it('objetivo cumplido mantiene las opciones solo como consulta', () => {
    expect(treatmentOptions(patient({ onTreatment: true, current: 50 }), calculateTarget('very-high', 160, 50)).educationalOnly).toBe(true);
  });
  it('indicación de hábitos no convierte el catálogo en propuesta de inicio', () => {
    expect(treatmentOptions(patient({ secondary: false, baseline: 90 }), calculateTarget('low', 90, 90)).educationalOnly).toBe(true);
  });
  it('datos pendientes no desbloquean fármacos', () => {
    expect(treatmentOptions(patient(), null).groups).toEqual([]);
    expect(treatmentOptions(patient({ onTreatment: true, current: null }), calculateTarget('very-high', 160, null)).groups).toEqual([]);
  });
});

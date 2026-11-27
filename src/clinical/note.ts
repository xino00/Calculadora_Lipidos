import { RISK_LABEL, type ClinicalInput, type RiskResult } from './types';
import type { TargetResult } from './targets';
import { DRUG_GROUPS, type DrugGroupId, type DrugOption } from './drugs';
import { format } from './format';
import { interpretLpa } from './lpa';

/* Concrete prescriptions the clinician can pick for the note. Every drug and dose
   here must exist in DRUG_GROUPS (checked in tests); nothing is chosen automatically. */
export interface RxOption { id: string; drug: string; group: DrugGroupId; dose: string; text: string }

export const STATIN_OPTIONS: readonly RxOption[] = [
  { id: 'atorva-10', drug: 'Atorvastatina', group: 'moderate', dose: '10 mg', text: 'atorvastatina 10 mg/24 h v.o.' },
  { id: 'atorva-20', drug: 'Atorvastatina', group: 'moderate', dose: '20 mg', text: 'atorvastatina 20 mg/24 h v.o.' },
  { id: 'atorva-40', drug: 'Atorvastatina', group: 'high', dose: '40 mg', text: 'atorvastatina 40 mg/24 h v.o.' },
  { id: 'atorva-80', drug: 'Atorvastatina', group: 'high', dose: '80 mg', text: 'atorvastatina 80 mg/24 h v.o.' },
  { id: 'rosuva-5', drug: 'Rosuvastatina', group: 'moderate', dose: '5 mg', text: 'rosuvastatina 5 mg/24 h v.o.' },
  { id: 'rosuva-10', drug: 'Rosuvastatina', group: 'moderate', dose: '10 mg', text: 'rosuvastatina 10 mg/24 h v.o.' },
  { id: 'rosuva-20', drug: 'Rosuvastatina', group: 'high', dose: '20 mg', text: 'rosuvastatina 20 mg/24 h v.o.' },
  { id: 'rosuva-40', drug: 'Rosuvastatina', group: 'high', dose: '40 mg', text: 'rosuvastatina 40 mg/24 h v.o.' },
  { id: 'simva-20', drug: 'Simvastatina', group: 'moderate', dose: '20 mg', text: 'simvastatina 20 mg/24 h v.o. (noche)' },
  { id: 'simva-40', drug: 'Simvastatina', group: 'moderate', dose: '40 mg', text: 'simvastatina 40 mg/24 h v.o. (noche)' },
];
export const EZE_OPTION: RxOption = { id: 'eze-10', drug: 'Ezetimiba', group: 'eze', dose: '10 mg', text: 'ezetimiba 10 mg/24 h v.o.' };
export const BA_OPTION: RxOption = { id: 'ba-180', drug: 'Ácido bempedoico', group: 'ba', dose: '180 mg', text: 'ácido bempedoico 180 mg/24 h v.o.' };
export const PCSK9_OPTIONS: readonly RxOption[] = [
  { id: 'aliro-75', drug: 'Alirocumab', group: 'pcsk9', dose: '75 mg cada 2 semanas', text: 'alirocumab 75 mg s.c. cada 2 semanas' },
  { id: 'aliro-150', drug: 'Alirocumab', group: 'pcsk9', dose: '150 mg cada 2 semanas', text: 'alirocumab 150 mg s.c. cada 2 semanas' },
  { id: 'aliro-300', drug: 'Alirocumab', group: 'pcsk9', dose: '300 mg cada 4 semanas', text: 'alirocumab 300 mg s.c. cada 4 semanas' },
  { id: 'evolo-140', drug: 'Evolocumab', group: 'pcsk9', dose: '140 mg cada 2 semanas', text: 'evolocumab 140 mg s.c. cada 2 semanas' },
  { id: 'evolo-420', drug: 'Evolocumab', group: 'pcsk9', dose: '420 mg una vez al mes', text: 'evolocumab 420 mg s.c. una vez al mes' },
];

export type NoteAction = 'start' | 'change' | 'keep';
export const ACTION_LABEL: Record<NoteAction, string> = { start: 'Iniciar', change: 'Ajustar', keep: 'Mantener' };
export interface NoteChoices { action: NoteAction | null; statin: string | null; eze: boolean; ba: boolean; pcsk9: string | null; control: boolean; comment: string }
export const EMPTY_NOTE: NoteChoices = { action: null, statin: null, eze: false, ba: false, pcsk9: null, control: true, comment: '' };

const THERAPY_TEXT: Record<ClinicalInput['therapy'], string> = {
  unknown: 'pauta por revisar', statin: 'estatina', 'statin-eze': 'estatina + ezetimiba',
  'statin-eze-pcsk9': 'estatina + ezetimiba + alirocumab/evolocumab', other: 'otra pauta o combinación',
};
const LPA_TEXT: Record<string, string> = { high: ', elevada (modificador de riesgo)', boundary: ', en el umbral de referencia', intermediate: ', zona de aumento progresivo del riesgo' };

export function defaultAction(d: ClinicalInput, target: TargetResult | null): NoteAction {
  if (!d.onTreatment) return 'start';
  return target?.overall === 'met' ? 'keep' : 'change';
}

/** Fit the choices to a combination picked in the nomogram: add-ons follow the combination; a statin or
    anti-PCSK9 dose already chosen is kept only if it still belongs to it. Doses are never picked here. */
export function applyRegimen(c: NoteChoices, components: readonly DrugGroupId[]): NoteChoices {
  const statinGroup = components.find(g => g === 'high' || g === 'moderate');
  const keepStatin = !!statinGroup && STATIN_OPTIONS.find(o => o.id === c.statin)?.group === statinGroup;
  return { ...c, statin: keepStatin ? c.statin : null, eze: components.includes('eze'), ba: components.includes('ba'), pcsk9: components.includes('pcsk9') ? c.pcsk9 : null };
}

export function chosenDrugs(c: NoteChoices, tolerance: ClinicalInput['tolerance']): RxOption[] {
  const statin = tolerance === 'none' ? undefined : STATIN_OPTIONS.find(o => o.id === c.statin);
  const pcsk9 = PCSK9_OPTIONS.find(o => o.id === c.pcsk9);
  return [statin, c.eze ? EZE_OPTION : undefined, c.ba ? BA_OPTION : undefined, pcsk9].filter((o): o is RxOption => !!o);
}

/** Technical-sheet cautions relevant to the current choice, taken verbatim from the catalogue. */
export function noteCautions(c: NoteChoices, tolerance: ClinicalInput['tolerance']): string[] {
  const list: string[] = [];
  const statin = tolerance === 'none' ? null : c.statin;
  const caution = (group: DrugGroupId, name: string) => (DRUG_GROUPS[group].options as readonly DrugOption[]).find(o => o.name === name)?.caution;
  if (statin === 'rosuva-40') list.push(caution('high', 'Rosuvastatina')!);
  if (c.ba) list.push(caution('ba', 'Ácido bempedoico')!);
  return list.filter(Boolean);
}

export function buildNote(d: ClinicalInput, risk: RiskResult, target: TargetResult | null, c: NoteChoices, example = false): string {
  const lines: string[] = [];
  if (example) lines.push('[Caso ficticio]');
  const prevention = d.secondary ? 'prevención secundaria' : 'prevención primaria';
  lines.push(risk.category
    ? `Riesgo CV: ${RISK_LABEL[risk.category].toLowerCase()} (${prevention}${risk.manual ? ', por criterio clínico' : ''})${risk.score !== null ? `; ${risk.model} ${format(risk.score)} %` : ''}.`
    : `Riesgo CV: no determinado (${prevention}).`);

  const current = d.onTreatment ? d.current : d.baseline;
  lines.push(`LDL-c: ${current !== null ? `${format(current)} mg/dL` : 'no introducido'}${d.onTreatment && d.baseline !== null ? ` (basal ${format(d.baseline)} mg/dL)` : !d.onTreatment && current !== null ? ' (sin tratamiento)' : ''}.`);

  if (target) {
    const goal = `<${target.absoluteTarget} mg/dL${target.needs50 ? ' y ≥50 % del basal' : ''}${target.absoluteTarget === 40 ? ' (opcional, IIb)' : ''}`;
    const status = target.overall === 'met' ? 'alcanzado'
      : target.overall === 'not-met' ? `no alcanzado${target.requiredAbsolute ? ` (faltan ${format(target.requiredAbsolute)} mg/dL)` : ''}`
      : target.baselineUnknown ? 'sin verificar (falta LDL basal)' : 'sin verificar';
    lines.push(`Objetivo: ${goal}; ${status}.`);
  }

  if (d.lpa !== null) lines.push(`Lp(a): ${format(d.lpa)} ${d.lpaUnit}${LPA_TEXT[interpretLpa(d.lpa, d.lpaUnit).level] ?? ''}.`);

  const tolerance = d.tolerance === 'partial' ? 'intolerancia parcial a estatinas' : d.tolerance === 'none' ? 'intolerancia completa a estatinas' : '';
  if (d.onTreatment || tolerance) lines.push(`Tratamiento previo: ${[d.onTreatment ? THERAPY_TEXT[d.therapy] : 'ninguno', tolerance].filter(Boolean).join('; ')}.`);

  const action = c.action ?? defaultAction(d, target);
  const drugs = chosenDrugs(c, d.tolerance).map(o => o.text).join(' + ');
  lines.push(drugs
    ? `Plan: ${action === 'start' ? 'inicio de' : action === 'change' ? 'se ajusta a' : 'se mantiene'} ${drugs}${drugs.endsWith('.') ? '' : '.'}`
    : action === 'keep' ? 'Plan: se mantiene el tratamiento actual.' : 'Plan: sin fármaco hipolipemiante pautado.');

  if (c.control) lines.push('Control: perfil lipídico en 4–6 semanas.');
  const comment = c.comment.trim();
  if (comment) lines.push(`Comentario: ${comment}`);
  lines.push('Ref.: ESC/EAS 2025.');
  return lines.join('\n');
}

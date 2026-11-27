import type { CSSProperties } from 'react';
import type { ClinicalInput, RiskResult } from '../clinical/types';
import { type TargetResult, calculateTarget, validLdl } from '../clinical/targets';
import { availableRegimens, selectedRegimen, simulateRegimen, treatmentPlan, type RegimenId } from '../clinical/medications';
import type { DrugGroupId } from '../clinical/drugs';
import { format } from '../clinical/format';
import { DrugOptions } from './TreatmentAlgorithm';
import { applyRegimen, chosenDrugs, type NoteChoices } from '../clinical/note';
import { Notice, Source } from './ui';

/* Presentation only. Short component names for the chart; full names stay in aria-labels and the detail below. */
const SHORT: Record<DrugGroupId, string> = { moderate: 'Est. moderada', high: 'Est. alta', eze: 'Ezetimiba', ba: 'Bempedoico', pcsk9: 'Anti-PCSK9' };
const TINY: Record<DrugGroupId, string> = { moderate: 'Est mod', high: 'Est alta', eze: 'Eze', ba: 'Bemp', pcsk9: 'PCSK9' };

type Vars = CSSProperties & Record<`--${string}`, number | string>;

function tickStep(max: number) { return max <= 200 ? 20 : max <= 400 ? 50 : 100; }

export function LdlNomogram({ data: d, risk, target, selected, onSelect: setSelected, choices, onChoices }: { data: ClinicalInput; risk: RiskResult; target: TargetResult; selected: RegimenId | null; onSelect: (id: RegimenId | null) => void; choices: NoteChoices; onChoices: (patch: Partial<NoteChoices>) => void }) {
  const baseline = validLdl(d.baseline) ? d.baseline : null;
  const currentRaw = d.onTreatment ? d.current : d.baseline;
  const current = validLdl(currentRaw) ? currentRaw : null;
  const blocked = treatmentPlan(d, target).blocked;
  const regimens = !blocked && baseline !== null ? availableRegimens(d.tolerance) : [];
  const chosen = regimens.length ? selectedRegimen(d.tolerance, selected) : null;
  const t = target.effectiveTarget;
  const max = Math.ceil(Math.max(baseline ?? 0, current ?? 0, target.absoluteTarget * 1.6) * 1.1 / 10) * 10;
  const step = tickStep(max);
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, n) => n * step);
  const reaches = (ldl: number) => risk.category ? calculateTarget(risk.category, d.baseline, ldl, target.absoluteTarget === 40).overall === 'met' : false;
  const zone = `${target.operator}${format(t)} mg/dL`;
  const chosenSim = chosen ? simulateRegimen(d.baseline, chosen.id) : null;

  return <figure className="nomo" style={{ '--max': max, '--t': t } as Vars}>
    <figcaption className="nomo-head">
      <h3>LDL-c frente al objetivo</h3>
      <p>{regimens.length ? 'Cada trazo baja desde el LDL basal hasta el valor medio esperable con esa combinación. En rojo, el tramo dentro del objetivo.' : 'Posición del paciente respecto al objetivo.'}</p>
      {regimens.length > 0 && <p className="nomo-legend"><b data-group="high">Est</b> estatina de intensidad alta o moderada; <b data-group="eze">Eze</b> ezetimiba; <b data-group="ba">Bemp</b> ácido bempedoico; <b data-group="pcsk9">PCSK9</b> alirocumab o evolocumab.</p>}
    </figcaption>
    <div className="nomo-plot">
      <div className="nomo-axis" aria-hidden="true">
        {ticks.map((v, n) => Math.abs(v - t) < step * 0.6 ? null : <span key={v} data-minor={n % 2 ? '' : undefined} data-near={Math.abs(v - t) < step * 1.6 ? '' : undefined} style={{ '--v': v } as Vars}>{v}</span>)}
        <b style={{ '--v': t } as Vars}>{target.operator}{format(t)}</b>
      </div>
      <div className="nomo-item nomo-patient">
        <div className="nomo-track" role="img" aria-label={`Objetivo ${zone}. ${current !== null ? `LDL actual ${format(current)} mg/dL.` : 'LDL actual no introducido.'} ${baseline !== null && d.onTreatment ? `LDL basal ${format(baseline)} mg/dL.` : ''}`}>
          {baseline !== null && d.onTreatment && current !== null && <i className="nomo-link" style={{ '--a': Math.min(baseline, current), '--b': Math.max(baseline, current) } as Vars}/>}
          {baseline !== null && d.onTreatment && <i className="nomo-dot basal" style={{ '--v': baseline } as Vars}/>}
          {current !== null && <i className="nomo-dot actual" style={{ '--v': current } as Vars}/>}
        </div>
        <p className="nomo-label"><span>Paciente</span></p>
        <p className="nomo-key">{baseline !== null && d.onTreatment && <>basal <b>{format(baseline)}</b> </>}{current !== null && <>actual <b>{format(current)}</b></>}</p>
      </div>
      {regimens.length > 0 && <div className="nomo-cols" role="group" aria-label="Combinaciones: LDL-c estimado desde el basal">
        {regimens.map(r => {
          const sim = simulateRegimen(d.baseline, r.id)!;
          const ok = reaches(sim.ldl);
          const name = r.components.map(c => SHORT[c]).join(' + ');
          return <button type="button" key={r.id} className={`nomo-item nomo-col ${ok ? 'reaches' : ''}`} aria-pressed={chosen?.id === r.id} onClick={() => { if (chosen?.id === r.id) { setSelected(null); return; } setSelected(r.id); onChoices(applyRegimen(choices, r.components)); }}
            aria-label={`${r.name}: descenso medio ${r.reduction} %, LDL-c estimado ${format(sim.ldl)} mg/dL; ${ok ? 'alcanzaría' : 'no alcanzaría'} el objetivo.`} title={name}>
            <span className="nomo-track" style={{ '--a': sim.ldl, '--b': baseline! } as Vars}>
              <i className="nomo-seg"/>
              <span className="nomo-val">{format(sim.ldl, 0)}</span>
            </span>
            <span className="nomo-label">{r.components.map(c => <span key={c} data-group={c}>{TINY[c]}</span>)}<small className="nomo-pct">−{r.reduction} %</small></span>
            <span className="nomo-key"><b>{format(sim.ldl, 0)}</b> −{r.reduction} %</span>
          </button>;
        })}
      </div>}
    </div>

    {blocked ? <p className="empty-text">Simulador suspendido hasta completar la valoración aplicable.</p>
      : baseline === null ? <p className="empty-text">Introduce un LDL basal conocido en «Datos del paciente» para comparar combinaciones.</p>
      : chosen && chosenSim ? <div className="nomo-detail">
          <p className="nomo-detail-line"><strong>{chosen.name}</strong></p>
          <p className="nomo-detail-line">Descenso medio ≈{chosen.reduction} % desde el basal: LDL-c estimado <strong>{format(chosenSim.ldl)} mg/dL</strong>. <span className={reaches(chosenSim.ldl) ? 'ok' : 'no'}>{reaches(chosenSim.ldl) ? 'Alcanzaría el objetivo.' : 'No alcanzaría el objetivo.'}</span></p>
          <p className="caption">Elige principio activo y dosis en cada ficha; pasan a la nota.</p>
          <DrugOptions groups={chosen.components} pick={{ choices, onChange: onChoices }}/>
          <RxSummary choices={choices} tolerance={d.tolerance}/>
        </div>
      : <><p className="caption">Pulsa una combinación para elegir sus fármacos y dosis. Ninguna está seleccionada por defecto.</p>{chosenDrugs(choices, d.tolerance).length > 0 && <RxSummary choices={choices} tolerance={d.tolerance}/>}</>}

    {regimens.length > 0 && <>
      <Notice>Estimaciones desde el <strong>LDL basal sin tratamiento</strong>: promedios de combinaciones de la figura 2. No se suman porcentajes, no predicen la respuesta a un principio activo o dosis concretos y no son descensos adicionales sobre el LDL actual.</Notice>
      <p className="caption">Respuesta individual variable. «Alcanzaría» describe solo el cálculo; no equivale a indicación, financiación ni eficacia confirmada para este paciente.</p>
      <Source>ESC/EAS 2025 · figura 2</Source>
    </>}
  </figure>;
}

function RxSummary({ choices, tolerance }: { choices: NoteChoices; tolerance: ClinicalInput['tolerance'] }) {
  const rx = chosenDrugs(choices, tolerance);
  return <p className="rx-summary" role="status">Pauta para la nota: {rx.length ? <strong>{rx.map(o => o.text).join(' + ')}</strong> : <span>elige principio activo y dosis en las fichas.</span>}</p>;
}

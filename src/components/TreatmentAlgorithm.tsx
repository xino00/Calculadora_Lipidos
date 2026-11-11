import { useState } from 'react';
import type { InputProps } from './RiskAssessment';
import type { RiskResult } from '../clinical/types';
import { type TargetResult, calculateTarget, validLdl } from '../clinical/targets';
import { treatmentThreshold } from '../clinical/thresholds';
import { availableRegimens, selectedRegimen, simulateRegimen, treatmentOptions, treatmentPlan, type RegimenId } from '../clinical/medications';
import { DRUG_GROUPS, DRUGS_REVIEWED, drugSource, type DrugGroup, type DrugGroupId } from '../clinical/drugs';
import { format } from '../clinical/format';
import { Check, Icon, Notice, Source } from './ui';

export function TreatmentInputs({ data: d, update }: InputProps) {
  return <section className="card">
    <div className="section-heading"><div className="icon-box"><Icon name="layers"/></div><div><h2>Tratamiento y tolerancia</h2><p>Datos necesarios antes de valorar opciones.</p></div></div>
    <div className="field-grid treatment-fields">
      <div className="field"><label htmlFor="tolerance">Tolerancia a estatinas</label><select id="tolerance" value={d.tolerance} onChange={e => update({ tolerance: e.target.value as typeof d.tolerance })}><option value="full">Toleradas / sin intolerancia conocida</option><option value="partial">Intolerancia parcial</option><option value="none">Intolerancia completa confirmada</option></select></div>
      {d.onTreatment && <div className="field"><label htmlFor="therapy">Pauta actual</label><select id="therapy" value={d.therapy} onChange={e => update({ therapy: e.target.value as typeof d.therapy })}><option value="unknown">Por revisar</option><option value="statin">Estatina</option><option value="statin-eze">Estatina + ezetimiba</option><option value="statin-eze-pcsk9">Estatina + ezetimiba + alirocumab/evolocumab</option><option value="other">Otra pauta / combinación</option></select><small>Describe los grupos actuales; las dosis concretas se revisan con la medicación del paciente.</small></div>}
    </div>
    <div className="subheading">Situaciones que requieren otra valoración</div>
    <Check label="Embarazo o lactancia" checked={d.pregnancy} onChange={pregnancy => update({ pregnancy })}/>
    <Check label="Hepatopatía activa" checked={d.activeLiver} onChange={activeLiver => update({ activeLiver })}/>
    <Check label="En tratamiento con diálisis" checked={d.dialysis} onChange={dialysis => update({ dialysis })}/>
    {d.tolerance === 'none' && d.onTreatment && ['statin', 'statin-eze', 'statin-eze-pcsk9'].includes(d.therapy) && <Notice tone="warning">La pauta marcada incluye estatina y la tolerancia indica intolerancia completa. Revisa estos datos antes de decidir.</Notice>}
  </section>;
}

function DrugOptions({ groups }: { groups: readonly DrugGroupId[] }) {
  return <div className="drug-options">{groups.map(id => {
    const group: DrugGroup = DRUG_GROUPS[id];
    return <section className="drug-option" key={id}>
      <h3>{group.name}</h3>
      <p className="caption">{group.description}</p>
      {group.options.map(option => <div className="drug-dose" key={option.name}>
        <p><strong>{option.name}</strong> · {option.dose}</p>
        <p className="caption">{option.route}{group.options.length > 1 ? ' · Alternativa: no combinar con las demás opciones de este grupo.' : ''}</p>
        {option.caution && <p className="drug-caution">{option.caution}</p>}
        <Source href={drugSource(option.sourceId).url}>{option.name} · ficha técnica, 4.2{option.caution ? '–4.5' : ''}</Source>
      </div>)}
      {group.sourceId && <Source href={drugSource(group.sourceId).url}>Intensidad por dosis · AHA/ACC, tabla 3</Source>}
    </section>;
  })}</div>;
}

export function TreatmentAlgorithm({ data: d, target, risk }: InputProps & { target: TargetResult | null; risk: RiskResult }) {
  const [selected, setSelected] = useState<RegimenId | null>(null);
  const indication = treatmentThreshold(risk.category, d.baseline, d.secondary);
  const plan = treatmentPlan(d, target);
  const options = treatmentOptions(d, target);
  const available = availableRegimens(d.tolerance);
  const selectedScenario = selectedRegimen(d.tolerance, selected);
  const simulation = !plan.blocked && selectedScenario ? simulateRegimen(d.baseline, selectedScenario.id) : null;
  const simulatedTarget = risk.category && simulation ? calculateTarget(risk.category, d.baseline, simulation.ldl, target?.absoluteTarget === 40) : null;
  return <>
    <section className="card">
      <div className="section-heading"><div className="icon-box"><Icon name="layers"/></div><div><h2>Opciones de tratamiento</h2><p>Indicación y alternativas con principios activos y dosis.</p></div></div>
      {!plan.blocked && <div className={`indication ${indication.level}`}><span className="eyebrow">{d.onTreatment ? 'INDICACIÓN SEGÚN SITUACIÓN BASAL' : '¿CUÁNDO INICIAR?'}</span><h3>{indication.title}</h3><p>{indication.detail}</p><span className="pill">{indication.strength}</span></div>}
      {d.tolerance === 'none' && d.onTreatment && ['statin', 'statin-eze', 'statin-eze-pcsk9'].includes(d.therapy) && <Notice tone="warning">La pauta marcada incluye estatina y la tolerancia indica intolerancia completa. Revisa estos datos antes de decidir.</Notice>}
      <h3 className="spaced">{plan.title}</h3>
      <ol className="plan-list">{plan.steps.map((step, n) => <li key={step}><span>{n + 1}</span><p>{step}</p></li>)}</ol>
      <Source>ESC/EAS 2025 · recomendaciones 1–3 y sección 4</Source>
      {!plan.blocked && <>
        {options.educationalOnly ? <details className="spaced"><summary>Consultar fármacos y dosis <span>Referencia</span></summary><div className="details-body"><Notice>Opciones de consulta: no se propone iniciar ni intensificar tratamiento a partir de esta lista.</Notice><DrugOptions groups={options.groups}/></div></details> : <>
          <Notice>Son opciones orientativas de adultos, no una pauta elegida ni dosis de inicio automáticas. Ajustar a la tolerancia, función renal/hepática e interacciones; revisar la ficha técnica.</Notice>
          <DrugOptions groups={options.groups}/>
          <Notice>Tras iniciar o intensificar, comprobar perfil lipídico en <strong>4–6 semanas</strong> y reevaluar respuesta y tolerancia.</Notice>
        </>}
        <p className="caption">Catálogo farmacológico contrastado el {DRUGS_REVIEWED}. La clasificación de intensidad no cambia los criterios de indicación ESC/EAS.</p>
      </>}
    </section>
    <section className="card compact">
      <details><summary>Comparar combinaciones <span>Simulador</span></summary><div className="details-body">
        <Notice>Estimaciones desde el <strong>LDL basal sin tratamiento</strong>. Son promedios de combinaciones de la figura 2; no se suman porcentajes ni se estima la respuesta exacta a un principio activo o dosis. Tampoco representan descensos adicionales sobre el LDL actual.</Notice>
        {plan.blocked ? <p className="empty-text">Simulador suspendido hasta completar la valoración aplicable.</p> : !validLdl(d.baseline) ? <p className="empty-text">Introduce un LDL basal conocido en «Datos del paciente» para activar las estimaciones.</p> : <>
          {simulation && selectedScenario ? <>
            <div className="simulation"><div><span>LDL-c estimado</span><strong>{format(simulation.ldl)} <small>mg/dL</small></strong><p>Descenso aproximado: {simulation.reduction} %</p></div><span className={`pill ${simulatedTarget?.overall === 'met' ? 'positive' : 'amber'}`}>{simulatedTarget?.overall === 'met' ? 'Alcanzaría el objetivo' : 'No alcanzaría el objetivo'}</span></div>
            <h3>Componentes de la combinación elegida</h3><DrugOptions groups={selectedScenario.components}/>
          </> : <p className="caption">Selecciona una combinación para ver sus componentes y el resultado estimado. No hay ninguna pauta seleccionada por defecto.</p>}
          <div className="comparison" aria-label="Comparación de LDL estimado">{available.map(regimen => {
            const simulated = simulateRegimen(d.baseline, regimen.id)!;
            return <button type="button" key={regimen.id} className={`bar-row ${selectedScenario?.id === regimen.id ? 'chosen' : ''}`} onClick={() => setSelected(regimen.id)} aria-pressed={selectedScenario?.id === regimen.id}>
              <span>{regimen.name}<small> · ≈{regimen.reduction} %</small></span><div className="bar-track"><div style={{ width: `${100 - regimen.reduction}%` }}/></div><strong>{format(simulated.ldl)} <small>mg/dL</small></strong>
            </button>;
          })}</div>
          <p className="caption">Respuesta individual variable. «Alcanzaría» describe solo el cálculo; no equivale a indicación, financiación ni eficacia clínica confirmada para ese paciente. Dentro de cada grupo se elige una alternativa; los componentes separados por «+» forman la combinación.</p>
        </>}
        <Source>ESC/EAS 2025 · figura 2</Source>
      </div></details>
    </section>
  </>;
}

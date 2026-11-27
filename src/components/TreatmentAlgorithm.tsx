import type { InputProps } from './RiskAssessment';
import type { RiskResult } from '../clinical/types';
import type { TargetResult } from '../clinical/targets';
import { treatmentThreshold } from '../clinical/thresholds';
import { treatmentOptions, treatmentPlan } from '../clinical/medications';
import { DRUG_GROUPS, DRUGS_REVIEWED, drugSource, type DrugGroup, type DrugGroupId } from '../clinical/drugs';
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

export function DrugOptions({ groups }: { groups: readonly DrugGroupId[] }) {
  return <div className="drug-options">{groups.map(id => {
    const group: DrugGroup = DRUG_GROUPS[id];
    return <section className="drug-option" data-group={id} key={id}>
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
  const indication = treatmentThreshold(risk.category, d.baseline, d.secondary);
  const plan = treatmentPlan(d, target);
  const options = treatmentOptions(d, target);
  return <>
    <section className="card">
      <div className="section-heading"><div className="icon-box"><Icon name="layers"/></div><div><h2>Opciones de tratamiento</h2><p>Indicación y alternativas con principios activos y dosis.</p></div></div>
      {!plan.blocked && <div className={`indication ${indication.level}`}><span className="eyebrow">{d.onTreatment ? 'Indicación según situación basal' : '¿Cuándo iniciar?'}</span><h3>{indication.title}</h3><p>{indication.detail}</p><span className="pill">{indication.strength}</span></div>}
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
  </>;
}

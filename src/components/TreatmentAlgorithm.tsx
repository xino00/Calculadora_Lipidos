import { useState } from 'react';
import type { InputProps } from './RiskAssessment';
import type { RiskResult } from '../clinical/types';
import { type TargetResult, calculateTarget, validLdl } from '../clinical/targets';
import { treatmentThreshold } from '../clinical/thresholds';
import { REGIMENS, simulateRegimen, treatmentPlan, type RegimenId } from '../clinical/medications';
import { format } from '../clinical/format';
import { Check, Icon, Notice, Source } from './ui';
export function TreatmentAlgorithm({ data: d, update, target, risk }: InputProps & { target: TargetResult | null; risk: RiskResult }) {
  const [selected, setSelected] = useState<RegimenId>('high-eze');
  const indication = treatmentThreshold(risk.category, d.baseline, d.secondary);
  const plan = treatmentPlan(d, target);
  const available = REGIMENS.filter(r => d.tolerance !== 'none' || !r.statin);
  const selectedId = available.some(r => r.id === selected) ? selected : 'eze-ba';
  const simulation = simulateRegimen(d.baseline, selectedId);
  const simulatedTarget = risk.category && simulation ? calculateTarget(risk.category, d.baseline, simulation.ldl, !!target && target.absoluteTarget === 40) : null;
  const comparison = d.tolerance === 'none' ? ['eze', 'ba', 'eze-ba', 'pcsk9', 'pcsk9-eze'] : ['moderate', 'high', 'high-eze', 'high-eze-ba', 'high-eze-pcsk9'];
  return <><section className="card"><div className="section-heading"><span className="step-number">04</span><div><h2>Decisión terapéutica</h2><p>Indicación, respuesta y opciones de intensificación.</p></div></div>
    <div className={`indication ${indication.level}`}><span className="eyebrow">{d.onTreatment ? 'INDICACIÓN SEGÚN SITUACIÓN BASAL' : '¿CUÁNDO INICIAR?'}</span><h3>{indication.title}</h3><p>{indication.detail}</p><span className="pill">{indication.strength}</span></div>
    <div className="field-grid spaced"><div className="field"><label htmlFor="tolerance">Tolerancia a estatinas</label><select id="tolerance" value={d.tolerance} onChange={e => update({ tolerance: e.target.value as typeof d.tolerance })}><option value="full">Toleradas / sin intolerancia conocida</option><option value="partial">Intolerancia parcial</option><option value="none">Intolerancia completa confirmada</option></select></div>
    {d.onTreatment && <div className="field"><label htmlFor="therapy">Pauta actual</label><select id="therapy" value={d.therapy} onChange={e => update({ therapy: e.target.value as typeof d.therapy })}><option value="unknown">Por revisar</option><option value="statin">Estatina</option><option value="statin-eze">Estatina + ezetimiba</option><option value="statin-eze-pcsk9">Estatina + ezetimiba + anti-PCSK9</option><option value="other">Otra pauta / combinación</option></select></div>}</div>
    <details className="spaced"><summary>Situaciones que requieren otra valoración</summary><div className="details-body"><Check label="Embarazo o lactancia" checked={d.pregnancy} onChange={pregnancy => update({ pregnancy })}/><Check label="Hepatopatía activa" checked={d.activeLiver} onChange={activeLiver => update({ activeLiver })}/><Check label="En tratamiento con diálisis" checked={d.dialysis} onChange={dialysis => update({ dialysis })}/></div></details>
    {d.tolerance === 'none' && d.onTreatment && ['statin', 'statin-eze', 'statin-eze-pcsk9'].includes(d.therapy) && <Notice tone="warning">La pauta marcada incluye estatina y la tolerancia indica intolerancia completa. Revisa estos datos antes de decidir.</Notice>}
    <h3 className="spaced">{plan.title}</h3><ol className="plan-list">{plan.steps.map((s, n) => <li key={s}><span>{n + 1}</span><p>{s}</p></li>)}</ol>
    {!plan.blocked && <Notice>Tras iniciar o intensificar, comprobar perfil lipídico en <strong>4–6 semanas</strong> y reevaluar respuesta y tolerancia. La selección y dosis requieren revisar la ficha técnica.</Notice>}
    <Source>ESC/EAS 2025 · recomendaciones 1–3 y sección 4</Source>
  </section>
  <section className="card"><div className="section-heading"><div className="icon-box"><Icon name="layers"/></div><div><h2>Simulador de reducción</h2><p>Compara escenarios desde el mismo punto de partida.</p></div><span className="pill neutral">Estimación</span></div>
    <Notice>Todos los escenarios parten del <strong>LDL basal sin tratamiento</strong>. Son promedios aproximados de combinaciones de la figura 2, no porcentajes que se suman ni descensos adicionales sobre el LDL actual.</Notice>
    {plan.blocked ? <p className="empty-text">Simulador suspendido hasta completar la valoración aplicable.</p> : !validLdl(d.baseline) ? <p className="empty-text">Introduce un LDL basal conocido en «Objetivos» para activar las estimaciones.</p> : <><div className="field spaced"><label htmlFor="regimen">Escenario a explorar</label><select id="regimen" value={selectedId} onChange={e => setSelected(e.target.value as RegimenId)}>{available.map(r => <option key={r.id} value={r.id}>{r.name} · ≈{r.reduction} %</option>)}</select></div>
    {simulation && <div className="simulation"><div><span>LDL-c estimado</span><strong>{format(simulation.ldl)} <small>mg/dL</small></strong><p>Descenso aproximado: {simulation.reduction} %</p></div><span className={`pill ${simulatedTarget?.overall === 'met' ? 'positive' : 'amber'}`}>{simulatedTarget?.overall === 'met' ? 'Alcanzaría el objetivo' : 'No alcanzaría el objetivo'}</span></div>}
    <div className="comparison" aria-label="Comparación de LDL estimado">{comparison.map(id => { const s = simulateRegimen(d.baseline, id as RegimenId)!; return <button key={id} className={`bar-row ${selectedId === id ? 'chosen' : ''}`} onClick={() => setSelected(id as RegimenId)} aria-pressed={selectedId === id}><span>{s.short}</span><div className="bar-track"><div style={{ width: `${100 - s.reduction}%` }}/></div><strong>{format(s.ldl)} <small>mg/dL</small></strong></button>; })}</div>
    <p className="caption">Respuesta individual variable. «Alcanzaría» describe solo el cálculo; no equivale a indicación, financiación ni eficacia clínica confirmada para ese paciente.</p></>}
    <Source>ESC/EAS 2025 · figura 2</Source>
  </section>
  <section className="card compact"><details><summary>Fármacos: notas de consulta</summary><div className="details-body drug-notes"><p><strong>Estatinas.</strong> Intensidad alta: descenso esperado ≥50 % (p. ej., atorvastatina 40–80 mg/día); moderada: 30–49 %. La figura 2 usa ≈50 % y ≈30 % para simular. Ajustar a tolerancia e interacciones.</p><Source href="https://cima.aemps.es/cima/dochtml/ft/74072/FT_74072.html">Atorvastatina · ficha técnica</Source><p><strong>Ezetimiba.</strong> Descenso medio aislado ≈20 %. La combinación con estatina tiene un efecto total propio; no se suman porcentajes.</p><p><strong>Ácido bempedoico.</strong> 180 mg/día. Revisar uricemia/gota, función hepática, síntomas tendinosos e interacciones. Con simvastatina, generalmente limitar esta a 20 mg; 40 mg solo en la excepción de ficha técnica; &gt;40 mg está contraindicado.</p><Source href="https://cima.aemps.es/cima/dochtml/ft/1201425002/FT_1201425002.html">Nilemdo · ficha técnica</Source><p><strong>Anti-PCSK9.</strong> El simulador se refiere a anticuerpos monoclonales (alirocumab/evolocumab). No equipara inclisirán con estos fármacos ni deduce criterios de financiación española.</p><Source>ESC/EAS 2025 · sección 4</Source></div></details></section></>;
}

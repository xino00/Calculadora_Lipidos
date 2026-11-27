import { useId } from 'react';
import type { ClinicalInput, DiabetesFactor, RiskCategory, RiskResult } from '../clinical/types';
import { REGION_LABEL, RISK_LABEL } from '../clinical/types';
import { RANK, SCORE2_LIMITS, missingScoreInputs } from '../clinical/risk';
import { Check, Icon, Notice, NumberField, Segmented, Source } from './ui';
export type InputProps = { data: ClinicalInput; update: (patch: Partial<ClinicalInput>) => void };
const FACTORS: Array<[DiabetesFactor, string]> = [['age', 'Edad avanzada'], ['hypertension', 'Hipertensión arterial'], ['dyslipidemia', 'Dislipidemia'], ['smoking', 'Tabaquismo'], ['obesity', 'Obesidad']];
/* Tick the factors instead of typing a count. Nothing ticked = not assessed (null), «Ninguno» = 0. */
function FactorChecklist({ data: d, update }: InputProps) {
  const list = d.diabetesFactors;
  const set = (next: DiabetesFactor[] | null) => update({ diabetesFactors: next, diabetesRiskFactors: next === null ? null : next.length });
  const toggle = (f: DiabetesFactor) => { const cur = list ?? []; const next = cur.includes(f) ? cur.filter(x => x !== f) : [...cur, f]; set(next.length ? next : null); };
  return <fieldset className="field factor-field"><legend>Otros factores mayores</legend>
    <div className="chips">{FACTORS.map(([f, label]) => <button type="button" key={f} className="chip" aria-pressed={!!list?.includes(f)} onClick={() => toggle(f)}>{label}</button>)}
      <button type="button" className="chip" aria-pressed={list !== null && list.length === 0} onClick={() => set(list !== null && list.length === 0 ? null : [])}>Ninguno</button></div>
    <small>{list === null ? 'Marca los presentes o «Ninguno». No cuentes la propia diabetes.' : `${list.length} factor${list.length === 1 ? '' : 'es'} mayor${list.length === 1 ? '' : 'es'}. No cuentes la propia diabetes.`} «Edad avanzada» (<i lang="en">older age</i>): la guía no fija un umbral; márcala según tu criterio.</small>
  </fieldset>;
}

export function RiskAssessment({ data: d, update }: InputProps) {
  return (
    <section className="card"><div className="section-heading"><div className="icon-box"><Icon name="shield"/></div><div><h2>Contexto clínico</h2><p>Empieza por lo que determina el riesgo.</p></div></div>
      <div className="field-grid"><NumberField label="Edad" value={d.age} onChange={age => update({ age, scoreConfirmed: false })} min={18} max={110} integer unit="años" hint="Edad utilizada en la valoración." />
        <fieldset className="field"><legend>Prevención</legend><div className="segmented"><button type="button" className={!d.secondary ? 'selected' : ''} aria-pressed={!d.secondary} onClick={() => update({ secondary: false, recurrentOrPolyvascular: false, consider40: false, acuteCoronary: false })}>Primaria</button><button type="button" className={d.secondary ? 'selected' : ''} aria-pressed={d.secondary} onClick={() => update({ secondary: true })}>Secundaria</button></div><small>{d.secondary ? 'ASCVD clínica establecida.' : 'Sin ASCVD clínica conocida.'}</small></fieldset></div>
      {d.secondary && <Notice>Incluye enfermedad coronaria, revascularización, ictus/AIT de origen aterosclerótico o enfermedad arterial periférica. No incluye cualquier cardiopatía ni un ictus hemorrágico aislado.</Notice>}
      <div className="subheading">Condiciones que clasifican el riesgo</div>
      <Check checked={d.imaging} onChange={imaging => update({ imaging })} label="Aterosclerosis inequívoca en imagen" detail="Placa significativa (habitualmente estenosis >50 %) o CAC marcadamente elevado (p. ej. >300). Una placa leve aislada es un modificador." />
      <div className="field-grid spaced"><div className="field"><label htmlFor="diabetes">Diabetes mellitus</label><select id="diabetes" value={d.diabetes} onChange={e => update({ diabetes: e.target.value as ClinicalInput['diabetes'], diabetesDuration: null, diabetesRiskFactors: null, diabetesFactors: null, organDamage: false, earlyType1: false })}><option value="no">No conocida</option><option value="type2">Diabetes tipo 2</option><option value="type1">Diabetes tipo 1</option></select></div>
      <div className="field"><label htmlFor="familial">Hipercolesterolemia familiar</label><select id="familial" value={d.familial} onChange={e => update({ familial: e.target.value as ClinicalInput['familial'] })}><option value="no">No conocida</option><option value="isolated">Sí, sin otros factores mayores</option><option value="plus">Sí, con otro factor mayor</option></select></div></div>
      {d.diabetes !== 'no' && <div className="inset"><div className="field-grid"><NumberField label="Duración de diabetes" value={d.diabetesDuration} onChange={diabetesDuration => update({ diabetesDuration })} unit="años" max={d.age || 100}/><FactorChecklist data={d} update={update}/></div><Check checked={d.organDamage} onChange={organDamage => update({ organDamage })} label="Lesión de órgano diana" detail="Microalbuminuria, retinopatía o neuropatía (tabla 3)."/>{d.diabetes === 'type1' && <Check checked={d.earlyType1} onChange={earlyType1 => update({ earlyType1 })} label="Inicio precoz de DM1" detail="Riesgo muy alto si, además, lleva >20 años de evolución."/>}<p className="caption">Se aplica la tabla 3 de dislipidemias 2025. SCORE2 general no es válido en diabetes; la vía SCORE2-Diabetes de ESC 2023 es específica.</p></div>}
      <Check checked={d.ckd} onChange={ckd => update({ ckd, egfr: ckd ? d.egfr : null })} label="Enfermedad renal crónica confirmada" detail="No clasificar una lesión renal aguda como ERC a partir de una determinación aislada."/>
      {d.ckd && <div className="inset"><NumberField label="Filtrado glomerular" value={d.egfr} onChange={egfr => update({ egfr })} unit="mL/min/1,73 m²" min={0.1} max={200}/></div>}
      <Check checked={d.severeRiskFactor} onChange={severeRiskFactor => update({ severeRiskFactor })} label="Otro factor aislado muy elevado" detail="Colesterol total >310 mg/dL o PA sistólica ≥180 o diastólica ≥110 mmHg."/>
      {d.secondary && <div className="inset"><Check checked={d.acuteCoronary} onChange={acuteCoronary => update({ acuteCoronary })} label="Síndrome coronario agudo actual" detail="Activa la orientación de intensificación durante el ingreso."/><Check checked={d.recurrentOrPolyvascular} onChange={recurrentOrPolyvascular => update({ recurrentOrPolyvascular, consider40: false })} label="Eventos recurrentes con estatina máxima o enfermedad polivascular" detail="Permite valorar un objetivo opcional <40 mg/dL; clase IIb, figura 1."/></div>}
      <Source>ESC/EAS 2025 · tabla 3</Source>
    </section>
  );
}

export function ScoreInputs({ data: d, update, risk }: InputProps & { risk: RiskResult }) {
  const calc = d.scoreMode === 'calc';
  const missing = missingScoreInputs(d);
  const region = (hint: string) => <div className="field"><label htmlFor="region">Región de riesgo</label><select id="region" value={d.region} onChange={e => update({ region: e.target.value as ClinicalInput['region'], scoreConfirmed: false })}>{Object.entries(REGION_LABEL).map(([key, text]) => <option value={key} key={key}>{text}</option>)}</select><small>{hint}</small></div>;
  if (!risk.scoreEligible) return null;
  return (
    <section className="card"><div className="section-heading"><div className="icon-box"><Icon name="shield"/></div><div><h2>Datos para SCORE2</h2><p>{calc ? 'SCORE2 calculado con los datos del paciente.' : 'Resultado de la calculadora oficial.'}</p></div>{risk.model && <span className="pill neutral">{risk.model}</span>}</div>
      {risk.scoreEligible ? <><div className="segmented mode" role="group" aria-label="Origen del SCORE2"><button type="button" className={calc ? 'selected' : ''} aria-pressed={calc} onClick={() => update({ scoreMode: 'calc' })}>Calcular aquí</button><button type="button" className={!calc ? 'selected' : ''} aria-pressed={!calc} onClick={() => update({ scoreMode: 'manual' })}>Entrada manual</button></div>
      {calc ? <><div className="field-grid"><Segmented label="Sexo" value={d.sex} options={[['male', 'Varón'], ['female', 'Mujer']]} onChange={sex => update({ sex })}/><Segmented label="Fumador actual" value={d.smoker} options={[[false, 'No'], [true, 'Sí']]} onChange={smoker => update({ smoker })}/>
        <NumberField label="Colesterol total" value={d.totalChol} onChange={totalChol => update({ totalChol })} unit="mg/dL" min={SCORE2_LIMITS.totalChol[0]} max={SCORE2_LIMITS.totalChol[1]}/><NumberField label="HDL-c" value={d.hdl} onChange={hdl => update({ hdl })} unit="mg/dL" min={SCORE2_LIMITS.hdl[0]} max={SCORE2_LIMITS.hdl[1]} error={d.hdl !== null && d.totalChol !== null && d.hdl >= d.totalChol ? 'El HDL-c debe ser menor que el colesterol total.' : undefined}/>
        <NumberField label="PA sistólica" value={d.sbp} onChange={sbp => update({ sbp })} unit="mmHg" min={SCORE2_LIMITS.sbp[0]} max={SCORE2_LIMITS.sbp[1]} integer/>{region('Recalibra el cálculo. España pertenece a la región de riesgo bajo.')}</div>
      {d.onTreatment && <Check label="Colesterol total y HDL-c previos al tratamiento" detail="SCORE2 no se calcula con lípidos bajo tratamiento hipolipemiante." checked={d.scorePretreatment} onChange={scorePretreatment => update({ scorePretreatment })}/>}
      {missing.length > 0 && <p className="caption">Falta: {missing.join(', ')}.</p>}
      <a className="official-link" href="https://www.heartscore.org/" target="_blank" rel="noopener noreferrer">Contrastar con HeartScore oficial <Icon name="external" size={16}/></a>
      </> : <><div className="field-grid"><NumberField label={`${risk.model} oficial`} value={d.score} onChange={score => update({ score })} unit="%" max={100} hint="Eventos cardiovasculares fatales y no fatales."/>{region('España pertenece a la región de riesgo bajo.')}</div>
      <a className="official-link" href="https://www.heartscore.org/" target="_blank" rel="noopener noreferrer">Abrir HeartScore oficial <Icon name="external" size={16}/></a>
      <Check label="Resultado oficial y región comprobados" checked={d.scoreConfirmed} onChange={scoreConfirmed => update({ scoreConfirmed })}/>
      {d.onTreatment && <Check label="Resultado histórico previo al tratamiento" detail="No se recalcula el riesgo con lípidos bajo tratamiento." checked={d.scorePretreatment} onChange={scorePretreatment => update({ scorePretreatment })}/>}
      </>}</> : <Notice>{d.age === null ? 'Al introducir la edad y el contexto clínico se mostrará la vía de evaluación adecuada.' : 'Con este contexto no se utiliza SCORE2 general. La categoría procede de las condiciones clínicas o requiere una valoración individual.'}</Notice>}
      <Source>ESC/EAS 2025 · tabla 3; ecuaciones SCORE2/SCORE2-OP en fuentes</Source>
    </section>
  );
}

/** The clinician's own category. Used in «Modificadores» and, when the guideline leaves the case to clinical judgement, in Resultado. */
export function ClinicalCategory({ data: d, update, risk, placeholder = 'Ej.: valoración conjunta de modificadores' }: InputProps & { risk: RiskResult; placeholder?: string }) {
  const select = useId(), reason = useId();
  return <div className="clinical-category">
    <div className="field"><label htmlFor={select}>Categoría indicada por el profesional</label><select id={select} value={d.reclassified} onChange={e => update({ reclassified: e.target.value as ClinicalInput['reclassified'] })}><option value="">{risk.original ? 'Mantener evaluación automática' : 'Elige la categoría'}</option>{(Object.keys(RISK_LABEL) as RiskCategory[]).filter(k => !risk.original || RANK[k] >= RANK[risk.original]).map(k => <option value={k} key={k}>{RISK_LABEL[k]}</option>)}</select></div>
    {d.reclassified && <div className="field spaced"><label htmlFor={reason}>Motivo clínico (sin datos identificativos)</label><input id={reason} value={d.reclassificationReason} maxLength={200} placeholder={placeholder} onChange={e => update({ reclassificationReason: e.target.value })}/><small>{d.reclassificationReason.trim().length >= 8 ? 'Aplicada.' : 'Se aplica al escribir un motivo de al menos 8 caracteres.'} No permite rebajar una categoría automática.</small></div>}
  </div>;
}

export function RiskModifiers({ data: d, update, risk }: InputProps & { risk: RiskResult }) {
  return (
    <section className="card compact"><details><summary>Modificadores y reclasificación clínica <span>Opcional</span></summary><div className="details-body"><Check checked={d.modifier} onChange={modifier => update({ modifier })} label="Otros modificadores presentes" detail="Antecedentes familiares prematuros, placa subclínica, enfermedad inflamatoria, entre otros (cuadro 1)."/>
      <p className="caption">Lp(a) elevada y otros modificadores requieren juicio clínico. Esta aplicación nunca suma puntos ni eleva automáticamente la categoría por ellos.</p>
      <ClinicalCategory data={d} update={update} risk={risk}/>
      <Source>ESC/EAS 2025 · cuadro 1 y recomendación 1</Source></div></details></section>
  );
}

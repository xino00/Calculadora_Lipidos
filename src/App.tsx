import { useEffect, useMemo, useRef, useState } from 'react';
import { EMPTY, RISK_LABEL, REGION_LABEL, type ClinicalInput } from './clinical/types';
import { SCORE2_LIMITS, assessRisk } from './clinical/risk';
import { calculateTarget } from './clinical/targets';
import { format } from './clinical/format';
import { interpretLpa } from './clinical/lpa';
import { REVIEWED } from './clinical/references';
import { RiskAssessment, RiskModifiers, ScoreInputs } from './components/RiskAssessment';
import { LipidInputs, TargetDetails } from './components/LipidInputs';
import { LpaAssessment, LpaDetails } from './components/LpaAssessment';
import { TreatmentAlgorithm, TreatmentInputs } from './components/TreatmentAlgorithm';
import { ResultsPanel } from './components/ResultsPanel';
import { LdlNomogram } from './components/LdlNomogram';
import { Icon, Notice } from './components/ui';
import { SourcesContent } from './components/SourcesContent';
import { NotePage } from './components/NotePage';
import type { RegimenId } from './clinical/medications';
import { EMPTY_NOTE, buildNote, type NoteChoices } from './clinical/note';
import './styles.css';

/* Five short screens instead of two long ones; a sticky bar moves between them. */
type Screen = 'risk' | 'ldl' | 'results' | 'treatment' | 'note';
const ORDER: Screen[] = ['risk', 'ldl', 'results', 'treatment', 'note'];
const LABEL: Record<Screen, string> = { risk: 'Riesgo', ldl: 'LDL y tratamiento', results: 'Resultado', treatment: 'Pauta', note: 'Nota' };
const TITLE: Record<Screen, string> = { risk: 'Riesgo cardiovascular', ldl: 'LDL-c y tratamiento actual', results: 'Resultado', treatment: 'Elegir pauta', note: 'Nota para la historia' };
const isData = (s: Screen) => s === 'risk' || s === 'ldl';

export default function App() {
  const [data, setData] = useState<ClinicalInput>({ ...EMPTY });
  const [screen, setScreen] = useState<Screen>('risk');
  const [attempted, setAttempted] = useState(false);
  const [caseId, setCaseId] = useState(0);
  const [example, setExample] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [regimen, setRegimen] = useState<RegimenId | null>(null);
  const [note, setNote] = useState<NoteChoices>({ ...EMPTY_NOTE });
  const [noteStatus, setNoteStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const sourcesDialog = useRef<HTMLDialogElement>(null);
  const screenHeading = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = pendingFocus.current; pendingFocus.current = null;
    if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: 'instant' }); return; }
    screenHeading.current?.focus(); window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen, caseId]);
  const update = (patch: Partial<ClinicalInput>) => {
    const riskChanged = ['age','secondary','diabetes','diabetesDuration','diabetesRiskFactors','organDamage','earlyType1','ckd','egfr','familial','imaging','severeRiskFactor','baseline','score','region','scoreMode','sex','smoker','sbp','totalChol','hdl'].some(k => k in patch);
    setData(old => ({ ...old, ...(riskChanged ? { reclassified: '' as const, reclassificationReason: '' } : {}), ...patch }));
    setCopyStatus('');
  };
  const assessed = assessRisk(data);
  const errors = useMemo(() => {
    const list: string[] = [];
    const check = (label: string, value: number | null, min: number, max: number, integer = false) => {
      if (value !== null && (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value)))) list.push(`Revisa ${label}: ${min}–${max}${integer ? ', número entero' : ''}.`);
    };
    check('la edad', data.age, 18, 110, true);
    check('el LDL basal', data.baseline, 0.1, 1000);
    if (data.onTreatment) check('el LDL actual', data.current, 0.1, 1000);
    if (data.ckd) check('el filtrado glomerular', data.egfr, 0.1, 200);
    if (data.diabetes !== 'no') { check('la duración de diabetes', data.diabetesDuration, 0, data.age || 110); check('los factores mayores', data.diabetesRiskFactors, 0, 5, true); }
    if (assessed.scoreEligible && data.scoreMode === 'calc') {
      check('el colesterol total', data.totalChol, ...SCORE2_LIMITS.totalChol); check('el HDL-c', data.hdl, ...SCORE2_LIMITS.hdl); check('la PA sistólica', data.sbp, ...SCORE2_LIMITS.sbp, true);
      if (data.hdl !== null && data.totalChol !== null && data.hdl >= data.totalChol) list.push('Revisa el HDL-c: debe ser menor que el colesterol total.');
    }
    if (assessed.scoreEligible && data.scoreMode === 'manual') check('el resultado de SCORE2', data.score, 0, 100);
    check('la Lp(a)', data.lpa, 0, data.lpaUnit === 'mg/dL' ? 500 : 1500);
    return list;
  }, [data, assessed.scoreEligible]);
  const risk = errors.length ? { ...assessed, category: null, error: 'Corrige los valores no válidos antes de interpretar resultados.' } : assessed;
  const target = risk.category ? calculateTarget(risk.category, data.baseline, data.onTreatment ? data.current : data.baseline, data.secondary && data.recurrentOrPolyvascular && data.consider40) : null;
  const lpa = interpretLpa(data.lpa, data.lpaUnit);
  const summary = [
    `DIANA LDL | Marco ESC/EAS 2025 | Prototipo independiente, pendiente de validación clínica externa.`,
    example ? 'CASO DE EJEMPLO — DATOS FICTICIOS' : '',
    `Edad: ${format(data.age, 0)} años. Prevención ${data.secondary ? 'secundaria' : 'primaria'}.`,
    `Riesgo: ${risk.category ? RISK_LABEL[risk.category] : 'sin determinar'}${risk.manual ? ' (indicado por el profesional)' : ''}.`,
    ...risk.reasons,
    risk.score !== null ? `${risk.model}: ${format(risk.score)} %. Región: ${REGION_LABEL[data.region]}. ${data.scoreMode === 'calc' ? `Calculado en la aplicación: ${data.sex === 'male' ? 'varón' : 'mujer'}, tabaquismo actual ${data.smoker ? 'sí' : 'no'}, PAS ${format(data.sbp, 0)} mmHg, CT ${format(data.totalChol)} mg/dL, HDL-c ${format(data.hdl)} mg/dL${data.onTreatment ? ' (lípidos previos al tratamiento)' : ''}.` : `Resultado externo${data.onTreatment ? ', previo al tratamiento' : ''}.`}` : '',
    `LDL basal: ${format(data.baseline)} mg/dL. LDL actual: ${format(data.onTreatment ? data.current : data.baseline)} mg/dL.`,
    target ? `Objetivo: <${target.absoluteTarget} mg/dL${target.needs50 ? ' y ≥50 % de reducción desde el basal' : ''}${target.absoluteTarget === 40 ? ' (opcional, IIb)' : ''}.` : '',
    target ? `Estado: ${target.overall === 'met' ? 'objetivo completo alcanzado' : target.overall === 'not-met' ? 'objetivo no alcanzado' : 'objetivo sin verificar'}. ${target.baselineUnknown ? 'Basal desconocido: el criterio ≥50 % no puede comprobarse.' : ''}` : '',
    target ? `Descenso adicional hasta el umbral: ${format(target.requiredAbsolute)} mg/dL (${format(target.requiredPercent)} % del actual). Respetar desigualdad estricta cuando aplica.` : '',
    data.lpa !== null ? `Lp(a): ${format(data.lpa)} ${data.lpaUnit}. ${lpa.title}. Sin conversión ni reclasificación automática.` : 'Lp(a): no introducida.',
    data.modifier ? 'Otros modificadores de riesgo presentes: requieren valoración clínica.' : '',
    ...errors, ...risk.notices,
    `Fuentes: https://doi.org/10.1093/eurheartj/ehaf190 · Revisión de fuentes: ${REVIEWED}.`,
  ].filter(Boolean).join('\n');
  const noteText = buildNote(data, risk, target, note, example);

  function clearNote() { setRegimen(null); setNote({ ...EMPTY_NOTE }); setNoteStatus(''); }
  function reset() {
    setData({ ...EMPTY }); setCaseId(v => v + 1); setExample(false);
    setScreen('risk'); setAttempted(false); setCopyStatus(''); clearNote();
  }
  function loadExample() {
    setData({ ...EMPTY, age: 58, secondary: true, baseline: 160, onTreatment: true, current: 82, lpa: 72, therapy: 'statin' });
    setCaseId(v => v + 1); setExample(true); setScreen('risk'); setAttempted(false); setCopyStatus(''); clearNote();
  }
  const changeNote = (patch: Partial<NoteChoices>) => { setNote(n => ({ ...n, ...patch })); setNoteStatus(''); };
  /* Leaving the data screens validates first; an invalid field takes you to the screen that holds it. */
  function goTo(next: Screen) {
    if (isData(screen) && !isData(next) && !dataValid()) return;
    setScreen(next);
  }
  function dataValid() {
    setAttempted(true);
    const invalid = document.querySelector<HTMLElement>('#patient-inputs [aria-invalid="true"]');
    const target = invalid ?? (errors.length ? document.getElementById('input-errors') : null);
    if (!target) return true;
    let parent = target.parentElement;
    while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
    const step = (target.closest('[data-step]')?.getAttribute('data-step') as Screen | null) ?? screen;
    if (step === screen) { target.focus(); target.scrollIntoView({ block: 'center', behavior: 'instant' }); }
    else { pendingFocus.current = target; setScreen(step); }
    return false;
  }
  function showSummary() { setCopyStatus(''); dialog.current?.showModal(); }
  async function copyNote() {
    try { await navigator.clipboard.writeText(noteText); setNoteStatus('Nota copiada. Ya puedes pegarla en la historia.'); }
    catch { document.querySelector<HTMLTextAreaElement>('.note-out textarea')?.select(); setNoteStatus('Selecciona el texto y cópialo manualmente.'); }
  }
  const index = ORDER.indexOf(screen);
  const prev = ORDER[index - 1];
  const next = ORDER[index + 1];

  return <div className="app-shell consultation">
    <a className="skip-link" href="#main">Saltar al contenido</a>
    <div className="workspace">
      <header className="topbar"><a className="brand" href="#main" onClick={() => setScreen('risk')}><span className="brand-mark"><Icon name="target" size={23}/></span><span>Diana<small>LDL</small></span></a><div className="header-actions"><button className="text-button" onClick={() => sourcesDialog.current?.showModal()}>Fuentes y método</button><button className="reset-button" onClick={reset}><Icon name="reset" size={16}/>Nuevo caso</button></div></header>
      <main id="main">
        {screen === 'risk' ? <>
          <div className="page-heading"><div><h1>Diana LDL</h1><p>Apunta al objetivo de LDL-c de cada paciente: riesgo, objetivo y pauta en cinco pasos, con la nota lista para la historia.</p></div><button className="example-button" onClick={loadExample}>{example ? 'Recargar ejemplo' : 'Explorar un ejemplo'}</button></div>
          <div className="trace-head"><dl><div><dt>Marco</dt><dd>ESC/EAS 2025</dd></div><div><dt>Estado</dt><dd><strong>Prototipo pendiente de validación clínica externa</strong>, herramienta independiente</dd></div><div><dt>Datos</dt><dd>Solo en memoria; se borran al recargar</dd></div></dl>{example && <b className="example-badge">Caso ficticio</b>}</div>
        </> : <p className="mini-head">Prototipo pendiente de validación clínica externa. Marco ESC/EAS 2025.{example && <b className="example-badge">Caso ficticio</b>}</p>}
        <nav className="workflow-nav" aria-label="Pasos de la consulta">
          {ORDER.map((s, n) => <button key={s} aria-current={screen === s ? 'step' : undefined} aria-label={`Paso ${n + 1}: ${LABEL[s]}`} className={screen === s ? 'active' : ''} onClick={() => goTo(s)}><span>{n + 1}</span><em>{LABEL[s]}</em></button>)}
        </nav>
        <h2 className="sr-only" ref={screenHeading} tabIndex={-1}>{TITLE[screen]}</h2>

        <section id="patient-inputs" hidden={!isData(screen)} key={caseId} aria-label="Datos del paciente">
          {errors.length > 0 && <div id="input-errors" tabIndex={-1}><Notice tone="warning"><strong>Revisa los datos</strong><ul>{errors.map(e => <li key={e}>{e}</li>)}</ul></Notice></div>}
          {attempted && !errors.length && risk.error && <Notice tone="warning">{risk.error} Puedes ver el resultado parcial; lo que falte quedará pendiente.</Notice>}
          <div data-step="risk" hidden={screen !== 'risk'}><RiskAssessment data={data} update={update}/><ScoreInputs data={data} update={update} risk={risk}/><RiskModifiers data={data} update={update} risk={risk}/></div>
          <div data-step="ldl" hidden={screen !== 'ldl'}><LipidInputs data={data} update={update}/><TreatmentInputs data={data} update={update}/><LpaAssessment data={data} update={update}/></div>
        </section>

        {screen === 'results' && <section className="result-page" aria-label="Resultado">
          <ResultsPanel data={data} risk={risk} target={target} onSummary={showSummary}/>
          {risk.error && <Notice tone="warning">{risk.error}</Notice>}
          <TreatmentAlgorithm data={data} update={update} risk={risk} target={target} part="plan"/>
          <TargetDetails target={target}/>
          <LpaDetails data={data}/>
          <section className="card compact"><details><summary>Motivos y matices de la valoración</summary><div className="details-body">{risk.reasons.length > 0 && <ul>{risk.reasons.map(s => <li key={s}>{s}</li>)}</ul>}{risk.notices.length > 0 && <ul>{risk.notices.map(s => <li key={s}>{s}</li>)}</ul>}{!risk.reasons.length && !risk.notices.length && <p>Completa los datos para determinar el riesgo.</p>}</div></details></section>
        </section>}

        {screen === 'treatment' && <section className="result-page treatment-page" aria-label="Elegir pauta">
          {target ? <LdlNomogram data={data} risk={risk} target={target} selected={regimen} onSelect={setRegimen} choices={note} onChoices={changeNote}/>
            : <Notice tone="warning">Completa la estratificación del riesgo para comparar combinaciones. Puedes elegir la pauta directamente en «Nota».</Notice>}
          <TreatmentAlgorithm data={data} update={update} risk={risk} target={target} part="catalogue"/>
        </section>}

        {screen === 'note' && <section className="result-page" aria-label="Nota para la historia">
          <NotePage data={data} risk={risk} target={target} choices={note} onChange={changeNote} regimen={regimen} example={example} onCopy={copyNote} status={noteStatus}/>
        </section>}

        <div className="input-actions step-bar">
          {prev ? <button className="reset-button" onClick={() => setScreen(prev)}>Anterior<span className="step-bar-name">: {LABEL[prev]}</span></button> : <p>Solo se muestran los campos aplicables.</p>}
          {next ? <button className="primary-button" onClick={() => goTo(next)}>Siguiente: {LABEL[next]}</button>
            : <button className="primary-button" onClick={copyNote}><Icon name="copy" size={18}/>Copiar nota</button>}
        </div>
        <footer><span>Marco ESC/EAS 2025</span><button onClick={() => sourcesDialog.current?.showModal()}>Fuentes y método</button><span>Reglas revisadas el {REVIEWED}</span></footer>
      </main>
    </div>
    <dialog className="sources-dialog" ref={sourcesDialog} aria-labelledby="sources-title"><button className="close-button sources-close" aria-label="Cerrar fuentes" onClick={() => sourcesDialog.current?.close()}>×</button><SourcesContent/></dialog>
    <dialog ref={dialog} aria-labelledby="summary-title"><div className="dialog-heading"><div><span className="eyebrow">Solo en esta sesión</span><h2 id="summary-title">Resumen de la valoración</h2></div><button className="close-button" aria-label="Cerrar resumen" onClick={() => dialog.current?.close()}>×</button></div><p className="caption">Revísalo antes de incorporarlo a una nota clínica. No incluye una prescripción.</p><textarea aria-label="Resumen clínico para copiar" readOnly value={summary}/><div className="dialog-actions"><span role="status">{copyStatus}</span><button className="primary-button" onClick={async () => { try { await navigator.clipboard.writeText(summary); setCopyStatus('Resumen copiado'); } catch { setCopyStatus('Selecciona el texto y cópialo manualmente.'); } }}><Icon name="copy" size={16}/>Copiar resumen</button></div></dialog>
  </div>;
}

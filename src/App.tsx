import { useMemo, useRef, useState } from 'react';
import { EMPTY, RISK_LABEL, REGION_LABEL, type ClinicalInput } from './clinical/types';
import { assessRisk } from './clinical/risk';
import { calculateTarget } from './clinical/targets';
import { format } from './clinical/format';
import { interpretLpa } from './clinical/lpa';
import { REFERENCES, REVIEWED } from './clinical/references';
import { RiskAssessment } from './components/RiskAssessment';
import { LipidInputs } from './components/LipidInputs';
import { LpaAssessment } from './components/LpaAssessment';
import { TreatmentAlgorithm } from './components/TreatmentAlgorithm';
import { ResultsPanel } from './components/ResultsPanel';
import { Icon, Notice } from './components/ui';
import './styles.css';

const TABS = [
  { id: 'risk', label: 'Riesgo', subtitle: 'Contexto y SCORE2', icon: 'shield' },
  { id: 'targets', label: 'Objetivos LDL-c', subtitle: 'Basal y respuesta', icon: 'target' },
  { id: 'lpa', label: 'Lipoproteína(a)', subtitle: 'Modificador de riesgo', icon: 'drop' },
  { id: 'treatment', label: 'Tratamiento', subtitle: 'Decisión y escenarios', icon: 'layers' },
] as const;
type Tab = typeof TABS[number]['id'] | 'sources';
export default function App() {
  const [data, setData] = useState<ClinicalInput>({ ...EMPTY });
  const [tab, setTab] = useState<Tab>('risk');
  const [caseId, setCaseId] = useState(0);
  const [example, setExample] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const update = (patch: Partial<ClinicalInput>) => {
    const riskChanged = ['age','secondary','diabetes','diabetesDuration','diabetesRiskFactors','organDamage','earlyType1','ckd','egfr','familial','imaging','severeRiskFactor','baseline','score','region'].some(k => k in patch);
    setData(old => ({ ...old, ...(riskChanged ? { reclassified: '' as const, reclassificationReason: '' } : {}), ...patch }));
    setCopyStatus('');
  };
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
    return list;
  }, [data]);
  const assessed = assessRisk(data);
  const risk = errors.length ? { ...assessed, category: null, error: 'Corrige los valores no válidos antes de interpretar resultados.' } : assessed;
  const target = risk.category ? calculateTarget(risk.category, data.baseline, data.onTreatment ? data.current : data.baseline, data.secondary && data.recurrentOrPolyvascular && data.consider40) : null;
  const lpa = interpretLpa(data.lpa, data.lpaUnit);
  const summary = [
    `LÍPIDOS · CONSULTA | Marco ESC/EAS 2025 | Prototipo independiente, pendiente de validación clínica externa.`,
    example ? 'CASO DE EJEMPLO — DATOS FICTICIOS' : '',
    `Edad: ${format(data.age, 0)} años. Prevención ${data.secondary ? 'secundaria' : 'primaria'}.`,
    `Riesgo: ${risk.category ? RISK_LABEL[risk.category] : 'sin determinar'}${risk.manual ? ' (indicado por el profesional)' : ''}.`,
    ...risk.reasons,
    risk.scoreEligible && data.scoreConfirmed && (!data.onTreatment || data.scorePretreatment) ? `${risk.model}: ${format(data.score)} %. Región: ${REGION_LABEL[data.region]}. Resultado externo${data.onTreatment ? ', previo al tratamiento' : ''}.` : '',
    `LDL basal: ${format(data.baseline)} mg/dL. LDL actual: ${format(data.onTreatment ? data.current : data.baseline)} mg/dL.`,
    target ? `Objetivo: <${target.absoluteTarget} mg/dL${target.needs50 ? ' y ≥50 % de reducción desde el basal' : ''}${target.absoluteTarget === 40 ? ' (opcional, IIb)' : ''}.` : '',
    target ? `Estado: ${target.overall === 'met' ? 'objetivo completo alcanzado' : target.overall === 'not-met' ? 'objetivo no alcanzado' : 'objetivo sin verificar'}. ${target.baselineUnknown ? 'Basal desconocido: el criterio ≥50 % no puede comprobarse.' : ''}` : '',
    target ? `Descenso adicional hasta el umbral: ${format(target.requiredAbsolute)} mg/dL (${format(target.requiredPercent)} % del actual). Respetar desigualdad estricta cuando aplica.` : '',
    data.lpa !== null ? `Lp(a): ${format(data.lpa)} ${data.lpaUnit}. ${lpa.title}. Sin conversión ni reclasificación automática.` : 'Lp(a): no introducida.',
    data.modifier ? 'Otros modificadores de riesgo presentes: requieren valoración clínica.' : '',
    ...errors, ...risk.notices,
    `Fuentes: https://doi.org/10.1093/eurheartj/ehaf190 · Revisión de fuentes: ${REVIEWED}.`,
  ].filter(Boolean).join('\n');
  function reset() { setData({ ...EMPTY }); setCaseId(v => v + 1); setExample(false); setTab('risk'); setCopyStatus(''); }
  function loadExample() { setData({ ...EMPTY, age: 58, secondary: true, baseline: 160, onTreatment: true, current: 82, lpa: 72, therapy: 'statin' }); setCaseId(v => v + 1); setExample(true); setTab('targets'); }
  const navigate = (next: Tab) => { setTab(next); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const activeIndex = TABS.findIndex(t => t.id === tab);
  return <div className="app-shell">
    <a className="skip-link" href="#main">Saltar al contenido</a>
    <aside className="sidebar"><a className="brand" href="#main" onClick={() => navigate('risk')}><span className="brand-mark"><Icon name="pulse" size={25}/></span><span>Lípidos<small>CONSULTA</small></span></a>
      <div className="sidebar-caption">ESPACIO CLÍNICO</div><nav aria-label="Módulos de la calculadora">{TABS.map((t, n) => <button key={t.id} className={`nav-item ${tab === t.id ? 'active' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => navigate(t.id)}><Icon name={t.icon}/><span>{t.label}<small>{t.subtitle}</small></span><b>0{n + 1}</b></button>)}</nav>
      <button className={`nav-item sources-nav ${tab === 'sources' ? 'active' : ''}`} onClick={() => navigate('sources')}><Icon name="book"/><span>Fuentes y método</span></button>
      <div className="sidebar-bottom"><span className="version">MARCO ESC/EAS <b>2025</b></span><p>Herramienta independiente<br/>para revisión profesional.</p><span className="review-badge">v0.1 · En revisión clínica</span></div>
    </aside>
    <div className="workspace"><header className="topbar"><span><span className="online-dot"/> Sesión local <span className="desktop-only">· sin datos guardados</span></span><button className="reset-button" onClick={reset}><Icon name="reset" size={16}/>Nuevo caso</button></header>
      <main id="main"><div className="page-heading"><div><div className="eyebrow">PREVENCIÓN CARDIOVASCULAR <span>/</span> ADULTOS</div><h1>Calculadora de lípidos<span>.</span></h1><p>Del riesgo al objetivo. Del objetivo al tratamiento.</p></div><button className="example-button" onClick={loadExample}>{example ? 'Recargar ejemplo' : 'Explorar un ejemplo'}<Icon name="arrow" size={16}/></button></div>
      <div className="scope-banner"><Icon name="info" size={16}/><span>Basada en ESC/EAS 2025. <strong>Prototipo pendiente de validación clínica externa.</strong> No es una herramienta oficial de ESC.</span>{example && <b className="example-badge">CASO FICTICIO</b>}</div>
      <nav className="mobile-tabs" aria-label="Módulos">{TABS.map((t, n) => <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => navigate(t.id)}><span>0{n + 1}</span>{['Riesgo','LDL-c','Lp(a)','Tratamiento'][n]}</button>)}</nav>
      {tab === 'sources' ? <section className="card sources-page"><div className="section-heading"><div className="icon-box"><Icon name="book"/></div><div><h2>Fuentes y método</h2><p>Reglas visibles y decisiones trazables.</p></div></div><Notice>Marco clínico fijo: actualización ESC/EAS 2025. Fuentes revisadas el {REVIEWED}. No integra automáticamente nuevas guías ni constituye validación clínica o certificación.</Notice><div className="references">{REFERENCES.map((r, n) => <a href={r.url} target="_blank" rel="noopener noreferrer" key={r.id}><span>{String(n + 1).padStart(2, '0')}</span><div><h3>{r.title}</h3><p>{r.detail}</p></div><Icon name="external" size={17}/></a>)}</div><h3>Decisiones de implementación</h3><ul className="method-list"><li>SCORE2 externo, sin fórmula aproximada. Región seleccionada como contexto; no recalibra el resultado.</li><li>LDL basal ≥190 mg/dL: se adopta el límite inclusivo de la nota a de tabla 4, aunque la tabla 3 imprime &gt;190.</li><li>Diabetes: criterios de tabla 3. Los casos no cubiertos quedan pendientes; no se mezclan con umbrales SCORE2-Diabetes.</li><li>FG para ERC confirmada: &lt;30 muy alto; 30–&lt;60 alto. FG ≥60 no determina una categoría en esta tabla.</li><li>Lp(a): umbral &gt;50 mg/dL o &gt;105 nmol/L de rec. 4/cuadro 1. El texto también usa ≥105: se señala el valor exacto como frontera clínica.</li><li>LDL: comparación estricta «&lt;» para el objetivo absoluto y «≤50 % del basal» para la reducción ≥50 %. La aritmética no se redondea antes de comparar.</li><li>Estimaciones farmacológicas: promedios de las combinaciones de figura 2. No se suman porcentajes ni se reconstruye un basal desconocido.</li><li>No cubre prescripción individual, interacciones completas, hipertrigliceridemia, pediatría ni criterios de financiación. No integra de forma general guías de ERC posteriores a 2025.</li></ul><h3>Privacidad</h3><p>Sin backend, analítica, cookies de la aplicación, almacenamiento local ni datos identificativos. Todo el cálculo ocurre en el navegador. Los campos se borran al recargar o crear un nuevo caso. El resumen solo sale de la aplicación si lo copias expresamente.</p></section> : <div className="content-grid"><div className="form-column" key={caseId}>
        {errors.length > 0 && <Notice tone="warning"><strong>Revisa los datos</strong><ul>{errors.map(e => <li key={e}>{e}</li>)}</ul></Notice>}
        {risk.error && data.age !== null && <Notice tone="warning">{risk.error}</Notice>}
        {tab === 'risk' && <RiskAssessment data={data} update={update} risk={risk}/>}
        {tab === 'targets' && <LipidInputs data={data} update={update} target={target}/>}
        {tab === 'lpa' && <LpaAssessment data={data} update={update}/>}
        {tab === 'treatment' && (errors.length ? <Notice>Corrige los campos indicados en los módulos de riesgo y LDL para continuar.</Notice> : <TreatmentAlgorithm data={data} update={update} risk={risk} target={target}/>)}
        {risk.notices.length > 0 && <section className="context-notes"><h3>Matices de esta valoración</h3><ul>{risk.notices.map(s => <li key={s}>{s}</li>)}</ul></section>}
        <div className="step-navigation"><button className="text-button" onClick={() => navigate(activeIndex > 0 ? TABS[activeIndex - 1].id : 'sources')}>{activeIndex > 0 ? '← Anterior' : 'Consultar el método'}</button>{activeIndex < 3 && <button className="primary-button" onClick={() => navigate(TABS[activeIndex + 1].id)}>{['Introducir LDL-c','Interpretar Lp(a)','Ver tratamiento'][activeIndex]}<Icon name="arrow" size={17}/></button>}</div>
      </div><ResultsPanel data={data} risk={risk} target={target} onSummary={() => { setCopyStatus(''); dialog.current?.showModal(); }}/></div>}
      <footer><span>Lípidos · Consulta <b>2025</b></span><button onClick={() => navigate('sources')}>Fuentes y método <Icon name="external" size={12}/></button><span>Revisión de fuentes · {REVIEWED}</span></footer>
      </main>
    </div>
    <dialog ref={dialog} aria-labelledby="summary-title"><div className="dialog-heading"><div><span className="eyebrow">SOLO EN ESTA SESIÓN</span><h2 id="summary-title">Resumen de la valoración</h2></div><button className="close-button" aria-label="Cerrar resumen" onClick={() => dialog.current?.close()}>×</button></div><p className="caption">Revísalo antes de incorporarlo a una nota clínica. No incluye una prescripción.</p><textarea aria-label="Resumen clínico para copiar" readOnly value={summary}/><div className="dialog-actions"><span role="status">{copyStatus}</span><button className="primary-button" onClick={async () => { try { await navigator.clipboard.writeText(summary); setCopyStatus('Resumen copiado'); } catch { setCopyStatus('Selecciona el texto y cópialo manualmente.'); } }}><Icon name="copy" size={16}/>Copiar resumen</button></div></dialog>
  </div>;
}

import { format } from '../clinical/format';
import { interpretLpa } from '../clinical/lpa';
import { REGION_LABEL, RISK_LABEL, type ClinicalInput, type RiskResult } from '../clinical/types';
import type { TargetResult } from '../clinical/targets';
import { Icon } from './ui';

export function ResultsPanel({ data, risk, target, onSummary }: { data: ClinicalInput; risk: RiskResult; target: TargetResult | null; onSummary: () => void }) {
  const lpa = interpretLpa(data.lpa, data.lpaUnit);
  return <section className="results-card overview" aria-label="Resumen clínico">
    <div className="overview-metrics">
      <div className="result-risk"><span>Riesgo cardiovascular</span><h2>{risk.category ? RISK_LABEL[risk.category] : 'Por determinar'}</h2><span className="result-tag">{data.secondary ? 'Prevención secundaria' : 'Prevención primaria'}{risk.manual ? ' · criterio clínico' : ''}</span>{risk.score !== null && <p className="result-note">{risk.model}: {format(risk.score)} % · {REGION_LABEL[data.region]}</p>}</div>
      <div className="result-target"><span>Objetivo de LDL-c</span><div><strong>{target ? `<${target.absoluteTarget}` : '—'}</strong><span>mg/dL</span></div><p>{target?.needs50 ? '+ reducción ≥50 % desde el basal' : target ? 'Objetivo absoluto según categoría' : 'Completa el contexto clínico'}</p>{target?.absoluteTarget === 40 && <small>Objetivo opcional · clase IIb</small>}</div>
      <div className="result-target"><span>Descenso adicional hasta el umbral</span><div><strong>{target ? format(target.requiredPercent) : '—'}</strong><span>%</span></div><p>{target ? format(target.requiredAbsolute) : '—'} mg/dL desde el LDL actual</p><p>LDL actual: {format(data.onTreatment ? data.current : data.baseline)} mg/dL · basal: {format(data.baseline)} mg/dL</p></div>
    </div>
    <div className="overview-bottom"><div><div className={`result-status ${target?.overall === 'met' ? 'achieved' : ''}`}><Icon name={target?.overall === 'met' ? 'check' : 'target'} size={17}/>{!target ? 'Pendiente de estratificación' : target.overall === 'met' ? 'Objetivo completo alcanzado' : target.overall === 'not-met' ? 'Objetivo aún no alcanzado' : 'Objetivo sin verificar'}</div><p className="result-note">{target?.baselineUnknown ? 'Falta el basal para verificar el descenso ≥50 %. ' : ''}El LDL debe quedar por debajo cuando el objetivo usa «&lt;».</p>{lpa.elevated && <p className="result-note">Lp(a) elevada: revisar el riesgo global; no se ha reclasificado automáticamente.</p>}</div><button className="summary-button" onClick={onSummary}><Icon name="copy" size={17}/>Copiar resumen</button></div>
  </section>;
}

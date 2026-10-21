import { format } from '../clinical/format';
import { interpretLpa } from '../clinical/lpa';
import { RISK_LABEL, type ClinicalInput, type RiskResult } from '../clinical/types';
import type { TargetResult } from '../clinical/targets';
import { Icon } from './ui';
export function ResultsPanel({ data, risk, target, onSummary }: { data: ClinicalInput; risk: RiskResult; target: TargetResult | null; onSummary: () => void }) {
  const lpa = interpretLpa(data.lpa, data.lpaUnit);
  return <aside className="results-column"><section className="results-card" aria-live="polite"><div className="result-heading"><Icon name="pulse"/><span>RESUMEN CLÍNICO</span><span className="live-dot"/></div>
    <div className="result-risk"><span>Riesgo cardiovascular</span><h2>{risk.category ? RISK_LABEL[risk.category] : 'Por determinar'}</h2><span className="result-tag">{data.secondary ? 'Prevención secundaria' : 'Prevención primaria'}{risk.manual ? ' · criterio clínico' : ''}</span></div>
    <div className="result-target"><span>Objetivo de LDL-c</span><div><strong>{target ? `<${target.absoluteTarget}` : '—'}</strong><span>mg/dL</span></div><p>{target?.needs50 ? '+ reducción ≥50 % desde el basal' : target ? 'Objetivo absoluto según categoría' : 'Completa el contexto clínico'}</p>{target?.absoluteTarget === 40 && <small>Objetivo opcional · clase IIb</small>}</div>
    <div className="result-rows"><div><span>LDL basal</span><strong>{format(data.baseline)} <small>mg/dL</small></strong></div><div><span>LDL actual</span><strong>{format(data.onTreatment ? data.current : data.baseline)} <small>mg/dL</small></strong></div><div><span>Descenso adicional*</span><strong>{target ? format(target.requiredPercent) : '—'} <small>%</small></strong></div></div>
    <div className={`result-status ${target?.overall === 'met' ? 'achieved' : ''}`}><Icon name={target?.overall === 'met' ? 'check' : 'target'} size={17}/>{!target ? 'Pendiente de estratificación' : target.overall === 'met' ? 'Objetivo completo alcanzado' : target.overall === 'not-met' ? 'Objetivo aún no alcanzado' : 'Objetivo sin verificar'}</div>
    {target?.baselineUnknown && <p className="result-note">Falta el basal para verificar el descenso ≥50 %.</p>}
    <p className="result-note">*Desde el LDL actual hasta el umbral. Debe quedar por debajo cuando el objetivo usa «&lt;».</p>
    <button className="summary-button" onClick={onSummary}><Icon name="copy" size={17}/> Ver y copiar resumen</button>
  </section>
  {risk.reasons.length > 0 && <section className="reason-card"><h3>¿De dónde sale este riesgo?</h3><ul>{risk.reasons.map(s => <li key={s}>{s}</li>)}</ul></section>}
  {lpa.elevated && <section className="modifier-card"><Icon name="drop" size={18}/><div><strong>Lp(a) elevada</strong><p>Revisar el riesgo global. No se ha cambiado la categoría automáticamente.</p></div></section>}
  <div className="privacy-note"><Icon name="lock" size={16}/><p>Los datos permanecen en memoria. Al recargar o pulsar «Nuevo caso», se borran.</p></div>
  </aside>;
}

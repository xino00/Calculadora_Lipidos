import { format } from '../clinical/format';
import { interpretLpa } from '../clinical/lpa';
import { RISK_LABEL, type ClinicalInput, type Region, type RiskCategory, type RiskResult } from '../clinical/types';
import type { TargetResult } from '../clinical/targets';
import { Icon } from './ui';

const RISK_ORDER: RiskCategory[] = ['low', 'moderate', 'high', 'very-high'];
const REGION_PHRASE: Record<Region, string> = { low: 'de riesgo bajo (España)', moderate: 'de riesgo moderado', high: 'de riesgo alto', 'very-high': 'de riesgo muy alto' };

/* The result reads like the automatic interpretation an ECG machine prints above the trace. */
export function ResultsPanel({ data, risk, target, onSummary }: { data: ClinicalInput; risk: RiskResult; target: TargetResult | null; onSummary: () => void }) {
  const lpa = interpretLpa(data.lpa, data.lpaUnit);
  const current = data.onTreatment ? data.current : data.baseline;
  const status = !target ? 'Pendiente de estratificación' : target.overall === 'met' ? 'Objetivo completo alcanzado' : target.overall === 'not-met' ? 'Objetivo aún no alcanzado' : 'Objetivo sin verificar';
  return <section className="results-card" aria-label="Resumen clínico">
    <div className="readout">
      <div className="readout-risk">
        <h2>{risk.category ? <>Riesgo {RISK_LABEL[risk.category].toLowerCase()}</> : 'Riesgo por determinar'}</h2>
        <ol className="risk-ticks" aria-label={risk.category ? `Categoría ${RISK_LABEL[risk.category]} de cuatro` : undefined}>{RISK_ORDER.map(k => <li key={k} className={k === risk.category ? 'on' : ''}>{RISK_LABEL[k]}</li>)}</ol>
      </div>
      <div className="readout-lines">
        <p>{data.secondary ? 'Prevención secundaria' : 'Prevención primaria'}{risk.manual ? ', categoría indicada por criterio clínico' : ''}.{risk.score !== null && <> {risk.model} {format(risk.score)} % en región {REGION_PHRASE[data.region]}.</>}</p>
        {target ? <>
          <p className="goal">Objetivo de LDL-c <strong>&lt;{target.absoluteTarget} mg/dL</strong>{target.needs50 ? ' y reducción ≥50 % desde el basal' : ''}.{target.absoluteTarget === 40 && <span className="optional"> Objetivo opcional, clase IIb.</span>}</p>
          <p>{current !== null ? <>LDL-c actual <strong>{format(current)} mg/dL</strong>{data.onTreatment && data.baseline !== null ? <>, basal {format(data.baseline)} mg/dL</> : ''}. </> : 'LDL-c actual no introducido. '}
            {target.requiredAbsolute !== null && target.requiredAbsolute > 0 && <>Faltan <strong>{format(target.requiredAbsolute)} mg/dL</strong> hasta {target.operator}{format(target.effectiveTarget)} mg/dL ({format(target.requiredPercent)} % del actual).</>}</p>
        </> : <p>Completa el contexto clínico para obtener el objetivo.</p>}
      </div>
    </div>
    <div className="readout-foot">
      <div>
        <p className={`result-status ${target?.overall === 'met' ? 'achieved' : ''}`}><Icon name={target?.overall === 'met' ? 'check' : 'target'} size={18}/>{status}</p>
        <p className="result-note">{target?.baselineUnknown ? 'Falta el basal para verificar el descenso ≥50 %. ' : ''}El LDL debe quedar por debajo cuando el objetivo usa «&lt;».</p>
        {lpa.elevated && <p className="result-note">Lp(a) elevada: revisar el riesgo global; no se ha reclasificado automáticamente.</p>}
      </div>
      <button className="summary-button" onClick={onSummary}><Icon name="copy" size={17}/>Copiar resumen</button>
    </div>
  </section>;
}

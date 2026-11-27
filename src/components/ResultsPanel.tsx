import { format } from '../clinical/format';
import { interpretLpa } from '../clinical/lpa';
import { RISK_LABEL, type ClinicalInput, type Region, type RiskCategory, type RiskResult } from '../clinical/types';
import type { TargetResult } from '../clinical/targets';
import { Icon } from './ui';
import { pendingReason } from '../clinical/risk';
import { ClinicalCategory } from './RiskAssessment';

const RISK_ORDER: RiskCategory[] = ['low', 'moderate', 'high', 'very-high'];
const REGION_PHRASE: Record<Region, string> = { low: 'de riesgo bajo (España)', moderate: 'de riesgo moderado', high: 'de riesgo alto', 'very-high': 'de riesgo muy alto' };

/* The result reads like the automatic interpretation an ECG machine prints above the trace. */
export function ResultsPanel({ data, risk, target, onSummary, onEdit, update }: { data: ClinicalInput; risk: RiskResult; target: TargetResult | null; onSummary: () => void; onEdit: (reason: string) => void; update: (patch: Partial<ClinicalInput>) => void }) {
  const pending = pendingReason(risk);
  /* Cases the guideline leaves to clinical judgement: let the clinician set the category right here. */
  const judgement = !!pending && /valoración clínica individual|Requiere valoración específica|no asigna una categoría/i.test(pending);
  const lpa = interpretLpa(data.lpa, data.lpaUnit);
  const current = data.onTreatment ? data.current : data.baseline;
  const status = !target ? 'Pendiente de estratificación' : target.overall === 'met' ? 'Objetivo completo alcanzado' : target.overall === 'not-met' ? 'Objetivo aún no alcanzado' : 'Objetivo sin verificar';
  return <section className={`results-card ${risk.category ? `risk-${risk.category}` : 'risk-pending'}`} aria-label="Resumen clínico">
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
        </> : judgement ? <><p className="pending"><strong>Sin categoría automática:</strong> {pending}</p><p>Indica tú la categoría para seguir; quedará marcada como criterio clínico.</p><ClinicalCategory data={data} update={update} risk={risk} placeholder="Ej.: menor de 40 años sin factores de riesgo"/><p><button type="button" className="text-button" onClick={() => onEdit(pending ?? '')}>Revisar los datos</button></p></>
          : <><p className="pending"><strong>Falta:</strong> {pending}</p><p><button type="button" className="reset-button" onClick={() => onEdit(pending ?? '')}>Completar datos</button></p></>}
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

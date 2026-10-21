import { interpretLpa } from '../clinical/lpa';
import type { LpaUnit } from '../clinical/types';
import type { InputProps } from './RiskAssessment';
import { Check, Icon, Notice, NumberField, Source } from './ui';
export function LpaAssessment({ data: d, update }: InputProps) {
  const lpa = interpretLpa(d.lpa, d.lpaUnit);
  const limits = d.lpaUnit === 'mg/dL' ? ['<30', '30–50', '>50'] : ['<62', '62–105', '>105'];
  return <><section className="card"><div className="section-heading"><span className="step-number">03</span><div><h2>Lipoproteína(a)</h2><p>Una pieza más en la valoración del riesgo.</p></div></div>
    <div className="field-grid"><NumberField key={d.lpaUnit} label="Concentración de Lp(a)" value={d.lpa} onChange={lpa => update({ lpa })} unit={d.lpaUnit} max={d.lpaUnit === 'mg/dL' ? 500 : 1500} hint="Opcional. Copia la unidad del laboratorio."/><fieldset className="field"><legend>Unidad del laboratorio</legend><div className="segmented">{(['mg/dL', 'nmol/L'] as LpaUnit[]).map(unit => <button key={unit} className={d.lpaUnit === unit ? 'selected' : ''} aria-pressed={d.lpaUnit === unit} onClick={() => { if (unit !== d.lpaUnit) update({ lpaUnit: unit, lpa: null }); }}>{unit}</button>)}</div><small>Cambiar de unidad vacía el valor.</small></fieldset></div>
    <Notice>No hay una conversión universal entre mg/dL y nmol/L. Aquí no se convierten valores ni se corrige el LDL-c restando colesterol de Lp(a).</Notice>
    <div className={`lpa-result ${lpa.elevated ? 'elevated' : ''}`}><div className="icon-box"><Icon name="drop" size={26}/></div><div><span className="eyebrow">INTERPRETACIÓN</span><h3>{lpa.title}</h3><p>{lpa.detail}</p></div></div>
    <div className="lpa-scale">{limits.map((text, index) => <div key={text}><span>{['Por debajo del rango', 'Riesgo progresivo', 'Modificador'][index]}</span><strong>{text}<small> {d.lpaUnit}</small></strong></div>)}</div>
    <p className="caption">El riesgo es continuo. Los puntos de corte orientan la decisión; no representan un límite biológico de normalidad. ESC/EAS 2025: &gt;50 mg/dL o &gt;105 nmol/L (IIa B).</p>
    <Source>ESC/EAS 2025 · sección 6 y recomendación 4</Source>
  </section><section className="card"><div className="section-heading"><div className="icon-box"><Icon name="shield"/></div><div><h2>Cómo cambia la decisión</h2><p>Interpretación clínica, sin puntuación añadida.</p></div></div>
    <ol className="clinical-list"><li><strong>Revisar el riesgo global.</strong> Es especialmente útil cerca de un umbral de tratamiento o con riesgo moderado.</li><li><strong>Optimizar el LDL-c y los demás factores.</strong> Una Lp(a) elevada no es, por sí sola, indicación automática de anti-PCSK9 ni de aspirina.</li><li><strong>Reclasificar solo con criterio clínico.</strong> Si corresponde, documenta la decisión en el módulo de riesgo.</li></ol>
    <Check checked={d.modifier} onChange={modifier => update({ modifier })} label="Existen otros modificadores de riesgo" detail="Registra su presencia para incluirlos en el resumen; no cambia la categoría automáticamente."/>
    <Source>ESC/EAS 2025 · cuadro 1 y sección 6</Source>
  </section></>;
}

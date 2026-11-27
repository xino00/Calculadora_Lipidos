import { useLayoutEffect, useRef } from 'react';
import type { ClinicalInput, RiskResult } from '../clinical/types';
import type { TargetResult } from '../clinical/targets';
import { REGIMENS, type RegimenId } from '../clinical/medications';
import { ACTION_LABEL, PCSK9_OPTIONS, STATIN_OPTIONS, buildNote, defaultAction, noteCautions, type NoteAction, type NoteChoices } from '../clinical/note';
import { Check, Chips, Icon, Notice } from './ui';

export function NotePage({ data: d, risk, target, choices: c, onChange, regimen, example, onCopy, status }: {
  data: ClinicalInput; risk: RiskResult; target: TargetResult | null; choices: NoteChoices;
  onChange: (patch: Partial<NoteChoices>) => void; regimen: RegimenId | null; example: boolean; onCopy: () => void; status: string;
}) {
  const box = useRef<HTMLTextAreaElement>(null);
  const note = buildNote(d, risk, target, c, example);
  const action = c.action ?? defaultAction(d, target);
  const cautions = noteCautions(c, d.tolerance);
  const marked = regimen ? REGIMENS.find(r => r.id === regimen) : null;
  const set = onChange;
  /* Grow the box to fit the note so nothing is hidden before copying. */
  useLayoutEffect(() => { const el = box.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${el.scrollHeight + 4}px`; }, [note]);

  return <section className="note-page" aria-label="Nota para la historia">
    <div className="note-choices">
      <h2>Tratamiento elegido</h2>
      <p className="caption">Elige principio activo y dosis; la nota se actualiza al momento. No hay nada marcado por defecto.</p>
      {(d.pregnancy || d.activeLiver || d.dialysis) && <Notice tone="warning">Embarazo o lactancia, hepatopatía activa o diálisis: decisión individual y revisión de las fichas técnicas antes de pautar.</Notice>}
      {marked && <p className="note-marked">Combinación elegida en «Pauta»: <strong>{marked.name}</strong> (≈{marked.reduction} %). Puedes cambiar cualquier fármaco o dosis aquí.</p>}

      <fieldset className="rx-group"><legend>Acción</legend>
        <div className="segmented">{(['start', 'change', 'keep'] as NoteAction[]).map(a => <button type="button" key={a} className={action === a ? 'selected' : ''} aria-pressed={action === a} onClick={() => set({ action: a })}>{ACTION_LABEL[a]}</button>)}</div>
      </fieldset>

      {d.tolerance === 'none'
        ? <p className="caption rx-none">Intolerancia completa a estatinas: no se ofrecen estatinas.</p>
        : <fieldset className="rx-group" data-group="high"><legend>Estatina</legend>
          {['Atorvastatina', 'Rosuvastatina', 'Simvastatina'].map(drug => <div className="dose-row" key={drug}>
            <span className="dose-drug">{drug}</span>
            <Chips options={STATIN_OPTIONS.filter(o => o.drug === drug)} value={c.statin} onPick={statin => set({ statin })}/>
          </div>)}
          <p className="caption">«alta»: estatina de alta intensidad.</p>
        </fieldset>}

      <fieldset className="rx-group" data-group="eze"><legend>Ezetimiba</legend>
        <Check label="Ezetimiba 10 mg/24 h" checked={c.eze} onChange={eze => set({ eze })}/>
      </fieldset>
      <fieldset className="rx-group" data-group="ba"><legend>Ácido bempedoico</legend>
        <Check label="Ácido bempedoico 180 mg/24 h" checked={c.ba} onChange={ba => set({ ba })}/>
      </fieldset>
      <fieldset className="rx-group" data-group="pcsk9"><legend>Anti-PCSK9 (subcutáneo)</legend>
        {['Alirocumab', 'Evolocumab'].map(drug => <div className="dose-row" key={drug}>
          <span className="dose-drug">{drug}</span>
          <Chips options={PCSK9_OPTIONS.filter(o => o.drug === drug)} value={c.pcsk9} onPick={pcsk9 => set({ pcsk9 })}/>
        </div>)}
      </fieldset>
      {cautions.map(text => <Notice tone="warning" key={text}>{text}</Notice>)}

      <fieldset className="rx-group"><legend>Seguimiento</legend>
        <Check label="Perfil lipídico en 4–6 semanas" checked={c.control} onChange={control => set({ control })}/>
        <div className="field"><label htmlFor="note-comment">Comentario (opcional, sin datos identificativos)</label>
          <input id="note-comment" maxLength={200} value={c.comment} placeholder="Ej.: reforzar adherencia y dieta" onChange={e => set({ comment: e.target.value })}/></div>
      </fieldset>
    </div>

    <aside className="note-out">
      <h2>Nota para la historia</h2>
      <textarea ref={box} readOnly value={note} aria-label="Nota para copiar" rows={note.split('\n').length + 1}/>
      <button type="button" className="primary-button" onClick={onCopy}><Icon name="copy" size={18}/>Copiar nota</button>
      <p className="note-status" role="status">{status}</p>
      <p className="caption">Revísala antes de pegarla. La aplicación no guarda nada: la nota solo sale si la copias.</p>
    </aside>
  </section>;
}

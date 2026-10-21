import { useEffect, useId, useState, type ReactNode } from 'react';
import { parseNumber } from '../clinical/format';
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    pulse: <path d="M3 12h5l3-8 4 16 3-8h3" />,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    drop: <path d="M12 3C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-12Z" />,
    layers: <><path d="m3 7 9-4 9 4-9 4zM3 12l9 4 9-4M3 17l9 4 9-4"/></>,
    book: <><path d="M12 5c-3-2-7-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    external: <><path d="M14 3h7v7m0-7L10 14"/><path d="M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6"/></>,
    reset: <><path d="M3 10a9 9 0 1 1 2 9M3 3v7h7"/></>,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></>,
    check: <path d="m5 12 4 4L19 6" />,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.info}</svg>;
}
export function NumberField({ label, value, onChange, unit, hint, min = 0, max = 1000, integer = false, placeholder = '—' }: {
  label: string; value: number | null; onChange: (n: number | null) => void; unit?: string; hint?: string;
  min?: number; max?: number; integer?: boolean; placeholder?: string;
}) {
  const id = useId();
  const [raw, setRaw] = useState(value === null ? '' : String(value));
  useEffect(() => { if (value === null) setRaw(''); else if (Number.isFinite(value) && parseNumber(raw) !== value) setRaw(String(value)); }, [value, raw]);
  const parsed = parseNumber(raw);
  const invalid = parsed !== null && (!Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed)));
  return <div className="field"><label htmlFor={id}>{label}</label><div className={`input-wrap ${invalid ? 'invalid' : ''}`}>
    <input id={id} type="text" inputMode={integer ? 'numeric' : 'decimal'} value={raw} placeholder={placeholder} autoComplete="off" aria-invalid={invalid} aria-describedby={`${id}-hint`} onChange={e => { setRaw(e.target.value); onChange(parseNumber(e.target.value)); }} />
    {unit && <span>{unit}</span>}
  </div><small id={`${id}-hint`} className={invalid ? 'field-error' : ''}>{invalid ? `Valor válido: ${min}–${max}${integer ? ', sin decimales' : ''}.` : hint}</small></div>;
}
export function Check({ label, detail, checked, onChange }: { label: string; detail?: string; checked: boolean; onChange: (b: boolean) => void }) {
  return <label className={`check-row ${checked ? 'checked' : ''}`}><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><span><strong>{label}</strong>{detail && <small>{detail}</small>}</span></label>;
}
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' | 'success' }) {
  return <div className={`notice ${tone}`}><Icon name={tone === 'success' ? 'check' : 'info'} size={18}/><div>{children}</div></div>;
}
export function Source({ children, href = 'https://doi.org/10.1093/eurheartj/ehaf190' }: { children: ReactNode; href?: string }) {
  return <a className="source" href={href} target="_blank" rel="noopener noreferrer">{children}<Icon name="external" size={12}/></a>;
}

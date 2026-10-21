interface Props {
  label: string;
  value: number;
  max?: number;
  min?: number;
  color: string;
  icon?: string;
}

/** Labelled horizontal meter. Supports signed ranges (e.g. karma -100..100). */
export function Bar({ label, value, max = 100, min = 0, color, icon }: Props) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="bar-row">
      <div className="bar-label">
        <span>{icon} {label}</span>
        <b>{Math.round(value)}</b>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
      </div>
    </div>
  );
}

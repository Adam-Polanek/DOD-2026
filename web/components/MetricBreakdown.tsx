import styles from "./MetricBreakdown.module.css";

export interface BreakdownRow {
  label: string;
  color: string;
  pct: number; // 0–1, šířka pruhu
  value: string;
  note?: string;
}

// Řádky „popisek · pruh · hodnota“ (rozpad skóre, rozložení profilů v /cil).
export function MetricBreakdown({ rows, wide }: { rows: BreakdownRow[]; wide?: boolean }) {
  return (
    <div className={`${styles.list} ${wide ? styles.wide : ""}`}>
      {rows.map((r) => (
        <div key={r.label} className={styles.row}>
          <span className={styles.label}>{r.label}</span>
          <span className={styles.track}>
            <span style={{ width: `${Math.max(0, Math.min(1, r.pct)) * 100}%`, background: r.color }} />
          </span>
          <span className={styles.value}>{r.value}</span>
          {r.note && <span className={styles.note}>{r.note}</span>}
        </div>
      ))}
    </div>
  );
}

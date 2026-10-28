import styles from "./DivergingBar.module.css";

// Body metriky můžou být kladné i záporné, proto pruh roste od středu.
// SCALE je jen pro zobrazení (kolik bodů = plný půlpruh), nic se tu nepočítá.
const SCALE = 12;

export function DivergingBar({ value, color }: { value: number; color: string }) {
  const half = Math.min(1, Math.abs(value) / SCALE) * 50;
  return (
    <span className={styles.track} aria-hidden="true">
      <span
        className={styles.fill}
        style={{ background: color, width: `${half}%`, left: value >= 0 ? "50%" : `${50 - half}%` }}
      />
      <span className={styles.zero} />
    </span>
  );
}

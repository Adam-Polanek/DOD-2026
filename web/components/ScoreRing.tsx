import styles from "./ScoreRing.module.css";

// Kruhový ukazatel Životního skóre 0–100.
export function ScoreRing({ score, size = 200 }: { score: number; size?: number }) {
  const r = 90;
  const len = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className={styles.ring} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r={r} className={styles.track} />
        <circle
          cx="100" cy="100" r={r}
          className={styles.value}
          strokeDasharray={`${len * pct} ${len}`}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div className={styles.center}>
        <span className={styles.score}>{score}</span>
        <span className={styles.of}>/ 100</span>
      </div>
    </div>
  );
}

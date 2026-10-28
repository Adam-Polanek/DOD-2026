import type { CSSProperties } from "react";
import type { Config, Metrics } from "@/lib/types";
import { METRIC_KEYS } from "@/lib/types";
import { signed } from "@/lib/format";
import styles from "./DeltaGrid.module.css";

// Mřížka změn po volbě: Finance / Vzdělání / Požitky / Úspory (Kč).
export function DeltaGrid({ fx, kc, config }: { fx: Metrics; kc: number; config: Config }) {
  return (
    <div className={styles.grid}>
      {METRIC_KEYS.map((k) => (
        <div key={k} className={styles.tile} style={{ "--c": config.metrics[k].color } as CSSProperties}>
          <span className={styles.label}>{config.metrics[k].name}</span>
          <span className={styles.value}>{signed(fx[k])}</span>
        </div>
      ))}
      <div className={`${styles.tile} ${styles.dark}`}>
        <span className={styles.label}>Úspory</span>
        <span className={styles.value}>{signed(kc)}</span>
      </div>
    </div>
  );
}

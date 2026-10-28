import type { Config, Metrics } from "@/lib/types";
import { METRIC_KEYS } from "@/lib/types";
import { fmtNum, signed } from "@/lib/format";
import { DivergingBar } from "./DivergingBar";
import styles from "./MetricHud.module.css";

// HUD nad otázkou: tři metriky jako „měření“ + úspory v Kč.
export function MetricHud({ metrics, kc, config }: { metrics: Metrics; kc: number; config: Config }) {
  return (
    <div className={styles.hud}>
      {METRIC_KEYS.map((k) => (
        <div key={k} className={styles.metric}>
          <span className={styles.head}>{config.metrics[k].name}</span>
          <div className={styles.row}>
            <b className={styles.value}>{signed(metrics[k])}</b>
            <DivergingBar value={metrics[k]} color={config.metrics[k].color} />
          </div>
        </div>
      ))}
      <div className={`${styles.metric} ${styles.savings}`}>
        <span className={styles.head}>Úspory</span>
        <b className={styles.kc}>{fmtNum(kc)}</b>
      </div>
    </div>
  );
}

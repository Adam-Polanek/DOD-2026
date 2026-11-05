import type { Config, Metrics } from "@/lib/types";
import { METRIC_KEYS } from "@/lib/types";
import { fmtNum } from "@/lib/format";
import { DivergingBar } from "./DivergingBar";
import styles from "./MetricHud.module.css";

// HUD nad otázkou: tři metriky jako „měření“. Pruh roste od startovní hodnoty.
export function MetricHud({ metrics, config }: { metrics: Metrics; config: Config }) {
  return (
    <div className={styles.hud}>
      {METRIC_KEYS.map((k) => (
        <div key={k} className={styles.metric}>
          <span className={styles.head}>{config.metrics[k].name}</span>
          <div className={styles.row}>
            <b className={styles.value}>{fmtNum(metrics[k])}</b>
            <DivergingBar value={metrics[k] - config.startMetric} color={config.metrics[k].color} />
          </div>
        </div>
      ))}
    </div>
  );
}

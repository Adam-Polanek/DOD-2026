import type { Config, FinalResult, Progress } from "@/lib/types";
import { METRIC_KEYS } from "@/lib/types";
import { fmtNum } from "@/lib/format";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { MetricBreakdown, type BreakdownRow } from "../MetricBreakdown";
import { ScoreRing } from "../ScoreRing";
import { Feedback } from "./Feedback";
import { Screen } from "./Screen";
import styles from "./game.module.css";

// Pruh u metriky ukazuje pořadí v kategorii (plný = 1. místo), skóre počítá server.
const rankPct = (rank: number, of: number) => (of > 1 ? (of - rank) / (of - 1) : 1);

// 05 · Cíl a skóre.
export function FinalView({ st, result: r, config, busy, onRefresh, onNewGame }: {
  st: Progress;
  result: FinalResult;
  config: Config;
  busy: boolean;
  onRefresh: () => void;
  onNewGame: () => void;
}) {
  const rows: BreakdownRow[] = METRIC_KEYS.map((k) => ({
    label: config.metrics[k].name,
    color: config.metrics[k].color,
    pct: rankPct(r.categories[k].rank, r.of),
    value: fmtNum(r.metrics[k]),
    note: `${r.categories[k].rank}. místo z ${r.of}`,
  }));

  return (
    <Screen top={{ left: "Cíl · DOX", right: st.code }}>
      <div className={`${styles.titleBlock} ${styles.center}`}>
        <span className="eyebrow">Životní skóre</span>
        <ScoreRing score={r.score} />
        <h2>{r.band.t}</h2>
        <div className={styles.chips} style={{ justifyContent: "center" }}>
          <Chip dark>Profil: {r.profile.name}</Chip>
          <Chip>{r.rank}. z {r.of}</Chip>
        </div>
        <p className="lead">{r.band.d}</p>
      </div>

      <MetricBreakdown rows={rows} />

      {/* Vyhodnocení každé oblasti podle konečných bodů (texty od týmu). */}
      {METRIC_KEYS.map((k) => (
        <div key={k} className={`${styles.card} ${styles.cardInk}`}>
          <span className="label" style={{ color: config.metrics[k].color }}>
            {config.metrics[k].name} · {fmtNum(r.metrics[k])} bodů
          </span>
          <p className="muted">{r.categories[k].text}</p>
        </div>
      ))}

      <div className={styles.redCard}>
        <b>Ukaž tuhle obrazovku v cíli</b>
        <span>Ceny dostane celkově nejlepší hráč a nejlepší v každé oblasti. Pořadí se mění, jak dobíhají další hráči.</span>
      </div>

      <Button arrow="↓" onClick={() => document.getElementById("feedback")?.scrollIntoView({ behavior: "smooth" })}>
        Ohodnoť hru
      </Button>
      <Button variant="ghost" arrow="↻" disabled={busy} onClick={onRefresh}>Aktualizovat pořadí</Button>

      <Feedback code={st.code} />

      <button type="button" className={styles.linkBtn} onClick={onNewGame}>Začít novou hru</button>
    </Screen>
  );
}

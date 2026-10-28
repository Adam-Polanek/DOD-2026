import { useState } from "react";
import type { Config, Progress, PublicStation } from "@/lib/types";
import { letter } from "@/lib/format";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { MetricHud } from "../MetricHud";
import { OptionCard } from "../OptionCard";
import { StationProgress } from "../StationProgress";
import { Screen } from "./Screen";
import styles from "./game.module.css";

// 03 · Stanoviště a volba – příběh, otázka, možnosti a potvrzení volby.
export function StationView({ st, station, config, msg, busy, onAnswer }: {
  st: Progress;
  station: PublicStation;
  config: Config;
  msg?: string;
  busy: boolean;
  onAnswer: (choice: number) => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <Screen
      actions={
        <Button arrow="→" disabled={choice === null || busy} onClick={() => choice !== null && onAnswer(choice)}>
          {choice === null ? "Vyber možnost" : busy ? "Odesílám…" : `Potvrdit volbu ${letter(choice)}`}
        </Button>
      }
    >
      <StationProgress total={st.route.length} current={st.current} />
      <MetricHud metrics={st.metrics} kc={st.kc} config={config} />
      <div className={styles.titleBlock}>
        <span className="eyebrow">{station.place}</span>
        <h2>{station.title}</h2>
      </div>
      <Alert>{msg}</Alert>
      {station.group && (
        <div className={styles.darkCard}>
          <b>{station.group.name}</b>
          <span>{station.group.why}</span>
        </div>
      )}
      <p className="lead">{station.story}</p>
      <h3>{station.q}</h3>
      <div className={styles.titleBlock} role="group" aria-label="Možnosti">
        {station.opts.map((o, i) => (
          <OptionCard
            key={i} index={i} text={o.t} locked={o.locked} lockText={o.lockText}
            selected={choice === i} disabled={busy} onSelect={() => setChoice(i)}
          />
        ))}
      </div>
    </Screen>
  );
}

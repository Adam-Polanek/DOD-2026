import { useState } from "react";
import type { Config, Progress, PublicStation } from "@/lib/types";
import { letter, pad2 } from "@/lib/format";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { MetricHud } from "../MetricHud";
import { OptionCard } from "../OptionCard";
import { StationProgress } from "../StationProgress";
import { Screen } from "./Screen";
import styles from "./game.module.css";

// 03 · Stanoviště a volba – příběh, otázka, možnosti a potvrzení volby.
// Otevřená otázka (station.input) má místo možností pole na číslo.
export function StationView({ st, station, config, msg, busy, onAnswer }: {
  st: Progress;
  station: PublicStation;
  config: Config;
  msg?: string;
  busy: boolean;
  onAnswer: (a: { choice: number } | { value: string }) => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const input = station.input;
  const ready = input ? value.trim() !== "" : choice !== null;
  const submit = () => {
    if (!ready || busy) return;
    onAnswer(input ? { value } : { choice: choice! });
  };
  return (
    <Screen
      actions={
        <Button arrow="→" disabled={!ready || busy} onClick={submit}>
          {busy ? "Odesílám…"
            : input ? (ready ? "Odeslat výsledek" : "Napiš výsledek")
            : choice === null ? "Vyber možnost" : `Potvrdit volbu ${letter(choice)}`}
        </Button>
      }
    >
      <StationProgress total={st.route.length} current={st.current} />
      <MetricHud metrics={st.metrics} config={config} />
      <div className={styles.titleBlock}>
        <span className="eyebrow">Stanoviště {pad2(station.num)}</span>
        <h2>{station.title}</h2>
      </div>
      <Alert>{msg}</Alert>
      <p className="lead">{station.story}</p>
      <h3>{station.q}</h3>
      {input ? (
        <form className={styles.field} onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <label htmlFor="answerValue" className="label">Výsledek v {input.unit} (zaokrouhli na celé koruny)</label>
          <input
            id="answerValue" className="input" inputMode="decimal" autoComplete="off" placeholder="např. 10500"
            maxLength={12} value={value} onChange={(e) => setValue(e.target.value)} disabled={busy}
          />
        </form>
      ) : (
        <div className={styles.titleBlock} role="group" aria-label="Možnosti">
          {station.opts.map((o, i) => (
            <OptionCard
              key={i} index={i} text={o.t} locked={o.locked} lockText={o.lockText}
              selected={choice === i} disabled={busy} onSelect={() => setChoice(i)}
            />
          ))}
        </div>
      )}
    </Screen>
  );
}

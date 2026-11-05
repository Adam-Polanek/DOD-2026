import type { Answer, Config, Progress, PublicStation } from "@/lib/types";
import { letter, pad2 } from "@/lib/format";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { DeltaGrid } from "../DeltaGrid";
import { Screen } from "./Screen";
import styles from "./game.module.css";

// 04 · Výsledek volby – co se stalo a změny metrik.
export function ResultView({ st, station, answer, config, onContinue }: {
  st: Progress;
  station: PublicStation;
  answer: Answer;
  config: Config;
  onContinue: () => void;
}) {
  const total = st.route.length;
  const next = st.route[st.current];
  const nextNum = pad2(st.current + 1);
  return (
    <Screen
      top={{ left: "Výsledek měření", right: `${pad2(station.num)} / ${pad2(total)}` }}
      actions={
        <>
          {next && <span className="label">Další: {nextNum} · {next.place}</span>}
          <Button arrow="→" onClick={onContinue}>
            {next ? `Pokračovat na stanoviště ${nextNum}` : "Zobrazit vyhodnocení"}
          </Button>
        </>
      }
    >
      <div className={styles.titleBlock}>
        <span className="eyebrow">{answer.quiz ? "Výpočet" : `Zvolil/a jsi ${letter(answer.choice)}`}</span>
        <h3>{answer.choiceText}</h3>
        {answer.result && <p className="lead">{answer.result}</p>}
      </div>
      {answer.correct !== null && (
        <Alert kind={answer.correct ? "ok" : "error"}>{answer.correct ? "Správně!" : "Tohle není správně."}</Alert>
      )}
      <DeltaGrid fx={answer.fx} config={config} />
    </Screen>
  );
}

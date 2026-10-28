import type { Answer, Config, Progress, PublicStation } from "@/lib/types";
import { fmtKc, letter, pad2 } from "@/lib/format";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { CodeCard } from "../CodeCard";
import { DeltaGrid } from "../DeltaGrid";
import { Screen } from "./Screen";
import styles from "./game.module.css";

// 04 · Výsledek volby – co se stalo, změny metrik a zůstatek.
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
            {st.current === total - 1 ? "Pokračovat do cíle" : `Pokračovat na stanoviště ${nextNum}`}
          </Button>
        </>
      }
    >
      <div className={styles.titleBlock}>
        <span className="eyebrow">Zvolil/a jsi {letter(answer.choice)}</span>
        <h3>{answer.choiceText}</h3>
        {answer.result && <p className="lead">{answer.result}</p>}
      </div>
      {answer.correct !== null && (
        <Alert kind={answer.correct ? "ok" : "error"}>{answer.correct ? "Správně!" : "Tohle není správně."}</Alert>
      )}
      <DeltaGrid fx={answer.fx} kc={answer.kc} config={config} />
      <CodeCard inline label="Zůstatek" value={fmtKc(st.kc)} />
    </Screen>
  );
}

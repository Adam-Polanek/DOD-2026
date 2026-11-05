import { Button } from "../Button";
import { CodeCard } from "../CodeCard";
import { Screen } from "./Screen";
import styles from "./game.module.css";

// Hned po startu: hráč si opíše/vyfotí kód, se kterým hru obnoví.
export function CodeView({ code, onContinue }: { code: string; onContinue: () => void }) {
  return (
    <Screen
      top={{ left: "VŠCHT · DOD 2026", right: code }}
      actions={<Button arrow="→" onClick={onContinue}>Jdeme na to</Button>}
    >
      <div className={styles.titleBlock}>
        <span className="eyebrow">Experiment začíná</span>
        <h2>Tohle je tvůj anonymní kód</h2>
        <p className="lead">Vyfoť si ho. Kdyby se ti zavřel prohlížeč, hru s ním obnovíš.</p>
      </div>
      <CodeCard big label="Hrací kód" value={code} />
      <p className="lead">Na každém stanovišti tě čeká kus příběhu a jedno rozhodnutí. Finance, vzdělání i požitky začínají na 10 bodech.</p>
    </Screen>
  );
}

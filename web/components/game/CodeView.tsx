import { fmtKc } from "@/lib/format";
import { Button } from "../Button";
import { CodeCard } from "../CodeCard";
import { Screen } from "./Screen";
import styles from "./game.module.css";

// Hned po startu: hráč si opíše/vyfotí kód, se kterým hru obnoví.
export function CodeView({ code, kc, onContinue }: { code: string; kc: number; onContinue: () => void }) {
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
      <CodeCard inline label="Startovní úspory" value={fmtKc(kc)} />
      <p className="lead">Naspořeno máš od rodičů a z letní brigády. Na každém stanovišti tě čeká kus příběhu a jedno rozhodnutí.</p>
    </Screen>
  );
}

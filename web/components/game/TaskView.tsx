import type { Progress } from "@/lib/types";
import { pad2 } from "@/lib/format";
import { Alert } from "../Alert";
import { QrScanner } from "../QrScanner";
import { ManualCode } from "./ManualCode";
import { Screen } from "./Screen";
import styles from "./game.module.css";

// Stanoviště s úkolem: po splnění ukáže obsluha druhý QR kód.
export function TaskView({ st, msg, busy, onToken }: {
  st: Progress;
  msg?: string;
  busy: boolean;
  onToken: (text: string) => void;
}) {
  const s = st.station;
  const taskText = "taskText" in s ? s.taskText : "";
  return (
    <Screen top={{ left: `Stanoviště ${pad2(s.num)} / ${pad2(st.route.length)}`, right: st.code }}>
      <div className={styles.titleBlock}>
        <span className="eyebrow">{s.place}</span>
        <h2>{s.title}</h2>
      </div>
      <Alert>{msg}</Alert>
      <div className={`${styles.card} ${styles.cardInk}`}>
        <span className="label">Úkol</span>
        <p>{taskText}</p>
      </div>
      <p className="lead">Až úkol splníš, obsluha ti ukáže QR kód. Naskenuj ho a pokračuj.</p>
      <QrScanner onCode={onToken} />
      <ManualCode label="Nebo opiš kód od obsluhy" busy={busy} onSubmit={onToken} />
    </Screen>
  );
}

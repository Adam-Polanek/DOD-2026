import { useState } from "react";
import type { Progress } from "@/lib/types";
import { pad2 } from "@/lib/format";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { QrScanner } from "../QrScanner";
import { ManualCode } from "./ManualCode";
import { Screen } from "./Screen";
import styles from "./game.module.css";

// 02 · Sken QR – kam jít dál, kamera, ruční kód a mapa trasy.
export function RouteView({ st, msg, info, busy, onToken }: {
  st: Progress;
  msg?: string;
  info?: boolean;
  busy: boolean;
  onToken: (text: string) => void;
}) {
  const [showMap, setShowMap] = useState(false);
  const total = st.route.length;
  const next = st.route[st.current];

  return (
    <Screen top={{ left: `Stanoviště ${pad2(st.current + 1)} / ${pad2(total)}`, right: st.code }}>
      <div className={styles.titleBlock}>
        <span className="eyebrow">{st.current === 0 ? "První zastávka" : "Další zastávka"}</span>
        <h2>{next.title}</h2>
        <p className="lead">Najdi ceduli s QR kódem a namiř na ni fotoaparát.</p>
      </div>
      <Alert kind={info ? "info" : "error"}>{msg}</Alert>
      <QrScanner onCode={onToken} />
      <ManualCode label="Nejde kamera? Opiš kód z cedule" busy={busy} onSubmit={onToken} />
      <Button variant="ghost" arrow={showMap ? "↑" : "↗"} onClick={() => setShowMap(!showMap)} aria-expanded={showMap}>
        {showMap ? "Skrýt mapu trasy" : "Zobrazit mapu trasy"}
      </Button>
      {showMap && <RouteMap st={st} />}
      <p className={styles.footnote}>Kód pro obnovení hry: {st.code}</p>
    </Screen>
  );
}

function RouteMap({ st }: { st: Progress }) {
  return (
    <ol className={styles.route}>
      {st.route.map((r, i) => {
        const state = i < st.current ? "done" : i === st.current ? "cur" : "locked";
        return (
          <li key={r.id + i} className={styles[state]}>
            <span className={styles.num}>{pad2(i + 1)}</span>
            <span>{r.title}</span>
            <span className={styles.state}>{state === "done" ? "hotovo" : state === "cur" ? "teď" : "zamčeno"}</span>
          </li>
        );
      })}
    </ol>
  );
}

import { useState } from "react";
import type { Config } from "@/lib/types";
import { METRIC_KEYS } from "@/lib/types";
import { fmtKc } from "@/lib/format";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { CodeCard } from "../CodeCard";
import { ElementTile } from "../ElementTile";
import { Screen } from "./Screen";
import styles from "./game.module.css";

// 01 · Úvod – přezdívka, start nové hry nebo obnovení starší hry kódem.
export function IntroView({ config, msg, pendingQr, busy, onStart, onRestore }: {
  config: Config;
  msg?: string;
  pendingQr: boolean;
  busy: boolean;
  onStart: (nickname: string) => void;
  onRestore: (code: string) => void;
}) {
  const [nick, setNick] = useState("");
  const [code, setCode] = useState("");

  // Hráč naskenoval QR v prohlížeči, který ho nezná – nejdřív nabídnout obnovení.
  const restore = (
    <details className={`${styles.card} ${styles.details}`} open={pendingQr}>
      <summary>Už hraješ? Obnov hru kódem</summary>
      <form className={styles.manual} onSubmit={(e) => { e.preventDefault(); if (code.trim()) onRestore(code); }}>
        <label htmlFor="restore" className="sr-only">Hrací kód</label>
        <input id="restore" value={code} onChange={(e) => setCode(e.target.value)} placeholder="DOD-XXXX" autoComplete="off" />
        <button type="submit" disabled={busy || !code.trim()}>OK</button>
      </form>
    </details>
  );

  return (
    <Screen
      top={{ left: "VŠCHT · DOD 2026", right: "Holešovice" }}
      actions={
        <>
          <Button arrow="→" disabled={busy} onClick={() => onStart(nick)}>
            {pendingQr ? "Ne, začínám novou hru" : "Začít experiment"}
          </Button>
          <p className={styles.footnote}>Bez registrace · žádné osobní údaje</p>
        </>
      }
    >
      <ElementTile number={config.routeLength} corner="Kč" symbol="St" name="Studium" note={fmtKc(config.startKc)} />
      <div className={styles.titleBlock}>
        <h1>Studium na VŠCHT jako experiment</h1>
        <p className="lead">
          Projdi {config.routeLength} stanovišť, na každém naskenuj QR kód a rozhodni se. Uvidíš, jak tvoje volby
          promění finance, vzdělání i zážitky. Některé možnosti si musíš umět dovolit a podle bodů se trasa
          v půlce rozdělí: Erasmus, nebo doma.
        </p>
      </div>
      <div className={styles.chips}>
        {METRIC_KEYS.map((k) => (
          <Chip key={k} dot={config.metrics[k].color}>{config.metrics[k].name}</Chip>
        ))}
      </div>

      <Alert kind={pendingQr ? "info" : "error"}>{msg}</Alert>
      {pendingQr && restore}

      <div className={styles.field}>
        <label htmlFor="nick" className="label">Přezdívka do žebříčku · nepovinné</label>
        <input
          id="nick" className="input" maxLength={40} autoComplete="off" placeholder="např. Chemik007"
          value={nick} onChange={(e) => setNick(e.target.value)}
        />
      </div>

      <CodeCard label="Tvůj anonymní kód" value={<span className="muted">DOD-····</span>} aside="~25 min" />
      {!pendingQr && restore}
    </Screen>
  );
}

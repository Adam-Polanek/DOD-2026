"use client";

import { useCallback, useEffect, useState } from "react";
import { adminBoard, adminExportUrl, adminReset } from "@/lib/api";
import type { AdminBoard } from "@/lib/types";
import { fmtNum, time } from "@/lib/format";
import { Alert } from "../Alert";
import { Button, ButtonLink } from "../Button";
import styles from "./Admin.module.css";

const REFRESH_MS = 20000;
const GROUPS = { erasmus: "Erasmus", doma: "doma" } as const;

export function Overview({ token, initial }: { token: string; initial: AdminBoard }) {
  const [d, setD] = useState(initial);
  const [updated, setUpdated] = useState(() => new Date());
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setD(await adminBoard(token));
      setUpdated(new Date());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba serveru");
    }
  }, [token]);

  useEffect(() => {
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const fin = d.board.filter((r) => r.finished_at);
  const avg = fin.length ? Math.round(fin.reduce((a, r) => a + r.score, 0) / fin.length) : "–";
  const grouped = d.board.filter((r) => r.group);
  const erasmus = grouped.filter((r) => r.group === "erasmus").length;

  // Kolik hráčů má hotový daný počet stanovišť (kde lidé odpadají).
  const n = d.stations.length;
  const reached = Array.from({ length: n + 1 }, (_, k) => d.board.filter((r) => r.stationsDone >= k).length);
  const max = Math.max(1, reached[0]);

  let rank = 0;
  return (
    <>
      {(d.defaultSecrets.admin || d.defaultSecrets.qr) && (
        <div className={styles.warn}>
          <b>Pozor:</b> na serveru{" "}
          {[d.defaultSecrets.admin && "není nastavený ADMIN_TOKEN", d.defaultSecrets.qr && "není nastavený QR_SECRET"]
            .filter(Boolean)
            .join(" a ")}
          . Před akcí nastavit!
        </div>
      )}

      <div className={styles.toolbar}>
        <h2>Přehled hráčů</h2>
        <span className="label">aktualizováno {updated.toLocaleTimeString("cs-CZ")}</span>
        <Button small variant="ghost" arrow="↻" onClick={load}>Obnovit</Button>
        <ButtonLink small arrow="↓" href={adminExportUrl(token)}>Stáhnout Excel (CSV)</ButtonLink>
      </div>
      <Alert>{error}</Alert>

      <div className={styles.stats}>
        {[
          ["Začalo hrát", d.stats.total],
          ["Dokončilo", d.stats.finished],
          ["Právě hraje", d.stats.total - d.stats.finished],
          ["Průměrné skóre", avg],
          ["Na Erasmu", grouped.length ? `${Math.round((erasmus / grouped.length) * 100)} %` : "–"],
        ].map(([label, value]) => (
          <div key={label} className={styles.stat}>
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <section className={styles.card}>
        <h3>Kde hráči jsou</h3>
        <p className="muted">Kolik hráčů má hotový daný počet stanovišť. Velký skok dolů = tam lidé odpadají.</p>
        <div className={styles.funnel}>
          {reached.slice(1).map((c, i) => (
            <div key={i} className={styles.fn}>
              <span>{i + 1 === n ? "Došli do cíle" : `Za ${i + 1}. stanovištěm`}</span>
              <span className={styles.track}><span style={{ width: `${(c / max) * 100}%` }} /></span>
              <b className="mono">{c}</b>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h3>Hráči</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th><th>Kód</th><th>Přezdívka</th><th>Skóre</th><th>Kč</th><th>Fin.</th><th>Vzd.</th>
                <th>Pož.</th><th>Profil</th><th>Skupina</th><th>Stav</th><th>Začal</th>
              </tr>
            </thead>
            <tbody>
              {d.board.length === 0 && (
                <tr><td colSpan={12} className="muted">Zatím nikdo nehraje.</td></tr>
              )}
              {d.board.map((r) => (
                <tr key={r.code} className={r.finished_at ? "" : styles.playing}>
                  <td className={styles.num}>{r.finished_at ? ++rank : ""}</td>
                  <td className="mono">{r.code}</td>
                  <td>{r.nickname}</td>
                  <td className={styles.num}><b>{r.score}</b></td>
                  <td className={styles.num}>{fmtNum(r.kc)}</td>
                  <td className={styles.num}>{r.metrics.f}</td>
                  <td className={styles.num}>{r.metrics.v}</td>
                  <td className={styles.num}>{r.metrics.p}</td>
                  <td>{r.profileName}</td>
                  <td>{r.group ? GROUPS[r.group] : ""}</td>
                  <td>
                    {r.finished_at
                      ? <span className={`${styles.pill} ${styles.fin}`}>v cíli {time(r.finished_at)}</span>
                      : <span className={styles.pill}>{r.stationsDone}/{n}</span>}
                  </td>
                  <td>{time(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DangerZone token={token} onDone={load} />
    </>
  );
}

// Smazání všech hráčů a výsledků (před akcí). Server předtím uloží zálohu.
function DangerZone({ token, onDone }: { token: string; onDone: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function reset() {
    if (confirmText.trim() !== "SMAZAT") {
      return setMsg({ kind: "error", text: "Pro potvrzení napiš do políčka velkými písmeny SMAZAT." });
    }
    if (!confirm("Opravdu smazat VŠECHNY hráče a výsledky? Server předtím uloží zálohu.")) return;
    try {
      const r = await adminReset(token);
      setConfirmText("");
      setMsg({ kind: "ok", text: `Smazáno ${r.deleted} hráčů. Záloha na serveru: ${r.backup}` });
      onDone();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Chyba serveru" });
    }
  }

  return (
    <section className={`${styles.card} ${styles.danger}`}>
      <h3>Nebezpečná zóna</h3>
      <p>
        <b>Smazat všechny hráče, výsledky a statistiky</b> – např. po testování, těsně před akcí. Server si předtím
        sám uloží zálohu databáze. QR kódy ani hesla se nemění.
      </p>
      <p className="muted">Tip: nejdřív si stáhni Excel (CSV), ať máš výsledky testů i u sebe.</p>
      <div className={styles.toolbar}>
        <input
          className="input" style={{ maxWidth: 220 }} placeholder="Napiš SMAZAT" autoComplete="off"
          value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label="Potvrzení smazání"
        />
        <Button small variant="danger" onClick={reset}>Smazat všechna data</Button>
      </div>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
    </section>
  );
}

"use client";

// Obrazovka do cíle (/cil) – monitor nebo projektor, obnovuje se sama.
import { useEffect, useState } from "react";
import { getConfig, getLeaderboard } from "@/lib/api";
import type { Config, Leaderboard as Data } from "@/lib/types";
import { METRIC_KEYS } from "@/lib/types";
import { pad2, signed } from "@/lib/format";
import { QrCode } from "../QrCode";
import styles from "./Leaderboard.module.css";

const REFRESH_MS = 15000;

export function Leaderboard() {
  const [config, setConfig] = useState<Config | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [offline, setOffline] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [c, d] = await Promise.all([config ? Promise.resolve(config) : getConfig(), getLeaderboard()]);
        if (!alive) return;
        setConfig(c);
        setData(d);
        setJoinUrl(location.origin + "/");
        setOffline(false);
      } catch {
        if (alive) setOffline(true);
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const best = data?.board[0]?.score;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <span className="eyebrow">VŠCHT · Den otevřených dveří 2026</span>
          <h1 className={styles.title}>Žebříček životního skóre</h1>
        </div>
        <div className={styles.stats}>
          <Stat value={data?.stats.total ?? "–"} label="hráčů" />
          <Stat value={data?.stats.finished ?? "–"} label="v cíli" />
          <Stat value={best ?? "–"} label="nejlepší" />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.table} aria-label="Celkové pořadí">
          {data && data.board.length === 0 && (
            <p className={styles.empty}>Zatím nikdo nedorazil do cíle. Kdo bude první?</p>
          )}
          {data?.board.slice(0, 10).map((r) => (
            <div key={r.rank + r.name} className={`${styles.row} ${r.rank <= 3 ? styles.top : ""}`}>
              <span className={styles.rank}>{pad2(r.rank)}</span>
              <span className={styles.name}>{r.name}</span>
              <span className={styles.profile}>{r.profile}</span>
              <span className={styles.score}>{r.score}</span>
            </div>
          ))}
        </section>

        <aside className={styles.side}>
          {config && data && (
            <div className={styles.card}>
              <span className={styles.cardTitle}>Nejlepší v kategorii</span>
              {METRIC_KEYS.map((k) => (
                <div key={k} className={styles.cat}>
                  <span className={styles.catName}>
                    <span className={styles.dot} style={{ background: config.metrics[k].color }} />
                    {config.metrics[k].name}
                  </span>
                  <ol>
                    {data.categories[k].length === 0 && <li className={styles.muted}>–</li>}
                    {data.categories[k].map((r) => (
                      <li key={r.rank + r.name}>
                        <span>{r.name}</span>
                        <b>{signed(r.metrics[k])}</b>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}

          <div className={`${styles.card} ${styles.join}`}>
            {joinUrl && <QrCode text={joinUrl} className={styles.qr} label="QR kód na hru" />}
            <div>
              <span className={styles.cardTitle}>Zahraj si taky</span>
              <p>Naskenuj QR a vyzkoušej si studium na VŠCHT nanečisto. Stačí mobil, nic se neinstaluje.</p>
            </div>
          </div>
        </aside>
      </main>

      {offline && <div className={styles.offline}>Spojení se serverem vypadlo, zkouším znovu…</div>}
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className={styles.stat}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

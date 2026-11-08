"use client";

import { useEffect, useState } from "react";
import { adminQr } from "@/lib/api";
import type { QrCodes } from "@/lib/types";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { QrCode } from "../QrCode";
import styles from "./Admin.module.css";

// QR kódy k tisku: každé místo na jednu stránku A4, pod QR kód k opsání.
export function QrSheets({ token }: { token: string }) {
  const [d, setD] = useState<QrCodes | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminQr(token).then(setD, (e) => setError(e instanceof Error ? e.message : "Chyba serveru"));
  }, [token]);

  if (error) return <Alert>{error}</Alert>;
  if (!d) return <p className="label">Načítám…</p>;

  const host = new URL(d.base).hostname;
  const local = host === "localhost" || /^[\d.]+$/.test(host);

  return (
    <>
      <div className={`${styles.noprint} ${styles.stackGap}`}>
        <div className={styles.toolbar}>
          <h2>QR kódy k tisku</h2>
          <Button small onClick={() => window.print()}>Tisknout (A4, 1 stanoviště na stránku)</Button>
        </div>
        <p>
          QR vedou na <b className="mono">{d.base}</b>
        </p>
        {!d.publicUrl && !local && (
          <div className={styles.warn}>
            Adresa v QR se vzala z prohlížeče, protože na serveru není nastavená proměnná{" "}
            <span className="mono">PUBLIC_URL</span>. <b>Před tiskem ji nastav v Azure na https://dodvscht.me</b>{" "}
            – jinak QR povedou tam, odkud máš admin zrovna otevřený.
          </div>
        )}
        {local && (
          <div className={styles.warn}>
            QR teď vedou na <span className="mono">{d.base}</span>, což mobily venku neotevřou.{" "}
            <b>Tiskni až z ostré adresy na Azure.</b>
          </div>
        )}
        {d.defaultSecret && (
          <div className={styles.warn}>
            Na serveru není nastavený <span className="mono">QR_SECRET</span>, kódy se po jeho nastavení změní.{" "}
            <b>Netiskni, dokud není nastavený.</b>
          </div>
        )}
        <p className="muted">
          Na listu je číslo a název stanoviště. Banka a Kancelářské budovy mají číslo podle trasy hráče (7 / 8). Pod
          každým QR je kód k opsání.
        </p>
      </div>

      <div className={styles.sheets}>
        {d.codes.map((c) => (
          <section key={c.token} className={styles.sheet}>
            <div className={styles.sheetBrand}>
              {/* eslint-disable-next-line @next/next/no-img-element -- statický export, logo jen k tisku */}
              <img src="/logo-vscht.png" alt="VŠCHT Praha" className={styles.logo} />
              <span>Den otevřených dveří</span>
            </div>
            {c.kind === "task" && <span className={styles.kind}>QR pro obsluhu – úkol splněn</span>}
            <div className={styles.num}>{c.num}</div>
            <div className={styles.place}>{c.title}</div>
            <QrCode text={c.url} className={styles.sheetQr} label={`QR kód: ${c.num}. ${c.title}`} />
            <div className={styles.code}>{c.token}</div>
            <p className={styles.how}>
              Naskenuj ve hře, nebo fotoaparátem mobilu. Nejde to? Opiš kód do hry.
            </p>
          </section>
        ))}
      </div>
    </>
  );
}

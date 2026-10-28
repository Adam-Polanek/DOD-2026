"use client";

// Přehled pro organizátory: hráči, výsledky, export, QR k tisku, smazání dat.
// Všechno jde přes /api/admin/* s tokenem (ADMIN_TOKEN na serveru).
import { useCallback, useEffect, useState } from "react";
import { adminBoard, ApiError } from "@/lib/api";
import type { AdminBoard } from "@/lib/types";
import { Alert } from "../Alert";
import { Button } from "../Button";
import { Overview } from "./Overview";
import { QrSheets } from "./QrSheets";
import styles from "./Admin.module.css";

const SESSION_KEY = "dod-admin";
type Tab = "overview" | "qr";

export function Admin() {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [board, setBoard] = useState<AdminBoard | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  const login = useCallback(async (t: string) => {
    setError("");
    try {
      const data = await adminBoard(t);
      setBoard(data);
      setToken(t);
      try {
        sessionStorage.setItem(SESSION_KEY, t);
      } catch {}
    } catch (e) {
      setError(e instanceof ApiError && e.status === 401 ? "Neplatný token." : e instanceof Error ? e.message : "Chyba");
    }
  }, []);

  // Token z této záložky prohlížeče (přežije obnovení stránky, ne zavření).
  useEffect(() => {
    (async () => {
      let saved: string | null = null;
      try {
        saved = sessionStorage.getItem(SESSION_KEY);
      } catch {}
      if (saved) {
        await login(saved);
        setInput(saved);
      }
      setChecking(false);
    })();
  }, [login]);

  function logout() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    setToken("");
    setBoard(null);
    setInput("");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className="eyebrow">VŠCHT · DOD 2026</span>
          <h1>Admin hry</h1>
        </div>
        {token && (
          <nav className={styles.tabs}>
            <button type="button" aria-pressed={tab === "overview"} onClick={() => setTab("overview")}>Přehled</button>
            <button type="button" aria-pressed={tab === "qr"} onClick={() => setTab("qr")}>QR k tisku</button>
            <a href="/cil" target="_blank" rel="noopener">Obrazovka do cíle ↗</a>
            <button type="button" onClick={logout}>Odhlásit</button>
          </nav>
        )}
      </header>

      <main className={styles.main}>
        {!token && !checking && (
          <form
            className={`${styles.card} ${styles.login}`}
            onSubmit={(e) => { e.preventDefault(); login(input.trim()); }}
          >
            <h2>Přihlášení</h2>
            <p className="muted">Zadej admin token (proměnná <span className="mono">ADMIN_TOKEN</span> na serveru).</p>
            <label htmlFor="token" className="sr-only">Admin token</label>
            <input
              id="token" type="password" className="input" placeholder="admin token" autoComplete="current-password"
              value={input} onChange={(e) => setInput(e.target.value)}
            />
            <Alert>{error}</Alert>
            <Button type="submit" arrow="→" disabled={!input.trim()}>Vstoupit</Button>
          </form>
        )}
        {token && board && tab === "overview" && <Overview token={token} initial={board} />}
        {token && tab === "qr" && <QrSheets token={token} />}
      </main>
    </div>
  );
}

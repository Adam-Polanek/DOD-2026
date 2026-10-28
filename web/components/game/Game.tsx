"use client";

// ---------------------------------------------------------------------------
//  Hra pro hráče. Všechno důležité (body, Kč, trasa, pořadí) počítá server –
//  tady se jen podle stavu z API vybírá, kterou obrazovku ukázat.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Answer, Config, Progress, PublicStation } from "@/lib/types";
import { isUnlocked } from "@/lib/types";
import { storeGet, storeSet, tokenFrom } from "@/lib/format";
import { Alert } from "../Alert";
import { CodeView } from "./CodeView";
import { FinalView } from "./FinalView";
import { IntroView } from "./IntroView";
import { ResultView } from "./ResultView";
import { RouteView } from "./RouteView";
import { Screen } from "./Screen";
import { StationView } from "./StationView";
import { TaskView } from "./TaskView";

const STORE_KEY = "dodCode"; // stejný klíč jako stará verze → rozehrané hry zůstanou

type View =
  | { name: "boot" }
  | { name: "offline" }
  | { name: "intro"; msg?: string }
  | { name: "code" }
  | { name: "play"; msg?: string; info?: boolean } // obrazovka podle stavu hráče
  | { name: "result"; station: PublicStation; answer: Answer };

const message = (e: unknown) => (e instanceof Error ? e.message : "Něco se pokazilo, zkus to znovu.");

export function Game() {
  const [config, setConfig] = useState<Config | null>(null);
  const [st, setSt] = useState<Progress | null>(null);
  const [view, setView] = useState<View>({ name: "boot" });
  const [busy, setBusy] = useState(false);
  const pendingQr = useRef<string | null>(null); // kód z adresy ?qr=…, odemkne se po startu

  const go = (v: View) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  // ---- Start aplikace ------------------------------------------------------
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(location.search);
      const qr = params.get("qr");
      if (qr) {
        pendingQr.current = qr;
        history.replaceState(null, "", location.pathname); // ať se kód neodemyká při obnovení stránky
      }
      try {
        setConfig(await api.getConfig());
      } catch {
        return go({ name: "offline" });
      }
      const code = storeGet(STORE_KEY);
      let me: Progress | null = null;
      if (code) {
        try {
          me = await api.getMe(code);
        } catch {
          storeSet(STORE_KEY, null);
        }
      }
      if (!me) {
        return go({
          name: "intro",
          msg: qr ? "Naskenoval/a jsi QR kód. Pokud už hraješ, zadej svůj kód DOD-XXXX a stanoviště se odemkne." : undefined,
        });
      }
      setSt(me);
      if (qr) return doUnlock(me, takePending()!);
      go({ name: "play" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function takePending() {
    const t = pendingQr.current;
    pendingQr.current = null;
    return t;
  }

  // ---- Akce ------------------------------------------------------------------
  async function start(nickname: string) {
    setBusy(true);
    try {
      const me = await api.register(nickname);
      storeSet(STORE_KEY, me.code);
      setSt(me);
      go({ name: "code" });
    } catch (e) {
      go({ name: "intro", msg: message(e) });
    } finally {
      setBusy(false);
    }
  }

  async function restore(input: string) {
    let code = input.trim().toUpperCase();
    if (code && !code.startsWith("DOD-")) code = "DOD-" + code;
    setBusy(true);
    try {
      const me = await api.getMe(code);
      storeSet(STORE_KEY, me.code);
      setSt(me);
      const t = takePending();
      if (t) return await doUnlock(me, t);
      go({ name: "play", msg: "Hra obnovena. Pokračuj tam, kde jsi skončil/a.", info: true });
    } catch (e) {
      go({ name: "intro", msg: e instanceof ApiError && e.status === 404 ? "Tenhle kód neznáme. Zkontroluj ho." : message(e) });
    } finally {
      setBusy(false);
    }
  }

  const unlocking = useRef(false);
  async function doUnlock(me: Progress, text: string) {
    if (unlocking.current) return; // čtečka mezitím přečetla další kód
    unlocking.current = true;
    setBusy(true);
    try {
      const next = await api.unlock(me.code, tokenFrom(text));
      setSt(next);
      go({ name: "play", msg: next.notice, info: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        storeSet(STORE_KEY, null);
        setSt(null);
        return go({ name: "intro", msg: e.message });
      }
      go({ name: "play", msg: message(e) });
    } finally {
      unlocking.current = false;
      setBusy(false);
    }
  }

  async function sendAnswer(choice: number) {
    if (!st || !isUnlocked(st.station)) return;
    const station = st.station;
    setBusy(true);
    try {
      const next = await api.answer(st.code, station.id, choice);
      setSt(next);
      if (next.answer) go({ name: "result", station, answer: next.answer });
      else go({ name: "play" });
    } catch (e) {
      try {
        setSt(await api.getMe(st.code));
      } catch {}
      go({ name: "play", msg: message(e) });
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    if (!st) return;
    setBusy(true);
    try {
      setSt(await api.getMe(st.code));
    } catch {}
    setBusy(false);
  }

  function newGame() {
    if (!st || !confirm(`Opravdu začít znovu? Tahle hra zůstane uložená pod kódem ${st.code}.`)) return;
    storeSet(STORE_KEY, null);
    setSt(null);
    go({ name: "intro" });
  }

  // ---- Vykreslení --------------------------------------------------------------
  if (view.name === "boot") {
    return <Screen top={{ left: "VŠCHT · DOD 2026" }}><p className="label">Načítám…</p></Screen>;
  }
  if (view.name === "offline" || !config) {
    return (
      <Screen top={{ left: "VŠCHT · DOD 2026" }}>
        <Alert>Nepodařilo se spojit se serverem. Zkontroluj internet a obnov stránku.</Alert>
      </Screen>
    );
  }
  if (view.name === "intro" || !st) {
    return (
      <IntroView
        config={config} msg={view.name === "intro" ? view.msg : undefined}
        pendingQr={!!pendingQr.current} busy={busy} onStart={start} onRestore={restore}
      />
    );
  }
  if (view.name === "code") {
    return (
      <CodeView
        code={st.code} kc={st.kc}
        onContinue={() => {
          const t = takePending();
          if (t) doUnlock(st, t);
          else go({ name: "play" });
        }}
      />
    );
  }
  if (view.name === "result") {
    return <ResultView st={st} station={view.station} answer={view.answer} config={config} onContinue={() => go({ name: "play" })} />;
  }

  // view.name === "play": obrazovku určuje stav hráče ze serveru.
  const { msg, info } = view;
  const onToken = (text: string) => doUnlock(st, text);
  if (st.result) {
    return <FinalView st={st} result={st.result} config={config} busy={busy} onRefresh={refresh} onNewGame={newGame} />;
  }
  if (st.arrived && !st.taskDone) {
    return <TaskView st={st} msg={msg} busy={busy} onToken={onToken} />;
  }
  if (st.arrived && isUnlocked(st.station) && !st.station.final) {
    return (
      <StationView
        key={st.station.id} st={st} station={st.station} config={config}
        msg={msg} busy={busy} onAnswer={sendAnswer}
      />
    );
  }
  return <RouteView st={st} msg={msg} info={info} busy={busy} onToken={onToken} />;
}

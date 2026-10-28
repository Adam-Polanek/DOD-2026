"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./QrScanner.module.css";

type Status = "idle" | "starting" | "scanning" | "error";

// BarcodeDetector umí Chrome/Android. Jinde (iPhone) se načte knihovna jsQR.
interface Detector {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: {
      new (opts: { formats: string[] }): Detector;
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

async function makeDetector(video: HTMLVideoElement): Promise<() => Promise<string | null>> {
  const BD = window.BarcodeDetector;
  if (BD && (await BD.getSupportedFormats()).includes("qr_code")) {
    const bd = new BD({ formats: ["qr_code"] });
    return async () => (await bd.detect(video))[0]?.rawValue ?? null;
  }
  const jsQR = (await import("jsqr")).default;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  return async () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!canvas.width) return null;
    ctx.drawImage(video, 0, 0);
    return jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data ?? null;
  };
}

// Náhled kamery s rámečkem a skenovací linkou. Kamera se zapíná až na klepnutí,
// ať prohlížeč nežádá o povolení hned při načtení stránky.
export function QrScanner({ onCode, autoStart }: { onCode: (text: string) => void; autoStart?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(!!autoStart);
  const onCodeRef = useRef(onCode);
  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!running) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const fail = (text: string) => {
      if (stopped) return;
      setStatus("error");
      setMessage(text);
      setRunning(false);
    };

    (async () => {
      // Kameru prohlížeč pustí jen na https (nebo localhost).
      if (!window.isSecureContext) {
        return fail("Čtečka tady nefunguje (adresa není https). Naskenuj QR fotoaparátem telefonu, nebo opiš kód.");
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        return fail("Tenhle prohlížeč kameru nepodporuje. Naskenuj QR fotoaparátem telefonu, nebo opiš kód.");
      }
      setStatus("starting");
      try {
        // Vyšší rozlišení = čtečka přečte i menší nebo vzdálenější QR (např. na monitoru).
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (stopped) return;
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        const detect = await makeDetector(v);
        if (stopped) return;
        setStatus("scanning");
        // Čtečka běží pořád, dokud je na obrazovce. Stejný kód se znovu
        // pošle až po pauze, ať se jedno stanoviště neodemyká dokola.
        let last = { text: "", at: 0 };
        const tick = async () => {
          if (stopped) return;
          try {
            const text = await detect();
            const now = Date.now();
            if (text && !stopped && (text !== last.text || now - last.at > 4000)) {
              last = { text, at: now };
              navigator.vibrate?.(80);
              onCodeRef.current(text);
              timer = setTimeout(tick, 1500); // chvíli počkat na odpověď serveru
              return;
            }
          } catch {}
          timer = setTimeout(tick, 200);
        };
        tick();
      } catch (e) {
        fail(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "Kamera není povolená. Povol ji v nastavení prohlížeče, nebo opiš kód."
            : "Kameru se nepodařilo spustit. Opiš kód pod QR.",
        );
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [running]);

  return (
    <div className={styles.camera}>
      <video ref={video} playsInline muted className={running ? styles.on : ""} />
      <span className={styles.frame} />
      {status === "scanning" && <span className={styles.line} />}
      <div className={styles.overlay}>
        {!running && (
          <button type="button" className={styles.start} onClick={() => { setMessage(""); setRunning(true); }}>
            {status === "error" ? "Zkusit znovu" : "Zapnout kameru"}
          </button>
        )}
        {status === "starting" && running && <span className={styles.hint}>Spouštím kameru…</span>}
        {status === "scanning" && <span className={styles.hint}>Namiř kameru na QR kód</span>}
        {message && <span className={styles.hint}>{message}</span>}
      </div>
    </div>
  );
}

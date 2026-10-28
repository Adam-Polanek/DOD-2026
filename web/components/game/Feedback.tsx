import type { FormEvent } from "react";
import { useState } from "react";
import { sendFeedback } from "@/lib/api";
import { storeGet, storeSet } from "@/lib/format";
import { Alert } from "../Alert";
import { Button } from "../Button";
import styles from "./game.module.css";

const RECOMMEND = ["Ano", "Možná", "Ne"];

// Hodnocení hry v cíli → POST /api/feedback.
export function Feedback({ code }: { code: string }) {
  const key = "dodFeedback:" + code;
  const [sent, setSent] = useState(() => !!storeGet(key));
  const [rating, setRating] = useState<number | null>(null);
  const [recommend, setRecommend] = useState("");
  const [best, setBest] = useState("");
  const [improve, setImprove] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sendFeedback(code, { rating, recommend, best, improve });
      storeSet(key, "1");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se odeslat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="feedback" className={`${styles.card} ${styles.cardInk}`}>
      <span className="label">Hodnocení hry</span>
      {sent ? (
        <Alert kind="ok">Díky za hodnocení! Pomůže nám hru vylepšit na příští rok.</Alert>
      ) : (
        <form onSubmit={submit} className={styles.titleBlock} style={{ gap: 14 }}>
          <div className={styles.field}>
            <span>Jak se ti hra líbila?</span>
            <div className={styles.scale} role="group" aria-label="Hodnocení 1 až 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" aria-pressed={rating === n} onClick={() => setRating(n)}>{n}</button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <span>Doporučil/a bys hru kamarádům?</span>
            <div className={`${styles.scale} ${styles.scaleWords}`} role="group" aria-label="Doporučení">
              {RECOMMEND.map((r) => (
                <button key={r} type="button" aria-pressed={recommend === r} onClick={() => setRecommend(r)}>{r}</button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="fbBest">Co se ti líbilo nejvíc?</label>
            <textarea id="fbBest" className="input" maxLength={500} value={best} onChange={(e) => setBest(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="fbImprove">Co bychom měli zlepšit?</label>
            <textarea id="fbImprove" className="input" maxLength={500} value={improve} onChange={(e) => setImprove(e.target.value)} />
          </div>
          <Alert>{error}</Alert>
          <Button type="submit" variant="dark" arrow="→" disabled={busy || (rating === null && !recommend && !best && !improve)}>
            Odeslat hodnocení
          </Button>
        </form>
      )}
    </section>
  );
}

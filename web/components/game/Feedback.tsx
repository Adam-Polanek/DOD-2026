import type { FormEvent } from "react";
import { useState } from "react";
import { sendFeedback } from "@/lib/api";
import { storeGet, storeSet } from "@/lib/format";
import { Alert } from "../Alert";
import { Button } from "../Button";
import styles from "./game.module.css";

// Hodnota 1–3 se ukládá na server, popisek čte čtečka obrazovky.
export const SMILEYS = [
  { value: 1, emoji: "🙁", label: "Nelíbila" },
  { value: 2, emoji: "😐", label: "Ušla" },
  { value: 3, emoji: "😀", label: "Líbila" },
];

// Hodnocení hry v cíli → POST /api/feedback. Smajlík povinný, vzkaz ne.
export function Feedback({ code }: { code: string }) {
  const key = "dodFeedback:" + code;
  const [sent, setSent] = useState(() => !!storeGet(key));
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (rating === null) return;
    setBusy(true);
    setError("");
    try {
      await sendFeedback(code, { rating, comment });
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
            <div className={`${styles.scale} ${styles.smileys}`} role="group" aria-label="Jak se ti hra líbila?">
              {SMILEYS.map((s) => (
                <button key={s.value} type="button" aria-pressed={rating === s.value} aria-label={s.label}
                  onClick={() => setRating(s.value)}>
                  <span aria-hidden="true">{s.emoji}</span>
                  <small>{s.label}</small>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="fbComment">Chceš nám něco vzkázat? <span className="muted">(nepovinné)</span></label>
            <textarea id="fbComment" className="input" maxLength={500} value={comment}
              placeholder="Co se ti líbilo, co bychom měli zlepšit…" onChange={(e) => setComment(e.target.value)} />
          </div>
          <Alert>{error}</Alert>
          <Button type="submit" variant="dark" arrow="→" disabled={busy || rating === null}>
            Odeslat hodnocení
          </Button>
        </form>
      )}
    </section>
  );
}

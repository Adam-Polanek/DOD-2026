import type { ReactNode } from "react";
import styles from "./CodeCard.module.css";

// „Kódová“ karta s přerušovaným rámečkem: anonymní kód hráče, zůstatek apod.
export function CodeCard({ label, value, aside, big, inline }: {
  label: ReactNode;
  value: ReactNode;
  aside?: ReactNode;
  big?: boolean;
  inline?: boolean; // popisek a hodnota v jednom řádku (např. Zůstatek)
}) {
  return (
    <div className={[styles.card, big && styles.big, inline && styles.inline].filter(Boolean).join(" ")}>
      <div className={styles.main}>
        <span className="label">{label}</span>
        <span className={styles.value}>{value}</span>
      </div>
      {aside && <span className={styles.aside}>{aside}</span>}
    </div>
  );
}

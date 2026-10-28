import type { ReactNode } from "react";
import styles from "./Chip.module.css";

// Štítek: obrys, nebo plný (dark). Volitelně barevná tečka (barva metriky).
export function Chip({ dot, dark, children }: { dot?: string; dark?: boolean; children: ReactNode }) {
  return (
    <span className={`${styles.chip} ${dark ? styles.dark : ""}`}>
      {dot && <span className={styles.dot} style={{ background: dot }} />}
      {children}
    </span>
  );
}

import type { ReactNode } from "react";
import styles from "./TopBar.module.css";

// Horní lišta obrazovky: vlevo kde jsme, vpravo kód hráče / číslo stanoviště.
export function TopBar({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <header className={styles.bar}>
      <span>{left}</span>
      {right && <span>{right}</span>}
    </header>
  );
}

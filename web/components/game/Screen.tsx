import type { ReactNode } from "react";
import { TopBar } from "../TopBar";
import styles from "./game.module.css";

// Rám mobilní obrazovky: horní lišta, obsah a tlačítka přilepená dole.
export function Screen({ top, children, actions }: {
  top?: { left: ReactNode; right?: ReactNode };
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.page}>
      {top && <TopBar left={top.left} right={top.right} />}
      <main className={`${styles.content} fade-in`}>{children}</main>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

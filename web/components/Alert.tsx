import type { ReactNode } from "react";
import styles from "./Alert.module.css";

// Hlášení ze serveru: chyba (červeně), informace nebo úspěch.
export function Alert({ kind = "error", children }: { kind?: "error" | "info" | "ok"; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className={`${styles.alert} ${styles[kind]}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

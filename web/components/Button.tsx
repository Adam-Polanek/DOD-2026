import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost" | "dark" | "danger";

interface Common {
  variant?: Variant;
  arrow?: ReactNode; // znak vpravo, např. → ↗ ↓ (sází se v Plex Mono)
  small?: boolean;
}

const cls = (variant: Variant, small?: boolean, extra?: string) =>
  [styles.btn, styles[variant], small && styles.small, extra].filter(Boolean).join(" ");

export function Button({ variant = "primary", arrow, small, className, children, ...rest }:
  Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cls(variant, small, className)} {...rest}>
      <span>{children}</span>
      {arrow && <span className={styles.arrow} aria-hidden="true">{arrow}</span>}
    </button>
  );
}

// Stejný vzhled pro odkaz (např. stažení CSV).
export function ButtonLink({ variant = "primary", arrow, small, className, children, ...rest }:
  Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cls(variant, small, className)} {...rest}>
      <span>{children}</span>
      {arrow && <span className={styles.arrow} aria-hidden="true">{arrow}</span>}
    </a>
  );
}

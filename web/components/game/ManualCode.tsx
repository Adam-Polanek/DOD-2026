import { useState } from "react";
import styles from "./game.module.css";

// Ruční zadání kódu z cedule, když nejde kamera.
export function ManualCode({ label, busy, onSubmit }: { label: string; busy: boolean; onSubmit: (code: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className={styles.field}>
      <label htmlFor="manualCode" className="label">{label}</label>
      <form className={styles.manual} onSubmit={(e) => { e.preventDefault(); if (value.trim()) onSubmit(value.trim()); }}>
        <input
          id="manualCode" value={value} onChange={(e) => setValue(e.target.value)}
          placeholder="ABC123" maxLength={12} autoComplete="off" autoCapitalize="characters"
        />
        <button type="submit" disabled={busy || !value.trim()}>OK</button>
      </form>
    </div>
  );
}

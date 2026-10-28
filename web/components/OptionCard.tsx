import { letter } from "@/lib/format";
import styles from "./OptionCard.module.css";

// Možnost odpovědi A/B/C. Stavy: běžná, vybraná, zamčená (důvod posílá server).
export function OptionCard({ index, text, selected, locked, lockText, disabled, onSelect }: {
  index: number;
  text: string;
  selected: boolean;
  locked: boolean;
  lockText: string | null;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const state = locked ? styles.locked : selected ? styles.selected : "";
  return (
    <button
      type="button"
      className={`${styles.opt} ${state}`}
      disabled={locked || disabled}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={styles.key}>{letter(index)}</span>
      <span className={styles.body}>
        <span>{text}</span>
        {locked && <span className={styles.why}>Zamčeno · {lockText}</span>}
      </span>
    </button>
  );
}

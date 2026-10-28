import { pad2 } from "@/lib/format";
import styles from "./StationProgress.module.css";

// Průběh trasy jako řada políček periodické tabulky 01–10.
// Hotová = černá, aktuální = červená, další = jen obrys.
export function StationProgress({ total, current }: { total: number; current: number }) {
  return (
    <ol className={styles.row} aria-label={`Stanoviště ${current + 1} z ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <li
          key={i}
          className={i < current ? styles.done : i === current ? styles.current : styles.todo}
          aria-current={i === current ? "step" : undefined}
        >
          {pad2(i + 1)}
        </li>
      ))}
    </ol>
  );
}

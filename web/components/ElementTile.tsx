import styles from "./ElementTile.module.css";

// Dlaždice prvku periodické tabulky – „St“ jako Studium.
export function ElementTile({ number, symbol, name, note, corner }: {
  number: number | string;
  symbol: string;
  name: string;
  note?: string;
  corner?: string;
}) {
  return (
    <div className={styles.tile} aria-hidden="true">
      <div className={styles.top}>
        <span>{number}</span>
        {corner && <span>{corner}</span>}
      </div>
      <div className={styles.symbol}>{symbol}</div>
      <div className={styles.name}>
        {name}
        {note && <><br />{note}</>}
      </div>
    </div>
  );
}

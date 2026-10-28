// Formátování čísel pro češtinu. Minus je typografický (−), ne pomlčka.
const cz = (n: number) => Math.round(Math.abs(n)).toLocaleString("cs-CZ");

export const fmtKc = (n: number) => (n < 0 ? "−" : "") + cz(n) + " Kč";
export const fmtNum = (n: number) => (n < 0 ? "−" : "") + cz(n);
export const signed = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "±") + cz(n);
export const pad2 = (n: number) => String(n).padStart(2, "0");
export const letter = (i: number) => "ABCDEF"[i] ?? String(i + 1);

// Kód z QR: QR obsahuje odkaz …/?qr=KOD, ruční zadání je rovnou kód.
export function tokenFrom(text: string) {
  try {
    const q = new URL(text).searchParams.get("qr");
    if (q) return q;
  } catch {}
  return text.trim();
}

export const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }) : "";

// localStorage může v anonymním okně vyhodit chybu – hra musí běžet i bez něj.
export function storeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function storeSet(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
}

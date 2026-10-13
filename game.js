// ---------------------------------------------------------------------------
//  PRAVIDLA HRY (běží POUZE na serveru). Obsah (texty, částky) je v questions.js.
//
//  Princip: v databázi jsou uložené jen volby hráče (a jestli podnikání vyšlo).
//  Peníze se z nich pokaždé znovu spočítají funkcí replay(). Díky tomu je stav
//  vždy konzistentní a nejde ho „rozbít" – stačí opravit pravidla a přepočítá se.
// ---------------------------------------------------------------------------
import { createHmac } from "node:crypto";
import { STATIONS, RATE, GROUPS, TIERS } from "./questions.js";

export { STATIONS, GROUPS, TIERS };
export const FINAL_INDEX = STATIONS.findIndex((s) => s.final);

// ---- QR kódy ---------------------------------------------------------------
// Každé stanoviště má krátký tajný kód odvozený z QR_SECRET. Kódy tak nejsou
// napsané v kódu na GitHubu a kdo nezná QR_SECRET, nemůže si je vymyslet.
// kind "arrive" = QR na stanovišti, "task" = QR, který ukáže obsluha po úkolu.
const QR_SECRET = process.env.QR_SECRET || "zmen-me-qr";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bez 0/O a 1/I

export function qrToken(stationId, kind = "arrive") {
  const h = createHmac("sha256", QR_SECRET).update(`${stationId}:${kind}`).digest();
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[h[i] % ALPHABET.length];
  return s;
}

// Najde, ke kterému stanovišti kód patří. Vrací { index, station, kind } nebo null.
export function findToken(token) {
  const t = (token || "").toString().trim().toUpperCase();
  for (let i = 0; i < STATIONS.length; i++) {
    const st = STATIONS[i];
    if (qrToken(st.id, "arrive") === t) return { index: i, station: st, kind: "arrive" };
    if (st.task && qrToken(st.id, "task") === t) return { index: i, station: st, kind: "task" };
  }
  return null;
}

// Seznam všech QR kódů pro organizátory (tisk).
export function allTokens() {
  return STATIONS.flatMap((st, i) => {
    const rows = [{ num: i + 1, id: st.id, title: st.title, kind: "arrive", token: qrToken(st.id, "arrive") }];
    if (st.task) rows.push({ num: i + 1, id: st.id, title: st.title, kind: "task", token: qrToken(st.id, "task") });
    return rows;
  });
}

// ---- Co smí vidět prohlížeč ------------------------------------------------
// Bez g, to, risk, debt, ok a bez tipů (ty přijdou až po odpovědi).
export function publicStations() {
  return STATIONS.map((st, i) => ({
    id: st.id, num: i + 1, age: st.age, title: st.title, income: st.income ?? 0,
    story: st.story ?? "", q: st.q ?? "", task: !!st.task, taskText: st.taskText ?? "",
    quiz: !!st.quiz, final: !!st.final,
    opts: (st.opts || []).map((o) => ({ t: o.t, d: o.d ?? "", needs: o.needs ?? null })),
  }));
}

export function publicRules() {
  return {
    groups: GROUPS,
    tiers: TIERS.map(({ id, min, t, d, prize }) => ({ id, min, t, d, prize })),
  };
}

// ---- Výpočet peněz ---------------------------------------------------------
const emptyState = () => ({
  piggy: 0, bank: 0, invest: 0, spent: 0,
  types: { p: 0, s: 0, r: 0 },
  unlockedInvest: false,
});

function grow(S, years) {
  const before = { piggy: S.piggy, bank: S.bank, invest: S.invest };
  for (const k of ["piggy", "bank", "invest"]) S[k] *= Math.pow(1 + RATE[k], years);
  return { years, before, after: { piggy: S.piggy, bank: S.bank, invest: S.invest } };
}

// Provede jednu volbu. `success` je uložený výsledek podnikání (true/false/null).
// Vrací { gain, outcome } pro zobrazení hráči.
function applyChoice(S, st, choice, success) {
  const o = st.opts[choice];
  if (st.quiz) {
    S.unlockedInvest = true;
    if (o.ok) { S.bank += st.bonus || 0; return { gain: st.bonus || 0, outcome: "quiz-ok" }; }
    return { gain: 0, outcome: "quiz-wrong" };
  }
  if (o.g) S.types[o.g]++;
  if (o.risk) {
    if (success) { S.bank += o.risk.win; return { gain: o.risk.win - st.income, outcome: "risk-win", win: o.risk.win }; }
    S.spent += st.income;
    return { gain: -st.income, outcome: "risk-lose" };
  }
  for (const k in o.to) S[k] += st.income * o.to[k];
  if (o.debt) { S.bank -= o.debt; S.spent += o.debt; }
  const gain = st.income * (1 - (o.to.spent || 0)) - (o.debt || 0);
  return { gain, outcome: gain > 0 ? "saved" : gain < 0 ? "debt" : "spent" };
}

// Přehraje hru od začátku.
//   choices  = { s1: { choice, success }, s2: … }
//   arrivedAt = index stanoviště, na které hráč naposledy dorazil (−1 = nikam)
// Vrací stav peněz a `elapsed` (jak se peníze změnily cestou na arrivedAt).
export function replay(choices, arrivedAt) {
  const S = emptyState();
  let elapsed = null, last = null;
  for (let i = 0; i <= arrivedAt && i < STATIONS.length; i++) {
    const st = STATIONS[i];
    if (i > 0) elapsed = grow(S, st.age - STATIONS[i - 1].age);
    const c = choices[st.id];
    if (c && !st.final) last = { stationId: st.id, ...applyChoice(S, st, c.choice, c.success) };
  }
  return { ...S, total: S.piggy + S.bank + S.invest, elapsed, last };
}

// Hodí kostkou u podnikání. Volá se jen jednou při odpovědi, výsledek se uloží.
export function rollRisk(st, choice) {
  const o = st.opts[choice];
  return o?.risk ? Math.random() < o.risk.p : null;
}

// Je volba povolená? (index existuje a možnost není zamčená)
export function choiceAllowed(st, choice, unlockedInvest) {
  const o = st.opts?.[choice];
  if (!o) return false;
  if (o.needs === "invest" && !unlockedInvest) return false;
  return true;
}

export function tierFor(total) {
  return TIERS.find((t) => t.min == null || total >= t.min);
}

// Převažující typ hráče. Při shodě vrací oba (např. „Střadatel × Podnikavec").
export function personaFor(types) {
  const order = ["p", "s", "r"].sort((a, b) => types[b] - types[a]);
  const mixed = types[order[0]] === types[order[1]];
  return { main: order[0], second: mixed ? order[1] : null };
}

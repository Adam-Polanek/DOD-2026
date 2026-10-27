// ---------------------------------------------------------------------------
//  PRAVIDLA HRY (běží POUZE na serveru). Obsah (texty, body, Kč) je v questions.js.
//
//  Princip: v databázi jsou uložené jen volby hráče. Metriky, Kč, skupina
//  (Erasmus / doma) i trasa se z nich pokaždé znovu spočítají funkcí replay().
//  Díky tomu je stav vždy konzistentní – stačí opravit pravidla a přepočítá se.
// ---------------------------------------------------------------------------
import { createHmac } from "node:crypto";
import {
  STATIONS, START_KC, ROUTES, GROUP_AFTER, GROUP_INFO, chooseGroup,
  METRICS, SCORE, BANDS,
} from "./questions.js";

export { STATIONS, METRICS, GROUP_INFO };
const BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s]));
const KEYS = ["f", "v", "p"];
export const ROUTE_LENGTH = ROUTES.erasmus.length;

// ---- QR kódy ---------------------------------------------------------------
// Každé stanoviště (místo) má krátký tajný kód odvozený z QR_SECRET. Kódy tak
// nejsou napsané v kódu na GitHubu a kdo nezná QR_SECRET, nemůže si je vymyslet.
// kind "arrive" = QR na stanovišti, "task" = QR, který ukáže obsluha po úkolu.
const QR_SECRET = process.env.QR_SECRET || "zmen-me-qr";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bez 0/O a 1/I

export function qrToken(stationId, kind = "arrive") {
  const h = createHmac("sha256", QR_SECRET).update(`${stationId}:${kind}`).digest();
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[h[i] % ALPHABET.length];
  return s;
}

// Najde, ke kterému stanovišti kód patří. Vrací { station, kind } nebo null.
export function findToken(token) {
  const t = (token || "").toString().trim().toUpperCase();
  for (const st of STATIONS) {
    if (qrToken(st.id, "arrive") === t) return { station: st, kind: "arrive" };
    if (st.task && qrToken(st.id, "task") === t) return { station: st, kind: "task" };
  }
  return null;
}

// Seznam všech QR kódů pro organizátory (tisk). Čísla stanovišť se u Banky
// a Kanceláří liší podle trasy, proto se tisknou jména míst.
export function allTokens() {
  return STATIONS.flatMap((st) => {
    const rows = [{ id: st.id, place: st.place, title: st.title, kind: "arrive", token: qrToken(st.id, "arrive") }];
    if (st.task) rows.push({ id: st.id, place: st.place, title: st.title, kind: "task", token: qrToken(st.id, "task") });
    return rows;
  });
}

// ---- Trasa a varianty ------------------------------------------------------
// Skupina je známá až po odpovědi na GROUP_AFTER. Do té doby je null a trasa
// se shoduje pro obě skupiny (liší se až za Přístavem).
export const routeFor = (group) => ROUTES[group || "erasmus"];

// Obsah stanoviště pro danou skupinu (příběh, otázka, možnosti).
export function stationContent(st, group) {
  return st.variants ? st.variants[group] : st;
}

// ---- Podmínky u možností ---------------------------------------------------
const NEED_NAMES = { kc: "Kč", f: "bodů financí", v: "bodů vzdělání", p: "bodů požitků" };
const fmt = (n) => Math.round(n).toLocaleString("cs-CZ");

// Vrací null (možnost je volná) nebo text, proč je zamčená.
export function lockReason(o, S) {
  for (const [k, min] of Object.entries(o.needs || {})) {
    const have = k === "kc" ? S.kc : S.m[k];
    if (have < min) return `Potřebuješ aspoň ${fmt(min)} ${NEED_NAMES[k]}, máš ${fmt(have)}.`;
  }
  return null;
}

// ---- Co smí vidět prohlížeč ------------------------------------------------
// Přehled míst pro mapu – bez otázek (ty závisí na skupině hráče).
export function publicStations() {
  return STATIONS.map((st) => ({ id: st.id, place: st.place, title: st.title, final: !!st.final }));
}

// Aktuální stanoviště tak, jak ho vidí hráč: bez fx, kc a ok,
// ale s informací, které možnosti má zamčené.
export function publicStation(st, num, S) {
  const c = stationContent(st, S.group) || {};
  return {
    id: st.id, num, place: st.place, title: st.title, final: !!st.final,
    task: !!st.task, taskText: st.taskText ?? "",
    story: c.story ?? "", q: c.q ?? "",
    opts: (c.opts || []).map((o) => {
      const why = lockReason(o, S);
      return { t: o.t, locked: !!why, lockText: why };
    }),
    group: st.id === nextAfter(GROUP_AFTER) && S.group ? { id: S.group, ...GROUP_INFO[S.group] } : null,
  };
}
function nextAfter(id) {
  const r = ROUTES.erasmus;
  return r[r.indexOf(id) + 1];
}

export function publicRules() {
  return {
    metrics: METRICS, startKc: START_KC, routeLength: ROUTE_LENGTH,
    bands: BANDS.map(({ min, t }) => ({ min, t })),
  };
}

// ---- Výpočet ---------------------------------------------------------------
// Přehraje hru od začátku podle uložených voleb.
//   choices = { s1: { choice }, s2: … }
// Vrací { m: {f,v,p}, kc, group, route, last } – last = výsledek poslední volby.
export function replay(choices) {
  const S = { m: { f: 0, v: 0, p: 0 }, kc: START_KC, group: null, last: null };
  // Trasa se po GROUP_AFTER může změnit, proto se bere vždy podle aktuální skupiny.
  let i = 0;
  while (i < ROUTE_LENGTH) {
    const st = BY_ID[routeFor(S.group)[i]];
    const c = choices[st.id];
    if (!c || st.final) break;
    const o = stationContent(st, S.group).opts[c.choice];
    const before = { ...S.m, kc: S.kc };
    for (const k of KEYS) S.m[k] += o.fx?.[k] || 0;
    S.kc += o.kc || 0;
    S.last = {
      stationId: st.id, choice: c.choice, choiceText: o.t, result: o.r ?? "",
      fx: { f: S.m.f - before.f, v: S.m.v - before.v, p: S.m.p - before.p },
      kc: S.kc - before.kc,
      correct: o.ok === undefined ? null : !!o.ok,
      quiz: stationContent(st, S.group).opts.some((x) => x.ok),
    };
    if (st.id === GROUP_AFTER) S.group = chooseGroup(S.m);
    if (o.switchTo) S.group = o.switchTo; // např. odmítnutý Erasmus → trasa „doma“
    i++;
  }
  S.route = routeFor(S.group);
  S.pos = i; // index aktuálního stanoviště v trase (první bez volby)
  return S;
}

// Je volba povolená? (index existuje a hráč splňuje podmínku)
export function choiceAllowed(st, choice, S) {
  const o = stationContent(st, S.group)?.opts?.[choice];
  return !!o && !lockReason(o, S);
}

// ---- Skóre 0–100 -----------------------------------------------------------
// Hranice metrik se spočítají z obsahu: nejhorší a nejlepší možný součet přes
// všechna stanoviště (u variant se bere krajní hodnota z obou).
const BOUNDS = (() => {
  const b = { f: [0, 0], v: [0, 0], p: [0, 0], kc: [START_KC, START_KC] };
  for (const st of STATIONS) {
    if (st.final) continue;
    const opts = st.variants ? Object.values(st.variants).flatMap((v) => v.opts) : st.opts;
    for (const k of [...KEYS, "kc"]) {
      const vals = opts.map((o) => (k === "kc" ? o.kc || 0 : o.fx?.[k] || 0));
      b[k][0] += Math.min(...vals);
      b[k][1] += Math.max(...vals);
    }
  }
  return b;
})();

const norm = (k, x) => {
  const [lo, hi] = BOUNDS[k];
  return hi === lo ? 0.5 : Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
};

export function scoreFor(S) {
  const n = { f: norm("f", S.m.f), v: norm("v", S.m.v), p: norm("p", S.m.p), kc: norm("kc", S.kc) };
  const avg = (n.f + n.v + n.p + n.kc) / 4;
  const balance = Math.min(n.f, n.v, n.p);
  const score = Math.round(100 * (SCORE.avgWeight * avg + SCORE.balanceWeight * balance));
  return { score, norm: n };
}

export function bandFor(score) {
  return BANDS.find((b) => score >= b.min);
}

// Nejsilnější metrika (porovnává se podle normalizovaných hodnot, ať je to
// férové i když má každá metrika jiný rozsah). Při shodě vrací obě.
export function profileFor(n) {
  const order = [...KEYS].sort((a, b) => n[b] - n[a]);
  const mixed = Math.abs(n[order[0]] - n[order[1]]) < 1e-9;
  return { main: order[0], second: mixed ? order[1] : null };
}

export function profileName(pr) {
  return METRICS[pr.main].profile + (pr.second ? " × " + METRICS[pr.second].profile : "");
}

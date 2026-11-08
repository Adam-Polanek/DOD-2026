// ---------------------------------------------------------------------------
//  PRAVIDLA HRY (běží POUZE na serveru). Obsah (texty, body) je v questions.js.
//
//  Princip: v databázi jsou uložené jen volby hráče. Metriky, skupina
//  (Erasmus / doma) i trasa se z nich pokaždé znovu spočítají funkcí replay().
//  Díky tomu je stav vždy konzistentní – stačí opravit pravidla a přepočítá se.
// ---------------------------------------------------------------------------
import { createHmac } from "node:crypto";
import {
  STATIONS, START_METRIC, ROUTES,
  METRICS, SCORE, BANDS,
} from "./questions.js";

export { STATIONS, METRICS };
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
// num = číslo stanoviště na trase; Banka a Kanceláře mají podle trasy 7, nebo 8 („7 / 8“).
export function allTokens() {
  return STATIONS.flatMap((st) => {
    const nums = [...new Set(Object.values(ROUTES).map((r) => r.indexOf(st.id) + 1))].sort((a, b) => a - b);
    const base = { id: st.id, num: nums.join(" / "), place: st.place, title: st.title };
    const rows = [{ ...base, kind: "arrive", token: qrToken(st.id, "arrive") }];
    if (st.task) rows.push({ ...base, kind: "task", token: qrToken(st.id, "task") });
    return rows;
  }).sort((a, b) => parseInt(a.num) - parseInt(b.num));
}

// ---- Trasa a varianty ------------------------------------------------------
// Skupina je známá až po odpovědi na Erasmu (switchTo). Do té doby je null
// a trasa se shoduje pro obě skupiny (liší se až za Přístavem).
export const routeFor = (group) => ROUTES[group || "erasmus"];

// Obsah stanoviště pro danou skupinu (příběh, otázka, možnosti).
export function stationContent(st, group) {
  return st.variants ? st.variants[group] : st;
}

// ---- Podmínky u možností ---------------------------------------------------
const NEED_NAMES = { f: "bodů financí", v: "bodů vzdělání", p: "bodů požitků" };

// Vrací null (možnost je volná) nebo text, proč je zamčená.
export function lockReason(o, S) {
  for (const [k, min] of Object.entries(o.needs || {})) {
    if (S.m[k] < min) return `Potřebuješ aspoň ${min} ${NEED_NAMES[k]}, máš ${S.m[k]}.`;
  }
  return null;
}

// ---- Otevřená otázka (hráč píše číslo) ---------------------------------------
// „9 726“, „9726,5“ i „9726 Kč“ → číslo; nesmysl → null.
export function parseNumber(raw) {
  const s = String(raw ?? "").replace(/\s|kč/gi, "").replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}

// Index rozsahu, do kterého odpověď spadá (poslední rozsah = „jiný výsledek“).
export function rangeIndex(input, value) {
  const i = input.ranges.findIndex((r) =>
    (r.min === undefined || value >= r.min) && (r.max === undefined || value <= r.max));
  return i === -1 ? input.ranges.length - 1 : i;
}

// ---- Co smí vidět prohlížeč ------------------------------------------------
// Přehled míst pro mapu – bez otázek (ty závisí na skupině hráče).
export function publicStations() {
  return STATIONS.map((st) => ({ id: st.id, place: st.place, title: st.title, final: st.id === ROUTES.erasmus.at(-1) }));
}

// Aktuální stanoviště tak, jak ho vidí hráč: bez fx, ok a rozsahů,
// ale s informací, které možnosti má zamčené.
export function publicStation(st, num, S) {
  const c = stationContent(st, S.group) || {};
  return {
    id: st.id, num, place: st.place, title: st.title, final: num === ROUTE_LENGTH,
    task: !!st.task, taskText: st.taskText ?? "",
    story: c.story ?? "", q: c.q ?? "",
    opts: (c.opts || []).map((o) => {
      const why = lockReason(o, S);
      return { t: o.t, locked: !!why, lockText: why };
    }),
    input: c.input ? { unit: c.input.unit } : null,
  };
}

export function publicRules() {
  // eval (texty vyhodnocení) se posílá až ve výsledku, jen ten hráčův.
  const metrics = Object.fromEntries(Object.entries(METRICS).map(([k, { eval: _, ...m }]) => [k, m]));
  return {
    metrics, startMetric: START_METRIC, routeLength: ROUTE_LENGTH,
    bands: BANDS.map(({ min, t }) => ({ min, t })),
  };
}

// Text z Vyhodnocení podle konečných bodů v metrice.
export function evalFor(k, value) {
  return METRICS[k].eval.find((e) => value <= e.max).t;
}

// ---- Výpočet ---------------------------------------------------------------
// Možnost, kterou volba vybrala: u otázek A/B/C je choice index možnosti,
// u otevřené otázky index rozsahu (napsané číslo je v c.value).
function optionFor(content, choice) {
  return content.input ? content.input.ranges[choice] : content.opts?.[choice];
}

// Přehraje hru od začátku podle uložených voleb.
//   choices = { s1: { choice, value }, s2: … }
// Vrací { m: {f,v,p}, group, route, pos, last } – last = výsledek poslední volby.
export function replay(choices) {
  const S = { m: { f: START_METRIC, v: START_METRIC, p: START_METRIC }, group: null, last: null };
  // Trasa se po Erasmu může změnit, proto se bere vždy podle aktuální skupiny.
  let i = 0;
  while (i < ROUTE_LENGTH) {
    const st = BY_ID[routeFor(S.group)[i]];
    const c = choices[st.id];
    const content = stationContent(st, S.group);
    const o = c && optionFor(content, c.choice);
    if (!o) break;
    const before = { ...S.m };
    for (const k of KEYS) S.m[k] += o.fx?.[k] || 0;
    S.last = {
      stationId: st.id, choice: c.choice,
      choiceText: content.input ? `Tvoje odpověď: ${fmtValue(c.value)} ${content.input.unit}` : o.t,
      result: o.r ?? "",
      fx: { f: S.m.f - before.f, v: S.m.v - before.v, p: S.m.p - before.p },
      correct: o.ok === undefined ? null : !!o.ok,
      quiz: !!content.input,
    };
    if (o.switchTo) S.group = o.switchTo; // Erasmus: A/B → „erasmus“, C → „doma“
    i++;
  }
  S.route = routeFor(S.group);
  S.pos = i; // index aktuálního stanoviště v trase (první bez volby); = ROUTE_LENGTH na konci
  return S;
}
const fmtValue = (n) => (n == null ? "?" : Number(n).toLocaleString("cs-CZ"));

// Je volba povolená? (index existuje a hráč splňuje podmínku)
export function choiceAllowed(st, choice, S) {
  const o = stationContent(st, S.group)?.opts?.[choice];
  return !!o && !lockReason(o, S);
}

// ---- Skóre 0–100 -----------------------------------------------------------
// Hranice metrik se spočítají z obsahu: nejhorší a nejlepší možný součet přes
// všechna stanoviště (u variant se bere krajní hodnota z obou).
const BOUNDS = (() => {
  const b = { f: [START_METRIC, START_METRIC], v: [START_METRIC, START_METRIC], p: [START_METRIC, START_METRIC] };
  for (const st of STATIONS) {
    const opts = (st.variants ? Object.values(st.variants) : [st]).flatMap((c) => optionsOf(c));
    for (const k of KEYS) {
      const vals = opts.map((o) => o.fx?.[k] || 0);
      b[k][0] += Math.min(...vals);
      b[k][1] += Math.max(...vals);
    }
  }
  return b;
})();

function optionsOf(c) {
  return c.input ? c.input.ranges : c.opts;
}
export const METRIC_BOUNDS = BOUNDS; // pro kontrolu rozsahů ve Vyhodnocení

const norm = (k, x) => {
  const [lo, hi] = BOUNDS[k];
  return hi === lo ? 0.5 : Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
};

function rawScore(m) {
  const n = { f: norm("f", m.f), v: norm("v", m.v), p: norm("p", m.p) };
  const avg = (n.f + n.v + n.p) / 3;
  const balance = Math.min(n.f, n.v, n.p);
  return { raw: SCORE.avgWeight * avg + SCORE.balanceWeight * balance, norm: n };
}

// Všechny metriky naráz maximum mít nejdou, takže surové skóre má menší rozsah
// než 0–1. Projdou se všechny možné hry (asi 40 000, při startu serveru)
// a skóre se roztáhne tak, aby nejhorší hra měla 0 a nejlepší 100.
const RAW_RANGE = (() => {
  let lo = Infinity, hi = -Infinity;
  const walk = (choices) => {
    const S = replay(choices);
    if (S.pos >= S.route.length) {
      const { raw } = rawScore(S.m);
      lo = Math.min(lo, raw); hi = Math.max(hi, raw);
      return;
    }
    const st = BY_ID[S.route[S.pos]];
    const c = stationContent(st, S.group);
    optionsOf(c).forEach((o, i) => {
      if (!c.input && lockReason(o, S)) return;
      walk({ ...choices, [st.id]: { choice: i, value: null } });
    });
  };
  walk({});
  return [lo, hi];
})();

export function scoreFor(S) {
  const { raw, norm: n } = rawScore(S.m);
  const [lo, hi] = RAW_RANGE;
  const score = Math.round(100 * Math.min(1, Math.max(0, (raw - lo) / (hi - lo))));
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

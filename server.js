// ---------------------------------------------------------------------------
//  DOD VŠCHT – finanční hra „Studium“ – backend (Node + Express + SQLite)
//  Spuštění:  npm install  &&  npm start
//  Nastavení přes proměnné prostředí (volitelné):
//    PORT         port serveru (výchozí 3000)
//    DB_PATH      cesta k databázi (výchozí ./data/dod.sqlite)
//    ADMIN_TOKEN  heslo pro admin přehled a export (VÝCHOZÍ "zmen-me" – ZMĚŇTE!)
//    QR_SECRET    tajemství, ze kterého se počítají kódy v QR (VÝCHOZÍ "zmen-me-qr" – ZMĚŇTE!
//                 a po vytištění QR kódů už neměňte, jinak přestanou platit)
// ---------------------------------------------------------------------------
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as game from "./game.js";
import * as store from "./db.js";

const { STATIONS, METRICS } = game;
const BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s]));
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
// Na Azure běží server za proxy – bez tohohle by odkazy v QR začínaly http:// místo https://.
app.set("trust proxy", true);
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "zmen-me";
const DEFAULT_SECRETS = { admin: !process.env.ADMIN_TOKEN, qr: !process.env.QR_SECRET };

// --- Generování unikátního kódu účastníka: DOD-XXXX -------------------------
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode() {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return "DOD-" + s;
}
function makeUniqueCode() {
  for (let i = 0; i < 20; i++) {
    const code = randomCode();
    if (!store.getParticipant(code)) return code;
  }
  return "DOD-" + Date.now().toString(36).toUpperCase();
}

function requireParticipant(req, res) {
  const code = (req.body?.code || req.params?.code || "").toString().trim().toUpperCase();
  const p = code && store.getParticipant(code);
  if (!p) {
    res.status(404).json({ error: "Neznámý hrací kód. Začni hru znovu." });
    return null;
  }
  return p;
}

// ---------------------------------------------------------------------------
//  Postup hráče: kde je, co má odemčené, metriky a Kč.
//  Stanoviště jdou povinně popořadě podle trasy hráče (ta se po stanovišti 5
//  rozdělí na Erasmus / doma). Aktuální je první stanoviště bez volby.
// ---------------------------------------------------------------------------
function progress(p) {
  const S = game.replay(store.getChoices(p.code));
  const unlocks = store.getUnlocks(p.code);
  const st = BY_ID[S.route[S.pos]];
  const arrived = unlocks.has(`${st.id}:arrive`);
  const taskDone = !st.task || unlocks.has(`${st.id}:task`);
  return {
    code: p.code,
    current: S.pos,                  // index aktuálního stanoviště v trase (0 = první)
    stationId: st.id,
    arrived,                         // naskenoval QR na místě?
    taskDone,                        // splnil úkol s obsluhou (jen u task stanovišť)?
    finished: !!p.finished_at,
    metrics: S.m,                    // { f, v, p } – finance, vzdělání, požitky
    kc: S.kc,
    group: S.group,                  // null / "erasmus" / "doma"
    route: S.route.map((id) => ({ id, place: BY_ID[id].place })),
    // Dokud hráč nenaskenuje QR, vidí jen kam má jít, ne otázku.
    station: arrived
      ? game.publicStation(st, S.pos + 1, S)
      : { id: st.id, num: S.pos + 1, place: st.place, title: st.title },
    result: arrived && st.final ? finalResult(p.code) : null,
  };
}

// Skóre jednoho hráče (pro výsledek, žebříček i export).
function scoreRow(p) {
  const S = game.replay(store.getChoices(p.code));
  const { score, norm } = game.scoreFor(S);
  const profile = game.profileFor(norm);
  return {
    code: p.code, nickname: p.nickname, created_at: p.created_at, finished_at: p.finished_at,
    stationsDone: S.pos + (p.finished_at ? 1 : 0),
    group: S.group, metrics: S.m, kc: Math.round(S.kc), score,
    profile: profile.main, profileName: game.profileName(profile),
  };
}

// Dokončení hráči seřazení podle skóre (při shodě víc Kč vyhrává).
function finishedRanking() {
  return store.allParticipants().filter((p) => p.finished_at).map(scoreRow)
    .sort((a, b) => (b.score - a.score) || (b.kc - a.kc));
}

// Pořadí v jedné metrice (nejlepší ve financích / vzdělání / požitcích).
function categoryRanking(rows, k) {
  return [...rows].sort((a, b) => (b.metrics[k] - a.metrics[k]) || (b.score - a.score));
}

function finalResult(code) {
  const rows = finishedRanking();
  const me = rows.find((r) => r.code === code);
  if (!me) return null;
  const band = game.bandFor(me.score);
  const categories = {};
  for (const k of Object.keys(METRICS)) {
    categories[k] = { value: me.metrics[k], rank: categoryRanking(rows, k).findIndex((r) => r.code === code) + 1 };
  }
  return {
    score: me.score, kc: me.kc, metrics: me.metrics,
    rank: rows.indexOf(me) + 1, of: rows.length,
    categories,                                  // { f: { value, rank }, v: …, p: … }
    band: { t: band.t, d: band.d },
    profile: { id: me.profile, name: me.profileName, text: METRICS[me.profile].text },
  };
}

// ===========================================================================
//  VEŘEJNÉ API (pro hráče)
// ===========================================================================

// Přehled míst + metriky a pravidla (bez otázek – ty závisí na trase hráče).
app.get("/api/config", (_req, res) => {
  res.json({ stations: game.publicStations(), ...game.publicRules() });
});

// Registrace nového hráče → přidělí kód.
app.post("/api/register", (req, res) => {
  const nickname = (req.body?.nickname || "").toString().trim().slice(0, 40) || null;
  const code = makeUniqueCode();
  const p = store.createParticipant(code, nickname);
  res.json(progress(p));
});

// Stav hráče (pro obnovení po zavření prohlížeče).
app.get("/api/me/:code", (req, res) => {
  const p = requireParticipant(req, res);
  if (!p) return;
  res.json(progress(p));
});

// Naskenovaný QR kód → odemkne stanoviště (nebo potvrdí splněný úkol).
app.post("/api/unlock", (req, res) => {
  const p = requireParticipant(req, res);
  if (!p) return;
  const found = game.findToken(req.body?.token);
  if (!found) return res.status(400).json({ error: "Tenhle kód neznáme. Zkontroluj, jestli jsi ho opsal(a) správně." });

  const before = progress(p);
  const idx = before.route.findIndex((r) => r.id === found.station.id);
  const next = before.route[before.current];
  if (idx < before.current) {
    return res.json({ ...before, notice: `${found.station.place}: tohle stanoviště už máš hotové.` });
  }
  if (idx > before.current) {
    return res.status(409).json({
      error: `Tohle je ${found.station.place}. Teď tě čeká stanoviště ${before.current + 1}: ${next.place}.`,
    });
  }
  if (found.kind === "task" && !before.arrived) {
    return res.status(409).json({ error: "Nejdřív naskenuj QR kód, který visí na stanovišti." });
  }
  store.addUnlock(p.code, found.station.id, found.kind);
  if (found.station.final) store.finishParticipant(p.code);
  res.json(progress(store.getParticipant(p.code)));
});

// Odpověď na otázku → server ji vyhodnotí a uloží.
app.post("/api/answer", (req, res) => {
  const p = requireParticipant(req, res);
  if (!p) return;
  const now = progress(p);
  const st = BY_ID[now.stationId];
  const choice = Number(req.body?.choice);

  if (req.body?.station !== st.id) {
    return res.status(409).json({ error: `Teď odpovídáš na stanovišti ${now.current + 1}: ${st.place}.`, ...now });
  }
  if (st.final) return res.status(409).json({ error: "Na posledním stanovišti se už neodpovídá." });
  if (!now.arrived) return res.status(409).json({ error: "Nejdřív naskenuj QR kód na stanovišti." });
  if (!now.taskDone) return res.status(409).json({ error: "Nejdřív splň úkol a nech si od obsluhy naskenovat QR kód." });
  const S = game.replay(store.getChoices(p.code));
  if (!game.choiceAllowed(st, choice, S)) {
    return res.status(400).json({ error: "Tuhle možnost teď nemůžeš zvolit." });
  }

  store.addChoice(p.code, st.id, choice, null);
  // Výsledek se počítá z uložených dat (při dvojkliku platí první volba).
  const after = game.replay(store.getChoices(p.code));
  const last = after.last.stationId === st.id ? after.last : null;
  res.json({ ...progress(p), answer: last });
});

// Zpětná vazba.
app.post("/api/feedback", (req, res) => {
  const p = requireParticipant(req, res);
  if (!p) return;
  const { rating, recommend, best, improve } = req.body || {};
  store.saveFeedback(p.code, {
    rating: rating != null ? Number(rating) : null,
    recommend: (recommend || "").toString().slice(0, 40),
    best: (best || "").toString().slice(0, 500),
    improve: (improve || "").toString().slice(0, 500),
  });
  res.json({ ok: true });
});

// Veřejný žebříček: TOP 20 celkově + TOP 3 v každé metrice (pro obrazovku v cíli).
app.get("/api/leaderboard", (_req, res) => {
  const rows = finishedRanking();
  const pub = (r, i) => ({ rank: i + 1, name: r.nickname || r.code, score: r.score, kc: r.kc,
    metrics: r.metrics, profile: r.profileName });
  const categories = {};
  for (const k of Object.keys(METRICS)) categories[k] = categoryRanking(rows, k).slice(0, 3).map(pub);
  res.json({
    board: rows.slice(0, 20).map(pub),
    categories,
    stats: { total: store.allParticipants().length, finished: rows.length },
  });
});

// ===========================================================================
//  ADMIN API (pro organizátory) – chráněno tokenem
// ===========================================================================
function requireAdmin(req, res) {
  const token = (req.query?.token || req.headers["x-admin-token"] || "").toString();
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Neplatný admin token." });
    return false;
  }
  return true;
}

// Všichni hráči: dokončení podle skóre, pak ti, co ještě hrají.
function allResults() {
  const playing = store.allParticipants().filter((p) => !p.finished_at).map(scoreRow);
  return [...finishedRanking(), ...playing];
}

app.get("/api/admin/leaderboard", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const board = allResults();
  res.json({
    board,
    stations: game.publicStations(),
    defaultSecrets: DEFAULT_SECRETS,
    stats: { total: board.length, finished: board.filter((r) => r.finished_at).length },
  });
});

// Kódy do QR pro tisk. URL vede na hru, která stanoviště sama odemkne.
app.get("/api/admin/qr", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const base = `${req.protocol}://${req.get("host")}`;
  res.json({
    base,
    defaultSecret: DEFAULT_SECRETS.qr, // true = QR_SECRET není nastavený, kódy se po nasazení změní
    codes: game.allTokens().map((t) => ({ ...t, url: `${base}/?qr=${t.token}` })),
  });
});

// Export do CSV (otevře se v Excelu).
app.get("/api/admin/export.csv", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const head = ["poradi", "kod", "prezdivka", "skore", "kc", "finance", "vzdelani", "pozitky",
    "profil", "skupina", "stanovist", "start", "dokonceno"];
  const csv = [head.join(";")];
  allResults().forEach((r, i) => {
    csv.push([
      r.finished_at ? i + 1 : "", r.code, (r.nickname || "").replace(/;/g, ","), r.score, r.kc,
      r.metrics.f, r.metrics.v, r.metrics.p, r.profileName, r.group ?? "", r.stationsDone,
      r.created_at, r.finished_at || "",
    ].join(";"));
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="dod-vysledky.csv"');
  res.send("\uFEFF" + csv.join("\n")); // BOM kvůli české diakritice v Excelu
});

app.get("/admin", (_req, res) => {
  res.sendFile(join(__dirname, "public", "admin.html"));
});

// Kontrola pro Azure (Health check) – odpoví, jen když funguje i databáze.
app.get("/api/health", (_req, res) => {
  store.allParticipants();
  res.json({ ok: true });
});

// Obrazovka do cíle (žebříček na velkou obrazovku).
app.get("/cil", (_req, res) => {
  res.sendFile(join(__dirname, "public", "cil.html"));
});

app.listen(PORT, () => {
  console.log(`DOD hra běží na http://localhost:${PORT}`);
  console.log(`Admin přehled: http://localhost:${PORT}/admin  (token: ${ADMIN_TOKEN})`);
});

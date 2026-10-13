// ---------------------------------------------------------------------------
//  Od kapesného k důchodu – backend (Node + Express + SQLite)
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

const { STATIONS, FINAL_INDEX } = game;
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "zmen-me";

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
//  Postup hráče: kde je, co má odemčené a kolik má peněz.
//  Stanoviště jdou povinně popořadě, aktuální je první, na kterém ještě nevolil.
// ---------------------------------------------------------------------------
function progress(p) {
  const choices = store.getChoices(p.code);
  const unlocks = store.getUnlocks(p.code);
  let current = 0;
  while (current < FINAL_INDEX && choices[STATIONS[current].id]) current++;
  const st = STATIONS[current];
  const arrived = unlocks.has(`${st.id}:arrive`);
  const taskDone = !st.task || unlocks.has(`${st.id}:task`);
  const S = game.replay(choices, arrived ? current : current - 1);
  return {
    code: p.code,
    current,                         // index aktuálního stanoviště (0 = první)
    stationId: st.id,
    arrived,                         // naskenoval QR na místě?
    taskDone,                        // splnil úkol s obsluhou (jen u task stanovišť)?
    finished: !!p.finished_at,
    money: { piggy: S.piggy, bank: S.bank, invest: S.invest, spent: S.spent, total: S.total },
    types: S.types,
    unlockedInvest: S.unlockedInvest,
    elapsed: arrived && current > 0 ? S.elapsed : null, // co se stalo s penězi cestou sem
    result: arrived && st.final ? finalResult(S) : null,
  };
}

function finalResult(S) {
  const tier = game.tierFor(S.total);
  return {
    total: S.total,
    tier: { id: tier.id, t: tier.t, d: tier.d, prize: tier.prize, prizeText: tier.prizeText },
    persona: game.personaFor(S.types),
  };
}

// ===========================================================================
//  VEŘEJNÉ API (pro hráče)
// ===========================================================================

// Stanoviště BEZ informací o tom, co se vyplatí + typy hráče a úrovně důchodu.
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
  if (found.index < before.current) {
    return res.json({ ...before, notice: `Stanoviště ${found.index + 1} už máš hotové.` });
  }
  if (found.index > before.current) {
    return res.status(409).json({
      error: `Tohle je stanoviště ${found.index + 1}. Stanoviště jdou popořadě, teď tě čeká stanoviště ${before.current + 1}.`,
    });
  }
  if (found.kind === "task" && !before.arrived) {
    return res.status(409).json({ error: "Nejdřív naskenuj QR kód, který visí na stanovišti." });
  }
  store.addUnlock(p.code, found.station.id, found.kind);
  if (found.station.final) store.finishParticipant(p.code);
  res.json(progress(store.getParticipant(p.code)));
});

// Odpověď na otázku → server ji vyhodnotí, u podnikání hodí kostkou a uloží.
app.post("/api/answer", (req, res) => {
  const p = requireParticipant(req, res);
  if (!p) return;
  const now = progress(p);
  const st = STATIONS[now.current];
  const choice = Number(req.body?.choice);

  if (req.body?.station !== st.id) {
    return res.status(409).json({ error: `Teď odpovídáš na stanovišti ${now.current + 1}.`, ...now });
  }
  if (st.final) return res.status(409).json({ error: "Na posledním stanovišti se už neodpovídá." });
  if (!now.arrived) return res.status(409).json({ error: "Nejdřív naskenuj QR kód na stanovišti." });
  if (!now.taskDone) return res.status(409).json({ error: "Nejdřív splň úkol a nech si od obsluhy naskenovat QR kód." });
  if (!game.choiceAllowed(st, choice, now.unlockedInvest)) {
    return res.status(400).json({ error: "Tuhle možnost teď nemůžeš zvolit." });
  }

  store.addChoice(p.code, st.id, choice, game.rollRisk(st, choice));
  // Spočítáme výsledek z uložených dat (při dvojkliku se vezme první volba).
  const saved = store.getChoices(p.code)[st.id];
  const S = game.replay(store.getChoices(p.code), now.current);
  const o = st.opts[saved.choice];
  res.json({
    ...progress(p),
    answer: {
      stationId: st.id, choice: saved.choice, choiceText: o.t,
      group: o.g || null, gain: S.last.gain, outcome: S.last.outcome, win: S.last.win ?? null,
      tip: st.tip,
    },
  });
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

// Všichni hráči s výsledky (pro žebříček i export).
function allResults() {
  return store.allParticipants().map((p) => {
    const pr = progress(p);
    const persona = game.personaFor(pr.types);
    return {
      code: p.code, nickname: p.nickname, created_at: p.created_at, finished_at: p.finished_at,
      stationsDone: pr.current + (pr.result ? 1 : 0),
      total: Math.round(pr.money.total),
      tier: pr.result?.tier.t ?? null,
      prize: pr.result?.tier.prize ?? null,
      types: pr.types,
      persona: game.GROUPS[persona.main].name + (persona.second ? " × " + game.GROUPS[persona.second].name : ""),
    };
  }).sort((a, b) => (!!b.finished_at - !!a.finished_at) || (b.total - a.total));
}

// Veřejný žebříček (TOP 20 dokončených).
app.get("/api/leaderboard", (_req, res) => {
  const all = allResults();
  const board = all.filter((r) => r.finished_at).slice(0, 20)
    .map((r, i) => ({ rank: i + 1, name: r.nickname || r.code, total: r.total, tier: r.tier }));
  res.json({ board, stats: { total: all.length, finished: all.filter((r) => r.finished_at).length } });
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

app.get("/api/admin/leaderboard", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const board = allResults();
  res.json({ board, stats: { total: board.length, finished: board.filter((r) => r.finished_at).length } });
});

// Kódy do QR pro tisk. URL vede na hru, která stanoviště sama odemkne.
app.get("/api/admin/qr", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const base = `${req.protocol}://${req.get("host")}`;
  res.json({ codes: game.allTokens().map((t) => ({ ...t, url: `${base}/?qr=${t.token}` })) });
});

// Export do CSV (otevře se v Excelu).
app.get("/api/admin/export.csv", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const head = ["poradi", "kod", "prezdivka", "majetek_kc", "duchod", "cena", "typ",
    "pozitkar", "stradatel", "podnikavec", "stanovist", "start", "dokonceno"];
  const csv = [head.join(";")];
  allResults().forEach((r, i) => {
    csv.push([
      i + 1, r.code, (r.nickname || "").replace(/;/g, ","), r.total, r.tier ?? "", r.prize ?? "",
      r.persona, r.types.p, r.types.s, r.types.r, r.stationsDone, r.created_at, r.finished_at || "",
    ].join(";"));
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="dod-vysledky.csv"');
  res.send("﻿" + csv.join("\n")); // BOM kvůli české diakritice v Excelu
});

app.get("/admin", (_req, res) => {
  res.sendFile(join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`Od kapesného k důchodu běží na http://localhost:${PORT}`);
  console.log(`Admin přehled: http://localhost:${PORT}/admin  (token: ${ADMIN_TOKEN})`);
});

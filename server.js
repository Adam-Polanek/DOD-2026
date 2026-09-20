// ---------------------------------------------------------------------------
//  DOD Trasa – backend (Node + Express + SQLite)
//  Spuštění:  npm install  &&  npm start
//  Nastavení přes proměnné prostředí (volitelné):
//    PORT         port serveru (výchozí 3000)
//    DB_PATH      cesta k databázi (výchozí ./data/dod.sqlite)
//    ADMIN_TOKEN  heslo pro admin přehled a export (VÝCHOZÍ "zmen-me" – ZMĚŇTE!)
// ---------------------------------------------------------------------------
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  publicStations, grade, MAX_POINTS, POINTS_PER_CORRECT, THEME_LABEL, STATIONS,
} from "./questions.js";
import * as store from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "zmen-me";

// --- Generování unikátního kódu účastníka: DOD-XXXX -------------------------
// Vynechány matoucí znaky (0/O, 1/I) kvůli čitelnosti na kartičkách/QR.
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
  // krajně nepravděpodobné – přidáme delší příponu
  return "DOD-" + Date.now().toString(36).toUpperCase();
}

// --- Validace kódu z requestu ----------------------------------------------
function requireParticipant(req, res) {
  const code = (req.body?.code || req.query?.code || "").toString().trim().toUpperCase();
  const p = code && store.getParticipant(code);
  if (!p) {
    res.status(404).json({ error: "Neznámý kód účastníka. Spusť trasu znovu." });
    return null;
  }
  return p;
}

// ===========================================================================
//  VEŘEJNÉ API (pro účastníky)
// ===========================================================================

// Konfigurace + stanoviště BEZ správných odpovědí.
app.get("/api/config", (_req, res) => {
  res.json({
    stations: publicStations(),
    maxPoints: MAX_POINTS,
    pointsPerCorrect: POINTS_PER_CORRECT,
    themeLabels: THEME_LABEL,
    stationCount: STATIONS.length,
  });
});

// Registrace nového účastníka → přidělí kód.
app.post("/api/register", (req, res) => {
  const nickname = (req.body?.nickname || "").toString().trim().slice(0, 40) || null;
  const code = makeUniqueCode();
  store.createParticipant(code, nickname);
  res.json({ code, nickname });
});

// Stav / postup účastníka (pro obnovení po zavření prohlížeče).
app.get("/api/me/:code", (req, res) => {
  const code = req.params.code.toString().trim().toUpperCase();
  const summary = store.participantSummary(code);
  if (!summary) return res.status(404).json({ error: "Neznámý kód." });
  // obohatíme odpovědi o správný index a vysvětlení (dopočítá server)
  const answers = summary.answers.map((a) => {
    const g = grade(a.station_id, a.q_index, a.chosen);
    return {
      station: a.station_id, q: a.q_index, chosen: a.chosen,
      correct: !!a.correct, correctIndex: g?.correctIndex, points: a.points, expl: g?.expl,
    };
  });
  res.json({
    code: summary.code, nickname: summary.nickname,
    points: summary.points, stationsDone: summary.stationsDone,
    finished: !!summary.finished_at, answers,
  });
});

// Odeslání odpovědi → server vyhodnotí a uloží.
app.post("/api/answer", (req, res) => {
  const p = requireParticipant(req, res);
  if (!p) return;
  const stationId = (req.body?.station || "").toString();
  const qIndex = Number(req.body?.q);
  const chosen = Number(req.body?.chosen);
  const g = grade(stationId, qIndex, chosen);
  if (!g) return res.status(400).json({ error: "Neplatné stanoviště nebo otázka." });

  const { firstTime, stored } = store.recordAnswer(
    p.code, stationId, qIndex, chosen, g.correct, g.points
  );
  const summary = store.participantSummary(p.code);
  res.json({
    // Body se počítají jen z PRVNÍ odpovědi (firstTime). Při opakování vrací uložený stav.
    scored: firstTime,
    correct: !!stored.correct,
    correctIndex: g.correctIndex,
    points: stored.points,
    expl: g.expl,
    totalPoints: summary.points,
    stationsDone: summary.stationsDone,
  });
});

// Dokončení trasy → uzavře a vrátí finální skóre + pořadí.
app.post("/api/finish", (req, res) => {
  const p = requireParticipant(req, res);
  if (!p) return;
  store.finishParticipant(p.code);
  const summary = store.participantSummary(p.code);
  const { rank, total } = store.rankOf(p.code);
  res.json({
    points: summary.points, stationsDone: summary.stationsDone,
    correct: summary.correct, maxPoints: MAX_POINTS, rank, totalPlayers: total,
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

// Veřejný žebříček (TOP 20) – jen kód/přezdívka a body.
app.get("/api/leaderboard", (_req, res) => {
  const board = store.leaderboard().slice(0, 20).map((r, i) => ({
    rank: i + 1,
    name: r.nickname || r.code,
    points: r.points,
    stations: r.stations,
  }));
  res.json({ board, stats: store.stats() });
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

// Kompletní žebříček pro organizátory.
app.get("/api/admin/leaderboard", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json({ board: store.leaderboard(), stats: store.stats(), maxPoints: MAX_POINTS });
});

// Export všech výsledků do CSV (otevře se v Excelu).
app.get("/api/admin/export.csv", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const rows = store.leaderboard();
  const head = ["poradi", "kod", "prezdivka", "body", "stanovist", "spravnych_odpovedi", "start", "dokonceno"];
  const csv = [head.join(";")];
  rows.forEach((r, i) => {
    csv.push([
      i + 1, r.code, (r.nickname || "").replace(/;/g, ","),
      r.points, r.stations, r.correct_answers, r.created_at, r.finished_at || "",
    ].join(";"));
  });
  // BOM kvůli české diakritice v Excelu
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="dod-vysledky.csv"');
  res.send("﻿" + csv.join("\n"));
});

// Admin stránka (žebříček na projektor). Token se zadává v ní.
app.get("/admin", (_req, res) => {
  res.sendFile(join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`DOD Trasa běží na http://localhost:${PORT}`);
  console.log(`Admin přehled: http://localhost:${PORT}/admin  (token: ${ADMIN_TOKEN})`);
});

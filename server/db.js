// ---------------------------------------------------------------------------
//  Datová vrstva nad vestavěnou SQLite (Node 22+). Žádné nativní závislosti.
//  Ukládají se jen „fakta": kdo hraje, která stanoviště odemkl a co zvolil.
//  Peníze a typ hráče se z toho počítají v game.js.
// ---------------------------------------------------------------------------
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Výchozí databáze leží v data/ ve složce projektu (o úroveň výš než server/).
const DB_PATH = process.env.DB_PATH || join(dirname(fileURLToPath(import.meta.url)), "..", "data", "dod.sqlite");
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
// Na Azure (proměnná WEBSITE_SITE_NAME) leží databáze na síťovém disku /home,
// kde režim WAL nefunguje spolehlivě – tam se použije klasický režim DELETE.
const JOURNAL = process.env.WEBSITE_SITE_NAME ? "DELETE" : "WAL";
db.exec(`PRAGMA journal_mode = ${JOURNAL};`);
db.exec("PRAGMA busy_timeout = 5000;"); // když je DB zrovna zamčená, počkat místo chyby

db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    code         TEXT PRIMARY KEY,
    nickname     TEXT,
    created_at   TEXT NOT NULL,
    finished_at  TEXT
  );
  -- Odemčená stanoviště. kind = 'arrive' (QR na místě) nebo 'task' (QR od obsluhy).
  CREATE TABLE IF NOT EXISTS unlocks (
    code        TEXT NOT NULL,
    station_id  TEXT NOT NULL,
    kind        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    PRIMARY KEY (code, station_id, kind)
  );
  -- Volby hráče. Na každém stanovišti platí jen PRVNÍ volba (pojistka proti
  -- opakování). success = výsledek podnikání (1/0), u ostatních NULL.
  CREATE TABLE IF NOT EXISTS choices (
    code        TEXT NOT NULL,
    station_id  TEXT NOT NULL,
    choice      INTEGER NOT NULL,
    success     INTEGER,
    created_at  TEXT NOT NULL,
    PRIMARY KEY (code, station_id)
  );
  CREATE TABLE IF NOT EXISTS feedback (
    code        TEXT PRIMARY KEY,
    rating      INTEGER,
    recommend   TEXT,
    best        TEXT,
    improve     TEXT,
    created_at  TEXT NOT NULL
  );
`);

const nowIso = () => new Date().toISOString();

// ---- Účastníci -------------------------------------------------------------
const stmtInsertParticipant = db.prepare(
  "INSERT INTO participants (code, nickname, created_at) VALUES (?, ?, ?)"
);
const stmtGetParticipant = db.prepare("SELECT * FROM participants WHERE code = ?");
const stmtAllParticipants = db.prepare("SELECT * FROM participants ORDER BY created_at");
const stmtFinish = db.prepare(
  "UPDATE participants SET finished_at = COALESCE(finished_at, ?) WHERE code = ?"
);

export function createParticipant(code, nickname = null) {
  stmtInsertParticipant.run(code, nickname, nowIso());
  return getParticipant(code);
}
export function getParticipant(code) {
  return stmtGetParticipant.get(code) || null;
}
export function allParticipants() {
  return stmtAllParticipants.all();
}
export function finishParticipant(code) {
  stmtFinish.run(nowIso(), code);
}

// ---- Odemčení stanovišť ----------------------------------------------------
const stmtInsertUnlock = db.prepare(
  "INSERT OR IGNORE INTO unlocks (code, station_id, kind, created_at) VALUES (?, ?, ?, ?)"
);
const stmtGetUnlocks = db.prepare("SELECT station_id, kind FROM unlocks WHERE code = ?");

export function addUnlock(code, stationId, kind) {
  stmtInsertUnlock.run(code, stationId, kind, nowIso());
}
// Vrací Set ve tvaru "s3:arrive", "s5:task" …
export function getUnlocks(code) {
  return new Set(stmtGetUnlocks.all(code).map((r) => `${r.station_id}:${r.kind}`));
}

// ---- Volby -----------------------------------------------------------------
const stmtInsertChoice = db.prepare(`
  INSERT OR IGNORE INTO choices (code, station_id, choice, success, created_at)
  VALUES (?, ?, ?, ?, ?)
`);
const stmtGetChoices = db.prepare("SELECT station_id, choice, success FROM choices WHERE code = ?");

// Vrací true, pokud se volba uložila poprvé.
export function addChoice(code, stationId, choice, success) {
  const s = success == null ? null : success ? 1 : 0;
  return stmtInsertChoice.run(code, stationId, choice, s, nowIso()).changes > 0;
}
// Vrací { s1: { choice, success }, … }
export function getChoices(code) {
  const out = {};
  for (const r of stmtGetChoices.all(code)) {
    out[r.station_id] = { choice: r.choice, success: r.success == null ? null : !!r.success };
  }
  return out;
}

// ---- Zpětná vazba ----------------------------------------------------------
const stmtUpsertFeedback = db.prepare(`
  INSERT INTO feedback (code, rating, recommend, best, improve, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(code) DO UPDATE SET
    rating=excluded.rating, recommend=excluded.recommend,
    best=excluded.best, improve=excluded.improve, created_at=excluded.created_at
`);
export function saveFeedback(code, { rating, recommend, best, improve }) {
  stmtUpsertFeedback.run(code, rating ?? null, recommend ?? null, best ?? null, improve ?? null, nowIso());
}

export default db;

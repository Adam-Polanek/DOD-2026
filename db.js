// ---------------------------------------------------------------------------
//  Datová vrstva nad vestavěnou SQLite (Node 22+). Žádné nativní závislosti.
//  Vše je schované tady, takže jde databázi v budoucnu vyměnit beze změn v API.
// ---------------------------------------------------------------------------
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH || "./data/dod.sqlite";
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    code         TEXT PRIMARY KEY,
    nickname     TEXT,
    created_at   TEXT NOT NULL,
    finished_at  TEXT
  );
  CREATE TABLE IF NOT EXISTS answers (
    code        TEXT NOT NULL,
    station_id  TEXT NOT NULL,
    q_index     INTEGER NOT NULL,
    chosen      INTEGER NOT NULL,
    correct     INTEGER NOT NULL,
    points      INTEGER NOT NULL,
    created_at  TEXT NOT NULL,
    PRIMARY KEY (code, station_id, q_index)   -- pojistka proti dvojímu bodování
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
const stmtFinish = db.prepare("UPDATE participants SET finished_at = ? WHERE code = ?");

export function createParticipant(code, nickname = null) {
  stmtInsertParticipant.run(code, nickname, nowIso());
  return getParticipant(code);
}
export function getParticipant(code) {
  return stmtGetParticipant.get(code) || null;
}
export function finishParticipant(code) {
  stmtFinish.run(nowIso(), code);
}

// ---- Odpovědi --------------------------------------------------------------
// INSERT OR IGNORE + kontrola changes(): první odpověď na danou otázku se
// zaznamená a boduje, opakované pokusy se ignorují (nejde farmit body).
const stmtInsertAnswer = db.prepare(`
  INSERT OR IGNORE INTO answers (code, station_id, q_index, chosen, correct, points, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const stmtGetAnswers = db.prepare("SELECT * FROM answers WHERE code = ?");
const stmtGetAnswer = db.prepare(
  "SELECT * FROM answers WHERE code = ? AND station_id = ? AND q_index = ?"
);

export function recordAnswer(code, stationId, qIndex, chosen, correct, points) {
  const res = stmtInsertAnswer.run(
    code, stationId, qIndex, chosen, correct ? 1 : 0, points, nowIso()
  );
  const firstTime = res.changes > 0;
  const stored = stmtGetAnswer.get(code, stationId, qIndex);
  return { firstTime, stored };
}
export function getAnswers(code) {
  return stmtGetAnswers.all(code);
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
export function getFeedback(code) {
  return db.prepare("SELECT * FROM feedback WHERE code = ?").get(code) || null;
}

// ---- Souhrny / žebříček ----------------------------------------------------
// Skóre a počet splněných stanovišť pro každého účastníka.
const stmtLeaderboard = db.prepare(`
  SELECT p.code, p.nickname, p.created_at, p.finished_at,
         COALESCE(SUM(a.points), 0)                              AS points,
         COUNT(DISTINCT CASE WHEN a.correct >= 0 THEN a.station_id END) AS stations,
         COALESCE(SUM(a.correct), 0)                             AS correct_answers,
         COUNT(a.q_index)                                        AS answered
  FROM participants p
  LEFT JOIN answers a ON a.code = p.code
  GROUP BY p.code
  ORDER BY points DESC, p.finished_at ASC, p.created_at ASC
`);
export function leaderboard() {
  return stmtLeaderboard.all();
}

// Souhrn jednoho účastníka (pro obnovení postupu i finální skóre).
export function participantSummary(code) {
  const p = getParticipant(code);
  if (!p) return null;
  const answers = getAnswers(code);
  const points = answers.reduce((s, a) => s + a.points, 0);
  const stationsDone = new Set(answers.map((a) => a.station_id)).size;
  const correct = answers.reduce((s, a) => s + a.correct, 0);
  return { ...p, points, stationsDone, correct, answers };
}

// Pořadí konkrétního účastníka v žebříčku (1 = první).
export function rankOf(code) {
  const board = leaderboard();
  const idx = board.findIndex((r) => r.code === code);
  return { rank: idx < 0 ? null : idx + 1, total: board.length };
}

export function stats() {
  const total = db.prepare("SELECT COUNT(*) n FROM participants").get().n;
  const finished = db.prepare("SELECT COUNT(*) n FROM participants WHERE finished_at IS NOT NULL").get().n;
  return { total, finished };
}

export default db;

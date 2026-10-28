// Tvary odpovědí API ze server/server.js a server/game.js.
// Body, Kč a pořadí počítá server – frontend je jen zobrazuje.

export type MetricKey = "f" | "v" | "p";
export const METRIC_KEYS: MetricKey[] = ["f", "v", "p"];

export type Metrics = Record<MetricKey, number>;
export type Group = "erasmus" | "doma";

export interface MetricInfo {
  name: string;
  profile: string;
  color: string;
  text: string;
}

// GET /api/config
export interface Config {
  stations: { id: string; place: string; title: string; final: boolean }[];
  metrics: Record<MetricKey, MetricInfo>;
  startKc: number;
  routeLength: number;
  bands: { min: number; t: string }[];
}

export interface StationOption {
  t: string;
  locked: boolean;
  lockText: string | null;
}

// Stanoviště před naskenováním QR – hráč vidí jen kam má jít.
export interface StationStub {
  id: string;
  num: number;
  place: string;
  title: string;
}

// Stanoviště po naskenování QR (game.publicStation).
export interface PublicStation extends StationStub {
  final: boolean;
  task: boolean;
  taskText: string;
  story: string;
  q: string;
  opts: StationOption[];
  group: { id: Group; name: string; why: string } | null;
}

// Výsledek poslední volby (game.replay → last).
export interface Answer {
  stationId: string;
  choice: number;
  choiceText: string;
  result: string;
  fx: Metrics;
  kc: number;
  correct: boolean | null;
  quiz: boolean;
}

export interface FinalResult {
  score: number;
  kc: number;
  metrics: Metrics;
  rank: number;
  of: number;
  categories: Record<MetricKey, { value: number; rank: number }>;
  band: { t: string; d: string };
  profile: { id: MetricKey; name: string; text: string };
}

// POST /api/register, GET /api/me/:code, POST /api/unlock, POST /api/answer
export interface Progress {
  code: string;
  current: number;
  stationId: string;
  arrived: boolean;
  taskDone: boolean;
  finished: boolean;
  metrics: Metrics;
  kc: number;
  group: Group | null;
  route: { id: string; place: string }[];
  station: StationStub | PublicStation;
  result: FinalResult | null;
  notice?: string;
  answer?: Answer | null;
}

// GET /api/leaderboard
export interface LeaderRow {
  rank: number;
  name: string;
  score: number;
  kc: number;
  metrics: Metrics;
  profile: string;
}

export interface Leaderboard {
  board: LeaderRow[];
  categories: Record<MetricKey, LeaderRow[]>;
  stats: { total: number; finished: number };
}

// GET /api/admin/leaderboard
export interface AdminRow {
  code: string;
  nickname: string | null;
  created_at: string;
  finished_at: string | null;
  stationsDone: number;
  group: Group | null;
  metrics: Metrics;
  kc: number;
  score: number;
  profile: MetricKey;
  profileName: string;
}

export interface AdminBoard {
  board: AdminRow[];
  stations: Config["stations"];
  defaultSecrets: { admin: boolean; qr: boolean };
  stats: { total: number; finished: number };
}

// GET /api/admin/qr
export interface QrCodes {
  base: string;
  defaultSecret: boolean;
  codes: { id: string; place: string; title: string; kind: "arrive" | "task"; token: string; url: string }[];
}

// Stanoviště je odemčené, když má otázku (ne jen místo a název).
export function isUnlocked(s: StationStub | PublicStation): s is PublicStation {
  return "opts" in s;
}

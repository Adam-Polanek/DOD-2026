import type { AdminBoard, Config, Leaderboard, Progress, QrCodes } from "./types";

export class ApiError extends Error {
  constructor(message: string, public status: number, public data: Record<string, unknown>) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { cache: "no-store", ...init });
  } catch {
    throw new ApiError("Nepodařilo se spojit se serverem. Zkontroluj internet a zkus to znovu.", 0, {});
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Něco se pokazilo, zkus to znovu.", res.status, data);
  return data as T;
}

const post = <T>(path: string, body: unknown, headers: Record<string, string> = {}) =>
  request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

// ---- Hráč -------------------------------------------------------------------
export const getConfig = () => request<Config>("/api/config");
export const register = (nickname: string) => post<Progress>("/api/register", { nickname });
export const getMe = (code: string) => request<Progress>("/api/me/" + encodeURIComponent(code));
export const unlock = (code: string, token: string) => post<Progress>("/api/unlock", { code, token });
export const answer = (code: string, station: string, choice: number) =>
  post<Progress>("/api/answer", { code, station, choice });
export const sendFeedback = (
  code: string,
  fb: { rating: number | null; recommend: string; best: string; improve: string },
) => post<{ ok: true }>("/api/feedback", { code, ...fb });
export const getLeaderboard = () => request<Leaderboard>("/api/leaderboard");

// ---- Admin (token jde v hlavičce) ---------------------------------------------
const adminHeaders = (token: string) => ({ "X-Admin-Token": token });
export const adminBoard = (token: string) =>
  request<AdminBoard>("/api/admin/leaderboard", { headers: adminHeaders(token) });
export const adminQr = (token: string) => request<QrCodes>("/api/admin/qr", { headers: adminHeaders(token) });
export const adminReset = (token: string) =>
  post<{ ok: true; deleted: number; backup: string }>("/api/admin/reset", { confirm: "SMAZAT" }, adminHeaders(token));
export const adminExportUrl = (token: string) => "/api/admin/export.csv?token=" + encodeURIComponent(token);

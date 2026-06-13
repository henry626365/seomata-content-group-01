// Server-side session + cookie helpers for Google Sign-In.
//
// Sessions are opaque random tokens stored in D1 (sessions table). The browser
// only holds the token in an HttpOnly cookie; we look it up server-side on every
// request. No JWT / signing secret needed — the token itself is the bearer.

import type { Env } from "../env.d";
import { randomHex } from "./signing";

export const SESSION_COOKIE = "kc_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface User {
  id: string;
  email: string;
  email_lower: string;
  name: string | null;
  picture: string | null;
  google_sub: string | null;
  role: string; // 'user' | 'admin'
  created_at: number;
  last_login_at: number | null;
}

// ── Cookie parsing / serialization ──────────────────────────────────────────

export function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get("cookie") || "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export interface CookieOpts {
  maxAgeSec?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export function serializeCookie(name: string, value: string, opts: CookieOpts = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || "/"}`);
  if (opts.maxAgeSec !== undefined) parts.push(`Max-Age=${Math.floor(opts.maxAgeSec)}`);
  if (opts.httpOnly !== false) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  parts.push(`SameSite=${opts.sameSite || "Lax"}`);
  return parts.join("; ");
}

/** True for https requests; used to decide whether to set the Secure cookie flag. */
export function isHttps(request: Request): boolean {
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

// ── Session CRUD ────────────────────────────────────────────────────────────

export async function createSession(
  env: Env,
  userId: string,
  meta: { ip?: string; ua?: string } = {},
): Promise<{ id: string; expiresAt: number }> {
  const id = randomHex(32); // 64 hex chars
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, created_at, expires_at, ip, ua) VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, userId, now, expiresAt, meta.ip || null, meta.ua || null)
    .run();
  return { id, expiresAt };
}

export async function destroySession(env: Env, sessionId: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(sessionId).run();
}

/** Resolve the current user from the session cookie, or null if unauthenticated/expired. */
export async function getSessionUser(request: Request, env: Env): Promise<User | null> {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;

  const sess = await env.DB.prepare(
    `SELECT user_id, expires_at FROM sessions WHERE id = ?`,
  )
    .bind(token)
    .first<{ user_id: string; expires_at: number }>();
  if (!sess) return null;

  if (sess.expires_at < Date.now()) {
    await destroySession(env, token).catch(() => {});
    return null;
  }

  const user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(sess.user_id)
    .first<User>();
  return user || null;
}

/** Header set that clears the session cookie. */
export function clearSessionCookie(request: Request): string {
  return serializeCookie(SESSION_COOKIE, "", {
    maxAgeSec: 0,
    httpOnly: true,
    secure: isHttps(request),
    sameSite: "Lax",
  });
}

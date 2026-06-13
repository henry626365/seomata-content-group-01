// User upsert + role resolution for Google Sign-In.

import type { Env } from "../env.d";
import type { User } from "./session";
import type { GoogleUserInfo } from "./oauth-google";
import { randomHex } from "./signing";

/** Emails listed in ADMIN_EMAILS (comma/space separated) get role='admin'. */
export function isAdminEmail(env: Env, email: string): boolean {
  const list = (env.ADMIN_EMAILS || "")
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

/**
 * Insert or update a user from verified Google profile data.
 * Role is recomputed on every login from ADMIN_EMAILS so promoting/demoting an
 * admin only requires editing the env var (no DB surgery).
 */
export async function upsertUserFromGoogle(env: Env, info: GoogleUserInfo): Promise<User> {
  const email = (info.email || "").trim();
  if (!email) throw new Error("google account has no email");
  const emailLower = email.toLowerCase();
  const role = isAdminEmail(env, emailLower) ? "admin" : "user";
  const now = Date.now();

  const existing = await env.DB.prepare(`SELECT * FROM users WHERE email_lower = ?`)
    .bind(emailLower)
    .first<User>();

  if (existing) {
    await env.DB.prepare(
      `UPDATE users SET name = ?, picture = ?, google_sub = ?, role = ?, last_login_at = ?, email = ?
       WHERE id = ?`,
    )
      .bind(info.name || null, info.picture || null, info.sub || existing.google_sub, role, now, email, existing.id)
      .run();
    return { ...existing, name: info.name || null, picture: info.picture || null, google_sub: info.sub || existing.google_sub, role, last_login_at: now, email };
  }

  const id = "usr_" + randomHex(12);
  await env.DB.prepare(
    `INSERT INTO users (id, email, email_lower, name, picture, google_sub, role, created_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, email, emailLower, info.name || null, info.picture || null, info.sub || null, role, now, now)
    .run();

  return {
    id,
    email,
    email_lower: emailLower,
    name: info.name || null,
    picture: info.picture || null,
    google_sub: info.sub || null,
    role,
    created_at: now,
    last_login_at: now,
  };
}

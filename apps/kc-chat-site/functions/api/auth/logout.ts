// POST /api/auth/logout
// Destroys the current session and clears the cookie.

import type { Env } from "../../env.d";
import { json } from "../../lib/http";
import { parseCookies, destroySession, clearSessionCookie, SESSION_COOKIE } from "../../lib/session";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (token) await destroySession(env, token).catch(() => {});
  return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(request) } });
};

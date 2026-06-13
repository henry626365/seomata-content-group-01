// Bearer-token auth for /api/admin/*.

import type { Env } from "../env.d";
import { err } from "./http";

/** Constant-time string compare. */
function eqCt(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function requireAdmin(request: Request, env: Env): Response | null {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 16) {
    return err("admin_unconfigured", "ADMIN_TOKEN not set on server", 500);
  }
  const auth = request.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(\S+)/i);
  if (!m) return err("missing_bearer", "Authorization: Bearer <token> required", 401);
  if (!eqCt(m[1], env.ADMIN_TOKEN)) return err("bad_token", "Invalid admin token", 403);
  return null;
}

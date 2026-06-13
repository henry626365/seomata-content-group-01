// Admin auth for /api/admin/*.
//
// Two accepted credentials (either is sufficient):
//   1. Authorization: Bearer <ADMIN_TOKEN>      — the original shared token
//   2. A Google session cookie whose user has role='admin' (ADMIN_EMAILS whitelist)

import type { Env } from "../env.d";
import { err } from "./http";
import { getSessionUser } from "./session";

/** Constant-time string compare. */
function eqCt(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Returns null when authorized, or an error Response to short-circuit the handler. */
export async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  // 1) Shared bearer token (back-compat).
  const auth = request.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(\S+)/i);
  if (m) {
    if (env.ADMIN_TOKEN && env.ADMIN_TOKEN.length >= 16 && eqCt(m[1], env.ADMIN_TOKEN)) {
      return null;
    }
    return err("bad_token", "Invalid admin token", 403);
  }

  // 2) Google admin session.
  const user = await getSessionUser(request, env);
  if (user && user.role === "admin") return null;
  if (user) return err("forbidden", "admin role required", 403);

  return err("missing_auth", "Admin token (Bearer) or admin Google session required", 401);
}

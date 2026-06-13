// GET /api/auth/me
// Returns the current logged-in user (from the session cookie), or { user: null }.

import type { Env } from "../../env.d";
import { ok } from "../../lib/http";
import { getSessionUser } from "../../lib/session";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getSessionUser(request, env);
  if (!user) return ok({ user: null });
  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
    },
  });
};

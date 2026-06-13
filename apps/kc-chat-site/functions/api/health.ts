// GET /api/health — liveness probe.
// Also used by the *patched* extension's heartbeat. Always returns 200.

import type { Env } from "../env.d";
import { ok } from "../lib/http";

export const onRequest: PagesFunction<Env> = async () =>
  ok({ time: Date.now(), service: "kcchat-site", version: "mvp-1" });

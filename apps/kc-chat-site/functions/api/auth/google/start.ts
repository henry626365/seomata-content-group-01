// GET /api/auth/google/start?redirect=/account
// Kicks off the Google OAuth flow: sets short-lived state + PKCE-verifier + post-login
// redirect cookies, then 302s the browser to Google's consent screen.

import type { Env } from "../../../env.d";
import { err } from "../../../lib/http";
import { serializeCookie, isHttps } from "../../../lib/session";
import { randomHex } from "../../../lib/signing";
import { buildAuthUrl, buildRedirectUri, pkceChallenge } from "../../../lib/oauth-google";

const STATE_COOKIE = "kc_oauth_state";
const VERIFIER_COOKIE = "kc_oauth_verifier";
const REDIRECT_COOKIE = "kc_oauth_redirect";
const TEMP_TTL_SEC = 600; // 10 min to complete the round-trip

/** Only allow same-site relative redirect targets (no open-redirect). */
function safeRedirect(raw: string | null): string {
  if (!raw) return "/account";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  return raw;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return err("oauth_unconfigured", "Google login is not configured on the server", 500);
  }

  const url = new URL(request.url);
  const redirectTo = safeRedirect(url.searchParams.get("redirect"));

  const state = randomHex(16);
  const verifier = randomHex(32);
  const challenge = await pkceChallenge(verifier);
  const redirectUri = buildRedirectUri(request);

  const authUrl = buildAuthUrl({
    clientId: env.GOOGLE_CLIENT_ID,
    redirectUri,
    state,
    codeChallenge: challenge,
    loginHint: url.searchParams.get("login_hint") || undefined,
  });

  const secure = isHttps(request);
  const cookieOpts = { maxAgeSec: TEMP_TTL_SEC, httpOnly: true, secure, sameSite: "Lax" as const };

  const headers = new Headers({ location: authUrl });
  headers.append("set-cookie", serializeCookie(STATE_COOKIE, state, cookieOpts));
  headers.append("set-cookie", serializeCookie(VERIFIER_COOKIE, verifier, cookieOpts));
  headers.append("set-cookie", serializeCookie(REDIRECT_COOKIE, redirectTo, cookieOpts));

  return new Response(null, { status: 302, headers });
};

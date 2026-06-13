// GET /api/auth/google/callback?code=...&state=...
// Completes the OAuth round-trip: validates state, exchanges the code (PKCE),
// fetches the verified profile, upserts the user, creates a session, sets the
// HttpOnly session cookie, and redirects back to the original target.

import type { Env } from "../../../env.d";
import { parseCookies, serializeCookie, isHttps, createSession, SESSION_COOKIE, SESSION_TTL_MS } from "../../../lib/session";
import { clientIp, clientUa } from "../../../lib/http";
import { exchangeCode, fetchUserInfo, buildRedirectUri } from "../../../lib/oauth-google";
import { upsertUserFromGoogle } from "../../../lib/users";

const STATE_COOKIE = "kc_oauth_state";
const VERIFIER_COOKIE = "kc_oauth_verifier";
const REDIRECT_COOKIE = "kc_oauth_redirect";

function fail(request: Request, reason: string): Response {
  // Send the user back to /login with an error flag rather than a raw JSON error.
  const headers = new Headers({ location: `/login?error=${encodeURIComponent(reason)}` });
  for (const c of [STATE_COOKIE, VERIFIER_COOKIE, REDIRECT_COOKIE]) {
    headers.append("set-cookie", serializeCookie(c, "", { maxAgeSec: 0, httpOnly: true, secure: isHttps(request), sameSite: "Lax" }));
  }
  return new Response(null, { status: 302, headers });
}

function safeRedirect(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/account";
  return raw;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail(request, "oauth_unconfigured");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  if (oauthError) return fail(request, oauthError);
  if (!code || !state) return fail(request, "missing_code");

  const cookies = parseCookies(request);
  if (!cookies[STATE_COOKIE] || cookies[STATE_COOKIE] !== state) return fail(request, "bad_state");
  const verifier = cookies[VERIFIER_COOKIE];
  if (!verifier) return fail(request, "missing_verifier");
  const redirectTo = safeRedirect(cookies[REDIRECT_COOKIE]);

  try {
    const tokens = await exchangeCode({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      code,
      redirectUri: buildRedirectUri(request),
      codeVerifier: verifier,
    });

    const info = await fetchUserInfo(tokens.access_token);
    if (!info.email || info.email_verified === false) return fail(request, "email_unverified");

    const user = await upsertUserFromGoogle(env, info);
    const sess = await createSession(env, user.id, { ip: clientIp(request), ua: clientUa(request) });

    // Admins land in the admin backend by default (unless a specific target was requested).
    const dest = user.role === "admin" && redirectTo === "/account" ? "/admin" : redirectTo;

    const secure = isHttps(request);
    const headers = new Headers({ location: dest });
    headers.append(
      "set-cookie",
      serializeCookie(SESSION_COOKIE, sess.id, {
        maxAgeSec: Math.floor(SESSION_TTL_MS / 1000),
        httpOnly: true,
        secure,
        sameSite: "Lax",
      }),
    );
    // Clear the temporary OAuth cookies.
    for (const c of [STATE_COOKIE, VERIFIER_COOKIE, REDIRECT_COOKIE]) {
      headers.append("set-cookie", serializeCookie(c, "", { maxAgeSec: 0, httpOnly: true, secure, sameSite: "Lax" }));
    }
    return new Response(null, { status: 302, headers });
  } catch {
    return fail(request, "exchange_failed");
  }
};

import { BUYER_SESSION_COOKIE } from './constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseCookieHeader(header: string | null): Record<string, string> {
	if (!header) return {};
	const out: Record<string, string> = {};
	for (const part of header.split(';')) {
		const idx = part.indexOf('=');
		if (idx === -1) continue;
		const k = part.slice(0, idx).trim();
		const v = part.slice(idx + 1).trim();
		if (k) out[k] = decodeURIComponent(v);
	}
	return out;
}

export function readBuyerSessionId(request: Request): string | null {
	const raw = parseCookieHeader(request.headers.get('Cookie'))[BUYER_SESSION_COOKIE];
	if (!raw || !UUID_RE.test(raw)) return null;
	return raw;
}

export function serializeBuyerSessionCookie(value: string, requestUrl: string): string {
	const secure = new URL(requestUrl).protocol === 'https:';
	const parts = [`${BUYER_SESSION_COOKIE}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=31536000'];
	if (secure) parts.push('Secure');
	return parts.join('; ');
}

export function getOrCreateBuyerSession(request: Request): { id: string; setCookie: string | null } {
	const existing = readBuyerSessionId(request);
	if (existing) return { id: existing, setCookie: null };
	const id = crypto.randomUUID();
	return { id, setCookie: serializeBuyerSessionCookie(id, request.url) };
}

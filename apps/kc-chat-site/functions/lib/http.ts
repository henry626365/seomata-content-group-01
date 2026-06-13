// Tiny HTTP helpers shared across functions

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

export function ok<T>(data: T): Response {
  return json({ ok: true, ...data });
}

export function err(code: string, message: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return json({ ok: false, code, message, ...extra }, { status });
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().includes("application/json")) return null;
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}

export function clientUa(req: Request): string {
  return (req.headers.get("user-agent") || "").slice(0, 240);
}

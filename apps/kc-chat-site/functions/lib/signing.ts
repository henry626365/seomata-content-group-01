// Port of `forge-token.js` to Web Crypto API (works in CF Workers).
//
// patch_gate_token = base64url( JSON{dh, ia, ea, sig, csig} )
//
//   dh   : device hash (16-char hex) — client-supplied
//   ia   : issued-at  (unix ms)
//   ea   : expires-at (unix ms)
//   sig  : 64-char hex random "server signature" (client checks shape only, no value)
//   csig : HMAC-SHA256(installSecret_bytes, `${dh}|${ia}|${ea}`).hex
//
// installSecret is a random 32-byte hex string we generate per card on first activation
// and remember in D1 so subsequent verify/heartbeat calls can re-derive the csig.

function bytesToHex(buf: ArrayBuffer | Uint8Array): string {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of u) s += b.toString(16).padStart(2, "0");
  return s;
}

function hexToBytes(hex: string): ArrayBuffer {
  if (hex.length % 2) throw new Error("hex length must be even");
  const buf = new ArrayBuffer(hex.length / 2);
  const view = new Uint8Array(buf);
  for (let i = 0; i < view.length; i++) view[i] = parseInt(hex.substr(i * 2, 2), 16);
  return buf;
}

function bytesToB64Url(buf: Uint8Array): string {
  let bin = "";
  for (const b of buf) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomHex(byteLen: number): string {
  const u = new Uint8Array(byteLen);
  crypto.getRandomValues(u);
  return bytesToHex(u);
}

export async function hmacSha256Hex(secretHex: string, payload: string): Promise<string> {
  const keyBuf = hexToBytes(secretHex);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const payloadBuf = new TextEncoder().encode(payload).buffer.slice(0);
  const sig = await crypto.subtle.sign("HMAC", key, payloadBuf);
  return bytesToHex(sig);
}

export interface ForgedToken {
  token: string;          // base64url
  raw: {
    dh: string;
    ia: number;
    ea: number;
    sig: string;
    csig: string;
  };
}

export async function forgeToken(opts: {
  dh: string;
  installSecret: string;
  issuedAt?: number;
  expiresAt: number;
}): Promise<ForgedToken> {
  const dh = opts.dh.toLowerCase();
  if (!/^[0-9a-f]{16}$/.test(dh)) throw new Error("dh must be 16 lowercase hex chars");
  if (!/^[0-9a-f]{64}$/.test(opts.installSecret)) throw new Error("installSecret must be 64 lowercase hex chars");

  const ia = opts.issuedAt ?? Date.now();
  const ea = opts.expiresAt;
  if (!(ea > ia)) throw new Error("expiresAt must be > issuedAt");

  const sig = randomHex(32);
  const csig = await hmacSha256Hex(opts.installSecret, `${dh}|${ia}|${ea}`);

  const obj = { dh, ia, ea, sig, csig };
  const token = bytesToB64Url(new TextEncoder().encode(JSON.stringify(obj)));
  return { token, raw: obj };
}

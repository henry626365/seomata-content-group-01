// Card-key delivery email via Resend HTTP API (works in Cloudflare Workers).
// No-ops gracefully if RESEND_API_KEY is unset, so the webhook never breaks on email.

import type { Env } from "../env.d";

export interface CardEmailArgs {
  to: string;
  code: string;
  tierLabel: string;
  days: number;
  activateUrl: string;
  brand: string;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

function validityLine(days: number): string {
  if (days >= 36000) return "Valid for ~100 years from activation";
  if (days >= 365) return `Valid for ${Math.round(days / 365)} year(s) from activation`;
  return `Valid for ${days} days from activation`;
}

export async function sendCardEmail(env: Env, a: CardEmailArgs): Promise<void> {
  if (!env.RESEND_API_KEY) return; // email not configured → no-op (success page still shows the code)

  const from = env.MAIL_FROM || `${a.brand} <onboarding@resend.dev>`;
  const subject = `Your ${a.brand} card-key — ${a.code}`;
  const html = buildHtml(a);
  const text =
    `Thanks for your purchase.\n\n` +
    `Your ${a.tierLabel} card-key: ${a.code}\n` +
    `${validityLine(a.days)}\n\n` +
    `Activate: ${a.activateUrl}\n`;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to: [a.to], subject, html, text }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`resend ${resp.status}: ${t.slice(0, 200)}`);
  }
}

function buildHtml(a: CardEmailArgs): string {
  const brand = esc(a.brand);
  const code = esc(a.code);
  const tier = esc(a.tierLabel);
  const url = esc(a.activateUrl);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#0a0d13;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0d13;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0e1320;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
          <tr><td style="padding:18px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:16px;font-weight:700;color:#ffffff;">${brand}</span>
            <span style="float:right;font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#4ade80;">&gt; payment received</span>
          </td></tr>
          <tr><td style="padding:28px 24px;">
            <h1 style="margin:0 0 8px;font-size:20px;color:#ffffff;">You're all set</h1>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#9aa3b2;">
              Thanks for buying the <strong style="color:#d7dee9;">${tier} card</strong>. Here is your card-key — keep it safe.
            </p>
            <div style="font-family:ui-monospace,Menlo,monospace;font-size:22px;font-weight:700;letter-spacing:2px;color:#4ade80;background:rgba(34,197,94,0.10);border:1px dashed rgba(34,197,94,0.4);border-radius:10px;padding:18px;text-align:center;">
              ${code}
            </div>
            <p style="margin:12px 0 22px;font-size:12px;color:#79839a;text-align:center;">${esc(validityLine(a.days))}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr><td style="border-radius:10px;background:#22c55e;">
                <a href="${url}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:700;color:#06250f;text-decoration:none;">Activate now &rarr;</a>
              </td></tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#79839a;">
              Activate inside Cursor: open the KC&nbsp;Chat panel &rarr; Settings &rarr; Activation, then paste the code above. It binds to one device on first activation.
            </p>
          </td></tr>
          <tr><td style="padding:16px 24px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#5b6472;">
            ${brand} · This card-key was issued for your order. If you didn't make this purchase, reply to let us know.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

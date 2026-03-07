const PHP_MAILER_URL = process.env.PHP_MAILER_URL ?? "https://sendotp.websevix.com/send-otp.php";

// ── HTML template ────────────────────────────────────────────────────────────
export function getOTPEmailHtml(otp: string, expiryMinutes: number): string {
  const digitCells = otp
    .split("")
    .map(
      (d) =>
        `<td style="width:48px;height:56px;background:linear-gradient(145deg,#1e1e2e,#0e0e1a);border:1.5px solid rgba(99,102,241,0.45);border-radius:10px;text-align:center;font-size:26px;font-weight:700;font-family:monospace;color:#e2e8f0;">${d}</td><td style="width:6px"></td>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="440" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#6366F1 0%,#8B5CF6 55%,#06B6D4 100%);border-radius:14px 14px 0 0;padding:22px 28px;text-align:center;">
            <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">⬡ Websevix</span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:0 0 14px 14px;padding:32px 28px 28px;box-shadow:0 8px 32px rgba(0,0,0,0.25);">
            <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;">Your verification code</p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.5;">
              Use this code to sign in to Websevix. Valid for <strong>${expiryMinutes} minutes</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>${digitCells}</tr>
            </table>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
              <p style="margin:0;font-size:12.5px;color:#475569;line-height:1.55;">
                🔒 <strong>Never share this code</strong> with anyone. Websevix will never ask for it.
              </p>
            </div>
            <p style="margin:0;font-size:12px;color:#94a3b8;">Didn't request this? You can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 0;text-align:center;">
            <p style="margin:0;font-size:11.5px;color:#475569;">
              Websevix · Web Services Platform ·
              <a href="mailto:login@websevix.com" style="color:#6366F1;text-decoration:none;">login@websevix.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Send via PHP mailer endpoint ─────────────────────────────────────────────
export async function sendOTPEmail(to: string, otp: string, expiryMinutes: number): Promise<void> {
  const html    = getOTPEmailHtml(otp, expiryMinutes);
  const altText = `Your Websevix OTP is: ${otp}. Valid for ${expiryMinutes} minutes. Never share this code.`;

  const res = await fetch(PHP_MAILER_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      subject:  `🔐 Your Websevix verification code: ${otp}`,
      message:  html,
      altText,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PHP mailer error ${res.status}: ${body}`);
  }
}

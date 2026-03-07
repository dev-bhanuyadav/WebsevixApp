const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute

function getKey(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}

function cleanup(key: string): void {
  const entry = store.get(key);
  if (entry && Date.now() > entry.resetAt) {
    store.delete(key);
  }
}

/**
 * Sliding window: max N requests per window per id.
 * Returns { allowed: boolean, retryAfter?: number (seconds) }
 */
export function rateLimit(
  prefix: string,
  id: string,
  max: number,
  windowMs: number = WINDOW_MS
): { allowed: boolean; retryAfter?: number } {
  const key = getKey(prefix, id);
  cleanup(key);
  const now = Date.now();
  let entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true };
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

/** Per-email OTP send: e.g. max 5 per hour */
export function otpSendLimit(email: string): { allowed: boolean; retryAfter?: number } {
  return rateLimit("otp:send", email.toLowerCase(), 5, 60 * 60 * 1000);
}

/** Per-IP check-email: max 20 per minute */
export function checkEmailLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  return rateLimit("check-email", ip, 20);
}

/** Resend OTP: same email, min 60 seconds between sends */
export function otpResendCooldown(email: string): { allowed: boolean; retryAfter?: number } {
  const key = getKey("otp:resend", email.toLowerCase());
  const entry = store.get(key);
  const now = Date.now();
  const cooldownMs = 60 * 1000;
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + cooldownMs });
    return { allowed: true };
  }
  if (now < entry.resetAt) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.resetAt = now + cooldownMs;
  entry.count = 1;
  store.set(key, entry);
  return { allowed: true };
}

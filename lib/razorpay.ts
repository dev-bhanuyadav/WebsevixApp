import Razorpay from "razorpay";
import crypto from "crypto";

/** Razorpay throws plain objects like { statusCode, error: { description, code } } */
export function razorpayErrMsg(e: unknown): string {
  if (!e) return "Unknown error";
  if (e instanceof Error) return e.message;
  // Razorpay SDK error shape
  if (typeof e === "object") {
    const obj = e as Record<string, unknown>;
    // { error: { description, code } }
    if (obj.error && typeof obj.error === "object") {
      const inner = obj.error as Record<string, unknown>;
      if (inner.description) return String(inner.description);
      if (inner.code)        return String(inner.code);
    }
    // { message } or { description }
    if (obj.message)     return String(obj.message);
    if (obj.description) return String(obj.description);
  }
  try { return JSON.stringify(e); } catch { return String(e); }
}

export function getRazorpay(): Razorpay {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay keys missing in environment");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function verifyPaymentSignature(params: {
  orderId:   string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET missing");
  const body     = `${params.orderId}|${params.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === params.signature;
}

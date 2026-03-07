export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { getRazorpay, razorpayErrMsg } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Please log in to continue." }, 401);
    await verifyAccessToken(auth);

    const body         = await request.json().catch(() => ({}));
    const amountRupees = Number(body.amount) || 1;
    const currency     = body.currency ?? "INR";
    const amountPaise  = Math.round(amountRupees * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) return jsonResponse({ error: "Payment gateway not configured on server." }, 500);

    const rz    = getRazorpay();
    const order = await rz.orders.create({
      amount:   amountPaise,
      currency,
      receipt:  `ws_${Date.now()}`,  // max 40 chars — this is fine
    });

    return jsonResponse({
      success: true,
      order:   { id: order.id, amount: order.amount, currency: order.currency },
      keyId,
    });

  } catch (e) {
    const msg = razorpayErrMsg(e);
    console.error("[payment/create]", msg, e);
    if (msg.includes("jwt") || msg.includes("Unauthorized")) return jsonResponse({ error: "Session expired. Please log in again." }, 401);
    if (msg.includes("keys missing"))                        return jsonResponse({ error: "Payment gateway not configured. Contact support." }, 500);
    return jsonResponse({ error: `Payment failed: ${msg}` }, 500);
  }
}

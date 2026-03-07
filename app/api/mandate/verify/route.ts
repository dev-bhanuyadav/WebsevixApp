export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { Mandate } from "@/models/Mandate";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    const body = await request.json() as {
      razorpay_payment_id:       string;
      razorpay_subscription_id?: string;   // subscription flow
      razorpay_order_id?:        string;   // one-time fallback
      razorpay_signature:        string;
    };

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_order_id, razorpay_signature } = body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";

    // Verify signature — formula differs for subscriptions vs regular orders
    if (keySecret) {
      const sigInput = razorpay_subscription_id
        ? `${razorpay_payment_id}|${razorpay_subscription_id}`
        : `${razorpay_order_id}|${razorpay_payment_id}`;

      const generated = crypto
        .createHmac("sha256", keySecret)
        .update(sigInput)
        .digest("hex");

      if (generated !== razorpay_signature) {
        return jsonResponse({ error: "Payment verification failed" }, 400);
      }
    }

    await connectDB();

    // Update existing mandate record or create new one
    const existing = await Mandate.findOne({ clientId: payload.userId });

    if (existing) {
      existing.status            = "authenticated";
      existing.razorpayMandateId = razorpay_payment_id;
      existing.subscriptionId    = razorpay_subscription_id ?? existing.subscriptionId ?? razorpay_order_id;
      existing.activatedAt       = new Date();
      await existing.save();
      return jsonResponse({ success: true, mandate: existing });
    }

    const mandate = await Mandate.create({
      clientId:          payload.userId,
      razorpayMandateId: razorpay_payment_id,
      subscriptionId:    razorpay_subscription_id ?? razorpay_order_id ?? "",
      maxAmount:         15000,
      status:            "authenticated",
      mandateNumber:     1,
      activatedAt:       new Date(),
    });

    return jsonResponse({ success: true, mandate });
  } catch (e) {
    console.error("[mandate/verify]", e);
    return jsonResponse({ error: "Verification failed" }, 500);
  }
}

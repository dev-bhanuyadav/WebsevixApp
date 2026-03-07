export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    await verifyAccessToken(auth);

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, _mock } = body;

    // Skip signature verification in mock/dev mode
    if (!_mock) {
      const { verifyPaymentSignature } = await import("@/lib/razorpay");
      const valid = verifyPaymentSignature({
        orderId:   razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });
      if (!valid) return jsonResponse({ error: "Invalid payment signature" }, 400);
    }

    if (orderId) {
      await connectDB();
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        paymentId:     razorpay_payment_id ?? `mock_${Date.now()}`,
      });
    }

    return jsonResponse({ success: true, paymentId: razorpay_payment_id ?? `mock_${Date.now()}` });
  } catch (e) {
    console.error("[payment/verify]", e);
    return jsonResponse({ error: "Payment verification failed" }, 500);
  }
}

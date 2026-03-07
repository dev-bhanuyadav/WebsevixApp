export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { PaymentRequest } from "@/models/PaymentRequest";
import { Message } from "@/models/Message";

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    const body = await request.json() as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      _mock?: boolean;
    };

    await connectDB();

    const pr = await PaymentRequest.findOne({
      _id: params.requestId,
      clientId: payload.userId,
      status: "pending",
    });
    if (!pr) return jsonResponse({ error: "Payment request not found" }, 404);

    // Verify signature (skip for mock)
    if (!body._mock) {
      const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
        .digest("hex");
      if (expectedSig !== body.razorpay_signature) {
        return jsonResponse({ error: "Payment verification failed" }, 400);
      }
    }

    // Mark payment request as paid
    pr.status             = "paid";
    pr.razorpayPaymentId  = body.razorpay_payment_id;
    pr.paidAt             = new Date();
    await pr.save();

    // Update the payment_request message status to "paid"
    await Message.updateOne(
      { paymentRequestId: pr._id },
      { $set: { paymentStatus: "paid" } },
    );

    return jsonResponse({ success: true });
  } catch (e) {
    console.error("[payment-request verify]", e);
    return jsonResponse({ error: "Verification failed" }, 500);
  }
}

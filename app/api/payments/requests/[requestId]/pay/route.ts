export const dynamic = 'force-dynamic';
/**
 * POST /api/payments/requests/[requestId]/pay
 * Step 1 — create Razorpay order for a payment request
 *
 * POST /api/payments/requests/[requestId]/verify
 * Step 2 — verify Razorpay payment and mark request as paid
 */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { PaymentRequest } from "@/models/PaymentRequest";
import { Message } from "@/models/Message";
import mongoose from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } },
) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    await connectDB();

    const pr = await PaymentRequest.findOne({
      _id: params.requestId,
      clientId: payload.userId,
      status: "pending",
    });
    if (!pr) return jsonResponse({ error: "Payment request not found or already paid" }, 404);

    // Create Razorpay order
    try {
      const Razorpay = (await import("razorpay")).default;
      const rzp = new Razorpay({
        key_id:     process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });
      const order = await rzp.orders.create({
        amount:   pr.amount * 100, // paise
        currency: "INR",
        receipt:  `pr_${pr._id.toString().slice(-8)}`,
        notes: {
          paymentRequestId: pr._id.toString(),
          type:             pr.type,
          description:      pr.description ?? "",
        },
      });
      pr.razorpayOrderId = order.id;
      await pr.save();
      return jsonResponse({ success: true, order });
    } catch {
      // Mock mode — no Razorpay keys configured
      const mockId = `order_mock_${Date.now()}`;
      pr.razorpayOrderId = mockId;
      await pr.save();
      return jsonResponse({
        success: true,
        order: { id: mockId, amount: pr.amount * 100, currency: "INR", _mock: true },
      });
    }
  } catch (e) {
    console.error("[payment-request pay]", e);
    return jsonResponse({ error: "Failed to initiate payment" }, 500);
  }
}

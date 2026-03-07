export const dynamic = 'force-dynamic'
/**
 * GET /api/payments/requests?orderId=xxx
 * Client fetches pending payment requests for their order.
 */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { PaymentRequest } from "@/models/PaymentRequest";
import { Order } from "@/models/Order";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    const orderId = request.nextUrl.searchParams.get("orderId");
    if (!orderId) return jsonResponse({ error: "orderId required" }, 400);

    await connectDB();

    // Resolve orderId string to MongoDB _id
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && orderId.length === 24;
    const orderQuery = isObjectId
      ? { $or: [{ _id: orderId }, { orderId }], clientId: payload.userId }
      : { orderId, clientId: payload.userId };

    const order = await Order.findOne(orderQuery).lean();
    if (!order) return jsonResponse({ error: "Order not found" }, 404);

    const requests = await PaymentRequest.find({
      orderId: order._id,
      clientId: payload.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return jsonResponse({ requests });
  } catch (e) {
    console.error("[payment-requests GET]", e);
    return jsonResponse({ error: "Failed to fetch payment requests" }, 500);
  }
}

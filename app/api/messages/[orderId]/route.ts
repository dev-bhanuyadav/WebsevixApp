export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { jsonResponse } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { Message } from "@/models/Message";
import { Order } from "@/models/Order";
import { verifyAccessToken } from "@/lib/jwt";

/** Find an order by its string orderId (e.g. "WS-1001") or MongoDB ObjectId.
 *  Admins can access any order; clients can only access their own. */
function buildOrderQuery(id: string, userId: string, isAdmin: boolean) {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;

  const idClause = isObjectId
    ? { $or: [{ _id: id }, { orderId: id }] }
    : { orderId: id };

  // Admins can read/write any order — don't restrict by clientId
  if (isAdmin) return idClause;

  // Clients can only access their own orders
  return isObjectId
    ? { $or: [{ _id: id }, { orderId: id }], clientId: userId }
    : { orderId: id, clientId: userId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } },
) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);
    const isAdmin = payload.role === "admin";

    // ?since=ISO_TIMESTAMP  → only return messages after that time (for fast polling)
    const sinceParam = request.nextUrl.searchParams.get("since");
    const sinceDate  = sinceParam ? new Date(sinceParam) : null;

    await connectDB();
    const order = await Order.findOne(
      buildOrderQuery(params.orderId, payload.userId, isAdmin),
    );
    if (!order) return jsonResponse({ error: "Order not found" }, 404);

    const query: Record<string, unknown> = { orderId: order._id };
    if (sinceDate && !isNaN(sinceDate.getTime())) {
      query.createdAt = { $gt: sinceDate };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .lean();

    return jsonResponse({ messages });
  } catch (e) {
    console.error("[messages GET]", e);
    return jsonResponse({ error: "Failed to fetch messages" }, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } },
) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);
    const isAdmin = payload.role === "admin";

    await connectDB();
    const order = await Order.findOne(
      buildOrderQuery(params.orderId, payload.userId, isAdmin),
    );
    if (!order) return jsonResponse({ error: "Order not found" }, 404);

    const body = await request.json();
    const { type = "text", content, file, paymentRequestId, paymentAmount, paymentType, paymentStatus } = body;
    if (!content && !file) return jsonResponse({ error: "content or file required" }, 400);

    const message = await Message.create({
      orderId:          order._id,
      senderId:         payload.userId,
      senderRole:       isAdmin ? "admin" : "client",
      type,
      content,
      file,
      ...(paymentRequestId && { paymentRequestId, paymentAmount, paymentType, paymentStatus }),
    });

    try {
      const { getPusher, orderChannel, PUSHER_EVENTS } = await import("@/lib/pusher");
      await getPusher().trigger(
        orderChannel(order.orderId),
        PUSHER_EVENTS.NEW_MESSAGE,
        { message: message.toObject() },
      );
    } catch { /* Pusher not configured — polling will pick it up */ }

    return jsonResponse({ success: true, message: message.toObject() }, 201);
  } catch (e) {
    console.error("[messages POST]", e);
    return jsonResponse({ error: "Failed to send message" }, 500);
  }
}

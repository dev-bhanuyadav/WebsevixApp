export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { jsonResponse } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { Order, toPublicOrder } from "@/models/Order";
import { verifyAccessToken } from "@/lib/jwt";

function buildOrderQuery(id: string, clientId: string) {
  // Only include _id condition when id is a valid ObjectId
  // "WS-1001" is NOT a valid ObjectId — casting it throws CastError
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;
  return isObjectId
    ? { $or: [{ _id: id }, { orderId: id }], clientId }
    : { orderId: id, clientId };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    await connectDB();

    const query = buildOrderQuery(params.id, payload.userId);
    const order = await Order.findOne(query).lean();
    if (!order) return jsonResponse({ error: "Order not found" }, 404);

    return jsonResponse({ order: toPublicOrder(order as never) });
  } catch (e) {
    console.error("[orders/:id GET]", e);
    return jsonResponse({ error: "Failed to fetch order" }, 500);
  }
}

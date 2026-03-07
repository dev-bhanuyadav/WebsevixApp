export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Order } from "@/models/Order";
import { getPusher, orderChannel, PUSHER_EVENTS } from "@/lib/pusher";
import mongoose from "mongoose";

interface RejectBody {
  reason?: string;
  refund?: boolean;
}

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id) || id.length !== 24) {
      return jsonResponse({ error: "Invalid order ID" }, 400);
    }

    const { reason, refund } = (await request.json()) as RejectBody;

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { status: "cancelled" } },
      { new: true }
    ).lean();

    if (!order) return jsonResponse({ error: "Order not found" }, 404);

    try {
      await getPusher().trigger(
        orderChannel(order.orderId),
        PUSHER_EVENTS.ORDER_STATUS,
        {
          status: "cancelled",
          message: reason ?? "Your order has been cancelled.",
          orderId: order.orderId,
        }
      );
    } catch {
      // Pusher failure is non-critical
    }

    return jsonResponse({ success: true, reason: reason ?? null, refund: refund ?? false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

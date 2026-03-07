export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Order } from "@/models/Order";
import { PaymentRequest } from "@/models/PaymentRequest";
import { getPusher, orderChannel, PUSHER_EVENTS } from "@/lib/pusher";
import mongoose from "mongoose";

interface MilestoneInput {
  title: string;
  description?: string;
  amount?: number;
  estimatedDays?: number;
}

interface AcceptBody {
  title?: string;
  totalCost?: number;
  advance?: number;
  milestones?: MilestoneInput[];
  message?: string;
}

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const payload = await verifyAdmin(request);
    await connectDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id) || id.length !== 24) {
      return jsonResponse({ error: "Invalid order ID" }, 400);
    }

    const body = (await request.json()) as AcceptBody;
    const { title, advance, milestones = [], message } = body;

    const milestoneDocs = milestones.map((m, idx) => ({
      title: m.title,
      description: m.description ?? "",
      status: "pending" as const,
      order: idx + 1,
    }));

    const updateData: Record<string, unknown> = {
      status: "in_progress",
      assignedAdmin: new mongoose.Types.ObjectId(payload.userId),
      milestones: milestoneDocs,
    };
    if (title?.trim()) updateData.title = title.trim();

    const order = await Order.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate("clientId", "firstName lastName email")
      .lean();

    if (!order) return jsonResponse({ error: "Order not found" }, 404);

    // Auto-create advance PaymentRequest if admin set an advance amount
    if (advance && advance > 0) {
      const clientId = (order.clientId as unknown as { _id: mongoose.Types.ObjectId })?._id
        ?? order.clientId as unknown as mongoose.Types.ObjectId;
      await PaymentRequest.create({
        orderId:     order._id,
        clientId:    clientId,
        amount:      advance,
        description: "Advance payment for project",
        type:        "advance",
        status:      "pending",
      });
    }

    try {
      await getPusher().trigger(
        orderChannel(order.orderId),
        PUSHER_EVENTS.ORDER_STATUS,
        {
          status: "in_progress",
          message: message ?? "Your order has been accepted and is now in progress.",
          orderId: order.orderId,
        }
      );
    } catch {
      // Pusher failure is non-critical; main response still returns success
    }

    return jsonResponse({ success: true, order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

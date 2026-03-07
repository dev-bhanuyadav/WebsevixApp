export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Order } from "@/models/Order";
import mongoose from "mongoose";

interface MilestoneBody {
  milestoneIndex: number;
  status: "pending" | "active" | "completed";
  note?: string;
}

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id) || id.length !== 24) {
      return jsonResponse({ error: "Invalid order ID" }, 400);
    }

    const body = (await request.json()) as MilestoneBody;
    const { milestoneIndex, status, note } = body;

    if (typeof milestoneIndex !== "number" || milestoneIndex < 0) {
      return jsonResponse({ error: "milestoneIndex must be a non-negative number" }, 400);
    }

    const validStatuses = ["pending", "active", "completed"];
    if (!validStatuses.includes(status)) {
      return jsonResponse({ error: `status must be one of: ${validStatuses.join(", ")}` }, 400);
    }

    const fieldUpdates: Record<string, unknown> = {
      [`milestones.${milestoneIndex}.status`]: status,
    };

    if (status === "completed") {
      fieldUpdates[`milestones.${milestoneIndex}.completedAt`] = new Date();
    }

    if (note !== undefined) {
      fieldUpdates[`milestones.${milestoneIndex}.note`] = note;
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: fieldUpdates },
      { new: true }
    ).lean();

    if (!order) return jsonResponse({ error: "Order not found" }, 404);

    return jsonResponse({ success: true, order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

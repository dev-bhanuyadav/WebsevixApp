export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Order } from "@/models/Order";
import mongoose from "mongoose";

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id) || id.length !== 24) {
      return jsonResponse({ error: "Invalid order ID" }, 400);
    }

    const order = await Order.findById(id)
      .populate("clientId", "firstName lastName email phone avatar isVerified isActive")
      .populate("assignedAdmin", "firstName lastName email")
      .lean();

    if (!order) return jsonResponse({ error: "Order not found" }, 404);

    return jsonResponse({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id) || id.length !== 24) {
      return jsonResponse({ error: "Invalid order ID" }, 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const allowedFields = ["status", "assignedAdmin", "milestones", "title", "placementFee"];
    const update: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) update[field] = body[field];
    }

    if (Object.keys(update).length === 0) {
      return jsonResponse({ error: "No valid fields provided" }, 400);
    }

    const order = await Order.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate("clientId", "firstName lastName email")
      .lean();

    if (!order) return jsonResponse({ error: "Order not found" }, 404);

    return jsonResponse({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

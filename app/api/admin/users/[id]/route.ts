export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { User } from "@/models/User";
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
      return jsonResponse({ error: "Invalid user ID" }, 400);
    }

    const oid = new mongoose.Types.ObjectId(id);

    const [user, orderCount, paidOrders] = await Promise.all([
      User.findById(oid).select("-password").lean(),
      Order.countDocuments({ clientId: oid }),
      Order.find({ clientId: oid, paymentStatus: "paid" }).select("placementFee").lean(),
    ]);

    if (!user) return jsonResponse({ error: "User not found" }, 404);

    const totalSpent = (paidOrders as { placementFee?: number }[]).reduce(
      (sum, o) => sum + (o.placementFee ?? 500),
      0
    );

    return jsonResponse({ user, orderCount, totalSpent });
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
      return jsonResponse({ error: "Invalid user ID" }, 400);
    }

    const body = (await request.json()) as { isActive?: boolean };
    if (typeof body.isActive !== "boolean") {
      return jsonResponse({ error: "isActive (boolean) is required" }, 400);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { isActive: body.isActive } },
      { new: true }
    )
      .select("-password")
      .lean();

    if (!user) return jsonResponse({ error: "User not found" }, 404);

    return jsonResponse({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

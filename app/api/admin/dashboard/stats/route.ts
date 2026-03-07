export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      pendingReview,
      inProgress,
      completed,
      totalUsers,
      newUsersToday,
      ordersThisMonth,
      newOrdersToday,
      paidOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending_review" }),
      Order.countDocuments({ status: "in_progress" }),
      Order.countDocuments({ status: "completed" }),
      User.countDocuments({ role: { $ne: "admin" } }),
      User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.find({ paymentStatus: "paid" }).select("placementFee").lean(),
    ]);

    const totalRevenue = (paidOrders as { placementFee?: number }[]).reduce(
      (sum, o) => sum + (o.placementFee ?? 500),
      0
    );

    return jsonResponse({
      totalOrders,
      pendingReview,
      inProgress,
      completed,
      totalUsers,
      newUsersToday,
      totalRevenue,
      placementFees: totalRevenue,
      ordersThisMonth,
      newOrdersToday,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

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

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30d";
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [
      ordersByDay,
      usersByDay,
      statusDist,
      typeDist,
      totalOrders,
      totalUsers,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: startDate }, role: { $ne: "admin" } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        { $match: { "aiSummary.projectType": { $exists: true, $nin: [null, ""] } } },
        { $group: { _id: "$aiSummary.projectType", count: { $sum: 1 } } },
        { $project: { type: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: { $ne: "admin" } }),
    ]);

    const avgOrdersPerDay = days > 0 ? parseFloat((totalOrders / days).toFixed(2)) : 0;

    return jsonResponse({
      ordersByDay,
      usersByDay,
      statusDist,
      typeDist,
      summary: {
        totalOrders,
        totalUsers,
        avgOrdersPerDay,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

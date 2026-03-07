export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { Message } from "@/models/Message";

interface ActivityItem {
  type: "order" | "payment" | "user" | "message";
  text: string;
  time: Date;
  orderId?: string;
}

type PopulatedClient = { firstName?: string; lastName?: string; email?: string } | null;
type PopulatedOrderRef = { orderId?: string; title?: string } | null;

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const [recentOrders, recentPayments, recentUsers, recentMessages] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("clientId", "firstName lastName")
        .lean(),
      Order.find({ paymentStatus: "paid" })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("clientId", "firstName lastName")
        .lean(),
      User.find({ role: { $ne: "admin" } })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Message.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("orderId", "orderId title")
        .lean(),
    ]);

    const activities: ActivityItem[] = [];

    for (const order of recentOrders) {
      const client = order.clientId as PopulatedClient;
      const name = client
        ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
        : "Unknown";
      activities.push({
        type: "order",
        text: `New order "${order.title}" placed by ${name}`,
        time: order.createdAt as Date,
        orderId: order.orderId,
      });
    }

    for (const order of recentPayments) {
      const client = order.clientId as PopulatedClient;
      const name = client
        ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
        : "Unknown";
      activities.push({
        type: "payment",
        text: `Payment received for "${order.title}" from ${name}`,
        time: order.updatedAt as Date,
        orderId: order.orderId,
      });
    }

    for (const user of recentUsers) {
      activities.push({
        type: "user",
        text: `New user ${user.firstName} ${user.lastName} (${user.email}) registered`,
        time: user.createdAt as Date,
      });
    }

    for (const msg of recentMessages) {
      const orderRef = msg.orderId as PopulatedOrderRef;
      const preview = (msg.content as string | undefined)?.slice(0, 60) ?? "(file)";
      activities.push({
        type: "message",
        text: `New message in order ${orderRef?.orderId ?? "unknown"}: ${preview}`,
        time: msg.createdAt as Date,
        orderId: orderRef?.orderId,
      });
    }

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return jsonResponse({ activity: activities.slice(0, 20) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

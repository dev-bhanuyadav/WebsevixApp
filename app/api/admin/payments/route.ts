export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Order } from "@/models/Order";

type PopulatedClient = {
  firstName?: string;
  lastName?: string;
  email?: string;
} | null;

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [paidOrders, pendingCount] = await Promise.all([
      Order.find({ paymentStatus: "paid" })
        .populate("clientId", "firstName lastName email")
        .sort({ updatedAt: -1 })
        .lean(),
      Order.countDocuments({ paymentStatus: "pending" }),
    ]);

    const payments = paidOrders.map((o) => {
      const client = o.clientId as PopulatedClient;
      return {
        orderId: o.orderId,
        clientName: client
          ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
          : "Unknown",
        clientEmail: client?.email ?? "",
        amount: o.placementFee ?? 500,
        status: o.paymentStatus,
        date: o.updatedAt,
        paymentId: o.paymentId ?? null,
      };
    });

    const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
    const thisMonth = payments
      .filter((p) => new Date(p.date) >= startOfMonth)
      .reduce((s, p) => s + p.amount, 0);

    return jsonResponse({
      payments,
      stats: {
        totalReceived,
        thisMonth,
        pendingCount,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

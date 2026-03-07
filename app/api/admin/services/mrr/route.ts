export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { calculateMRR } from "@/lib/billingEngine";
import { ServiceInvoice } from "@/models/ServiceInvoice";
import { ClientService } from "@/models/ClientService";
import { connectDB } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const [mrr, invoiceStats, churn] = await Promise.all([
      calculateMRR(),
      ServiceInvoice.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      ClientService.countDocuments({
        status: "cancelled",
        updatedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
    ]);

    return jsonResponse({
      mrr:         mrr.total,
      arr:         mrr.total * 12,
      byCategory:  mrr.byCategory,
      activeCount: mrr.count,
      totalRevenue: invoiceStats[0]?.total ?? 0,
      totalInvoices: invoiceStats[0]?.count ?? 0,
      churnThisMonth: churn,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 500);
  }
}

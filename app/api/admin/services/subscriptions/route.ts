export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { ClientService } from "@/models/ClientService";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    await connectDB();
    const { searchParams } = request.nextUrl;
    const status   = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

    const query: Record<string, unknown> = {};
    if (status)   query.status   = status;
    if (clientId) query.clientId = clientId;

    const [subs, total] = await Promise.all([
      ClientService.find(query)
        .populate("clientId",  "firstName lastName email")
        .populate("serviceId", "name category icon basePrice billingCycle")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ClientService.countDocuments(query),
    ]);

    return jsonResponse({ subscriptions: subs, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 500);
  }
}

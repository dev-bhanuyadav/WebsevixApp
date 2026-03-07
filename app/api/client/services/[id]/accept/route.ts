export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { ClientService } from "@/models/ClientService";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);
    await connectDB();

    const cs = await ClientService.findOne({ _id: params.id, clientId: payload.userId, status: "pending_acceptance" });
    if (!cs) return jsonResponse({ error: "Service offer not found" }, 404);

    const now = new Date();
    cs.status      = "active";
    cs.acceptedAt  = now;
    if (!cs.billingStartDate) cs.billingStartDate = now;
    if (!cs.nextBillingDate) {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      cs.nextBillingDate = next;
    }
    await cs.save();
    return jsonResponse({ success: true, status: "active" });
  } catch (e) {
    console.error("[client/services/accept]", e);
    return jsonResponse({ error: "Failed to accept service" }, 500);
  }
}

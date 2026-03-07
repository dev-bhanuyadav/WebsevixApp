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
    if (cs.isMandatory) return jsonResponse({ error: "Mandatory services cannot be rejected" }, 403);

    cs.status     = "rejected";
    cs.rejectedAt = new Date();
    await cs.save();
    return jsonResponse({ success: true, status: "rejected" });
  } catch (e) {
    return jsonResponse({ error: "Failed to reject service" }, 500);
  }
}

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

    const cs = await ClientService.findOne({ _id: params.id, clientId: payload.userId });
    if (!cs) return jsonResponse({ error: "Subscription not found" }, 404);
    if (cs.isMandatory) return jsonResponse({ error: "Mandatory services cannot be cancelled" }, 403);
    if (!["active", "paused"].includes(cs.status)) return jsonResponse({ error: "Service is not active" }, 400);

    cs.status = "cancelled";
    await cs.save();
    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ error: "Failed to cancel service" }, 500);
  }
}

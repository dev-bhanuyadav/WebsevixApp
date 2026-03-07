export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { Mandate } from "@/models/Mandate";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);
    await connectDB();

    const mandates = await Mandate.find({ clientId: payload.userId })
      .sort({ mandateNumber: 1 })
      .lean();

    const activeMandate = mandates.find(m => m.status === "active") ?? null;
    return jsonResponse({ mandates, activeMandate, hasActive: !!activeMandate });
  } catch (e) {
    return jsonResponse({ error: "Failed to fetch mandate" }, 500);
  }
}

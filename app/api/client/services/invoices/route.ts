export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { ServiceInvoice } from "@/models/ServiceInvoice";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);
    await connectDB();

    const invoices = await ServiceInvoice.find({ clientId: payload.userId })
      .sort({ createdAt: -1 })
      .lean();

    return jsonResponse({ invoices });
  } catch (e) {
    return jsonResponse({ error: "Failed to fetch invoices" }, 500);
  }
}

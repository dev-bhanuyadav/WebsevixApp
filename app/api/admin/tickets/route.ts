export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Ticket } from "@/models/Ticket";
import mongoose from "mongoose";

/** GET /api/admin/tickets — list all, filters: status, priority, category, sla */
export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return jsonResponse({ error: msg || "Unauthorized" }, msg === "Forbidden" ? 403 : 401);
  }

  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignedTo = searchParams.get("assignedTo");
    const sla = searchParams.get("sla"); // at_risk | breached

    const q: Record<string, unknown> = {};
    if (status) q.status = status;
    if (priority) q.priority = priority;
    if (category) q.category = category;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo))
      q.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    if (sla === "breached") q.isSlaBreach = true;
    if (sla === "at_risk") {
      q.isSlaBreach = false;
      q.slaDeadline = { $lte: new Date(Date.now() + 4 * 60 * 60 * 1000), $gte: new Date() };
    }

    const tickets = await Ticket.find(q)
      .sort({ isSlaBreach: -1, slaDeadline: 1, createdAt: -1 })
      .populate("clientId", "firstName lastName email")
      .populate({ path: "relatedServiceId", populate: { path: "serviceId", select: "name" } })
      .populate("relatedOrderId", "orderId title")
      .populate("assignedTo", "firstName lastName")
      .lean();

    return jsonResponse({ tickets });
  } catch (e) {
    console.error("[admin/tickets GET]", e);
    return jsonResponse({ error: "Failed to fetch tickets" }, 500);
  }
}

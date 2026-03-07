export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Ticket } from "@/models/Ticket";
import { TicketReply } from "@/models/TicketReply";
import mongoose from "mongoose";

/** GET /api/admin/tickets/[id] — full ticket + all replies (incl. internal) */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return jsonResponse({ error: msg || "Unauthorized" }, msg === "Forbidden" ? 403 : 401);
  }

  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonResponse({ error: "Invalid ticket" }, 400);

    await connectDB();

    const ticket = await Ticket.findById(id)
      .populate("clientId", "firstName lastName email")
      .populate("relatedServiceId", "serviceId")
      .populate("relatedOrderId", "orderId title")
      .populate("assignedTo", "firstName lastName")
      .lean();

    if (!ticket) return jsonResponse({ error: "Ticket not found" }, 404);

    const replies = await TicketReply.find({ ticketId: id })
      .sort({ createdAt: 1 })
      .populate("senderId", "firstName lastName")
      .lean();

    return jsonResponse({ ticket, replies });
  } catch (e) {
    console.error("[admin/tickets/[id] GET]", e);
    return jsonResponse({ error: "Failed to fetch ticket" }, 500);
  }
}

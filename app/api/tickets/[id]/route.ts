export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { Ticket } from "@/models/Ticket";
import { TicketReply } from "@/models/TicketReply";
import mongoose from "mongoose";

/** GET /api/tickets/[id] — single ticket + replies (no internal) */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonResponse({ error: "Invalid ticket" }, 400);

    await connectDB();

    const ticket = await Ticket.findOne({
      _id: id,
      clientId: payload.userId,
    })
      .populate("relatedServiceId", "serviceId")
      .populate("relatedOrderId", "orderId title")
      .populate("assignedTo", "firstName lastName")
      .lean();

    if (!ticket) return jsonResponse({ error: "Ticket not found" }, 404);

    const replies = await TicketReply.find({
      ticketId: ticket._id,
      isInternal: false,
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "firstName lastName")
      .lean();

    return jsonResponse({ ticket, replies });
  } catch (e) {
    console.error("[tickets/[id] GET]", e);
    return jsonResponse({ error: "Failed to fetch ticket" }, 500);
  }
}

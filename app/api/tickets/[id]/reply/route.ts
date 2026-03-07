export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { Ticket } from "@/models/Ticket";
import { TicketReply } from "@/models/TicketReply";
import mongoose from "mongoose";

/** POST /api/tickets/[id]/reply — client sends reply */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonResponse({ error: "Invalid ticket" }, 400);

    const body = await request.json() as {
      message: string;
      attachments?: { url: string; name: string; size: number; mimeType: string }[];
    };
    if (!body.message?.trim()) return jsonResponse({ error: "Message required" }, 400);

    await connectDB();

    const ticket = await Ticket.findOne({
      _id: id,
      clientId: payload.userId,
    });
    if (!ticket) return jsonResponse({ error: "Ticket not found" }, 404);
    if (ticket.status === "closed")
      return jsonResponse({ error: "Ticket is closed" }, 400);

    await TicketReply.create({
      ticketId: ticket._id,
      senderId: new mongoose.Types.ObjectId(payload.userId),
      senderRole: "client",
      message: body.message.trim(),
      attachments: body.attachments ?? [],
      isInternal: false,
    });

    const updated = await Ticket.findByIdAndUpdate(
      id,
      { $set: { status: "waiting_client", updatedAt: new Date() } },
      { new: true }
    ).lean();

    const replies = await TicketReply.find({ ticketId: id, isInternal: false })
      .sort({ createdAt: 1 })
      .populate("senderId", "firstName lastName")
      .lean();

    return jsonResponse({ success: true, replies, ticket: updated });
  } catch (e) {
    console.error("[tickets/[id]/reply POST]", e);
    return jsonResponse({ error: "Failed to send reply" }, 500);
  }
}

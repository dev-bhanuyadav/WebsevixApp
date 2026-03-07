export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Ticket } from "@/models/Ticket";
import { TicketReply } from "@/models/TicketReply";
import mongoose from "mongoose";

/** POST /api/admin/tickets/[id]/reply — admin reply or internal note */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let payload: { userId: string };
  try {
    payload = await verifyAdmin(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return jsonResponse({ error: msg || "Unauthorized" }, msg === "Forbidden" ? 403 : 401);
  }

  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonResponse({ error: "Invalid ticket" }, 400);

    const body = await request.json() as {
      message: string;
      isInternal?: boolean;
      attachments?: { url: string; name: string; size: number; mimeType: string }[];
    };
    if (!body.message?.trim()) return jsonResponse({ error: "Message required" }, 400);

    await connectDB();

    const ticket = await Ticket.findById(id);
    if (!ticket) return jsonResponse({ error: "Ticket not found" }, 404);

    await TicketReply.create({
      ticketId: ticket._id,
      senderId: new mongoose.Types.ObjectId(payload.userId),
      senderRole: "admin",
      message: body.message.trim(),
      attachments: body.attachments ?? [],
      isInternal: !!body.isInternal,
    });

    const isInternal = !!body.isInternal;
    if (!isInternal) {
      const updates: Record<string, unknown> = { status: "waiting_client", updatedAt: new Date() };
      if (!ticket.firstResponseAt) updates.firstResponseAt = new Date();
      await Ticket.updateOne({ _id: id }, { $set: updates });
    }

    const replies = await TicketReply.find({ ticketId: id })
      .sort({ createdAt: 1 })
      .populate("senderId", "firstName lastName")
      .lean();

    return jsonResponse({ success: true, replies });
  } catch (e) {
    console.error("[admin/tickets/[id]/reply POST]", e);
    return jsonResponse({ error: "Failed to send reply" }, 500);
  }
}

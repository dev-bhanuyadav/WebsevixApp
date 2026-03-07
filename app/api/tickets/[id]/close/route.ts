export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { Ticket } from "@/models/Ticket";
import mongoose from "mongoose";

/** POST /api/tickets/[id]/close — client confirms resolved → close */
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

    await connectDB();

    const ticket = await Ticket.findOne({
      _id: id,
      clientId: payload.userId,
    });
    if (!ticket) return jsonResponse({ error: "Ticket not found" }, 404);
    if (ticket.status !== "resolved")
      return jsonResponse({ error: "Only resolved tickets can be closed" }, 400);

    ticket.status = "closed";
    ticket.closedAt = new Date();
    await ticket.save();

    return jsonResponse({ success: true, ticket });
  } catch (e) {
    console.error("[tickets/[id]/close POST]", e);
    return jsonResponse({ error: "Failed to close ticket" }, 500);
  }
}

export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Ticket } from "@/models/Ticket";
import mongoose from "mongoose";

/** PATCH /api/admin/tickets/[id]/assign */
export async function PATCH(
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

    const body = await request.json() as { assignedTo: string | null };
    const assignedTo =
      body.assignedTo && mongoose.Types.ObjectId.isValid(body.assignedTo)
        ? new mongoose.Types.ObjectId(body.assignedTo)
        : null;

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { $set: { assignedTo, updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!ticket) return jsonResponse({ error: "Ticket not found" }, 404);
    return jsonResponse({ success: true, ticket });
  } catch (e) {
    console.error("[admin/tickets/[id]/assign PATCH]", e);
    return jsonResponse({ error: "Failed to assign" }, 500);
  }
}

export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Ticket } from "@/models/Ticket";
import mongoose from "mongoose";

/** PATCH /api/admin/tickets/[id]/status */
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

    const body = await request.json() as { status?: string; priority?: string; internalNote?: string };
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status) {
      const valid = ["open", "in_progress", "waiting_client", "resolved", "closed", "reopened"];
      if (valid.includes(body.status)) updates.status = body.status;
      if (body.status === "resolved") updates.resolvedAt = new Date();
    }
    if (body.priority) {
      const valid = ["low", "medium", "high", "critical"];
      if (valid.includes(body.priority)) updates.priority = body.priority;
    }
    if (body.internalNote !== undefined) updates.internalNote = body.internalNote || null;

    const ticket = await Ticket.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!ticket) return jsonResponse({ error: "Ticket not found" }, 404);
    return jsonResponse({ success: true, ticket });
  } catch (e) {
    console.error("[admin/tickets/[id]/status PATCH]", e);
    return jsonResponse({ error: "Failed to update" }, 500);
  }
}

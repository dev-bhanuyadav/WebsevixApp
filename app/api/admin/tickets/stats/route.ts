export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Ticket } from "@/models/Ticket";

/** GET /api/admin/tickets/stats */
export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return jsonResponse({ error: msg || "Unauthorized" }, msg === "Forbidden" ? 403 : 401);
  }

  try {
    await connectDB();

    const [open, active, resolvedToday, slaBreach] = await Promise.all([
      Ticket.countDocuments({ status: "open" }),
      Ticket.countDocuments({ status: { $in: ["open", "in_progress", "waiting_client", "reopened"] } }),
      Ticket.countDocuments({
        status: "resolved",
        resolvedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Ticket.countDocuments({ isSlaBreach: true, status: { $nin: ["closed", "resolved"] } }),
    ]);

    return jsonResponse({
      open,
      active,
      resolvedToday,
      slaBreach,
    });
  } catch (e) {
    console.error("[admin/tickets/stats]", e);
    return jsonResponse({ error: "Failed to fetch stats" }, 500);
  }
}

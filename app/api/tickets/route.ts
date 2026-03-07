export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { Ticket } from "@/models/Ticket";
import { generateTicketId, getSlaDeadline } from "@/lib/tickets";
import mongoose from "mongoose";

/** GET /api/tickets — list client's tickets, optional ?status=open */
export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    await connectDB();
    const status = request.nextUrl.searchParams.get("status");

    const q: { clientId: mongoose.Types.ObjectId; status?: string } = {
      clientId: new mongoose.Types.ObjectId(payload.userId),
    };
    if (status) q.status = status;

    const tickets = await Ticket.find(q)
      .sort({ createdAt: -1 })
      .populate({ path: "relatedServiceId", populate: { path: "serviceId", select: "name" } })
      .populate("relatedOrderId", "orderId title")
      .lean();

    return jsonResponse({ tickets });
  } catch (e) {
    console.error("[tickets GET]", e);
    return jsonResponse({ error: "Failed to fetch tickets" }, 500);
  }
}

/** POST /api/tickets — create ticket */
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    const body = await request.json() as {
      category: string;
      relatedServiceId?: string;
      relatedOrderId?: string;
      subject: string;
      description: string;
      priority?: string;
      attachments?: { url: string; name: string; size: number; mimeType: string }[];
    };

    const category = body.category as "service_issue" | "order_issue" | "billing" | "account" | "general";
    const validCat = ["service_issue", "order_issue", "billing", "account", "general"];
    if (!validCat.includes(category))
      return jsonResponse({ error: "Invalid category" }, 400);
    if (!body.subject?.trim()) return jsonResponse({ error: "Subject required" }, 400);
    if (!body.description?.trim()) return jsonResponse({ error: "Description required" }, 400);

    const priority = (body.priority as "low" | "medium" | "high" | "critical") || "medium";
    const validPri = ["low", "medium", "high", "critical"];
    const pri = validPri.includes(priority) ? priority : "medium";

    await connectDB();

    const ticketId = await generateTicketId();
    const slaDeadline = getSlaDeadline(pri);

    const ticket = await Ticket.create({
      ticketId,
      clientId: new mongoose.Types.ObjectId(payload.userId),
      category,
      relatedServiceId: body.relatedServiceId && mongoose.Types.ObjectId.isValid(body.relatedServiceId)
        ? new mongoose.Types.ObjectId(body.relatedServiceId) : null,
      relatedOrderId: body.relatedOrderId && mongoose.Types.ObjectId.isValid(body.relatedOrderId)
        ? new mongoose.Types.ObjectId(body.relatedOrderId) : null,
      subject: body.subject.trim().slice(0, 150),
      description: body.description.trim().slice(0, 2000),
      priority: pri,
      attachments: body.attachments ?? [],
      slaDeadline,
    });

    const created = await Ticket.findById(ticket._id)
      .populate("relatedServiceId", "serviceId")
      .populate("relatedOrderId", "orderId title")
      .lean();

    return jsonResponse({ success: true, ticket: created }, 201);
  } catch (e) {
    console.error("[tickets POST]", e);
    return jsonResponse({ error: "Failed to create ticket" }, 500);
  }
}

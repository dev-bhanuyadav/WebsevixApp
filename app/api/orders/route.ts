export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { Order, toPublicOrder } from "@/models/Order";
import { verifyAccessToken } from "@/lib/jwt";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  aiSummary: z.object({
    projectType:  z.string().optional(),
    description:  z.string().optional(),
    features:     z.array(z.string()).optional(),
    designStyle:  z.string().optional(),
    budget:       z.string().optional(),
    timeline:     z.string().optional(),
    references:   z.array(z.string()).optional(),
  }).optional(),
  paymentId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    const body   = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return jsonResponse({ error: "Invalid input" }, 400);

    await connectDB();

    const count   = await Order.countDocuments();
    const orderId = `WS-${String(1001 + count)}`;

    const order = await Order.create({
      orderId,
      clientId:      payload.userId,
      title:         parsed.data.title,
      aiSummary:     parsed.data.aiSummary ?? {},
      paymentStatus: parsed.data.paymentId ? "paid" : "pending",
      paymentId:     parsed.data.paymentId,
      milestones: [
        { title: "Requirements Finalized", description: "Project brief reviewed and confirmed by our team", status: "active",  order: 1 },
        { title: "Design Mockups",          description: "UI/UX wireframes and visual design",                status: "pending", order: 2 },
        { title: "Frontend Development",    description: "Building the user interface",                       status: "pending", order: 3 },
        { title: "Backend Integration",     description: "APIs, database, and business logic",                status: "pending", order: 4 },
        { title: "Testing & QA",            description: "Cross-browser testing and bug fixes",               status: "pending", order: 5 },
        { title: "Final Delivery",          description: "Deployment and project handover",                   status: "pending", order: 6 },
      ],
    });

    return jsonResponse({ success: true, order: toPublicOrder(order) }, 201);
  } catch (e) {
    console.error("[orders POST]", e);
    return jsonResponse({ error: "Failed to create order" }, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    await connectDB();
    const orders = await Order.find({ clientId: payload.userId }).sort({ createdAt: -1 }).lean();
    return jsonResponse({ orders: orders.map(o => toPublicOrder(o as never)) });
  } catch (e) {
    console.error("[orders GET]", e);
    return jsonResponse({ error: "Failed to fetch orders" }, 500);
  }
}

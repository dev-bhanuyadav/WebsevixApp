export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { PaymentRequest } from "@/models/PaymentRequest";
import mongoose from "mongoose";

interface PaymentRequestBody {
  orderId: string;
  clientId: string;
  amount: number;
  description?: string;
  type: "advance" | "milestone" | "final" | "placement";
  dueDate?: string;
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const body = (await request.json()) as PaymentRequestBody;
    const { orderId, clientId, amount, description, type, dueDate } = body;

    if (!mongoose.Types.ObjectId.isValid(orderId) || orderId.length !== 24) {
      return jsonResponse({ error: "Invalid orderId" }, 400);
    }
    if (!mongoose.Types.ObjectId.isValid(clientId) || clientId.length !== 24) {
      return jsonResponse({ error: "Invalid clientId" }, 400);
    }
    if (typeof amount !== "number" || amount <= 0) {
      return jsonResponse({ error: "amount must be a positive number" }, 400);
    }

    const validTypes = ["advance", "milestone", "final", "placement"];
    if (!validTypes.includes(type)) {
      return jsonResponse({ error: `type must be one of: ${validTypes.join(", ")}` }, 400);
    }

    const paymentRequest = await PaymentRequest.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      clientId: new mongoose.Types.ObjectId(clientId),
      amount,
      description: description?.trim() ?? "",
      type,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: "pending",
    });

    return jsonResponse({ success: true, request: paymentRequest }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

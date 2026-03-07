export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Service } from "@/models/Service";
import { ClientService } from "@/models/ClientService";

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    await connectDB();

    const body = await request.json();
    const { clientId, serviceId, customPrice, isMandatory, notes, billingStartNow, relatedOrderId } = body;

    if (!clientId || !serviceId) return jsonResponse({ error: "clientId and serviceId required" }, 400);

    const service = await Service.findById(serviceId).lean();
    if (!service) return jsonResponse({ error: "Service not found" }, 404);

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const data: Record<string, unknown> = {
      clientId:         new mongoose.Types.ObjectId(clientId),
      serviceId:        new mongoose.Types.ObjectId(serviceId),
      customPrice:      typeof customPrice === "number" ? customPrice : null,
      isMandatory:      isMandatory ?? service.isMandatory,
      offeredBy:        new mongoose.Types.ObjectId(admin.userId),
      offeredAt:        now,
      status:           "pending_acceptance",
      notes:            notes ?? "",
      billingStartDate: billingStartNow ? now : nextMonth,
      nextBillingDate:  billingStartNow ? now : nextMonth,
    };
    if (relatedOrderId) data.relatedOrderId = new mongoose.Types.ObjectId(relatedOrderId);

    // Upsert: don't duplicate
    const cs = await ClientService.findOneAndUpdate(
      { clientId: new mongoose.Types.ObjectId(clientId), serviceId: new mongoose.Types.ObjectId(serviceId) },
      { $set: data },
      { upsert: true, new: true },
    );

    return jsonResponse({ success: true, clientService: cs }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 500);
  }
}

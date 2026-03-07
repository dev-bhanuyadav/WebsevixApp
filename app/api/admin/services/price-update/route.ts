export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Service } from "@/models/Service";
import { ClientService } from "@/models/ClientService";

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    await connectDB();

    const { serviceId, newPrice, reason, applyTo, clientIds } =
      await request.json() as {
        serviceId: string;
        newPrice:  number;
        reason?:   string;
        applyTo:   "all" | "new_only" | "specific";
        clientIds?: string[];
      };

    if (!serviceId || typeof newPrice !== "number") return jsonResponse({ error: "serviceId and newPrice required" }, 400);

    const service = await Service.findById(serviceId).lean();
    if (!service) return jsonResponse({ error: "Service not found" }, 404);

    const oldPrice = service.basePrice;

    // Update the base price on the Service itself
    await Service.findByIdAndUpdate(serviceId, { $set: { basePrice: newPrice } });

    if (applyTo === "new_only") {
      return jsonResponse({ updated: 0, oldPrice, newPrice, message: "Base price updated. Applies to new assignments only." });
    }

    // Build query for which ClientServices to update
    const csQuery: Record<string, unknown> = {
      serviceId: new mongoose.Types.ObjectId(serviceId),
      status:    { $in: ["active", "pending_acceptance"] },
    };

    if (applyTo === "specific" && clientIds?.length) {
      csQuery.clientId = { $in: clientIds.map(id => new mongoose.Types.ObjectId(id)) };
    } else if (applyTo === "all") {
      // Only update clients who are using the base price (no custom price)
      csQuery.customPrice = null;
    }

    const affectedDocs = await ClientService.find(csQuery).select("_id customPrice").lean();

    // Add to priceHistory for each affected doc
    const now = new Date();
    await ClientService.updateMany(csQuery, {
      $push: {
        priceHistory: {
          oldPrice,
          newPrice,
          changedAt: now,
          changedBy: new mongoose.Types.ObjectId(admin.userId),
          reason:    reason ?? "Price update",
        },
      },
    });

    return jsonResponse({
      updated:  affectedDocs.length,
      oldPrice,
      newPrice,
      serviceId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 500);
  }
}

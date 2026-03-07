export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Service } from "@/models/Service";
import { ClientService } from "@/models/ClientService";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(request);
    await connectDB();
    const updates = await request.json();
    delete updates._id; delete updates.createdBy; delete updates.createdAt;
    const service = await Service.findByIdAndUpdate(params.id, { $set: updates }, { new: true }).lean();
    if (!service) return jsonResponse({ error: "Service not found" }, 404);
    return jsonResponse({ service });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(request);
    await connectDB();
    const activeCount = await ClientService.countDocuments({ serviceId: params.id, status: "active" });
    if (activeCount > 0) return jsonResponse({ error: `Cannot delete: ${activeCount} active clients` }, 409);
    await Service.findByIdAndDelete(params.id);
    return jsonResponse({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 500);
  }
}

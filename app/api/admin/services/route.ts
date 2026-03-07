export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Service } from "@/models/Service";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    await connectDB();
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    const services = await Service.find(query).sort({ createdAt: -1 }).lean();
    return jsonResponse({ services });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    await connectDB();
    const body = await request.json();
    const { name, description, category, basePrice, billingCycle, isMandatory, isActive, icon, features } = body;
    if (!name || typeof basePrice !== "number") return jsonResponse({ error: "name and basePrice required" }, 400);
    const service = await Service.create({
      name, description, category, basePrice, billingCycle, isMandatory, isActive, icon,
      features: features ?? [],
      createdBy: admin.userId,
    });
    return jsonResponse({ service }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 500);
  }
}

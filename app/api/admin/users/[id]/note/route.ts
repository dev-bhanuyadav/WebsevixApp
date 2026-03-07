export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { AdminNote } from "@/models/AdminNote";
import mongoose from "mongoose";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const payload = await verifyAdmin(request);
    await connectDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id) || id.length !== 24) {
      return jsonResponse({ error: "Invalid user ID" }, 400);
    }

    const body = (await request.json()) as { note?: string };
    if (!body.note?.trim()) {
      return jsonResponse({ error: "note is required" }, 400);
    }

    const adminNote = await AdminNote.create({
      targetType: "user",
      targetId: new mongoose.Types.ObjectId(id),
      note: body.note.trim(),
      addedBy: new mongoose.Types.ObjectId(payload.userId),
    });

    return jsonResponse({ success: true, note: adminNote }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id) || id.length !== 24) {
      return jsonResponse({ error: "Invalid user ID" }, 400);
    }

    const notes = await AdminNote.find({
      targetType: "user",
      targetId: new mongoose.Types.ObjectId(id),
    })
      .populate("addedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    return jsonResponse({ notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

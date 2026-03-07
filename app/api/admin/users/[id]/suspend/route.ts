export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { User } from "@/models/User";
import mongoose from "mongoose";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id) || id.length !== 24) {
      return jsonResponse({ error: "Invalid user ID" }, 400);
    }

    const user = await User.findById(id).select("-password");
    if (!user) return jsonResponse({ error: "User not found" }, 404);

    if (user.role === "admin") {
      return jsonResponse({ error: "Cannot suspend an admin user" }, 403);
    }

    user.isActive = !user.isActive;
    await user.save();

    return jsonResponse({
      user: user.toObject(),
      suspended: !user.isActive,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

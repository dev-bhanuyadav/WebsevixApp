export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyAccessToken } from "@/lib/jwt";
import { toPublic } from "@/models/User";
import { jsonResponse } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const payload = await verifyAccessToken(token);
    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      return jsonResponse({ error: "User not found" }, 401);
    }
    return jsonResponse({ user: toPublic(user) });
  } catch (e) {
    console.error("[me]", e);
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
}

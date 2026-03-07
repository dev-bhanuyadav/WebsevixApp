export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { RefreshToken } from "@/models/RefreshToken";
import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";
import { jsonResponse } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (!refreshToken) {
      return jsonResponse({ error: "No refresh token" }, 401);
    }
    const payload = await verifyRefreshToken(refreshToken);
    await connectDB();
    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored || stored.expiresAt < new Date()) {
      return jsonResponse({ error: "Invalid or expired refresh token" }, 401);
    }
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      return jsonResponse({ error: "User not found or inactive" }, 401);
    }
    const accessToken = await signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    return jsonResponse({ accessToken });
  } catch (e) {
    console.error("[refresh]", e);
    return jsonResponse({ error: "Refresh failed" }, 401);
  }
}

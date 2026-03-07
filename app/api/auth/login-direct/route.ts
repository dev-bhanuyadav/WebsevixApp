export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, toPublic } from "@/models/User";
import { RefreshToken } from "@/models/RefreshToken";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { jsonResponse } from "@/lib/api";
import { cookies } from "next/headers";

const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json() as { email?: string };
    if (!email || typeof email !== "string") {
      return jsonResponse({ error: "Email is required" }, 400);
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return jsonResponse({ error: "User not found" }, 404);
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken  = await signAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = await signRefreshToken({ userId: user._id.toString(), role: user.role });

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      userAgent: request.headers.get("user-agent") ?? undefined,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      expiresAt: new Date(Date.now() + REFRESH_MAX_AGE * 1000),
    });

    const cookieStore = await cookies();
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_MAX_AGE,
      path: "/",
    });

    return jsonResponse({ success: true, accessToken, user: toPublic(user) });
  } catch (e) {
    console.error("[login-direct]", e);
    return jsonResponse({ error: "Login failed" }, 500);
  }
}

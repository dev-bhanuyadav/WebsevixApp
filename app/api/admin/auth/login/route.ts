export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { RefreshToken } from "@/models/RefreshToken";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { jsonResponse } from "@/lib/api";
import { cookies } from "next/headers";

const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return jsonResponse({ error: "Email and password are required." }, 400);
    }

    await connectDB();

    const user = await User.findOne({ email: body.email.toLowerCase().trim() });

    // Vague error on purpose — don't leak which part is wrong
    if (!user || user.role !== "admin") {
      return jsonResponse({ error: "Invalid admin credentials." }, 401);
    }

    if (!user.password) {
      return jsonResponse({ error: "Account not configured for password login." }, 401);
    }

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) {
      return jsonResponse({ error: "Invalid admin credentials." }, 401);
    }

    if (!user.isActive) {
      return jsonResponse({ error: "This admin account has been disabled." }, 403);
    }

    user.lastLogin = new Date();
    await user.save();

    const uid          = user._id.toString();
    const accessToken  = await signAccessToken({ userId: uid, email: user.email, role: "admin" });
    const refreshToken = await signRefreshToken({ userId: uid, role: "admin" });

    // Save refresh token to DB so /api/auth/refresh can validate it
    await RefreshToken.create({
      userId:    user._id,
      token:     refreshToken,
      userAgent: request.headers.get("user-agent") ?? undefined,
      ip:        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      expiresAt: new Date(Date.now() + REFRESH_MAX_AGE * 1000),
    });

    const cookieStore = await cookies();
    const cookieOpts = {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge:   REFRESH_MAX_AGE,
      path:     "/",
    };

    // adminToken   → middleware reads this for /admin/* route protection
    // refreshToken → useAuth hook uses this to stay logged in (admin pages need it)
    cookieStore.set("adminToken",   refreshToken, cookieOpts);
    cookieStore.set("refreshToken", refreshToken, cookieOpts);

    return jsonResponse({
      success:     true,
      accessToken,
      admin: {
        id:        uid,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        role:      "admin",
      },
    });
  } catch (e) {
    console.error("[admin/auth/login]", e);
    return jsonResponse({ error: "Login failed. Please try again." }, 500);
  }
}

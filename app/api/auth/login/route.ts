export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User, toPublic } from "@/models/User";
import { RefreshToken } from "@/models/RefreshToken";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { jsonResponse } from "@/lib/api";
import { cookies } from "next/headers";
import { z } from "zod";

const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body   = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: "Email and password are required" }, 400);
    }

    const { email, password } = parsed.data;
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return jsonResponse({ error: "No account found with this email. Please sign up." }, 401);
    }

    if (!user.password) {
      return jsonResponse({ error: "No password set. Try signing up again." }, 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return jsonResponse({ error: "Incorrect password. Please try again." }, 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken  = await signAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = await signRefreshToken({ userId: user._id.toString(), role: user.role });

    await RefreshToken.create({
      userId:    user._id,
      token:     refreshToken,
      userAgent: request.headers.get("user-agent") ?? undefined,
      ip:        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      expiresAt: new Date(Date.now() + REFRESH_MAX_AGE * 1000),
    });

    const cookieStore = await cookies();
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   REFRESH_MAX_AGE,
      path:     "/",
    });

    return jsonResponse({ success: true, accessToken, user: toPublic(user) });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[login] ERROR:", msg);

    let userMsg = "Login failed. Please try again.";
    if (msg.includes("JWT_SECRET"))       userMsg = "Server config error (JWT_SECRET missing in Vercel env vars).";
    else if (msg.includes("JWT_REFRESH")) userMsg = "Server config error (JWT_REFRESH_SECRET missing in Vercel env vars).";
    else if (process.env.NODE_ENV !== "production") userMsg = msg;

    return jsonResponse({ error: userMsg }, 500);
  }
}

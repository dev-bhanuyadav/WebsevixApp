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
  email:     z.string().email("Valid email required"),
  firstName: z.string().min(1).max(50).trim(),
  lastName:  z.string().min(1).max(50).trim(),
  phone:     z.string().min(5).max(25).trim(),
  password:  z.string().min(8, "Password must be at least 8 characters").max(72),
  role:      z.enum(["client", "developer"]).default("client"),
});

export async function POST(request: NextRequest) {
  let createdUserId: string | null = null;

  try {
    const body   = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      const first  = Object.values(fields)[0]?.[0] ?? "Invalid input";
      return jsonResponse({ error: first }, 400);
    }

    const { email, firstName, lastName, phone, password, role } = parsed.data;
    const normalEmail = email.toLowerCase().trim();

    await connectDB();

    // Check duplicate
    const existing = await User.findOne({ email: normalEmail });
    if (existing) {
      return jsonResponse({ error: "Email already registered. Sign in instead." }, 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email:           normalEmail,
      password:        hashedPassword,
      firstName:       firstName.trim(),
      lastName:        lastName.trim(),
      phone:           phone.trim(),
      role,
      isVerified:      true,
      profileComplete: true,
    });
    createdUserId = user._id.toString();

    // Sign tokens — if this throws (missing env vars), we'll cleanup
    const uid = createdUserId!;
    const accessToken  = await signAccessToken({ userId: uid, email: user.email, role: user.role });
    const refreshToken = await signRefreshToken({ userId: uid, role: user.role });

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

    createdUserId = null; // success — don't cleanup
    return jsonResponse({ success: true, accessToken, user: toPublic(user) });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[register] ERROR:", msg);

    // Cleanup: remove partially created user so re-registration works
    if (createdUserId) {
      try {
        await User.deleteOne({ _id: createdUserId });
        console.log("[register] Rolled back user:", createdUserId);
      } catch (ce) { console.error("[register] Cleanup failed:", ce); }
    }

    // Human-readable errors
    let userMsg = "Registration failed. Please try again.";
    if (msg.includes("JWT_SECRET"))         userMsg = "Server config error (JWT). Contact support.";
    else if (msg.includes("JWT_REFRESH"))   userMsg = "Server config error (JWT). Contact support.";
    else if (msg.includes("MONGODB_URI"))   userMsg = "Database not configured.";
    else if (msg.includes("duplicate key")) userMsg = "Email already registered. Sign in instead.";
    else if (process.env.NODE_ENV !== "production") userMsg = msg;

    return jsonResponse({ error: userMsg }, 500);
  }
}

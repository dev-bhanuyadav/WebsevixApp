export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { connectDB } from "@/lib/mongodb";
import { OTP } from "@/models/OTP";
import { sendOtpSchema } from "@/lib/validations";
import { otpSendLimit, otpResendCooldown } from "@/lib/rateLimit";
import { sendOTPEmail } from "@/lib/email";
import { jsonResponse } from "@/lib/api";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) return jsonResponse({ error: "Invalid request" }, 400);

    const { email, type } = parsed.data;

    // Rate limiting
    const limit = otpSendLimit(email);
    if (!limit.allowed)
      return jsonResponse({ error: "Too many OTPs sent. Try again later.", retryAfter: limit.retryAfter }, 429);

    const cooldown = otpResendCooldown(email);
    if (!cooldown.allowed)
      return jsonResponse({ error: "Please wait before resending.", retryAfter: cooldown.retryAfter }, 429);

    // Generate & hash OTP
    const otp       = randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save to DB
    await connectDB();
    await OTP.deleteMany({ email, type, used: false });
    await OTP.create({ email, otp: hashedOtp, type, attempts: 0, expiresAt, used: false });

    // Send via PHP mailer
    await sendOTPEmail(email, otp, OTP_EXPIRY_MINUTES);

    return jsonResponse({ success: true, expiresIn: OTP_EXPIRY_MINUTES * 60 });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-otp] ERROR:", msg);

    if (msg.includes("MONGODB_URI")) {
      return jsonResponse({ error: "Database not configured." }, 500);
    }
    if (msg.includes("PHP mailer") || msg.includes("ENOTFOUND") || msg.includes("fetch")) {
      return jsonResponse({ error: `Email delivery failed: ${msg}` }, 500);
    }
    return jsonResponse({ error: "Failed to send OTP. Please try again." }, 500);
  }
}

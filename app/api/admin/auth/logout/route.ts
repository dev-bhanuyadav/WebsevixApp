export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { RefreshToken } from "@/models/RefreshToken";

export async function POST() {
  const cookieStore = await cookies();

  // Delete the stored refresh token from DB
  const token = cookieStore.get("refreshToken")?.value;
  if (token) {
    try {
      await connectDB();
      await RefreshToken.deleteOne({ token });
    } catch { /* ignore */ }
  }

  const opts = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge:   0,
    path:     "/",
  };
  cookieStore.set("adminToken",   "", opts);
  cookieStore.set("refreshToken", "", opts);
  return NextResponse.json({ success: true });
}

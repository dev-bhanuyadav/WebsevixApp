export const dynamic = 'force-dynamic'
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { RefreshToken } from "@/models/RefreshToken";
import { jsonResponse } from "@/lib/api";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("refreshToken")?.value;
    if (token) {
      await connectDB();
      await RefreshToken.deleteOne({ token });
    }
    cookieStore.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
    return jsonResponse({ success: true });
  } catch (e) {
    console.error("[logout]", e);
    return jsonResponse({ success: true });
  }
}

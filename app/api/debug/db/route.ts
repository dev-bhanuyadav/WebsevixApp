export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

// Only available in development
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json({
      status: "❌ FAILED",
      reason: "MONGODB_URI is not set in .env.local",
    }, { status: 500 });
  }

  // Mask password in URI for safe display
  const safeUri = uri.replace(/:([^@]+)@/, ":****@");

  try {
    await connectDB();
    return NextResponse.json({
      status: "✅ CONNECTED",
      uri: safeUri,
      message: "MongoDB connection is working perfectly",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      status: "❌ FAILED",
      uri: safeUri,
      error: msg,
    }, { status: 500 });
  }
}

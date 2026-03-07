export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

/** POST /api/admin/branding
 *  Body: { logoWide: string; logoSquare: string }
 *  Saves logo URLs to the SiteSettings collection in DB
 */
export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const body = await request.json() as { logoWide?: string; logoSquare?: string };

    await connectDB();
    await SiteSettings.findOneAndUpdate(
      {},
      {
        logoWide:   (body.logoWide   ?? "").trim(),
        logoSquare: (body.logoSquare ?? "").trim(),
      },
      { upsert: true, new: true }
    );

    return jsonResponse({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized" || msg === "Forbidden")
      return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 403);
    console.error("[admin/branding]", e);
    return jsonResponse({ error: "Failed to save" }, 500);
  }
}

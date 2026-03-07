export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

/** GET /api/site-settings/icon
 *  Redirects to the square logo (external URL or local path) for use as favicon
 */
export async function GET() {
  try {
    await connectDB();
    const s = await SiteSettings.findOne().lean() as { logoSquare?: string } | null;
    const url = s?.logoSquare?.split("?")[0]; // strip cache-bust query
    if (url) {
      // Both external URLs (https://...) and local paths (/uploads/...)
      const dest = url.startsWith("http") ? url : `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${url}`;
      return NextResponse.redirect(dest, 302);
    }
  } catch { /* use default */ }
  return new NextResponse(null, { status: 404 });
}

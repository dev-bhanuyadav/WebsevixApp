export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { SiteSettings } from "@/models/SiteSettings";

/** GET /api/site-settings — public, returns logo URLs + platform name */
export async function GET() {
  try {
    await connectDB();
    const s = await SiteSettings.findOne().lean() as {
      logoWide?: string; logoSquare?: string; platformName?: string; placementFee?: number;
    } | null;
    return jsonResponse({
      logoWide:     s?.logoWide     || "",
      logoSquare:   s?.logoSquare   || "",
      platformName: s?.platformName || "Websevix",
      placementFee: s?.placementFee ?? 500,
    });
  } catch {
    return jsonResponse({ logoWide: "", logoSquare: "", platformName: "Websevix", placementFee: 500 });
  }
}

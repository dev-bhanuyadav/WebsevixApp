export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET() {
  return jsonResponse({
    placementFee: parseInt(process.env.PLACEMENT_FEE ?? "500", 10),
    platformName: process.env.PLATFORM_NAME ?? "Websevix",
  });
}

export async function PATCH(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const body = (await request.json()) as { placementFee?: number; platformName?: string };

    return jsonResponse({
      success: true,
      message:
        "Settings received. Update PLACEMENT_FEE and PLATFORM_NAME environment variables to persist changes.",
      received: body,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

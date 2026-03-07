export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { previewMonthlyBilling, currentMonth } from "@/lib/billingEngine";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    const preview = await previewMonthlyBilling();
    const grandTotal = preview.reduce((s, c) => s + c.total, 0);
    return jsonResponse({
      month:      currentMonth(),
      clients:    preview.length,
      grandTotal,
      preview,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 500);
  }
}

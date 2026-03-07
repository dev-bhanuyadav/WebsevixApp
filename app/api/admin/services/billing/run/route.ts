export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { runMonthlyBilling, currentMonth } from "@/lib/billingEngine";

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);
    const body = await request.json().catch(() => ({}));
    const { clientIds } = body as { clientIds?: string[] };

    const results = await runMonthlyBilling(clientIds);

    const paid     = results.filter(r => r.status === "queued").length;
    const noMandate = results.filter(r => r.status === "no_mandate").length;
    const errors   = results.filter(r => r.status === "error").length;
    const total    = results.reduce((s, r) => s + (r.total ?? 0), 0);

    return jsonResponse({
      month:     currentMonth(),
      results,
      summary:   { processed: results.length, queued: paid, noMandate, errors, total },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 500);
  }
}

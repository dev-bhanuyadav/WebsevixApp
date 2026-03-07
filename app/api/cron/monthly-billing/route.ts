export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { runMonthlyBilling, currentMonth } from "@/lib/billingEngine";

/** Called by Vercel Cron on 1st of month, or manually by admin.
 *  Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  const secret   = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret") ?? request.nextUrl.searchParams.get("secret");

  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results    = await runMonthlyBilling();
    const queued     = results.filter(r => r.status === "queued").length;
    const noMandate  = results.filter(r => r.status === "no_mandate").length;
    const errors     = results.filter(r => r.status === "error").length;
    const grandTotal = results.reduce((s, r) => s + (r.total ?? 0), 0);

    return NextResponse.json({
      month:   currentMonth(),
      results,
      summary: { total: results.length, queued, noMandate, errors, grandTotal },
    });
  } catch (e) {
    console.error("[cron/monthly-billing]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

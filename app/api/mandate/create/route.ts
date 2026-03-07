export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { Mandate } from "@/models/Mandate";
import { User } from "@/models/User";
import { ClientService } from "@/models/ClientService";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);
    await connectDB();

    // Already has an active subscription mandate — nothing to do
    const existing = await Mandate.findOne({
      clientId: payload.userId,
      status:   { $in: ["active", "authenticated", "created"] },
    });
    if (existing) return jsonResponse({ alreadyActive: true, mandate: existing });

    const user = await User.findById(payload.userId).lean() as {
      firstName?: string; lastName?: string; email?: string; phone?: string;
    } | null;

    // Calculate client's current monthly total from active services
    const activeServices = await ClientService.find({
      clientId: payload.userId,
      status:   "active",
    }).populate<{ serviceId: { basePrice: number } }>("serviceId", "basePrice");

    const monthlyTotal = activeServices.reduce((sum, cs) => {
      const price = cs.customPrice ?? (cs.serviceId as { basePrice: number }).basePrice ?? 0;
      return sum + price;
    }, 0);

    // Plan amount = monthly total (min ₹100 = Razorpay minimum, ₹100 paise)
    // If no services yet, use ₹100 placeholder — admin can trigger billing separately
    const planAmountPaise = Math.max(monthlyTotal * 100, 100);

    // ── Try real Razorpay Subscriptions ───────────────────────────────────────
    try {
      const { getRazorpay } = await import("@/lib/razorpay");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = getRazorpay() as any;

      // Step 1 — Create a monthly plan
      const plan = await rzp.plans.create({
        period:   "monthly",
        interval: 1,
        item: {
          name:     "Websevix Monthly Services",
          amount:   planAmountPaise,
          currency: "INR",
          description: "Auto-billing for Websevix services",
        },
      });

      // Step 2 — Create subscription
      // start_at = 30 days later → first full monthly charge starts next cycle
      // Auth charge (₹2) happens automatically during UPI mandate approval in checkout
      const startAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      const subscription = await rzp.subscriptions.create({
        plan_id:     plan.id,
        total_count: 120,          // 10 years of auto monthly billing
        quantity:    1,
        start_at:    startAt,
        notify_info: {
          notify_phone: user?.phone ?? "",
          notify_email: user?.email ?? "",
        },
        notes: {
          clientId:     payload.userId,
          monthlyTotal: String(monthlyTotal),
          platform:     "websevix",
        },
      });

      // Save a "created" mandate record so we track the subscription
      await Mandate.create({
        clientId:       payload.userId,
        subscriptionId: subscription.id,
        planId:         plan.id,
        maxAmount:      15000,
        status:         "created",
        mandateNumber:  1,
      });

      return jsonResponse({
        success:        true,
        subscriptionId: subscription.id,
        keyId:          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        monthlyTotal,
        prefill: {
          name:    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
          email:   user?.email  ?? "",
          contact: user?.phone  ?? "",
        },
      });
    } catch (rzErr) {
      // ── Mock / Dev fallback ────────────────────────────────────────────────
      console.warn("[mandate/create] Razorpay unavailable — mock:", rzErr instanceof Error ? rzErr.message : rzErr);
      const mandate = await Mandate.create({
        clientId:          payload.userId,
        razorpayMandateId: `mock_${Date.now()}`,
        subscriptionId:    `mock_sub_${Date.now()}`,
        maxAmount:         15000,
        status:            "authenticated",
        mandateNumber:     1,
        paymentMethod:     "Mock (Dev)",
        maskedAccount:     "mock@upi",
        activatedAt:       new Date(),
      });
      return jsonResponse({ success: true, mock: true, mandate });
    }
  } catch (e) {
    console.error("[mandate/create]", e);
    return jsonResponse({ error: "Failed to initiate autopay setup" }, 500);
  }
}

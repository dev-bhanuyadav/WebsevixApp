export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { ClientService } from "@/models/ClientService";
import { Service } from "@/models/Service";
import { User } from "@/models/User";
import { getRazorpay, razorpayErrMsg } from "@/lib/razorpay";

/**
 * POST /api/client/services/pay-monthly
 * Creates one Razorpay order for the total of ALL pending + due services
 * On success → call /api/client/services/verify-payment with type=monthly
 */
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    await connectDB();

    const now = new Date();

    // Get all services that need payment
    const services = await ClientService.find({
      clientId: payload.userId,
      $or: [
        { status: "pending_acceptance" },                        // First month payment
        { status: "active", nextBillingDate: { $lte: now } },   // Renewal due
      ],
    })
      .populate("serviceId", "name basePrice billingCycle")
      .lean() as any[];

    if (!services.length)
      return jsonResponse({ error: "No services require payment at this time." }, 400);

    // Build line items and calculate total
    const lineItems = services.map((s: any) => {
      const svc   = s.serviceId as { name: string; basePrice: number; billingCycle: string };
      const price = s.customPrice ?? svc.basePrice;
      const type  = s.status === "pending_acceptance" ? "first" : "renewal";
      return {
        clientServiceId: String(s._id),
        serviceName:     svc.name,
        billingCycle:    svc.billingCycle,
        price,
        type,
      };
    });

    const totalRupees = lineItems.reduce((sum, item) => sum + item.price, 0);
    const totalPaise  = Math.round(totalRupees * 100);

    if (totalPaise < 100)
      return jsonResponse({ error: "Total amount must be at least ₹1" }, 400);

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) return jsonResponse({ error: "Payment gateway not configured on server" }, 500);

    // Create ONE Razorpay order for the total
    let order;
    try {
      const rz = getRazorpay();
      order = await rz.orders.create({
        amount:   totalPaise,
        currency: "INR",
        receipt:  `mth_${Date.now()}`,
        notes: {
          userId:    payload.userId,
          type:      "service_monthly",
          serviceIds: lineItems.map(i => i.clientServiceId).join(","),
        },
      });
    } catch (rzErr: unknown) {
      const msg = razorpayErrMsg(rzErr);
      console.error("[pay-monthly] Razorpay error:", msg, rzErr);
      return jsonResponse({ error: `Payment failed: ${msg}` }, 500);
    }

    return jsonResponse({
      success:      true,
      orderId:      order.id,
      keyId,
      amount:       totalPaise,
      totalRupees,
      currency:     "INR",
      lineItems,
      servicesCount: lineItems.length,
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[pay-monthly] Error:", msg);
    if (msg.includes("jwt") || msg.includes("Unauthorized"))
      return jsonResponse({ error: "Session expired. Please log in again." }, 401);
    return jsonResponse({ error: `Could not create payment: ${msg}` }, 500);
  }
}

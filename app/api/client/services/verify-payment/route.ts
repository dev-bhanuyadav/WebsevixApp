export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { getRazorpay, verifyPaymentSignature } from "@/lib/razorpay";
import { ClientService } from "@/models/ClientService";
import { Service } from "@/models/Service";
import { User } from "@/models/User";
import { ServiceInvoice } from "@/models/ServiceInvoice";
import { nextInvoiceNo, currentMonth } from "@/lib/billingEngine";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return jsonResponse({ error: "Missing payment details" }, 400);

    // Verify signature
    const valid = verifyPaymentSignature({
      orderId:   razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) return jsonResponse({ error: "Invalid payment signature" }, 400);

    await connectDB();

    // Fetch order notes from Razorpay
    let notes: Record<string, string> = {};
    try {
      const rz    = getRazorpay();
      const order = await rz.orders.fetch(razorpay_order_id);
      notes = (order.notes as Record<string, string>) || {};
    } catch (e) {
      console.error("[verify-payment] Could not fetch order notes:", e);
      return jsonResponse({ error: "Could not verify order with Razorpay." }, 400);
    }

    const type = notes.type;

    // ── MONTHLY PAYMENT: activate/renew all services at once ──────
    if (type === "service_monthly") {
      const serviceIds = (notes.serviceIds || "").split(",").filter(Boolean);
      if (!serviceIds.length)
        return jsonResponse({ error: "No services found in order" }, 400);

      const now     = new Date();
      const month   = currentMonth();
      const results = [];
      const allLineItems: { serviceName: string; price: number; billingCycle: string }[] = [];

      for (const csId of serviceIds) {
        const cs = await ClientService.findOne({ _id: csId, clientId: payload.userId })
          .populate<{ serviceId: { name: string; basePrice: number; billingCycle: string } }>(
            "serviceId", "name basePrice billingCycle"
          );
        if (!cs) continue;

        const svc   = cs.serviceId as unknown as { name: string; basePrice: number; billingCycle: string };
        const price = cs.customPrice ?? svc.basePrice;

        if (cs.status === "pending_acceptance") {
          // Activate for first month
          cs.status           = "active";
          cs.acceptedAt       = now;
          cs.billingStartDate = now;
          cs.nextBillingDate  = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          cs.lastBilledAt     = now;
          await cs.save();
          results.push({ name: svc.name, action: "activated" });

        } else if (cs.status === "active" && cs.nextBillingDate && cs.nextBillingDate <= now) {
          // Renew for next month
          const nextDate = new Date(cs.nextBillingDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          cs.nextBillingDate = nextDate;
          cs.lastBilledAt    = now;
          await cs.save();
          results.push({ name: svc.name, action: "renewed" });
        }

        allLineItems.push({ serviceName: svc.name, price, billingCycle: svc.billingCycle });
      }

      if (!allLineItems.length)
        return jsonResponse({ error: "No eligible services to process." }, 400);

      // Create one invoice for all services
      const totalAmount = allLineItems.reduce((sum, i) => sum + i.price, 0);
      const invoiceNo   = await nextInvoiceNo(month);
      await ServiceInvoice.create({
        clientId:          payload.userId,
        invoiceNo,
        month,
        lineItems:         allLineItems,
        subtotal:          totalAmount,
        tax:               0,
        total:             totalAmount,
        status:            "paid",
        razorpayPaymentId: razorpay_payment_id,
        paidAt:            now,
      });

      const activated = results.filter(r => r.action === "activated").map(r => r.name);
      const renewed   = results.filter(r => r.action === "renewed").map(r => r.name);

      let message = "";
      if (activated.length) message += `Activated: ${activated.join(", ")}. `;
      if (renewed.length)   message += `Renewed: ${renewed.join(", ")}.`;

      return jsonResponse({
        success: true,
        message: message.trim() || "Payment successful.",
        results,
      });
    }

    // ── SINGLE SERVICE PAYMENT ─────────────────────────────────────
    const clientServiceId = notes.clientServiceId;
    if (!clientServiceId)
      return jsonResponse({ error: "Invalid order context" }, 400);

    const cs = await ClientService.findOne({ _id: clientServiceId, clientId: payload.userId })
      .populate<{ serviceId: { name: string; basePrice: number; billingCycle: string } }>(
        "serviceId", "name basePrice billingCycle"
      );

    if (!cs) return jsonResponse({ error: "Service not found" }, 404);

    const svc   = cs.serviceId as unknown as { name: string; basePrice: number; billingCycle: string };
    const price = cs.customPrice ?? svc.basePrice;
    const now   = new Date();
    const month = currentMonth();

    if (type === "service_first") {
      if (cs.status !== "pending_acceptance")
        return jsonResponse({ error: "Service already activated" }, 400);

      cs.status           = "active";
      cs.acceptedAt       = now;
      cs.billingStartDate = now;
      cs.nextBillingDate  = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      cs.lastBilledAt     = now;
      await cs.save();

      const invoiceNo = await nextInvoiceNo(month);
      await ServiceInvoice.create({
        clientId:          cs.clientId,
        invoiceNo,
        month,
        lineItems:         [{ serviceName: svc.name, price, billingCycle: svc.billingCycle }],
        subtotal:          price,
        tax:               0,
        total:             price,
        status:            "paid",
        razorpayPaymentId: razorpay_payment_id,
        paidAt:            now,
      });

      return jsonResponse({ success: true, message: `${svc.name} activated for 1 month.` });
    }

    if (type === "service_renewal") {
      if (cs.status !== "active")
        return jsonResponse({ error: "Service is not active" }, 400);

      const nextDate = new Date(cs.nextBillingDate ?? now);
      nextDate.setMonth(nextDate.getMonth() + 1);
      cs.nextBillingDate = nextDate;
      cs.lastBilledAt    = now;
      await cs.save();

      const invoiceNo = await nextInvoiceNo(month);
      await ServiceInvoice.create({
        clientId:          cs.clientId,
        invoiceNo,
        month,
        lineItems:         [{ serviceName: svc.name, price, billingCycle: svc.billingCycle }],
        subtotal:          price,
        tax:               0,
        total:             price,
        status:            "paid",
        razorpayPaymentId: razorpay_payment_id,
        paidAt:            now,
      });

      return jsonResponse({ success: true, message: `${svc.name} renewed for 1 month.` });
    }

    return jsonResponse({ error: "Unknown payment type" }, 400);

  } catch (e) {
    console.error("[verify-payment]", e);
    return jsonResponse({ error: "Payment verification failed" }, 500);
  }
}

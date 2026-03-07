export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Mandate } from "@/models/Mandate";
import { ServiceInvoice } from "@/models/ServiceInvoice";
import { verifyWebhookSignature } from "@/lib/razorpayMandate";

export async function POST(request: NextRequest) {
  try {
    const body      = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

    if (secret && !verifyWebhookSignature(body, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body) as { event: string; payload: Record<string, unknown> };
    await connectDB();

    switch (event.event) {
      case "subscription.authenticated": {
        const sub = (event.payload as Record<string, { entity: Record<string, unknown> }>).subscription?.entity;
        if (sub?.id) {
          await Mandate.findOneAndUpdate(
            { subscriptionId: sub.id as string },
            { $set: { status: "authenticated" } },
          );
        }
        break;
      }
      case "subscription.activated": {
        const sub = (event.payload as Record<string, { entity: Record<string, unknown> }>).subscription?.entity;
        if (sub?.id) {
          await Mandate.findOneAndUpdate(
            { subscriptionId: sub.id as string },
            { $set: { status: "active", activatedAt: new Date() } },
          );
        }
        break;
      }
      case "subscription.charged": {
        const sub     = (event.payload as Record<string, { entity: Record<string, unknown> }>).subscription?.entity;
        const payment = (event.payload as Record<string, { entity: Record<string, unknown> }>).payment?.entity;
        if (sub?.id && payment?.id) {
          // Mark the most recent sent invoice for this mandate as paid
          const mandate = await Mandate.findOne({ subscriptionId: sub.id as string }).lean();
          if (mandate) {
            await ServiceInvoice.findOneAndUpdate(
              { mandateId: mandate._id, status: "sent" },
              { $set: { status: "paid", razorpayPaymentId: payment.id as string, paidAt: new Date() } },
              { sort: { createdAt: -1 } },
            );
          }
        }
        break;
      }
      case "subscription.payment.failed": {
        const sub = (event.payload as Record<string, { entity: Record<string, unknown> }>).subscription?.entity;
        const err = (event.payload as Record<string, { entity: Record<string, unknown> }>).payment?.entity;
        if (sub?.id) {
          const mandate = await Mandate.findOne({ subscriptionId: sub.id as string }).lean();
          if (mandate) {
            await ServiceInvoice.findOneAndUpdate(
              { mandateId: mandate._id, status: "sent" },
              { $set: { status: "failed", failReason: (err as Record<string, unknown>)?.error_description as string ?? "Payment failed" } },
              { sort: { createdAt: -1 } },
            );
          }
        }
        break;
      }
      case "subscription.cancelled": {
        const sub = (event.payload as Record<string, { entity: Record<string, unknown> }>).subscription?.entity;
        if (sub?.id) {
          await Mandate.findOneAndUpdate(
            { subscriptionId: sub.id as string },
            { $set: { status: "cancelled" } },
          );
        }
        break;
      }
      case "subscription.paused": {
        const sub = (event.payload as Record<string, { entity: Record<string, unknown> }>).subscription?.entity;
        if (sub?.id) {
          await Mandate.findOneAndUpdate(
            { subscriptionId: sub.id as string },
            { $set: { status: "paused" } },
          );
        }
        break;
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    console.error("[webhook/razorpay]", e);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

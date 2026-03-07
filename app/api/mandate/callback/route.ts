export const dynamic = 'force-dynamic'
/**
 * GET /api/mandate/callback
 * Razorpay redirects here after UPI AutoPay / recurring mandate setup.
 * Query params: razorpay_payment_id, razorpay_order_id, razorpay_signature, userId
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { Mandate } from "@/models/Mandate";

export async function GET(request: NextRequest) {
  const p   = request.nextUrl.searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ok     = `${appUrl}/dashboard/client/services?autopay=success`;
  const fail   = `${appUrl}/dashboard/client/services?autopay=failed`;

  const userId            = p.get("userId")                ?? "";
  const paymentId         = p.get("razorpay_payment_id")   ?? "";
  const orderId           = p.get("razorpay_order_id")     ?? "";
  const sig               = p.get("razorpay_signature")    ?? "";
  const paymentLinkStatus = p.get("razorpay_payment_link_status");

  if (!userId || !paymentId) {
    return NextResponse.redirect(fail);
  }

  // Payment link cancelled / failed
  if (paymentLinkStatus && paymentLinkStatus !== "paid") {
    return NextResponse.redirect(fail);
  }

  try {
    // Verify signature (skip if key secret not set)
    const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
    if (keySecret && orderId && sig) {
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
      if (expected !== sig) {
        console.error("[mandate/callback] signature mismatch");
        return NextResponse.redirect(fail);
      }
    }

    await connectDB();

    // Don't create a duplicate
    const existing = await Mandate.findOne({
      clientId: userId,
      status:   { $in: ["active", "authenticated"] },
    });

    if (!existing) {
      await Mandate.create({
        clientId:          userId,
        razorpayMandateId: paymentId,
        subscriptionId:    orderId,
        maxAmount:         15000,
        status:            "authenticated",
        mandateNumber:     1,
        paymentMethod:     "UPI AutoPay",
        activatedAt:       new Date(),
      });
    }

    return NextResponse.redirect(ok);
  } catch (e) {
    console.error("[mandate/callback]", e);
    return NextResponse.redirect(fail);
  }
}

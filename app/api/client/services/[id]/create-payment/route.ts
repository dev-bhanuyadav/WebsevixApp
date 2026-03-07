export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { ClientService } from "@/models/ClientService";
import { Service } from "@/models/Service";
import { getRazorpay, razorpayErrMsg } from "@/lib/razorpay";

interface ClientServiceLean {
  _id: unknown;
  clientId: unknown;
  customPrice?: number | null;
  status: string;
  serviceId: { name: string; basePrice: number; billingCycle: string };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    const payload = await verifyAccessToken(auth);

    const id  = params.id;
    const type = new URL(request.url).searchParams.get("type") || "first";

    await connectDB();

    const cs = await ClientService.findOne({ _id: id, clientId: payload.userId })
      .populate("serviceId", "name basePrice billingCycle")
      .lean()
      .then((doc) => doc as ClientServiceLean | null);

    if (!cs) return jsonResponse({ error: "Service not found" }, 404);

    const svc         = cs.serviceId;
    const amountRupees = cs.customPrice ?? svc.basePrice;
    const amountPaise  = Math.round(amountRupees * 100);

    if (type === "first" && cs.status !== "pending_acceptance")
      return jsonResponse({ error: "Service is not pending acceptance" }, 400);
    if (type === "renewal" && cs.status !== "active")
      return jsonResponse({ error: "Service is not active" }, 400);
    if (amountPaise < 100)
      return jsonResponse({ error: "Minimum amount is ₹1" }, 400);

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) return jsonResponse({ error: "Payment gateway not configured on server" }, 500);

    let order;
    try {
      const rz = getRazorpay();
      order = await rz.orders.create({
        amount:   amountPaise,
        currency: "INR",
        receipt:  `svc_${Date.now()}`,
        notes: {
          clientServiceId: id,
          type: type === "first" ? "service_first" : "service_renewal",
        },
      });
    } catch (rzErr: unknown) {
      const msg = razorpayErrMsg(rzErr);
      console.error("[create-payment] Razorpay error:", msg, rzErr);
      return jsonResponse({ error: `Payment failed: ${msg}` }, 500);
    }

    return jsonResponse({
      success:     true,
      orderId:     order.id,
      keyId,
      amount:      amountPaise,
      amountRupees,
      currency:    "INR",
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[create-payment] Unexpected error:", msg);
    if (msg.includes("jwt") || msg.includes("Unauthorized")) return jsonResponse({ error: "Session expired. Please log in again." }, 401);
    return jsonResponse({ error: `Could not create payment order: ${msg}` }, 500);
  }
}

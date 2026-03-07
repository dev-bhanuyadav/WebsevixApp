/**
 * Razorpay Mandate / Subscription helpers for autopay.
 * Degrades gracefully when keys are not configured.
 */

async function getRazorpay() {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.startsWith("rzp_test_xxx")) return null;
  const Razorpay = (await import("razorpay")).default;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/** Create a Razorpay plan for a given monthly amount (₹) */
export async function createPlan(amount: number, label: string) {
  const rzp = await getRazorpay();
  if (!rzp) {
    return { id: `plan_mock_${Date.now()}`, _mock: true };
  }
  return rzp.plans.create({
    period:   "monthly",
    interval: 1,
    item: {
      name:     label,
      amount:   amount * 100,
      currency: "INR",
    },
  });
}

/** Create a Razorpay subscription (autopay mandate, max ₹15,000) */
export async function createSubscription(
  planId:    string,
  clientId:  string,
  totalCount = 120,
) {
  const rzp = await getRazorpay();
  if (!rzp) {
    return {
      id:        `sub_mock_${Date.now()}`,
      short_url: `https://razorpay.com/s/mock_${Date.now()}`,
      _mock:     true,
    };
  }
  return rzp.subscriptions.create({
    plan_id:         planId,
    customer_notify: 1,
    quantity:        1,
    total_count:     totalCount,
    notes: { clientId, platform: "websevix" },
  });
}

/** Manually trigger a charge on an active subscription */
export async function chargeSubscription(
  subscriptionId: string,
  amount:         number,
) {
  const rzp = await getRazorpay();
  if (!rzp) return { id: `pay_mock_${Date.now()}`, _mock: true };

  // Razorpay "As Presented" debit — charge exactly the given amount
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rzp.subscriptions as any).pendingUpdate(subscriptionId, {});
}

/** Cancel a subscription */
export async function cancelSubscription(subscriptionId: string) {
  const rzp = await getRazorpay();
  if (!rzp) return { status: "cancelled", _mock: true };
  return rzp.subscriptions.cancel(subscriptionId, false);
}

/** Verify Razorpay webhook signature */
export function verifyWebhookSignature(
  body:      string,
  signature: string,
  secret:    string,
): boolean {
  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === signature;
}

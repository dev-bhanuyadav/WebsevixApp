interface RazorpayOptions {
  key: string;
  name: string;
  description?: string;
  image?: string;

  // Regular one-time payment
  order_id?: string;
  amount?: number;
  currency?: string;

  // Subscription / AutoPay (use instead of order_id)
  subscription_id?: string;

  handler?: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void; escape?: boolean };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id:      string;
  razorpay_order_id?:       string;       // regular payment
  razorpay_subscription_id?: string;      // subscription payment
  razorpay_signature:       string;
}

interface RazorpayClass {
  new (options: RazorpayOptions): RazorpayInstance;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: () => void): void;
}

interface Window {
  Razorpay: RazorpayClass;
}

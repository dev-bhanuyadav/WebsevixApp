import Pusher from "pusher";
import PusherJS from "pusher-js";

function getPusherServer(): Pusher {
  const appId     = process.env.PUSHER_APP_ID;
  const key       = process.env.PUSHER_KEY;
  const secret    = process.env.PUSHER_SECRET;
  const cluster   = process.env.PUSHER_CLUSTER ?? "ap2";

  if (!appId || !key || !secret) {
    throw new Error("Pusher server env vars not configured");
  }

  return new Pusher({ appId, key, secret, cluster, useTLS: true });
}

let _pusherServer: Pusher | null = null;
export function getPusher(): Pusher {
  if (!_pusherServer) _pusherServer = getPusherServer();
  return _pusherServer;
}

export function getPusherClient(): PusherJS | null {
  const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "ap2";
  if (!key) return null;
  return new PusherJS(key, { cluster });
}

export function orderChannel(orderId: string): string {
  return `order-${orderId}`;
}

export const PUSHER_EVENTS = {
  NEW_MESSAGE:       "new-message",
  TYPING:            "typing",
  MILESTONE_UPDATE:  "milestone-update",
  ORDER_STATUS:      "order-status",
} as const;

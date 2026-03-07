import { NextResponse } from "next/server";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

export function jsonResponse(data: object, status: number = 200): NextResponse {
  const res = NextResponse.json(data, { status });
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export function getClientIp(request: Request): string {
  const xForwarded = request.headers.get("x-forwarded-for");
  const xReal = request.headers.get("x-real-ip");
  if (xForwarded) return xForwarded.split(",")[0].trim();
  if (xReal) return xReal;
  return "127.0.0.1";
}

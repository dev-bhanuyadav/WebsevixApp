import { NextRequest } from "next/server";
import { verifyAccessToken, type AccessPayload } from "@/lib/jwt";

export async function verifyAdmin(request: NextRequest): Promise<AccessPayload> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.slice(7).trim();
  if (!token) throw new Error("Unauthorized");

  const payload = await verifyAccessToken(token);

  if (payload.role !== "admin") {
    throw new Error("Forbidden");
  }

  return payload;
}

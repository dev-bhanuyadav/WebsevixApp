import { SignJWT, jwtVerify } from "jose";

function getAccessSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
}
function getRefreshSecret() {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_REFRESH_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
}

export interface AccessPayload {
  userId: string;
  email: string;
  role: string;
  type: "access";
}

export interface RefreshPayload {
  userId: string;
  role:   string;
  type:   "refresh";
  jti?:   string;
}

const ACCESS_EXP = "15m";
const REFRESH_EXP = "30d";

export async function signAccessToken(payload: Omit<AccessPayload, "type">): Promise<string> {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(ACCESS_EXP)
    .sign(getAccessSecret());
}

export async function signRefreshToken(payload: Omit<RefreshPayload, "type">): Promise<string> {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(REFRESH_EXP)
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return payload as unknown as AccessPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return payload as unknown as RefreshPayload;
}

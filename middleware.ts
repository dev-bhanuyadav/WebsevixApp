import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedRoutes  = ["/dashboard"];
const adminRoutes      = ["/admin"];
const adminPublicPaths = ["/admin/login"]; // accessible without auth
const authRoutes       = ["/login", "/signup"];

function isAdminPublic(pathname: string): boolean {
  return adminPublicPaths.some(r => pathname === r || pathname.startsWith(r + "/"));
}
function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));
}
function isProtected(pathname: string): boolean {
  return protectedRoutes.some(r => pathname.startsWith(r));
}
function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));
}

async function verifyToken(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as { userId?: string; role?: string };
  } catch { return null; }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken  = request.cookies.get("refreshToken")?.value;
  const adminToken    = request.cookies.get("adminToken")?.value;
  const secret        = process.env.JWT_REFRESH_SECRET ?? "";

  // ── /admin/login is always accessible ──────────────────────────
  if (isAdminPublic(pathname)) {
    // If already logged in as admin, redirect straight to panel
    if (adminToken && secret) {
      const payload = await verifyToken(adminToken, secret);
      if (payload?.role === "admin") {
        const url = request.nextUrl.clone(); url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // ── /admin/* — must have valid adminToken cookie ────────────────
  if (isAdminRoute(pathname)) {
    if (!adminToken || !secret) {
      const url = request.nextUrl.clone(); url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    const payload = await verifyToken(adminToken, secret);
    if (!payload || payload.role !== "admin") {
      const url = request.nextUrl.clone(); url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── /dashboard/* — must be logged in via normal flow ───────────
  let valid = false;
  let role  = "client";
  if (refreshToken && secret) {
    const payload = await verifyToken(refreshToken, secret);
    if (payload) { valid = true; role = payload.role ?? "client"; }
  }

  if (isProtected(pathname) && !valid) {
    const url = request.nextUrl.clone(); url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already logged-in client → skip auth pages
  if (isAuthRoute(pathname) && valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/client";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/login", "/login/:path*",
    "/signup", "/signup/:path*",
  ],
};

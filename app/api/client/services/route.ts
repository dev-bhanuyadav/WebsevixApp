export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";
import { ClientService } from "@/models/ClientService";
import { ServiceInvoice } from "@/models/ServiceInvoice";
import { Service } from "@/models/Service"; // Required for populate to work
import { User } from "@/models/User"; // Required for ClientService populate

export async function GET(request: NextRequest) {
  let payload: { userId: string };
  
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Please log in to view services." }, 401);
    payload = await verifyAccessToken(auth);
  } catch (authErr) {
    const msg = authErr instanceof Error ? authErr.message : String(authErr);
    console.error("[client/services GET] Auth error:", authErr);
    if (msg.includes("expired") || msg.includes("invalid") || msg.includes("jwt")) {
      return jsonResponse({ error: "Session expired. Please log in again." }, 401);
    }
    return jsonResponse({ error: "Authentication failed. Please log in again." }, 401);
  }

  try {
    console.log("[client/services GET] Attempting DB connection...");
    await connectDB();
    console.log("[client/services GET] DB connection successful");
  } catch (dbErr) {
    const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
    console.error("[client/services GET] DB connection error:", dbErr);
    if (msg.includes("MONGODB_URI")) {
      return jsonResponse({ error: "Database not configured. Please contact support.", _debug: "MONGODB_URI missing" }, 503);
    }
    if (msg.includes("MongoNetworkError") || msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      return jsonResponse({ error: "Database temporarily unavailable. Please try again in a moment.", _debug: msg }, 503);
    }
    return jsonResponse({ error: "Database connection failed. Please try again.", _debug: msg }, 503);
  }

  try {
    console.log("[client/services GET] Querying services for user:", payload.userId);
    const [services, invoices] = await Promise.all([
      ClientService.find({ clientId: payload.userId })
        .populate("serviceId", "name description category icon basePrice billingCycle features isMandatory")
        .sort({ createdAt: -1 })
        .lean()
        .catch((err) => {
          console.error("[client/services GET] ClientService query error:", err);
          console.error("[client/services GET] Error details:", err.message);
          return [];
        }),
      ServiceInvoice.find({ clientId: payload.userId })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean()
        .catch((err) => {
          console.error("[client/services GET] ServiceInvoice query error:", err);
          return [];
        }),
    ]);

    const now = new Date();
    const servicesWithDue = services.map((s: { nextBillingDate?: Date; status: string; [k: string]: unknown }) => {
      try {
        const next = s.nextBillingDate ? new Date(s.nextBillingDate) : null;
        const isDue = s.status === "active" && next && next <= now;
        return { ...s, isDue: !!isDue };
      } catch (dateErr) {
        console.error("[client/services GET] Date processing error for service:", s._id, dateErr);
        return { ...s, isDue: false };
      }
    });

    const active = services.filter((s: any) => s.status === "active");
    const monthlyTotal = active.reduce((sum: number, s: any) => {
      try {
        const svc = s.serviceId;
        return sum + (s.customPrice ?? svc?.basePrice ?? 0);
      } catch (calcErr) {
        console.error("[client/services GET] Price calculation error for service:", s._id, calcErr);
        return sum;
      }
    }, 0);

    return jsonResponse({ 
      services: servicesWithDue, 
      invoices, 
      monthlyTotal,
      _debug: {
        servicesCount: services.length,
        invoicesCount: invoices.length,
        userId: payload.userId,
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[client/services GET] Processing error:", e);
    
    if (msg.includes("Cast to ObjectId failed")) {
      return jsonResponse({ error: "Invalid user ID. Please log out and log in again." }, 400);
    }
    if (msg.includes("MongoNetworkError") || msg.includes("timeout")) {
      return jsonResponse({ error: "Database query timed out. Please try again." }, 503);
    }
    
    return jsonResponse({ 
      error: "Failed to load services. Please try again.", 
      _debug: process.env.NODE_ENV === "development" ? msg : undefined 
    }, 500);
  }
}

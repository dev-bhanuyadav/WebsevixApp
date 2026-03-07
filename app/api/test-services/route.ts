export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";

// Simple test endpoint to check what's working
export async function GET(request: NextRequest) {
  try {
    console.log("[test-services] Starting test...");
    
    // Test 1: Basic response
    const tests = {
      basicResponse: true,
      dbConnection: false,
      modelsLoaded: false,
      envVars: {
        mongoUri: !!process.env.MONGODB_URI,
        jwtSecret: !!process.env.JWT_SECRET,
        nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV,
      }
    };

    // Test 2: DB Connection
    try {
      await connectDB();
      tests.dbConnection = true;
      console.log("[test-services] DB connection: SUCCESS");
    } catch (dbErr) {
      console.error("[test-services] DB connection: FAILED", dbErr);
    }

    // Test 3: Model imports
    try {
      const { ClientService } = await import("@/models/ClientService");
      const { Service } = await import("@/models/Service");
      const { User } = await import("@/models/User");
      
      tests.modelsLoaded = true;
      console.log("[test-services] Models loaded: SUCCESS");
      
      // Test a simple query without populate
      if (tests.dbConnection) {
        const count = await ClientService.countDocuments();
        console.log("[test-services] ClientService count:", count);
      }
    } catch (modelErr) {
      console.error("[test-services] Model loading: FAILED", modelErr);
    }

    return jsonResponse({ 
      success: true, 
      tests,
      timestamp: new Date().toISOString(),
      message: "Test endpoint working"
    });
    
  } catch (e) {
    console.error("[test-services] Test failed:", e);
    return jsonResponse({ 
      success: false, 
      error: e instanceof Error ? e.message : String(e),
      timestamp: new Date().toISOString()
    }, 500);
  }
}
export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { jsonResponse } from "@/lib/api";

/**
 * ONE-TIME admin creation endpoint.
 * Protected by ADMIN_SETUP_KEY env var.
 *
 * Usage (call once, then this becomes a no-op):
 *   POST /api/admin/setup
 *   Body: { "setupKey": "your_key_from_env" }
 *
 * Or just visit in browser:
 *   GET /api/admin/setup?key=your_key_from_env
 */

async function createAdmin() {
  await connectDB();

  // If any admin already exists and is properly set up, skip
  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    return { alreadyExists: true, email: existingAdmin.email };
  }

  const email     = (process.env.ADMIN_EMAIL     ?? "admin@websevix.com").toLowerCase().trim();
  const password  = process.env.ADMIN_PASSWORD   ?? "Admin@Websevix2024!";
  const firstName = process.env.ADMIN_FIRST_NAME ?? "Super";
  const lastName  = process.env.ADMIN_LAST_NAME  ?? "Admin";
  const hashed    = await bcrypt.hash(password, 12);

  // If user with this email already exists (wrong role), upgrade them to admin
  const byEmail = await User.findOne({ email });
  if (byEmail) {
    byEmail.role            = "admin";
    byEmail.password        = hashed;
    byEmail.firstName       = firstName;
    byEmail.lastName        = lastName;
    byEmail.isVerified      = true;
    byEmail.isActive        = true;
    byEmail.profileComplete = true;
    await byEmail.save();
    return { created: true, upgraded: true, email, password };
  }

  // Fresh create
  await User.create({
    email,
    password:        hashed,
    firstName,
    lastName,
    phone:           "0000000000",
    role:            "admin",
    isVerified:      true,
    isActive:        true,
    profileComplete: true,
  });

  return { created: true, email, password };
}

export async function GET(request: NextRequest) {
  const key    = request.nextUrl.searchParams.get("key");
  const envKey = process.env.ADMIN_SETUP_KEY ?? "websevix_admin_seed_key_2024";

  if (key !== envKey) {
    return jsonResponse({ error: "Invalid or missing setup key." }, 403);
  }

  try {
    const result = await createAdmin();
    if (result.alreadyExists) {
      return jsonResponse({ message: `Admin already exists: ${result.email}` });
    }
    return jsonResponse({
      message:  result.upgraded ? "Existing user upgraded to admin!" : "Admin created successfully!",
      email:    result.email,
      password: result.password,
      nextStep: "Visit /admin/login and sign in.",
    });
  } catch (e) {
    console.error("[admin/setup]", e);
    return jsonResponse({ error: "Setup failed. Check server logs." }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body   = await request.json() as { setupKey?: string };
    const envKey = process.env.ADMIN_SETUP_KEY ?? "websevix_admin_seed_key_2024";

    if (body.setupKey !== envKey) {
      return jsonResponse({ error: "Invalid or missing setup key." }, 403);
    }

    const result = await createAdmin();
    if (result.alreadyExists) {
      return jsonResponse({ message: `Admin already exists: ${result.email}` });
    }
    return jsonResponse({
      message:  "Admin created successfully!",
      email:    result.email,
      password: result.password,
    });
  } catch (e) {
    console.error("[admin/setup]", e);
    return jsonResponse({ error: "Setup failed." }, 500);
  }
}

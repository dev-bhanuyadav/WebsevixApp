import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, default: null },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, default: "" },
    role: { type: String, enum: ["client", "developer", "admin"], required: true },
    avatar: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    googleId: { type: String, default: null },
    profileComplete: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("ERROR: MONGODB_URI is not set in .env.local");
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME ?? "Admin";
  const lastName = process.env.ADMIN_LAST_NAME ?? "User";

  if (!email || !password) {
    console.error("ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ERROR: ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const User = mongoose.models["User"] ?? mongoose.model("User", UserSchema);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Admin user with email "${email}" already exists (role: ${existing.role}).`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    firstName,
    lastName,
    phone: "",
    role: "admin",
    isVerified: true,
    isActive: true,
    profileComplete: true,
  });

  console.log(`Admin user created successfully:`);
  console.log(`  Email:      ${email}`);
  console.log(`  Name:       ${firstName} ${lastName}`);
  console.log(`  Role:       admin`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Failed to create admin user:", message);
  process.exit(1);
});

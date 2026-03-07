import mongoose, { Schema, model, models } from "mongoose";

export interface IOTP {
  _id: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  type: "login" | "signup" | "reset";
  attempts: number;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    email: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    type: { type: String, enum: ["login", "signup", "reset"], required: true },
    attempts: { type: Number, default: 0, max: 5 },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = models.OTP ?? model<IOTP>("OTP", OTPSchema);

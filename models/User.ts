import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  role: "client" | "developer" | "admin";
  avatar?: string | null;
  isVerified: boolean;
  isActive: boolean;
  googleId?: string | null;
  profileComplete: boolean;
  lastLogin?: Date | null;
  razorpayCustomerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, default: null },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["client", "developer", "admin"], required: true },
    avatar: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    googleId: { type: String, default: null },
    profileComplete: { type: Boolean, default: false },
    lastLogin:           { type: Date,   default: null },
    razorpayCustomerId:  { type: String, default: null },
  },
  { timestamps: true }
);

export const User = models.User ?? model<IUser>("User", UserSchema);

export type UserPublic = Pick<
  IUser,
  "_id" | "email" | "firstName" | "lastName" | "role" | "avatar" | "isVerified" | "profileComplete"
> & { id: string };

export function toPublic(user: IUser): UserPublic {
  return {
    id: user._id.toString(),
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar ?? null,
    isVerified: user.isVerified,
    profileComplete: user.profileComplete,
  };
}

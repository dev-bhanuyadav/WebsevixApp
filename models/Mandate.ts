import mongoose, { Schema, model, models, type Document } from "mongoose";

export type MandateStatus =
  | "created" | "authenticated" | "active" | "paused" | "cancelled" | "expired";

export interface IMandate extends Document {
  _id:                mongoose.Types.ObjectId;
  clientId:           mongoose.Types.ObjectId;
  razorpayMandateId?: string;
  razorpayCustomerId?: string;
  subscriptionId?:    string;
  planId?:            string;
  maxAmount:          number;
  status:             MandateStatus;
  paymentMethod?:     string;
  maskedAccount?:     string;
  bankName?:          string;
  mandateNumber:      number;
  activatedAt?:       Date;
  expiresAt?:         Date;
  shortUrl?:          string;
  createdAt:          Date;
  updatedAt:          Date;
}

const MandateSchema = new Schema<IMandate>(
  {
    clientId:            { type: Schema.Types.ObjectId, ref: "User", required: true },
    razorpayMandateId:   { type: String },
    razorpayCustomerId:  { type: String },
    subscriptionId:      { type: String },
    planId:              { type: String },
    maxAmount:           { type: Number, default: 15000 },
    status: {
      type:    String,
      enum:    ["created","authenticated","active","paused","cancelled","expired"],
      default: "created",
    },
    paymentMethod: { type: String },
    maskedAccount: { type: String },
    bankName:      { type: String },
    mandateNumber: { type: Number, default: 1 },
    activatedAt:   { type: Date },
    expiresAt:     { type: Date },
    shortUrl:      { type: String },
  },
  { timestamps: true },
);

MandateSchema.index({ clientId: 1, status: 1 });
MandateSchema.index({ subscriptionId: 1 });

export const Mandate = models.Mandate ?? model<IMandate>("Mandate", MandateSchema);

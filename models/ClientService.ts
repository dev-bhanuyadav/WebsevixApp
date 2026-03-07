import mongoose, { Schema, model, models, type Document } from "mongoose";

export type ClientServiceStatus =
  | "pending_acceptance" | "active" | "paused" | "cancelled" | "rejected";

export interface IPriceHistoryEntry {
  oldPrice:  number;
  newPrice:  number;
  changedAt: Date;
  changedBy: mongoose.Types.ObjectId;
  reason?:   string;
}

export interface IClientService extends Document {
  _id:              mongoose.Types.ObjectId;
  clientId:         mongoose.Types.ObjectId;
  serviceId:        mongoose.Types.ObjectId;
  customPrice?:     number | null;
  status:           ClientServiceStatus;
  isMandatory:      boolean;
  offeredBy?:       mongoose.Types.ObjectId;
  offeredAt:        Date;
  acceptedAt?:      Date;
  rejectedAt?:      Date;
  billingStartDate?: Date;
  nextBillingDate?:  Date;
  lastBilledAt?:     Date;
  priceHistory:     IPriceHistoryEntry[];
  relatedOrderId?:  mongoose.Types.ObjectId | null;
  notes?:           string;
  createdAt:        Date;
  updatedAt:        Date;
}

const ClientServiceSchema = new Schema<IClientService>(
  {
    clientId:  { type: Schema.Types.ObjectId, ref: "User",    required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    customPrice: { type: Number, default: null },
    status: {
      type:    String,
      enum:    ["pending_acceptance","active","paused","cancelled","rejected"],
      default: "pending_acceptance",
    },
    isMandatory:      { type: Boolean, default: false },
    offeredBy:        { type: Schema.Types.ObjectId, ref: "User" },
    offeredAt:        { type: Date, default: Date.now },
    acceptedAt:       { type: Date },
    rejectedAt:       { type: Date },
    billingStartDate: { type: Date },
    nextBillingDate:  { type: Date },
    lastBilledAt:     { type: Date },
    priceHistory: [{
      oldPrice:  { type: Number },
      newPrice:  { type: Number },
      changedAt: { type: Date },
      changedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reason:    { type: String },
    }],
    relatedOrderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

// One service per client (unique)
ClientServiceSchema.index({ clientId: 1, serviceId: 1 }, { unique: true });
ClientServiceSchema.index({ clientId: 1, status: 1 });
ClientServiceSchema.index({ nextBillingDate: 1, status: 1 });

export const ClientService =
  models.ClientService ?? model<IClientService>("ClientService", ClientServiceSchema);

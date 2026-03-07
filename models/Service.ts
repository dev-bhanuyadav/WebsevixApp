import mongoose, { Schema, model, models, type Document } from "mongoose";

export type ServiceCategory =
  | "hosting" | "maintenance" | "infrastructure"
  | "security" | "domain" | "integration" | "support" | "custom";

export type BillingCycle = "monthly" | "quarterly" | "yearly" | "one-time";

export interface IService extends Document {
  _id: mongoose.Types.ObjectId;
  name:         string;
  description?: string;
  category:     ServiceCategory;
  basePrice:    number;
  billingCycle: BillingCycle;
  isMandatory:  boolean;
  isActive:     boolean;
  icon?:        string;
  features:     string[];
  createdBy?:   mongoose.Types.ObjectId;
  createdAt:    Date;
  updatedAt:    Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name:         { type: String, required: true, trim: true },
    description:  { type: String, default: "" },
    category: {
      type: String,
      enum: ["hosting","maintenance","infrastructure","security","domain","integration","support","custom"],
      default: "custom",
    },
    basePrice:    { type: Number, required: true, min: 0 },
    billingCycle: { type: String, enum: ["monthly","quarterly","yearly","one-time"], default: "monthly" },
    isMandatory:  { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    icon:         { type: String, default: "🛡️" },
    features:     [{ type: String }],
    createdBy:    { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

ServiceSchema.index({ category: 1, isActive: 1 });

export const Service = models.Service ?? model<IService>("Service", ServiceSchema);

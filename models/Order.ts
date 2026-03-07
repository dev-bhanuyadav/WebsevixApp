import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface IMilestone {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: "pending" | "active" | "completed";
  completedAt?: Date;
  order: number;
}

export interface IAISummary {
  projectType?: string;
  description?: string;
  features?: string[];
  designStyle?: string;
  budget?: string;
  timeline?: string;
  references?: string[];
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string;
  clientId: mongoose.Types.ObjectId;
  title: string;
  aiSummary: IAISummary;
  status: "pending_review" | "in_progress" | "completed" | "cancelled";
  milestones: IMilestone[];
  placementFee: number;
  paymentStatus: "paid" | "pending";
  paymentId?: string;
  assignedAdmin?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  status:      { type: String, enum: ["pending", "active", "completed"], default: "pending" },
  completedAt: { type: Date },
  order:       { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true },
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    aiSummary: {
      projectType:  { type: String },
      description:  { type: String },
      features:     [{ type: String }],
      designStyle:  { type: String },
      budget:       { type: String },
      timeline:     { type: String },
      references:   [{ type: String }],
    },
    status: {
      type: String,
      enum: ["pending_review", "in_progress", "completed", "cancelled"],
      default: "pending_review",
    },
    milestones: [MilestoneSchema],
    placementFee:  { type: Number, default: 1 },
    paymentStatus: { type: String, enum: ["paid", "pending"], default: "pending" },
    paymentId:     { type: String },
    assignedAdmin: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// orderId is generated in the API route before Order.create()

export const Order = models.Order ?? model<IOrder>("Order", OrderSchema);

export function toPublicOrder(order: IOrder) {
  return {
    id:            order._id.toString(),
    orderId:       order.orderId,
    clientId:      order.clientId.toString(),
    title:         order.title,
    aiSummary:     order.aiSummary,
    status:        order.status,
    milestones:    order.milestones,
    placementFee:  order.placementFee,
    paymentStatus: order.paymentStatus,
    paymentId:     order.paymentId,
    assignedAdmin: order.assignedAdmin?.toString(),
    createdAt:     order.createdAt,
    updatedAt:     order.updatedAt,
  };
}

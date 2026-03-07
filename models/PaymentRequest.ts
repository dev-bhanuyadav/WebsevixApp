import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface IPaymentRequest extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  amount: number;
  description?: string;
  type: "advance" | "milestone" | "final" | "placement";
  dueDate?: Date;
  status: "pending" | "paid" | "cancelled";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRequestSchema = new Schema<IPaymentRequest>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["advance", "milestone", "final", "placement"],
      required: true,
    },
    dueDate: { type: Date },
    status: { type: String, enum: ["pending", "paid", "cancelled"], default: "pending" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

PaymentRequestSchema.index({ clientId: 1, status: 1 });
PaymentRequestSchema.index({ orderId: 1 });

export const PaymentRequest =
  models.PaymentRequest ?? model<IPaymentRequest>("PaymentRequest", PaymentRequestSchema);

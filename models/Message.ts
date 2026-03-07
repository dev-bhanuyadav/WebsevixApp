import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface IFileAttachment {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: "client" | "admin";
  type: "text" | "file" | "image" | "system" | "payment_request";
  content?: string;
  file?: IFileAttachment;
  // For payment_request messages
  paymentRequestId?: mongoose.Types.ObjectId;
  paymentAmount?: number;
  paymentType?: "advance" | "milestone" | "final";
  paymentStatus?: "pending" | "paid" | "cancelled";
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    orderId:          { type: Schema.Types.ObjectId, ref: "Order", required: true },
    senderId:         { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole:       { type: String, enum: ["client", "admin"], required: true },
    type:             { type: String, enum: ["text", "file", "image", "system", "payment_request"], default: "text" },
    content:          { type: String },
    file: {
      url:      { type: String },
      name:     { type: String },
      size:     { type: Number },
      mimeType: { type: String },
    },
    paymentRequestId: { type: Schema.Types.ObjectId, ref: "PaymentRequest" },
    paymentAmount:    { type: Number },
    paymentType:      { type: String, enum: ["advance", "milestone", "final"] },
    paymentStatus:    { type: String, enum: ["pending", "paid", "cancelled"], default: "pending" },
    isRead:           { type: Boolean, default: false },
    readAt:           { type: Date },
  },
  { timestamps: true }
);

MessageSchema.index({ orderId: 1, createdAt: 1 });

export const Message = models.Message ?? model<IMessage>("Message", MessageSchema);

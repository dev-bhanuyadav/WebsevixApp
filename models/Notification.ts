import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  targetType: "all" | "user" | "segment";
  targetUsers: mongoose.Types.ObjectId[];
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "promo";
  channels: ("in-app" | "email" | "push")[];
  sentBy: mongoose.Types.ObjectId;
  scheduledAt?: Date;
  sentAt?: Date;
  status: "draft" | "scheduled" | "sent" | "failed";
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    targetType: { type: String, enum: ["all", "user", "segment"], required: true },
    targetUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["info", "success", "warning", "promo"], required: true },
    channels: [{ type: String, enum: ["in-app", "email", "push"] }],
    sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "failed"],
      default: "draft",
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

NotificationSchema.index({ status: 1, createdAt: -1 });

export const Notification =
  models.Notification ?? model<INotification>("Notification", NotificationSchema);

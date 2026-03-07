import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface ITicketReplyAttachment {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface ITicketReply extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: "client" | "admin";
  message: string;
  attachments: ITicketReplyAttachment[];
  isInternal: boolean;
  createdAt: Date;
}

const ReplyAttachmentSchema = new Schema(
  { url: String, name: String, size: Number, mimeType: String },
  { _id: false }
);

const TicketReplySchema = new Schema<ITicketReply>(
  {
    ticketId:    { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    senderId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole:  { type: String, enum: ["client", "admin"], required: true },
    message:     { type: String, required: true },
    attachments: { type: [ReplyAttachmentSchema], default: [] },
    isInternal:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

TicketReplySchema.index({ ticketId: 1, createdAt: 1 });

export const TicketReply = models.TicketReply ?? model<ITicketReply>("TicketReply", TicketReplySchema);

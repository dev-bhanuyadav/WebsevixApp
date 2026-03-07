import mongoose, { Schema, model, models, type Document } from "mongoose";

export type TicketCategory =
  | "service_issue"
  | "order_issue"
  | "billing"
  | "account"
  | "general";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_client"
  | "resolved"
  | "closed"
  | "reopened";

export interface ITicketAttachment {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: string;
  clientId: mongoose.Types.ObjectId;
  category: TicketCategory;
  relatedServiceId?: mongoose.Types.ObjectId | null;
  relatedOrderId?: mongoose.Types.ObjectId | null;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: mongoose.Types.ObjectId | null;
  attachments: ITicketAttachment[];
  internalNote?: string | null;
  firstResponseAt?: Date | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  slaDeadline?: Date | null;
  isSlaBreach: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema(
  { url: String, name: String, size: Number, mimeType: String },
  { _id: false }
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketId:         { type: String, unique: true, required: true },
    clientId:         { type: Schema.Types.ObjectId, ref: "User", required: true },
    category:         {
      type: String,
      enum: ["service_issue", "order_issue", "billing", "account", "general"],
      required: true,
    },
    relatedServiceId: { type: Schema.Types.ObjectId, ref: "ClientService", default: null },
    relatedOrderId:   { type: Schema.Types.ObjectId, ref: "Order", default: null },
    subject:          { type: String, required: true, maxlength: 150 },
    description:      { type: String, required: true, maxlength: 2000 },
    priority:          {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "waiting_client", "resolved", "closed", "reopened"],
      default: "open",
    },
    assignedTo:       { type: Schema.Types.ObjectId, ref: "User", default: null },
    attachments:      { type: [AttachmentSchema], default: [] },
    internalNote:     { type: String, default: null },
    firstResponseAt: { type: Date, default: null },
    resolvedAt:      { type: Date, default: null },
    closedAt:         { type: Date, default: null },
    slaDeadline:      { type: Date, default: null },
    isSlaBreach:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

TicketSchema.index({ clientId: 1, status: 1 });
TicketSchema.index({ status: 1, priority: -1 });
TicketSchema.index({ slaDeadline: 1, isSlaBreach: 1 });

export const Ticket = models.Ticket ?? model<ITicket>("Ticket", TicketSchema);

import mongoose, { Schema, model, models, type Document } from "mongoose";

export type InvoiceStatus = "draft" | "sent" | "paid" | "failed" | "refunded";

export interface ILineItem {
  serviceId?:   mongoose.Types.ObjectId;
  serviceName:  string;
  price:        number;
  billingCycle: string;
}

export interface IServiceInvoice extends Document {
  _id:               mongoose.Types.ObjectId;
  clientId:          mongoose.Types.ObjectId;
  invoiceNo:         string;
  month:             string;
  lineItems:         ILineItem[];
  subtotal:          number;
  tax:               number;
  total:             number;
  status:            InvoiceStatus;
  razorpayPaymentId?: string;
  mandateId?:        mongoose.Types.ObjectId;
  dueDate?:          Date;
  paidAt?:           Date;
  failReason?:       string;
  createdAt:         Date;
  updatedAt:         Date;
}

const ServiceInvoiceSchema = new Schema<IServiceInvoice>(
  {
    clientId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    invoiceNo: { type: String, unique: true, required: true },
    month:     { type: String, required: true }, // "2026-03"
    lineItems: [{
      serviceId:   { type: Schema.Types.ObjectId, ref: "Service" },
      serviceName: { type: String },
      price:       { type: Number },
      billingCycle:{ type: String },
    }],
    subtotal:          { type: Number, default: 0 },
    tax:               { type: Number, default: 0 },
    total:             { type: Number, default: 0 },
    status: {
      type:    String,
      enum:    ["draft","sent","paid","failed","refunded"],
      default: "draft",
    },
    razorpayPaymentId: { type: String },
    mandateId:         { type: Schema.Types.ObjectId, ref: "Mandate" },
    dueDate:           { type: Date },
    paidAt:            { type: Date },
    failReason:        { type: String },
  },
  { timestamps: true },
);

ServiceInvoiceSchema.index({ clientId: 1, month: 1 });
ServiceInvoiceSchema.index({ status: 1, dueDate: 1 });

let invoiceCounter = 0;

export async function generateInvoiceNo(month: string): Promise<string> {
  const [year, mon] = month.split("-");
  invoiceCounter++;
  const seq = String(invoiceCounter).padStart(3, "0");
  return `INV-${year}-${mon}-${seq}`;
}

export const ServiceInvoice =
  models.ServiceInvoice ?? model<IServiceInvoice>("ServiceInvoice", ServiceInvoiceSchema);

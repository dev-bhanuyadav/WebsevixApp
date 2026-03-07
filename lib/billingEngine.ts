/**
 * Monthly billing engine — calculates totals, creates invoices, triggers mandates.
 */
import { connectDB } from "@/lib/mongodb";
import { ClientService } from "@/models/ClientService";
import { Mandate } from "@/models/Mandate";
import { ServiceInvoice } from "@/models/ServiceInvoice";
import { Service } from "@/models/Service";
import mongoose from "mongoose";

const MAX_MANDATE_AMOUNT = 15_000;

/** Effective price for a client service */
export function effectivePrice(
  cs: { customPrice?: number | null },
  svc: { basePrice: number },
): number {
  return cs.customPrice != null ? cs.customPrice : svc.basePrice;
}

/** Current billing month string e.g. "2026-03" */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Sequential invoice number generator */
export async function nextInvoiceNo(month: string): Promise<string> {
  const [year, mon] = month.split("-");
  const count = await ServiceInvoice.countDocuments({ month });
  return `INV-${year}-${mon}-${String(count + 1).padStart(3, "0")}`;
}

interface BillingPreviewClient {
  clientId:   string;
  total:      number;
  services:   { name: string; price: number }[];
  mandate?:   { subscriptionId?: string; status: string };
  hasMandate: boolean;
}

// Typed lean document returned from populate query
interface LeanClientService {
  _id:          mongoose.Types.ObjectId;
  clientId:     mongoose.Types.ObjectId;
  customPrice?: number | null;
  serviceId:    { _id: mongoose.Types.ObjectId; name: string; basePrice: number; billingCycle: string };
}

/** Preview: who will be billed and how much this month */
export async function previewMonthlyBilling(): Promise<BillingPreviewClient[]> {
  await connectDB();

  const activeSubs = (await ClientService.find({ status: "active" })
    .populate<{ serviceId: { _id: mongoose.Types.ObjectId; name: string; basePrice: number; billingCycle: string } }>(
      "serviceId", "name basePrice billingCycle",
    )
    .lean()) as unknown as LeanClientService[];

  // Group by client
  const byClient: Record<string, LeanClientService[]> = {};
  for (const cs of activeSubs) {
    const cid = cs.clientId.toString();
    (byClient[cid] ??= []).push(cs);
  }

  const result: BillingPreviewClient[] = [];
  for (const [clientId, subs] of Object.entries(byClient)) {
    const services = subs.map(cs => ({
      name:  cs.serviceId.name,
      price: effectivePrice(cs, cs.serviceId),
    }));
    const total = services.reduce((s, x) => s + x.price, 0);

    const mandate = await Mandate.findOne({
      clientId: new mongoose.Types.ObjectId(clientId),
      status:   "active",
    }).lean();

    result.push({
      clientId,
      total,
      services,
      mandate:    mandate ?? undefined,
      hasMandate: !!mandate,
    });
  }

  return result;
}

interface BillingResult {
  clientId: string;
  status:   "queued" | "no_mandate" | "error";
  invoiceId?: string;
  total?:   number;
  error?:   string;
}

/** Run billing for all clients (or a specific list of clientIds) */
export async function runMonthlyBilling(
  clientIds?: string[],
): Promise<BillingResult[]> {
  await connectDB();

  const month   = currentMonth();
  const preview = await previewMonthlyBilling();
  const targets = clientIds
    ? preview.filter(p => clientIds.includes(p.clientId))
    : preview;

  const results: BillingResult[] = [];

  for (const client of targets) {
    try {
      if (!client.hasMandate) {
        results.push({ clientId: client.clientId, status: "no_mandate", total: client.total });
        continue;
      }

      // Avoid double-billing same month
      const existing = await ServiceInvoice.findOne({
        clientId: new mongoose.Types.ObjectId(client.clientId),
        month,
        status: { $in: ["paid", "sent"] },
      }).lean();
      if (existing) {
        results.push({ clientId: client.clientId, status: "queued", invoiceId: existing._id.toString(), total: client.total });
        continue;
      }

      // Build line items from active services
      const activeSubs = (await ClientService.find({
        clientId: new mongoose.Types.ObjectId(client.clientId),
        status: "active",
      })
        .populate<{ serviceId: { name: string; basePrice: number; billingCycle: string; _id: mongoose.Types.ObjectId } }>(
          "serviceId", "name basePrice billingCycle",
        )
        .lean()) as unknown as LeanClientService[];

      const lineItems = activeSubs.map(cs => ({
        serviceId:    cs.serviceId._id,
        serviceName:  cs.serviceId.name,
        price:        effectivePrice(cs, cs.serviceId),
        billingCycle: cs.serviceId.billingCycle,
      }));

      const subtotal = lineItems.reduce((s, l) => s + l.price, 0);
      const invoiceNo = await nextInvoiceNo(month);

      const invoice = await ServiceInvoice.create({
        clientId:  new mongoose.Types.ObjectId(client.clientId),
        invoiceNo,
        month,
        lineItems,
        subtotal,
        tax:       0,
        total:     subtotal,
        status:    "sent",
        dueDate:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        mandateId: client.mandate
          ? (await Mandate.findOne({ clientId: client.clientId, status: "active" }).lean())?._id
          : undefined,
      });

      results.push({
        clientId:  client.clientId,
        status:    "queued",
        invoiceId: invoice._id.toString(),
        total:     subtotal,
      });

      // Update nextBillingDate for all active ClientServices
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      await ClientService.updateMany(
        { clientId: new mongoose.Types.ObjectId(client.clientId), status: "active" },
        { $set: { lastBilledAt: new Date(), nextBillingDate: nextMonth } },
      );
    } catch (e) {
      results.push({ clientId: client.clientId, status: "error", error: String(e) });
    }
  }

  return results;
}

interface LeanClientServiceMRR {
  _id:          mongoose.Types.ObjectId;
  customPrice?: number | null;
  serviceId:    { basePrice: number; category: string };
}

/** Calculate MRR from all active subscriptions */
export async function calculateMRR(): Promise<{
  total:      number;
  byCategory: Record<string, number>;
  count:      number;
}> {
  await connectDB();

  const activeSubs = (await ClientService.find({ status: "active" })
    .populate<{ serviceId: { basePrice: number; category: string } }>(
      "serviceId", "basePrice category",
    )
    .lean()) as unknown as LeanClientServiceMRR[];

  let total = 0;
  const byCategory: Record<string, number> = {};

  for (const cs of activeSubs) {
    const price = effectivePrice(cs, cs.serviceId);
    total += price;
    const cat = cs.serviceId.category ?? "custom";
    byCategory[cat] = (byCategory[cat] ?? 0) + price;
  }

  return { total, byCategory, count: activeSubs.length };
}

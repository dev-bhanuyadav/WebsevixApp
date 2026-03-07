import type { TicketPriority } from "@/models/Ticket";
import { Ticket } from "@/models/Ticket";
import mongoose from "mongoose";

/** SLA hours by priority: critical=4, high=12, medium=24, low=72 */
export const SLA_HOURS: Record<TicketPriority, number> = {
  critical: 4,
  high:     12,
  medium:   24,
  low:      72,
};

export function getSlaDeadline(priority: TicketPriority): Date {
  const hours = SLA_HOURS[priority];
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

/** Generate next ticketId: TKT-2026-0001 */
export async function generateTicketId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;
  const last = await Ticket.findOne({ ticketId: new RegExp(`^${prefix}`) })
    .sort({ ticketId: -1 })
    .select("ticketId")
    .lean();
  const nextNum = last?.ticketId
    ? parseInt(last.ticketId.replace(prefix, ""), 10) + 1
    : 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export function isTicketClosed(status: string): boolean {
  return status === "closed";
}

export function canClientReply(status: string): boolean {
  return !["closed"].includes(status);
}

export function canClientClose(status: string): boolean {
  return status === "resolved";
}

export function canClientReopen(status: string): boolean {
  return status === "resolved" || status === "closed";
}

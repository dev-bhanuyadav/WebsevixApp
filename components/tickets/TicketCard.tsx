"use client";

import Link from "next/link";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { SLATimer } from "./SLATimer";
import type { TicketStatus, TicketPriority } from "@/models/Ticket";

interface TicketCardProps {
  _id: string;
  ticketId: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  relatedServiceId?: { serviceId?: { name?: string } } | null;
  relatedOrderId?: { orderId?: string; title?: string } | null;
  createdAt: string;
  updatedAt: string;
  slaDeadline?: Date | string | null;
  isSlaBreach?: boolean;
  lastReplyAt?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  service_issue: "Service Issue",
  order_issue:   "Order/Project",
  billing:       "Billing",
  account:       "Account",
  general:       "General",
};

function formatAgo(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (m < 60) return m <= 1 ? "Just now" : `${m} min ago`;
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  return `${day} day${day > 1 ? "s" : ""} ago`;
}

export function TicketCard(props: TicketCardProps) {
  const {
    _id,
    ticketId,
    subject,
    status,
    priority,
    category,
    relatedServiceId,
    relatedOrderId,
    createdAt,
    slaDeadline,
    isSlaBreach,
  } = props;

  const serviceName = (relatedServiceId as { serviceId?: { name?: string } } | null)?.serviceId?.name ?? null;
  const orderRef = (relatedOrderId as { orderId?: string; title?: string } | null)?.orderId
    || (relatedOrderId as { orderId?: string; title?: string } | null)?.title;

  return (
    <Link href={`/dashboard/client/tickets/${_id}`}>
      <div
        className="rounded-xl border p-4 transition-all hover:border-white/15"
        style={{
          background: isSlaBreach ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.025)",
          border: isSlaBreach ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-indigo-400">#{ticketId}</span>
            <TicketPriorityBadge priority={priority} />
            <TicketStatusBadge status={status} />
          </div>
          {slaDeadline && (
            <SLATimer deadline={slaDeadline} isBreach={!!isSlaBreach} compact />
          )}
        </div>
        <h3 className="text-snow font-medium mt-2 line-clamp-1">{subject}</h3>
        <p className="text-xs text-slate mt-1">
          {CATEGORY_LABELS[category] || category}
          {serviceName && ` • ${serviceName}`}
          {orderRef && ` • ${orderRef}`}
          {" • "}
          Raised {formatAgo(createdAt)}
        </p>
        <p className="text-xs text-slate/80 mt-1">Last update: {formatAgo(props.updatedAt)}</p>
        <div className="mt-3 flex justify-end">
          <span className="text-xs text-indigo-400 font-medium">View Ticket →</span>
        </div>
      </div>
    </Link>
  );
}

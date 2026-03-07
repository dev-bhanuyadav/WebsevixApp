"use client";

import { motion } from "framer-motion";

interface Reply {
  _id: string;
  message: string;
  senderRole: string;
  senderId?: { firstName?: string; lastName?: string };
  createdAt: string;
  attachments?: { url: string; name: string }[];
  isInternal?: boolean;
}

interface TicketThreadProps {
  replies: Reply[];
  currentUserId?: string;
}

export function TicketThread({ replies }: TicketThreadProps) {
  return (
    <div className="space-y-4">
      {replies.map((r) => {
        const isAdmin = r.senderRole === "admin";
        const isInternal = r.isInternal;
        const name = r.senderId
          ? `${(r.senderId as { firstName?: string }).firstName ?? ""} ${(r.senderId as { lastName?: string }).lastName ?? ""}`.trim() || "Support"
          : isAdmin ? "Support" : "You";

        if (isInternal) {
          return (
            <motion.div
              key={r._id}
              className="flex justify-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="rounded-lg px-3 py-1.5 text-xs text-slate bg-white/[0.04] border border-amber-500/20 text-amber-200/90 max-w-md text-center">
                Internal note (admin only)
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={r._id}
            className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                isAdmin
                  ? "rounded-tl-md bg-white/[0.06] border border-white/10"
                  : "rounded-tr-md text-white"
              }`}
              style={!isAdmin ? { background: "linear-gradient(135deg,#6366F1,#7C3AED)" } : {}}
            >
              <p className="text-[10px] font-medium opacity-80 mb-0.5">{name}</p>
              <p className="text-sm whitespace-pre-wrap break-words">{r.message}</p>
              {(r.attachments ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.attachments!.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline opacity-90"
                    >
                      {a.name}
                    </a>
                  ))}
                </div>
              )}
              <p className="text-[10px] opacity-70 mt-1">
                {new Date(r.createdAt).toLocaleString()}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

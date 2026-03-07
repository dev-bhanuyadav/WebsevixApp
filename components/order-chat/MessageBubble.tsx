"use client";

import { motion } from "framer-motion";
import type { IMessage } from "@/models/Message";
import { FileMessage } from "./FileMessage";
import { SystemMessage } from "./SystemMessage";

interface MessageBubbleProps {
  message: IMessage & { _id: { toString(): string } };
  isOwn: boolean;
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  if (message.type === "system") return <SystemMessage content={message.content ?? ""} />;

  const isFile  = message.type === "file" || message.type === "image";

  return (
    <motion.div
      className={`flex items-end gap-2 mb-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white self-start mt-1"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
          A
        </div>
      )}

      <div className={`max-w-[70%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {isFile && message.file ? (
          <FileMessage file={message.file} isOwn={isOwn} />
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isOwn
                ? "rounded-br-sm text-white"
                : "rounded-bl-sm text-silver"
            }`}
            style={
              isOwn
                ? { background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 2px 10px rgba(99,102,241,0.2)" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
            }
          >
            {message.content}
          </div>
        )}

        <div className={`flex items-center gap-1.5 text-xs text-slate ${isOwn ? "flex-row-reverse" : ""}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && (
            <span className="text-indigo-400" title={message.isRead ? "Read" : "Sent"}>
              {message.isRead ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

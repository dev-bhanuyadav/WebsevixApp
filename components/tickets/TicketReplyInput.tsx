"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface TicketReplyInputProps {
  onSend: (message: string, attachments: { url: string; name: string; size: number; mimeType: string }[]) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function TicketReplyInput({ onSend, disabled, placeholder = "Type your reply..." }: TicketReplyInputProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    try {
      await onSend(trimmed, []);
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-xl border border-white/10 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="w-full resize-none rounded-lg px-3 py-2 text-sm text-snow placeholder:text-slate outline-none bg-white/[0.04] border border-white/10 disabled:opacity-50"
      />
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!message.trim() || sending || disabled}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#6366F1,#7C3AED)" }}
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send
        </button>
      </div>
    </div>
  );
}

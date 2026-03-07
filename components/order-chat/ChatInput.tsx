"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, X } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  uploading?: boolean;
}

export function ChatInput({ onSend, onFileSelect, disabled, uploading }: ChatInputProps) {
  const [text,     setText]     = useState("");
  const [preview,  setPreview]  = useState<{ name: string; file: File } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (preview) {
      onFileSelect(preview.file);
      setPreview(null);
      return;
    }
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPreview({ name: f.name, file: f });
    e.target.value = "";
  };

  return (
    <div className="border-t border-white/[0.06] px-4 pt-3 pb-4 space-y-2">
      {/* File preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
          >
            <span className="text-xs text-indigo-300 flex-1 truncate">{preview.name}</span>
            <button onClick={() => setPreview(null)} className="text-slate hover:text-silver">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.zip,.doc,.docx,.txt"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="p-3 rounded-xl text-slate hover:text-silver hover:bg-white/[0.05] border border-white/[0.08] transition-colors flex-shrink-0 disabled:opacity-40"
        >
          <Paperclip size={16} />
        </button>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={uploading ? "Uploading file…" : "Type a message…"}
          disabled={disabled || uploading || !!preview}
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm text-snow placeholder-slate/50 bg-white/[0.05] border border-white/[0.09] focus:outline-none focus:border-indigo-500/40 transition-colors disabled:opacity-50"
          style={{ maxHeight: 120 }}
        />

        <motion.button
          onClick={handleSend}
          disabled={(!text.trim() && !preview) || disabled || uploading}
          className="p-3 rounded-xl text-white flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{ background: (text.trim() || preview) ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "rgba(255,255,255,0.06)" }}
          whileTap={{ scale: 0.92 }}
        >
          {uploading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : <Send size={16} />}
        </motion.button>
      </div>
    </div>
  );
}

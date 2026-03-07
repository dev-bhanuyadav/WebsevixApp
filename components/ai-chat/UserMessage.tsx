"use client";

import { motion } from "framer-motion";

interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <motion.div
      className="flex justify-end mb-4"
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="max-w-[70%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white leading-relaxed"
        style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 2px 12px rgba(99,102,241,0.2)" }}
      >
        {content}
      </div>
    </motion.div>
  );
}

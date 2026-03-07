"use client";

import { motion } from "framer-motion";

export function SystemMessage({ content }: { content: string }) {
  return (
    <motion.div
      className="flex items-center justify-center my-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs text-slate border border-white/[0.07] bg-white/[0.03]">
        <span className="w-1 h-1 rounded-full bg-slate" />
        {content}
      </div>
    </motion.div>
  );
}

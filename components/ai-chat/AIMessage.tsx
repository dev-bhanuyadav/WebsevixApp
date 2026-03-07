"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QuickReplyChips, CheckboxGroup } from "./QuickReplyChips";

interface AIMessageProps {
  content: string;
  showChips?: string[];
  showCheckboxes?: string[];
  isLatest?: boolean;
  onChipSelect?: (chip: string) => void;
  onCheckboxConfirm?: (vals: string[]) => void;
  disabled?: boolean;
}

export function AIMessage({
  content, showChips, showCheckboxes, isLatest, onChipSelect, onCheckboxConfirm, disabled
}: AIMessageProps) {
  const [displayed, setDisplayed] = useState(isLatest ? "" : content);
  const [checkSelected, setCheckSelected] = useState<string[]>([]);

  // Typewriter for latest AI message
  useEffect(() => {
    if (!isLatest) return;
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(content.slice(0, i + 1));
      i++;
      if (i >= content.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [content, isLatest]);

  const done = displayed.length === content.length;

  return (
    <motion.div
      className="flex items-end gap-2.5 mb-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* AI Avatar */}
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white self-start mt-1"
        style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", boxShadow: "0 0 12px rgba(99,102,241,0.35)" }}>
        V
      </div>

      <div className="max-w-[75%] space-y-2">
        {/* Bubble */}
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-silver leading-relaxed whitespace-pre-line"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {displayed}
          {isLatest && !done && (
            <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
          )}
        </div>

        {/* Chips (show after typewriter done) */}
        {done && showChips && !showCheckboxes && (
          <QuickReplyChips chips={showChips} onSelect={s => onChipSelect?.(s)} disabled={disabled} />
        )}
        {done && showCheckboxes && (
          <CheckboxGroup
            options={showCheckboxes}
            selected={checkSelected}
            onChange={setCheckSelected}
            onConfirm={() => { onCheckboxConfirm?.(checkSelected); }}
          />
        )}
      </div>
    </motion.div>
  );
}

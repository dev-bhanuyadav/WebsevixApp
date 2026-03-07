"use client";

import { motion } from "framer-motion";

interface QuickReplyChipsProps {
  chips: string[];
  onSelect: (chip: string) => void;
  disabled?: boolean;
}

export function QuickReplyChips({ chips, onSelect, disabled }: QuickReplyChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {chips.map((chip, i) => (
        <motion.button
          key={chip}
          onClick={() => !disabled && onSelect(chip)}
          disabled={disabled}
          className="px-3.5 py-1.5 rounded-full text-sm font-medium border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/15 hover:border-indigo-500/50 hover:text-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{ background: "rgba(99,102,241,0.06)" }}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {chip}
        </motion.button>
      ))}
    </div>
  );
}

interface CheckboxGroupProps {
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  onConfirm: () => void;
}

export function CheckboxGroup({ options, selected, onChange, onConfirm }: CheckboxGroupProps) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            onClick={() => toggle(opt)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm border transition-colors ${
              selected.includes(opt)
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
                : "border-white/[0.08] bg-white/[0.03] text-slate hover:border-white/20 hover:text-silver"
            }`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${
              selected.includes(opt) ? "border-indigo-500 bg-indigo-500" : "border-white/20"
            }`}>
              {selected.includes(opt) && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            {opt}
          </motion.button>
        ))}
      </div>
      {selected.length > 0 && (
        <motion.button
          onClick={onConfirm}
          className="w-full py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.98 }}
        >
          Confirm {selected.length} feature{selected.length > 1 ? "s" : ""} →
        </motion.button>
      )}
    </div>
  );
}

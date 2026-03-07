"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, X, ZoomIn } from "lucide-react";
import type { IFileAttachment } from "@/models/Message";

interface FileMessageProps {
  file: IFileAttachment;
  isOwn: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileMessage({ file, isOwn }: FileMessageProps) {
  const [lightbox, setLightbox] = useState(false);
  const isImage = file.mimeType?.startsWith("image/");

  return (
    <>
      {isImage ? (
        <div
          className="relative rounded-xl overflow-hidden cursor-pointer max-w-[240px] group"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          onClick={() => setLightbox(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.url} alt={file.name} className="w-full h-auto max-h-48 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ZoomIn size={20} className="text-white" />
          </div>
        </div>
      ) : (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border max-w-[240px] hover:opacity-90 transition-opacity ${
            isOwn
              ? "bg-indigo-500/30 border-indigo-500/40"
              : "bg-white/[0.04] border-white/[0.08]"
          }`}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-500/20">
            <FileText size={18} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-snow truncate font-medium">{file.name}</p>
            <p className="text-xs text-slate">{formatSize(file.size)}</p>
          </div>
          <Download size={15} className="text-slate flex-shrink-0" />
        </a>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLightbox(false)}
            >
              <button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={() => setLightbox(false)}
              >
                <X size={18} />
              </button>
              <motion.img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-[90vh] rounded-xl object-contain"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

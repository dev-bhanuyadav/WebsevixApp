"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { SystemMessage } from "./SystemMessage";
import { useAuth } from "@/hooks/useAuth";
import type { IMessage } from "@/models/Message";

interface ChatWindowProps {
  orderId: string;
}

type MsgWithId = IMessage & { _id: { toString(): string }; createdAt: Date };

export function ChatWindow({ orderId }: ChatWindowProps) {
  const { user, accessToken } = useAuth();
  const [messages,  setMessages]  = useState<MsgWithId[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (!orderId || !accessToken) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res  = await fetch(`/api/messages/${orderId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json();
        if (!cancelled) setMessages(data.messages ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [orderId, accessToken]);

  useEffect(scrollBottom, [messages, scrollBottom]);

  // Poll for new messages every 8 seconds
  useEffect(() => {
    if (!orderId || !accessToken) return;
    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`/api/messages/${orderId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json();
        setMessages(data.messages ?? []);
      } catch { /* ignore */ }
    }, 8000);
    return () => clearInterval(interval);
  }, [orderId, accessToken]);

  const sendText = async (content: string) => {
    if (!content.trim()) return;
    try {
      const res = await fetch(`/api/messages/${orderId}`, {
        method:  "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${accessToken}` },
        body:    JSON.stringify({ type: "text", content }),
      });
      const data = await res.json();
      if (data.message) setMessages(prev => [...prev, data.message]);
    } catch (e) { console.error(e); }
  };

  const sendFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method:  "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body:    fd,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.file) return;

      const isImage = file.type.startsWith("image/");
      const res = await fetch(`/api/messages/${orderId}`, {
        method:  "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${accessToken}` },
        body:    JSON.stringify({ type: isImage ? "image" : "file", content: file.name, file: uploadData.file }),
      });
      const data = await res.json();
      if (data.message) setMessages(prev => [...prev, data.message]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0"
        style={{ background: "rgba(7,7,15,0.6)", backdropFilter: "blur(8px)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-snow">Project Chat</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate">Admin · Websevix Team</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <svg className="w-6 h-6 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm text-silver font-medium">No messages yet</p>
            <p className="text-xs text-slate max-w-48">Send a message to connect with the Websevix team about your project</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <MessageBubble
                key={msg._id?.toString()}
                message={msg}
                isOwn={msg.senderId?.toString() === user?.id || msg.senderRole === "client"}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <ChatInput
        onSend={sendText}
        onFileSelect={sendFile}
        disabled={loading}
        uploading={uploading}
      />
    </div>
  );
}

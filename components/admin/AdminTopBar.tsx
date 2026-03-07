"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, Search, Bell, Plus } from "lucide-react";

interface AdminTopBarProps {
  onMobileMenuOpen: () => void;
  title?: string;
  notificationCount?: number;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function AdminTopBar({
  onMobileMenuOpen,
  title,
  notificationCount = 0,
}: AdminTopBarProps) {
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [greeting] = useState(getGreeting);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-6"
      style={{
        height: 64,
        background: "#0a0a12",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        color: "#F8FAFC",
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate hover:text-snow hover:bg-white/5 transition-all flex-shrink-0"
      >
        <Menu size={18} />
      </button>

      {/* Greeting + page title */}
      <div className="flex flex-col min-w-0" style={{ color: "#F8FAFC" }}>
        <span className="text-xs leading-tight hidden sm:block" style={{ color: "#64748B" }}>
          {greeting}, Admin&nbsp;👑
        </span>
        <span className="text-sm font-semibold leading-tight truncate" style={{ color: "#F8FAFC" }}>
          {title ?? "Dashboard"}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Live clock */}
      <div
        className="hidden md:flex items-center px-3 py-1.5 rounded-lg text-xs font-mono text-silver flex-shrink-0"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {clock}
      </div>

      {/* Search */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          width: 220,
        }}
      >
        <Search size={14} className="text-slate flex-shrink-0" />
        <input
          type="text"
          placeholder="Search orders, users…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-sm text-snow placeholder-slate outline-none w-full"
        />
      </div>

      {/* Notification bell */}
      <button className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate hover:text-snow hover:bg-white/5 transition-all flex-shrink-0">
        <Bell size={17} />
        {notificationCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold"
            style={{ background: "#EF4444" }}
          >
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>

      {/* New Orders quick action */}
      <Link
        href="/admin/orders?status=pending_review"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
          boxShadow: "0 0 18px rgba(99,102,241,0.25)",
        }}
      >
        <Plus size={14} />
        New Orders
      </Link>
    </motion.header>
  );
}

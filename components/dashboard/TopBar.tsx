"use client";

import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MobileMenuButton } from "./Sidebar";

interface TopBarProps {
  title?: string;
  onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 py-3.5 border-b border-white/[0.05]"
      style={{ background: "rgba(7,7,15,0.85)", backdropFilter: "blur(12px)" }}>
      <MobileMenuButton onClick={onMenuClick} />

      {title && (
        <h1 className="font-display font-semibold text-base text-snow hidden sm:block">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-3">
        <button className="relative p-2 rounded-xl text-slate hover:text-silver hover:bg-white/[0.05] transition-colors">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </button>

        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 cursor-pointer"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
          {user?.firstName?.[0]?.toUpperCase() ?? "U"}
        </div>
      </div>
    </header>
  );
}

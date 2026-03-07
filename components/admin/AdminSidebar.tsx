"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  LayoutDashboard,
  Package,
  Users,
  MessageSquare,
  Bell,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  Ticket,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  pendingOrdersCount?: number;
  unreadMessagesCount?: number;
  openTicketsCount?: number;
}

const NAV_ITEMS = (pendingOrdersCount: number, unreadMessagesCount: number, ticketsCount?: number): NavItem[] => [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: Package, badge: pendingOrdersCount },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare, badge: unreadMessagesCount },
  { label: "Tickets", href: "/admin/tickets", icon: Ticket, badge: ticketsCount },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Services", href: "/admin/services", icon: Shield },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({
  mobileOpen,
  onMobileClose,
  pendingOrdersCount = 0,
  unreadMessagesCount = 0,
  openTicketsCount = 0,
}: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const navItems = NAV_ITEMS(pendingOrdersCount, unreadMessagesCount, openTicketsCount);
  const { logoWide, logoSquare } = useSiteSettings();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      await logout();
      router.push("/admin/login");
    }
  };

  const renderBody = (isMobile = false) => {
    const showLabels = isMobile || !collapsed;
    return (
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{
          width: isMobile ? 260 : collapsed ? 72 : 260,
          background: "rgba(6,6,8,0.98)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          transition: "width 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Logo */}
        <div className="relative flex items-center h-16 px-4 flex-shrink-0 overflow-hidden">
          {/* Pulse glow under logo */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-8 opacity-0 animate-pulse-slow"
            style={{
              background: "radial-gradient(ellipse, rgba(99,102,241,0.55), transparent 70%)",
              animationDelay: "0s",
              opacity: 0.35,
            }}
          />
          {/* Logo area:
               collapsed → square icon only
               expanded  → wide logo (contains icon+text) OR square+text fallback */}
          {showLabels && logoWide
            /* ── Expanded + wide logo set → show wide logo only ── */
            ? <div
                className="relative z-10 flex items-center gap-2 ml-1"
                style={{ maxWidth: 160, overflow: "hidden" }}
              >
                <img src={logoWide} alt="Websevix" style={{ height: 28, width: "auto", objectFit: "contain" }} />
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.28)" }}
                >
                  Admin
                </span>
              </div>
            /* ── Collapsed or no wide logo → square icon always visible ── */
            : <>
                <div
                  className="relative z-10 flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden"
                  style={logoSquare ? {} : { background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
                >
                  {logoSquare
                    ? <img src={logoSquare} alt="logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
                    : <span className="font-display font-bold text-base text-white select-none">W</span>
                  }
                </div>
                {/* Brand text — only when expanded */}
                <div
                  className="overflow-hidden flex items-center gap-2 ml-3 whitespace-nowrap"
                  style={{
                    maxWidth: showLabels ? 160 : 0,
                    opacity: showLabels ? 1 : 0,
                    transition: "max-width 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.2s",
                  }}
                >
                  <span className="font-display font-bold text-snow text-base">Websevix</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.28)" }}
                  >
                    Admin
                  </span>
                </div>
              </>
          }

          {/* Mobile close / Desktop collapse toggle */}
          {isMobile ? (
            <button
              onClick={onMobileClose}
              className="ml-auto z-10 p-1 rounded-lg text-slate hover:text-snow hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-6 h-6 rounded-md text-slate hover:text-snow hover:bg-white/5 transition-all"
            >
              {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const hasBadge = typeof item.badge === "number" && item.badge > 0;

            return (
              <Link key={item.href} href={item.href} onClick={isMobile ? onMobileClose : undefined}>
                <motion.div
                  whileHover={{ x: active ? 0 : 2 }}
                  transition={{ duration: 0.15 }}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(139,92,246,0.07) 100%)"
                      : "transparent",
                    borderLeft: `2px solid ${active ? "#6366F1" : "transparent"}`,
                    boxShadow: active ? "0 0 18px rgba(99,102,241,0.1)" : "none",
                  }}
                >
                  {/* Icon */}
                  <div className="relative flex-shrink-0">
                    <Icon size={17} style={{ color: active ? "#818CF8" : "#64748B" }} />
                    {hasBadge && !showLabels && (
                      <span
                        className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-3.5 h-3.5 rounded-full text-white text-[9px] font-bold"
                        style={{ background: "#EF4444" }}
                      >
                        {item.badge! > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>

                  {/* Label + badge */}
                  <div
                    className="flex items-center justify-between overflow-hidden whitespace-nowrap"
                    style={{
                      flex: showLabels ? "1 1 0%" : "0 0 0px",
                      maxWidth: showLabels ? 180 : 0,
                      opacity: showLabels ? 1 : 0,
                      transition: "max-width 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.2s",
                    }}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: active ? "#F8FAFC" : "#64748B" }}
                    >
                      {item.label}
                    </span>
                    {hasBadge && (
                      <span
                        className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          color: "#EF4444",
                          border: "1px solid rgba(239,68,68,0.25)",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: "#EF4444" }}
                        />
                        {item.badge! > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom admin profile */}
        <div
          className="px-3 py-4 space-y-1 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3 px-1 py-1.5">
            {/* Avatar */}
            <div
              className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 font-display font-bold text-sm text-white select-none"
              style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
            >
              A
            </div>
            <div
              className="flex flex-col overflow-hidden whitespace-nowrap"
              style={{
                maxWidth: showLabels ? 160 : 0,
                opacity: showLabels ? 1 : 0,
                transition: "max-width 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.2s",
              }}
            >
              <span className="text-sm font-semibold text-snow">Admin</span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full w-fit mt-0.5"
                style={{
                  background: "rgba(99,102,241,0.14)",
                  color: "#818CF8",
                  border: "1px solid rgba(99,102,241,0.24)",
                }}
              >
                Super Admin
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-red-500/10 group"
          >
            <LogOut
              size={16}
              className="flex-shrink-0 transition-colors text-slate group-hover:text-red-400"
            />
            <span
              className="text-sm font-medium transition-colors text-slate group-hover:text-red-400 overflow-hidden whitespace-nowrap"
              style={{
                maxWidth: showLabels ? 140 : 0,
                opacity: showLabels ? 1 : 0,
                transition: "max-width 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.2s",
              }}
            >
              Logout
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop fixed sidebar */}
      <div
        className="hidden lg:flex h-screen sticky top-0 flex-shrink-0"
        style={{
          width: collapsed ? 72 : 260,
          transition: "width 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {renderBody(false)}
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="sb-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              key="sb-drawer"
              initial={{ x: -270 }}
              animate={{ x: 0 }}
              exit={{ x: -270 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 h-full z-50"
            >
              {renderBody(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  LayoutDashboard, Sparkles, Package, MessageSquare,
  User, LogOut, ChevronLeft, ChevronRight, X, Menu, Shield, Ticket,
} from "lucide-react";

const NAV = [
  { href: "/dashboard/client",            label: "Overview",    icon: LayoutDashboard },
  { href: "/dashboard/client/new-order",  label: "New Order",   icon: Sparkles,  highlight: true },
  { href: "/dashboard/client/orders",     label: "My Orders",   icon: Package },
  { href: "/dashboard/client/messages",   label: "Messages",    icon: MessageSquare },
  { href: "/dashboard/client/services",   label: "My Services", icon: Shield },
  { href: "/dashboard/client/tickets",    label: "Support Tickets", icon: Ticket },
  { href: "/dashboard/client/profile",    label: "Profile",     icon: User },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { logoWide, logoSquare } = useSiteSettings();

  const isActive = (href: string) =>
    href === "/dashboard/client" ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className="flex flex-col h-full"
      style={{ background: "linear-gradient(180deg, #09091A 0%, #07070F 100%)" }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-5 border-b border-white/[0.06] ${collapsed && !mobile ? "justify-center px-0" : ""}`}>
        {(collapsed && !mobile)
          /* ── Collapsed: square icon only ── */
          ? <motion.div
              className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
              style={logoSquare ? {} : { background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
              whileHover={{ scale: 1.08, boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {logoSquare
                ? <img src={logoSquare} alt="logo" style={{ width: 32, height: 32, objectFit: "contain" }} />
                : <span className="font-display font-bold text-sm text-white">W</span>
              }
            </motion.div>
          /* ── Expanded / mobile: wide logo OR square+text ── */
          : logoWide
              ? <img src={logoWide} alt="Websevix" style={{ height: 32, width: "auto", objectFit: "contain" }} />
              : <>
                  <motion.div
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={logoSquare ? {} : { background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                    whileHover={{ scale: 1.08, boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {logoSquare
                      ? <img src={logoSquare} alt="logo" style={{ width: 32, height: 32, objectFit: "contain" }} />
                      : <span className="font-display font-bold text-sm text-white">W</span>
                    }
                  </motion.div>
                  <span className="font-display font-bold text-base text-snow tracking-tight">Websevix</span>
                </>
        }

        {mobile && (
          <button onClick={onMobileClose} className="ml-auto text-slate hover:text-silver p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={mobile ? onMobileClose : undefined}>
              <motion.div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group transition-colors duration-150 ${
                  active
                    ? "bg-indigo-500/10 text-snow"
                    : "text-slate hover:text-silver hover:bg-white/[0.04]"
                } ${collapsed && !mobile ? "justify-center px-0" : ""}`}
                whileHover={{ x: collapsed && !mobile ? 0 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {/* Active left border */}
                {active && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full"
                    style={{ background: "linear-gradient(to bottom,#6366F1,#8B5CF6)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Highlight glow for New Order */}
                {item.highlight && (
                  <div className="absolute inset-0 rounded-xl"
                    style={{ background: active ? "rgba(99,102,241,0.08)" : "transparent",
                             boxShadow: active ? "0 0 12px rgba(99,102,241,0.15) inset" : "none" }} />
                )}

                <item.icon
                  size={18}
                  className={`flex-shrink-0 ${
                    active ? "text-indigo-400" :
                    item.highlight ? "text-violet-400 group-hover:text-violet-300" :
                    "text-slate group-hover:text-silver"
                  }`}
                />

                {(!collapsed || mobile) && (
                  <span className={`text-sm font-medium ${item.highlight && !active ? "text-violet-300" : ""}`}>
                    {item.label}
                  </span>
                )}

                {/* Tooltip on collapsed */}
                {collapsed && !mobile && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-surface border border-white/10
                    text-xs text-snow whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50
                    shadow-lg transition-opacity duration-150">
                    {item.label}
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + logout */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3 space-y-1">
        {(!collapsed || mobile) ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
              {user?.firstName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-snow font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">Client</span>
            </div>
          </div>
        ) : null}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate hover:text-red-400 hover:bg-red-500/5 transition-colors group ${collapsed && !mobile ? "justify-center px-0" : ""}`}
        >
          <LogOut size={16} className="flex-shrink-0 group-hover:text-red-400" />
          {(!collapsed || mobile) && <span className="text-sm">Sign out</span>}
          {collapsed && !mobile && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-surface border border-white/10
              text-xs text-snow whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50
              shadow-lg transition-opacity duration-150">
              Sign out
            </div>
          )}
        </button>

        {/* Collapse toggle — desktop only */}
        {!mobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate hover:text-silver hover:bg-white/[0.04] transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-xs">Collapse</span></>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-white/[0.06] overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-72 z-50 lg:hidden flex flex-col border-r border-white/[0.06]"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-xl text-slate hover:text-snow hover:bg-white/[0.06] transition-colors"
    >
      <Menu size={20} />
    </button>
  );
}

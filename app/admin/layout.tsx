"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { NewOrderToastProvider } from "@/components/admin/NewOrderToast";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/users": "Users",
  "/admin/messages": "Messages",
  "/admin/tickets": "Tickets",
  "/admin/notifications": "Notifications",
  "/admin/payments": "Payments",
  "/admin/services": "Services",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

interface DashboardStats {
  pendingReview: number;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const { accessToken, isLoading } = useAuth();

  const pageTitle = pathname
    ? (ADMIN_PAGE_TITLES[pathname] ?? (pathname.replace("/admin", "").replace(/^\//, "") || "Dashboard"))
    : "Dashboard";

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/dashboard/stats", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then((d: DashboardStats) => {
        if (typeof d.pendingReview === "number") setPendingOrders(d.pendingReview);
      })
      .catch(console.error);
  }, [accessToken]);

  // While auth is initializing show a minimal spinner
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060608]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
            W
          </div>
          <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <NewOrderToastProvider>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: "#060608" }}
      >
        <AdminSidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          pendingOrdersCount={pendingOrders}
        />
        <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#060608" }}>
          <AdminTopBar title={pageTitle} onMobileMenuOpen={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-auto p-6" style={{ background: "#060608", color: "#F8FAFC" }}>
            {children}
          </main>
        </div>
      </div>
    </NewOrderToastProvider>
  );
}

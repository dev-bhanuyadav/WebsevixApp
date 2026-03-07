"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    // All users are clients — direct redirect
    window.location.href = "/dashboard/client";
  }, [user, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <div className="flex items-center gap-3 text-slate">
        <svg className="w-5 h-5 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading…
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function AppHomeFooter() {
  const { logoSquare } = useSiteSettings();

  return (
    <footer className="px-4 sm:px-6 py-8 border-t border-white/[0.06]">
      <div className="max-w-lg mx-auto flex flex-col items-center gap-4 text-center">
        <Link href="/" className="flex items-center gap-2 text-snow/90 hover:text-snow transition-colors">
          {logoSquare ? (
            <img src={logoSquare} alt="Websevix" className="w-8 h-8 rounded-lg object-contain" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
            >
              <span className="font-display font-bold text-white text-sm">W</span>
            </div>
          )}
          <span className="font-display font-semibold text-sm">Websevix</span>
        </Link>
        <p className="text-xs text-slate max-w-xs">
          Professional web development. Chat with us, we build, you get your site.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/login" className="text-slate hover:text-snow transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Get started
          </Link>
        </div>
      </div>
    </footer>
  );
}

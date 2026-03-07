"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FilePlus2,
  Package,
  MessageSquare,
  User,
  ChevronRight,
} from "lucide-react";
const EXPO = [0.16, 1, 0.3, 1] as const;

const actions = [
  {
    label: "New order",
    description: "Start a new website project",
    href: "/dashboard/client/new-order",
    icon: FilePlus2,
    accent: "indigo",
  },
  {
    label: "My orders",
    description: "Track and manage orders",
    href: "/dashboard/client/orders",
    icon: Package,
    accent: "violet",
  },
  {
    label: "Messages",
    description: "Chat with the team",
    href: "/dashboard/client/messages",
    icon: MessageSquare,
    accent: "cyan",
  },
  {
    label: "Profile",
    description: "Account settings",
    href: "/dashboard/client/profile",
    icon: User,
    accent: "emerald",
  },
] as const;

const accentClasses: Record<string, string> = {
  indigo: "bg-indigo-500/12 border-indigo-500/20 text-indigo-400",
  violet: "bg-violet-500/12 border-violet-500/20 text-violet-400",
  cyan: "bg-cyan-500/12 border-cyan-500/20 text-cyan-400",
  emerald: "bg-emerald-500/12 border-emerald-500/20 text-emerald-400",
};

export default function AppQuickActions() {

  return (
    <section className="px-4 sm:px-6 pb-8">
      <div className="max-w-lg mx-auto">
        <motion.h2
          className="font-display font-semibold text-lg text-snow mb-4 px-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EXPO, delay: 0.25 }}
        >
          Quick actions
        </motion.h2>
        <ul className="space-y-2">
          {actions.map((item, i) => {
            const Icon = item.icon;
            const accent = accentClasses[item.accent] ?? accentClasses.indigo;
            return (
              <motion.li
                key={item.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EXPO, delay: 0.3 + i * 0.05 }}
              >
                <Link
                  href={item.href}
                  className="card card-hover flex items-center gap-4 p-4 rounded-2xl group"
                >
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${accent}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-snow">{item.label}</p>
                    <p className="text-xs text-slate truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
                </Link>
              </motion.li>
            );
          })}
        </ul>
        <p className="text-xs text-slate mt-4 px-1 text-center">
          Sign in to access orders, messages and profile.
        </p>
      </div>
    </section>
  );
}

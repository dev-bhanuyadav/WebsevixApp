"use client";

import { motion } from "framer-motion";
import { FileText, MessageSquare, Wallet, Briefcase } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const EXPO = [0.16, 1, 0.3, 1] as const;

function SignOutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => { await logout(); router.push("/"); }}
      className="text-sm text-slate hover:text-snow transition-colors"
    >
      Sign out
    </button>
  );
}

export default function DeveloperDashboardPage() {
  const { user } = useAuth();
  const stats = [
    { label: "Active proposals",    value: "0", icon: FileText     },
    { label: "Completed projects",  value: "0", icon: MessageSquare },
    { label: "Earnings",            value: "—", icon: Wallet        },
  ];

  return (
    <div className="min-h-screen bg-base">
      <header className="border-b border-white/5 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-lg text-snow">Websevix</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate">{user?.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <motion.h1
          className="font-display font-bold text-2xl sm:text-3xl text-snow mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EXPO }}
        >
          Welcome back, {user?.firstName ?? "there"}!
        </motion.h1>
        <motion.p
          className="text-slate mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EXPO, delay: 0.1 }}
        >
          Find projects and manage your work.
        </motion.p>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="card card-hover p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EXPO, delay: 0.15 + i * 0.08 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-violet-400" />
                </div>
                <span className="text-sm text-slate">{s.label}</span>
              </div>
              <p className="font-display font-bold text-2xl text-snow">{s.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="font-display font-semibold text-lg text-snow mb-4">Available projects</h2>
          <div className="card p-8 text-center text-slate">
            <p className="mb-4">No projects available right now.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold hover:opacity-95 transition-opacity"
            >
              <Briefcase className="w-4 h-4" /> Browse projects
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

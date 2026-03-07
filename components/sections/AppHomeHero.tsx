"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
const EXPO = [0.16, 1, 0.3, 1] as const;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AppHomeHero() {

  return (
    <section className="relative pt-safe pb-8 px-4 sm:px-6">
      {/* Subtle top gradient — no heavy visuals for app */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(100%,400px)] h-48 bg-radial-glow opacity-80" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto text-center">
        <motion.p
          className="text-slate text-sm font-medium mb-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EXPO }}
        >
          {greeting()}
        </motion.p>
        <motion.h1
          className="font-display font-bold text-3xl sm:text-4xl text-snow tracking-tight mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EXPO, delay: 0.08 }}
        >
          Welcome to{" "}
          <span className="text-gradient-live">Websevix</span>
        </motion.h1>
        <motion.p
          className="text-slate text-base leading-relaxed mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EXPO, delay: 0.14 }}
        >
          Order your website. We chat, build, and deliver — simple and transparent.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EXPO, delay: 0.2 }}
        >
          <Link
            href="/login"
            className="text-sm font-medium text-slate hover:text-snow px-5 py-2.5 rounded-xl transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="btn-primary btn-shimmer inline-flex items-center gap-2 text-sm px-6 py-3 rounded-xl w-full sm:w-auto justify-center"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

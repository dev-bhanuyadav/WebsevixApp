"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EXPO = [0.16, 1, 0.3, 1] as const;

export default function CTASection() {
  const rm = useReducedMotion();

  return (
    <section className="section relative overflow-hidden">
      <div className="sep" />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {!rm && (
          <>
            <motion.div
              className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(99,102,241,0.28), transparent 65%)", filter: "blur(80px)" }}
              animate={{ x:[0,50,-35,0], y:[0,-45,30,0], scale:[1,1.12,0.9,1] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[-5%] right-[15%] w-[500px] h-[500px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 65%)", filter: "blur(60px)" }}
              animate={{ x:[0,-30,20,0], y:[0,30,-20,0], scale:[1,0.9,1.1,1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "56px 56px" }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-16 text-center">
        <motion.div
          className="card p-12 sm:p-16 relative overflow-hidden"
          style={{
            border: "1px solid rgba(99,102,241,0.18)",
            boxShadow: "0 0 0 1px rgba(99,102,241,0.08), 0 30px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, ease: EXPO }}
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
          <div className="absolute top-0 left-0 w-40 h-40" style={{ background: "radial-gradient(circle at top left, rgba(99,102,241,0.07), transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-40 h-40" style={{ background: "radial-gradient(circle at bottom right, rgba(139,92,246,0.07), transparent 70%)" }} />

          <motion.p
            className="text-xs font-semibold text-indigo-400 uppercase tracking-[0.22em] mb-5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EXPO, delay: 0.2 }}
          >
            Get Started
          </motion.p>

          <motion.h2
            className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-snow leading-[1.08] mb-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, ease: EXPO, delay: 0.3 }}
          >
            Let's build your web.{" "}
            <span className="text-gradient-live">Chat with us.</span>
          </motion.h2>

          <motion.p
            className="text-slate text-base sm:text-lg leading-[1.85] max-w-lg mx-auto mb-10 font-light"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, ease: EXPO, delay: 0.4 }}
          >
            Share your idea on live chat. We'll understand what you need and build your site. No pressure — just a clear, human conversation.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, ease: EXPO, delay: 0.5 }}
          >
            <Link href="#contact" className="btn-primary btn-shimmer inline-flex items-center gap-2 text-base px-9 py-4 w-full sm:w-auto justify-center">
              Chat with us <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <Link href="#how-it-works" className="btn-ghost inline-flex items-center gap-2 text-base px-9 py-4 w-full sm:w-auto justify-center">
              How it works
            </Link>
          </motion.div>

          <motion.p
            className="mt-6 text-xs text-dim"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EXPO, delay: 0.7 }}
          >
            Chat with us · We build your web · Transparent, step by step
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

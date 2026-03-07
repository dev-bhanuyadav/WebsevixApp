"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MessageSquare, Wrench } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ─── Easing ─── */
const EXPO   = [0.16, 1, 0.3, 1] as const;
const SMOOTH = [0.25, 0.1, 0.25, 1] as const;

/* ─── Hero words ─── */
const LINE_1 = ["Chat", "With", "Us."];
const LINE_2 = ["We", "Build", "Your", "Web."];

/* ─── Mockup: order progress ─── */
const PHASES = [
  { label: "Brief & Quote", pct: 100 },
  { label: "Design",        pct: 100 },
  { label: "Development",   pct: 70  },
  { label: "Launch",        pct: 0   },
];

export default function Hero() {
  const rm = useReducedMotion();

  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-28 pb-24">

      {/* ══ Background ══ */}
      <div className="absolute inset-0 bg-[#050510]">
        {/* Top radial glow */}
        <div className="absolute inset-0 bg-radial-glow" />

        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        {/* Animated aurora orbs — 18s cycle */}
        {!rm && (
          <>
            <motion.div
              className="absolute top-[10%] left-[15%] w-[700px] h-[700px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%)", filter: "blur(40px)" }}
              animate={{ scale:[1,1.14,1], opacity:[0.6,1,0.6], x:[0,50,-30,0], y:[0,-40,25,0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[10%] right-[10%] w-[550px] h-[550px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)", filter: "blur(40px)" }}
              animate={{ scale:[1,1.1,1], opacity:[0.5,0.85,0.5], x:[0,-40,20,0], y:[0,35,-20,0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            />
            <motion.div
              className="absolute top-[40%] right-[25%] w-[300px] h-[300px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 65%)", filter: "blur(30px)" }}
              animate={{ scale:[1,1.2,1], opacity:[0.3,0.7,0.3] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 7 }}
            />
          </>
        )}
      </div>

      {/* ══ Page-load reveal line ══ */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[9998] origin-left"
        style={{ background: "linear-gradient(90deg, #6366F1, #A78BFA, #22D3EE)" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, ease: EXPO, delay: 0.2 }}
      />

      {/* ══ Center content ══ */}
      <div className="relative z-10 flex flex-col items-center text-center px-5 sm:px-8 w-full max-w-5xl mx-auto">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EXPO, delay: 0.6 }}
          className="mb-9"
        >
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold tracking-[0.16em] uppercase border border-indigo-500/25 bg-indigo-500/8 text-indigo-300">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            Professional Web Development
          </span>
        </motion.div>

        {/* Headline — cinematic word-by-word push-up reveal */}
        <h1 className="font-display font-bold leading-[1.04] tracking-tight text-[2.8rem] sm:text-[3.8rem] lg:text-[5.2rem] xl:text-[6rem] mb-8 select-none">

          {/* Line 1 */}
          <span className="flex flex-wrap items-center justify-center gap-x-[0.22em] overflow-hidden">
            {LINE_1.map((w, i) => (
              <motion.span
                key={w}
                className="inline-block text-snow"
                initial={{ y: "105%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: EXPO, delay: 0.75 + i * 0.18 }}
              >
                {w}
              </motion.span>
            ))}
          </span>

          {/* Line 2 — gradient-animated */}
          <span className="flex flex-wrap items-center justify-center gap-x-[0.22em] overflow-hidden mt-1">
            {LINE_2.map((w, i) => (
              <motion.span
                key={w}
                className="inline-block text-gradient-live"
                initial={{ y: "105%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: EXPO, delay: 1.1 + i * 0.18 }}
              >
                {w}
              </motion.span>
            ))}
          </span>
        </h1>

        {/* Subtext */}
        <motion.p
          className="text-base sm:text-lg lg:text-xl text-slate max-w-2xl leading-[1.75] mb-11 font-light"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: EXPO, delay: 1.7 }}
        >
          Share your idea over live chat. We understand what you need,{" "}
          <span className="text-silver font-medium">build your website</span>, and deliver.
          No runaround — just a clear, human conversation and a site you’ll love.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex items-center justify-center mb-11"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: EXPO, delay: 1.9 }}
        >
          <Link href="/login" className="btn-primary btn-shimmer inline-flex items-center gap-2 text-[15px] px-10 py-4 w-full sm:w-auto justify-center">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Trust chips */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, ease: EXPO, delay: 2.1 }}
        >
          {[
            { icon: MessageSquare, text: "Live chat — we're here" },
            { icon: Wrench, text: "We build your web" },
            { icon: CheckCircle2, text: "Transparent, step by step" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-sm text-slate">
              <Icon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              {text}
            </div>
          ))}
        </motion.div>

        {/* ── Platform Mockup ── */}
        <motion.div
          className="w-full max-w-3xl"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EXPO, delay: 2.0 }}
        >
          <motion.div
            animate={rm ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Browser chrome */}
            <div
              className="card shadow-card-float overflow-hidden"
              style={{ boxShadow: "0 30px 100px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.1)" }}
            >
              {/* Title bar */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.015]">
                <div className="flex gap-1.5">
                  {["#FF5F57","#FEBC2E","#28C840"].map((c) => (
                    <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-slate">
                    websevix.com
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7 grid sm:grid-cols-3 gap-4">

                {/* Left: project card */}
                <div className="sm:col-span-2 flex flex-col gap-4">

                  <div className="bg-white/[0.018] rounded-xl border border-white/[0.06] p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <motion.span
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2.5 py-1 mb-2"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          In Progress
                        </motion.span>
                        <h3 className="font-display font-semibold text-snow text-sm">Business Website — Order #1024</h3>
                        <p className="text-[11px] text-slate mt-0.5">Landing + 5 pages · Responsive</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate mb-0.5">Order #1024</p>
                        <p className="font-display font-bold text-snow text-lg">In progress</p>
                      </div>
                    </div>

                    {/* Phases */}
                    <div className="space-y-2.5">
                      {PHASES.map((m, mi) => (
                        <div key={m.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[11px] ${m.pct === 100 ? "text-slate line-through" : "text-silver"}`}>
                              {m.label}
                            </span>
                            <span className={`text-[10px] font-semibold ${m.pct === 100 ? "text-emerald-400" : m.pct > 0 ? "text-indigo-400" : "text-dim"}`}>
                              {m.pct}%
                            </span>
                          </div>
                          <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${m.pct === 100 ? "bg-emerald-500" : m.pct > 0 ? "bg-gradient-to-r from-indigo-500 to-violet-400" : "bg-transparent"}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${m.pct}%` }}
                              transition={{ duration: 1.4, ease: EXPO, delay: 2.5 + mi * 0.2 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: live chat + Razorpay */}
                <div className="flex flex-col gap-3">
                  <div className="bg-white/[0.018] rounded-xl border border-white/[0.06] p-4">
                    <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.14em] mb-3">Live Chat</p>
                    <div className="space-y-2.5 mb-3">
                      <div className="flex justify-end">
                        <span className="text-[11px] text-snow bg-indigo-500/20 border border-indigo-500/25 rounded-lg px-2.5 py-1.5 max-w-[85%]">
                          When will the design be ready?
                        </span>
                      </div>
                      <div className="flex justify-start">
                        <span className="text-[11px] text-snow bg-white/[0.06] border border-white/[0.08] rounded-lg px-2.5 py-1.5 max-w-[85%]">
                          By Friday. We’ll share a preview link.
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/[0.04] flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[10px] text-slate">Websevix team · Online</span>
                    </div>
                  </div>

                  <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <p className="text-[11px] font-semibold text-snow">Confirmed</p>
                    </div>
                    <p className="text-xs text-emerald-400/90">We're on it</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge: phase delivered */}
            <motion.div
              className="absolute -bottom-6 -right-3 sm:-right-10 card border border-white/[0.1] px-4 py-2.5 flex items-center gap-2.5"
              style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EXPO, delay: 3.0 }}
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-snow">Phase delivered</p>
                <p className="text-[10px] text-slate">Design approved</p>
              </div>
            </motion.div>

            {/* Floating badge: live chat */}
            <motion.div
              className="absolute -top-6 -left-3 sm:-left-10 card border border-white/[0.1] px-4 py-2.5 flex items-center gap-2.5"
              style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}
              initial={{ opacity: 0, scale: 0.7, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EXPO, delay: 3.3 }}
            >
              <motion.div
                className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              </motion.div>
              <div>
                <p className="text-[11px] font-semibold text-snow">Live chat</p>
                <p className="text-[10px] text-slate">We’re here to help</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}

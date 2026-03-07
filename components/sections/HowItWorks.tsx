"use client";

import { motion } from "framer-motion";
import { MessageSquare, FileCheck, Wrench, ArrowRight } from "lucide-react";

const EXPO = [0.16, 1, 0.3, 1] as const;

const steps = [
  {
    num: "01",
    Icon: MessageSquare,
    title: "Share Your Idea",
    desc: "Tell us what you need — over live chat. We listen, ask the right questions, and understand your vision. No forms, no friction. Just a clear conversation.",
    tag: "We're here to listen",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/18",
    glow: "rgba(99,102,241,0.12)",
  },
  {
    num: "02",
    Icon: FileCheck,
    title: "Align & Confirm",
    desc: "We share a clear plan and scope. When you're ready, we confirm next steps. Simple and transparent — so you know exactly what you're getting.",
    tag: "No surprises",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/18",
    glow: "rgba(139,92,246,0.12)",
  },
  {
    num: "03",
    Icon: Wrench,
    title: "We Build, You Stay in the Loop",
    desc: "We build your website. You stay updated over chat — see progress, share feedback, and get your site delivered. Just us, no middlemen.",
    tag: "We build for you",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/18",
    glow: "rgba(34,211,238,0.1)",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section relative overflow-hidden">
      <div className="sep" />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-20">

        <motion.div
          className="text-center mb-18 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.0, ease: EXPO }}
        >
          <motion.p
            className="text-xs font-semibold text-indigo-400 uppercase tracking-[0.22em] mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EXPO, delay: 0.15 }}
          >
            How it works
          </motion.p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[2.9rem] text-snow leading-[1.1] mb-5">
            Chat with us.
            <br />
            <span className="text-gradient">We build your web.</span>
          </h2>
          <p className="text-slate text-base leading-[1.8]">
            Share your idea, stay in touch over live chat. We build and deliver — no marketplace, no runaround.
          </p>
        </motion.div>

        <div className="hidden md:block relative h-0 mb-0 z-10">
          <div className="absolute" style={{ top: "3.5rem", left: "calc(16.66% + 2rem)", right: "calc(16.66% + 2rem)", height: "1px" }}>
            <motion.div
              className="w-full h-full origin-left"
              style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5), rgba(34,211,238,0.5))" }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: EXPO, delay: 0.3 }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="relative group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.0, ease: EXPO, delay: i * 0.18 }}
            >
              <div
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 50%, ${step.glow}, transparent 75%)`, filter: "blur(16px)" }}
              />
              <div className="card card-hover h-full p-7 flex flex-col gap-5 relative">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl border ${step.bg} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                    <step.Icon className={`w-5.5 h-5.5 ${step.color}`} />
                  </div>
                  <span className={`font-display font-black text-5xl leading-none select-none ${step.color} opacity-10 group-hover:opacity-25 transition-opacity duration-700`}>
                    {step.num}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-snow text-lg mb-2.5 leading-snug">{step.title}</h3>
                  <p className="text-slate text-sm leading-[1.85]">{step.desc}</p>
                </div>
                <div className={`inline-flex items-center gap-2 text-xs font-semibold ${step.color}`}>
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-current"
                    animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.25, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {step.tag}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="flex justify-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EXPO, delay: 0.5 }}
        >
          <a href="#contact" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors duration-500 group">
            Start the conversation
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-500" style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

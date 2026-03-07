"use client";

import { motion } from "framer-motion";
import { Globe, Palette, ShoppingCart, Layers, Smartphone, Plug, ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EXPO = [0.16, 1, 0.3, 1] as const;

const services = [
  { Icon: Globe,        title: "Web Development",  desc: "Custom websites, landing pages, full-stack web apps", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/15" },
  { Icon: Palette,      title: "UI/UX Design",      desc: "Figma design systems, user flows, click-through prototypes", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/15" },
  { Icon: ShoppingCart, title: "E-commerce",        desc: "Shopify, WooCommerce, headless storefronts", color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/15" },
  { Icon: Layers,       title: "SaaS Development",  desc: "Multi-tenant apps, dashboards, subscription billing", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/15" },
  { Icon: Smartphone,   title: "Mobile Apps",       desc: "React Native & Expo for iOS and Android", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/15" },
  { Icon: Plug,         title: "API & Integrations",desc: "REST, GraphQL, webhooks, third-party connections", color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/15" },
];

export default function Categories() {
  const rm = useReducedMotion();

  return (
    <section id="services" className="section relative overflow-hidden">
      <div className="sep" />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-20">

        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.0, ease: EXPO }}
        >
          <div>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-[0.22em] mb-4">Services</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-[2.9rem] text-snow leading-[1.1]">
              What can we help<br />
              <span className="text-gradient">you build?</span>
            </h2>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-indigo-400 transition-colors duration-500 group shrink-0"
          >
            Browse all services
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-500" />
          </a>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            return (
              <motion.a
                key={s.title}
                href="#"
                className="card card-hover group p-6 flex items-start gap-4 cursor-pointer"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 1.0, ease: EXPO, delay: (row + col) * 0.09 }}
              >
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl border ${s.bg} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                  <s.Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-semibold text-snow text-[15px] leading-snug">{s.title}</h3>
                    <ArrowUpRight className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  </div>
                  <p className="text-sm text-slate mt-1.5 leading-[1.75]">{s.desc}</p>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

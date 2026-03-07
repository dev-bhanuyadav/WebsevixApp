"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin } from "lucide-react";

const EXPO = [0.16, 1, 0.3, 1] as const;

const cols = [
  { head: "Platform", links: ["How It Works", "Browse Services", "Post a Project", "For Developers"] },
  { head: "Company",  links: ["About",         "Blog",            "Careers",          "Press"         ] },
  { head: "Legal",    links: ["Privacy Policy","Terms of Service","Cookie Policy",    "Security"      ] },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, ease: EXPO }}
        >
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M3 8h7M3 11h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </div>
              <span className="font-display font-bold text-[17px] text-snow">Websevix</span>
            </Link>
            <p className="text-slate text-sm leading-[1.8] max-w-[210px] mb-6">
              The trusted marketplace for getting web projects built right.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Github,   href: "#", label: "GitHub"   },
                { Icon: Twitter,  href: "#", label: "Twitter"  },
                { Icon: Linkedin, href: "#", label: "LinkedIn" },
              ].map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-9 h-9 rounded-lg border border-white/[0.07] flex items-center justify-center text-slate hover:text-snow hover:border-indigo-500/25 hover:bg-indigo-500/8 transition-all duration-500"
                  style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col, ci) => (
            <motion.div
              key={col.head}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EXPO, delay: (ci + 1) * 0.1 }}
            >
              <p className="font-display font-semibold text-snow text-sm mb-5">{col.head}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link href="#"
                      className="text-sm text-slate hover:text-silver transition-colors duration-500 inline-block"
                      style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}>
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <div className="sep mb-7" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-dim text-xs">&copy; {new Date().getFullYear()} Websevix. All rights reserved.</p>
          <p className="text-dim text-xs">Made with ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
}

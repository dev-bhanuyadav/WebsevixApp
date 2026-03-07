"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import styles from "./Navbar.module.css";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { logoWide, logoSquare } = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goAuth = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    try {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      sessionStorage.setItem("blast_origin", JSON.stringify({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }));
    } catch { /* ignore */ }
    router.push(href);
  }, [router]);

  return (
    <>
      <header
        className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}
        role="banner"
      >
        {/* Liquid glass bg layer — filter + blur only here, content stays sharp */}
        <div className={styles.liquidBg} aria-hidden />
        <div className={styles.inner}>
          {/* Logo — Websevix PNG (wide or square from site settings) */}
          <Link href="/" className={styles.logo}>
            {(logoWide || logoSquare) ? (
              <img
                src={logoWide || logoSquare}
                alt="Websevix"
                style={{ height: 32, width: "auto", objectFit: "contain" }}
              />
            ) : (
              <>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 5h10M3 8h7M3 11h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <span className={styles.logoText}>Websevix</span>
              </>
            )}
          </Link>

          {/* Center nav */}
          <nav className={styles.nav}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Sign In + CTA */}
          <div className={styles.actions}>
            <Link href="/login" onClick={(e) => goAuth(e, "/login")} className={styles.signIn}>
              Sign In
            </Link>
            <Link href="/signup" onClick={(e) => goAuth(e, "/signup")} className={styles.cta}>
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={styles.hamburger}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile menu — slide down glass panel */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className={styles.mobileOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.div
              className={styles.mobilePanel}
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "tween", duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className={styles.mobileHeader}>
                <Link href="/" className={styles.logo} onClick={() => setMobileOpen(false)}>
                  {logoWide ? (
                    <img src={logoWide} alt="Websevix" />
                  ) : (
                    <>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {logoSquare ? (
                          <img src={logoSquare} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 5h10M3 8h7M3 11h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                      <span className={styles.logoText}>Websevix</span>
                    </>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className={styles.hamburger}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className={styles.mobileNav}>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={styles.mobileNavLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className={styles.mobileActions}>
                <Link
                  href="/login"
                  className={styles.mobileSignIn}
                  onClick={(e) => { setMobileOpen(false); goAuth(e, "/login"); }}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className={styles.mobileCta}
                  onClick={(e) => { setMobileOpen(false); goAuth(e, "/signup"); }}
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

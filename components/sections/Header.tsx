"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const LOGO_URL = "https://res.cloudinary.com/dm50qybtk/image/upload/v1772594157/ebsevix_X-Design_ci4jlo.png";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { logoWide } = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .glass-header {
          font-family: 'DM Sans', sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 0 2rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-header.scrolled {
          padding: 0 2rem;
        }

        .glass-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 68px;
          border-radius: 0 0 24px 24px;
          padding: 0 1.5rem;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.08) 100%
          );
          backdrop-filter: blur(24px) saturate(200%) brightness(1.1);
          -webkit-backdrop-filter: blur(24px) saturate(200%) brightness(1.1);
          border: 1px solid rgba(255, 255, 255, 0.28);
          border-top: none;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.35),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            inset 0 -1px 0 rgba(255, 255, 255, 0.08);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .glass-inner::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 45%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.12),
            transparent
          );
          animation: shimmer 4s infinite;
          pointer-events: none;
        }

        .glass-inner::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.6) 30%,
            rgba(255,255,255,0.6) 70%,
            transparent
          );
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 250%; }
        }

        .glass-header.scrolled .glass-inner {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.22) 0%,
            rgba(255, 255, 255, 0.12) 100%
          );
          backdrop-filter: blur(32px) saturate(220%) brightness(1.15);
          -webkit-backdrop-filter: blur(32px) saturate(220%) brightness(1.15);
          box-shadow:
            0 16px 48px rgba(0, 0, 0, 0.45),
            0 4px 12px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.45),
            inset 0 -1px 0 rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.35);
        }

        .logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.4rem;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
          position: relative;
          z-index: 1;
        }

        .logo span {
          background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        .logo img {
          display: block;
          height: 42px;
          width: auto;
          object-fit: contain;
          vertical-align: middle;
          filter: brightness(0) invert(1);
        }

        @media (max-width: 768px) {
          .logo img {
            height: 36px;
          }
        }
      `}</style>

      <header className={`glass-header ${scrolled ? "scrolled" : ""}`}>
        <div className="glass-inner">
          <Link href="/" className="logo">
            <img src={logoWide || LOGO_URL} alt="Websevix" />
          </Link>
        </div>
      </header>
    </>
  );
}

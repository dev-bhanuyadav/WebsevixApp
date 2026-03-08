import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Body font — DM Sans: clean, modern humanist
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Display font — Space Grotesk: geometric, premium SaaS feel
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Websevix — Web App",
  description:
    "Order your website. Chat with us, we build it, and deliver. Simple and transparent.",
  keywords: ["web development", "website order", "web app", "Websevix"],
  authors: [{ name: "Websevix" }],
  icons: {
    icon:      "/api/site-settings/icon",
    shortcut:  "/api/site-settings/icon",
    apple:     "/api/site-settings/icon",
  },
  openGraph: {
    title: "Websevix — Web App",
    description: "Order your website. Chat with us, we build it, and deliver.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Websevix — Web App",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Websevix",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#050510",
  viewportFit: "cover",
};

import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans bg-base text-snow antialiased" style={{ backgroundColor: "#050510", minHeight: "100vh" }}>
        <svg aria-hidden style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
          <defs>
            <filter id="liquid-refract" x="-10%" y="-10%" width="120%" height="120%">
              {/* Organic noise map */}
              <feTurbulence type="fractalNoise" baseFrequency="0.018 0.018" numOctaves="3" seed="8" result="noise" />
              {/* Soften the noise so distortion is smooth, not jagged */}
              <feGaussianBlur in="noise" stdDeviation="3" result="blurredNoise" />
              {/* Displace source — scale 18 gives visible edge refraction without chaos */}
              <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="18" xChannelSelector="R" yChannelSelector="G" result="displaced" />
              {/* Slight composite blur to blend displaced edges */}
              <feGaussianBlur in="displaced" stdDeviation="0.4" />
            </filter>
          </defs>
        </svg>
        <SiteSettingsProvider>
          <AuthProvider>
            <div className="noise-overlay" aria-hidden />
            {children}
          </AuthProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}

# Websevix — On-Demand Web Services Marketplace

A production-ready, motion-rich SaaS landing page built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**. The homepage is designed to match the premium feel of Stripe, Linear, Vercel, and Loom.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (custom theme)
- **Framer Motion** (animations)
- **next/font** (Inter + Syne)
- **Lucide React** (icons)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Start (production)

```bash
npm start
```

## Project Structure

```
/app
  page.tsx          # Homepage
  layout.tsx        # Root layout, fonts, metadata
  globals.css       # Global styles + keyframes
/components
  ui/               # Reusable UI (Button, Badge, GlassCard, etc.)
  sections/         # Page sections (Navbar, Hero, HowItWorks, etc.)
/hooks              # useCountAnimation, useMousePosition, useScrollProgress, useReducedMotion
/data
  content.ts        # Copy and dummy data
/public
  /images
  /icons
```

## Design System

- **Background:** `#0A0A0F`
- **Primary:** `#6366F1` (indigo)
- **Secondary:** `#8B5CF6` (violet)
- **Accent:** `#06B6D4` (cyan)
- **Fonts:** Syne (headings), Inter (body)

Animations respect `prefers-reduced-motion` for accessibility.

## Deploy on Vercel

1. Push the project to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Vercel will detect Next.js and use the default build command: `next build`.
4. Deploy. No extra configuration needed.

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

Follow the prompts to link the project and deploy.

## License

Private / All rights reserved.
"# WebsevixApp" 

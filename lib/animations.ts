import type { Variants } from "framer-motion";

// ── Spring presets ────────────────────────────────────────────────────────────
export const SPRING_MODAL   = { type: "spring", stiffness: 280, damping: 18 } as const;
export const SPRING_CONTENT = { type: "spring", stiffness: 340, damping: 22 } as const;
export const SPRING_OTP     = { type: "spring", stiffness: 400, damping: 20 } as const;
export const SPRING_CHAR    = { type: "spring", stiffness: 380, damping: 24 } as const;
export const EASE_EXPO      = [0.16, 1, 0.3, 1] as const;

// ── Modal card entry (scale + blur) ───────────────────────────────────────────
export const modalVariants: Variants = {
  hidden: {
    scale: 0.6,
    opacity: 0,
    filter: "blur(20px)",
  },
  visible: {
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      ...SPRING_MODAL,
      opacity: { duration: 0.25 },
      filter: { duration: 0.5 },
    },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    y: 20,
    filter: "blur(10px)",
    transition: { duration: 0.3, ease: EASE_EXPO },
  },
};

// ── Step transitions (forward) ────────────────────────────────────────────────
export const stepForwardVariants: Variants = {
  enter: {
    x: 40,
    opacity: 0,
    filter: "blur(4px)",
  },
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      ...SPRING_CONTENT,
      opacity: { duration: 0.3 },
      filter: { duration: 0.35 },
    },
  },
  exit: {
    x: -30,
    opacity: 0,
    filter: "blur(4px)",
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

// ── Step transitions (backward) ──────────────────────────────────────────────
export const stepBackwardVariants: Variants = {
  enter: {
    x: -40,
    opacity: 0,
    filter: "blur(4px)",
  },
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      ...SPRING_CONTENT,
      opacity: { duration: 0.3 },
      filter: { duration: 0.35 },
    },
  },
  exit: {
    x: 30,
    opacity: 0,
    filter: "blur(4px)",
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

// ── OTP box ──────────────────────────────────────────────────────────────────
export const otpBoxVariants: Variants = {
  hidden: { y: -20, opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { ...SPRING_OTP, delay: i * 0.06 },
  }),
};

// ── Content choreography (parent stagger) ────────────────────────────────────
export const contentContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

export const contentItemVariants: Variants = {
  hidden: { y: 18, opacity: 0, filter: "blur(4px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      ...SPRING_CONTENT,
      opacity: { duration: 0.35 },
    },
  },
};

// ── Character-by-character reveal ────────────────────────────────────────────
export const charVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.025,
      duration: 0.45,
      ease: [0.34, 1.56, 0.64, 1],
    },
  }),
};

// ── Logo icon entry ───────────────────────────────────────────────────────────
export const logoVariants: Variants = {
  hidden: { scale: 0, rotate: -30, opacity: 0 },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { ...SPRING_MODAL, delay: 0.05 },
  },
};

// ── Success content ───────────────────────────────────────────────────────────
export const successCharVariants: Variants = {
  hidden: (i: number) => ({
    x: (i % 3 === 0 ? -40 : i % 3 === 1 ? 40 : 0),
    y: (i % 3 === 2 ? 40 : 0),
    opacity: 0,
  }),
  visible: (i: number) => ({
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.04,
      ...SPRING_CHAR,
    },
  }),
};

// ── Screen warp ───────────────────────────────────────────────────────────────
export const warpVariants: Variants = {
  idle:  { perspective: "none", rotateX: 0, rotateY: 0 },
  warp:  {
    rotateX: [0, 2, 0],
    rotateY: [0, 1, 0],
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

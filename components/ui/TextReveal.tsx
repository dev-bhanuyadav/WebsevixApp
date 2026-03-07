"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const easing = [0.25, 0.1, 0.25, 1] as const;

interface TextRevealProps {
  text: string;
  className?: string;
  by?: "words" | "chars" | "line";
  stagger?: number;
}

export default function TextReveal({
  text,
  className = "",
  by = "words",
  stagger = 0.08,
}: TextRevealProps) {
  const reducedMotion = useReducedMotion();

  const words = text.split(" ");
  const chars = text.split("");

  if (reducedMotion) {
    return <span className={className}>{text}</span>;
  }

  if (by === "words") {
    return (
      <span className={`inline-flex flex-wrap ${className}`}>
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.25em]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * stagger,
              ease: easing,
            }}
          >
            {word}
          </motion.span>
        ))}
      </span>
    );
  }

  if (by === "chars") {
    return (
      <span className={`inline-flex ${className}`}>
        {chars.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.3,
              delay: i * 0.02,
              ease: easing,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
    );
  }

  return <span className={className}>{text}</span>;
}

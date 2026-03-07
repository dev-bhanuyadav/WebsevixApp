"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useRef, useEffect } from "react";
import { useMousePosition } from "@/hooks/useMousePosition";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

export default function TiltCard({
  children,
  className = "",
  maxTilt = 10,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouse = useMousePosition(ref);
  const reducedMotion = useReducedMotion();

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    rotateX.set(-mouse.normalizedY * maxTilt);
    rotateY.set(mouse.normalizedX * maxTilt);
  }, [mouse.normalizedX, mouse.normalizedY, reducedMotion, maxTilt, rotateX, rotateY]);

  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        transform: reducedMotion ? undefined : transform,
      }}
      whileHover={reducedMotion ? {} : { scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

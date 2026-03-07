"use client";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export default function GradientText({
  children,
  className = "",
  animate = false,
}: GradientTextProps) {
  return (
    <span
      className={`
        bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent
        ${animate ? "animate-gradient-shift" : ""}
        ${className}
      `}
      style={animate ? { backgroundSize: "200% auto" } : undefined}
    >
      {children}
    </span>
  );
}

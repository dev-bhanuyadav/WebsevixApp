"use client";

interface LogoMarkProps {
  size?:     number;
  color?:    string;
  className?: string;
  logoUrl?:  string; // when set, shows actual logo image instead of SVG W
}

export function LogoMark({ size = 40, color = "white", className, logoUrl }: LogoMarkProps) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt="logo"
        width={size}
        height={size}
        className={className}
        style={{ objectFit: "contain", width: size, height: size }}
      />
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 38"
      fill="none"
      className={className}
    >
      {/* Geometric W — sharp, modern */}
      <path
        d="M2 4L11 34L22 12L33 34L42 4"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top accent dot */}
      <circle cx="22" cy="4" r="2.5" fill={color} opacity="0.6" />
    </svg>
  );
}

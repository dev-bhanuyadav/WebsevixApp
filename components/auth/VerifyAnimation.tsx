"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { createPortal } from "react-dom";
import { LogoMark } from "./LogoMark";
import { SparkBurst } from "./SparkBurst";
import { useSiteSettings } from "@/context/SiteSettingsContext";

// ── Types ─────────────────────────────────────────────────────────────────────
type AnimPhase =
  | "IDLE"
  | "LOGO_BIRTH"
  | "LOGO_ASCENT"
  | "LOGO_SETTLE"
  | "LINE_DRAWING"
  | "LINE_COMPLETE"
  | "TICK_MORPH"
  | "CELEBRATE"
  | "EXIT"
  | "ERROR";

export interface ButtonOrigin {
  centerX: number;
  centerY: number;
  top: number;
  width: number;
  height: number;
}

interface VerifyAnimationProps {
  isActive: boolean;
  apiResult: "success" | "error" | null;
  origin: ButtonOrigin | null;
  errorMessage?: string | null;
  onComplete: () => void;
  onErrorDismiss: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const LOGO_SIZE = 56;
const SVG_SIZE  = 100;
const GAP       = 24;   // px gap between logo bottom and button top

// ── Component ─────────────────────────────────────────────────────────────────
export function VerifyAnimation({
  isActive, apiResult, origin, errorMessage, onComplete, onErrorDismiss,
}: VerifyAnimationProps) {
  const [phase, setPhase]               = useState<AnimPhase>("IDLE");
  const [mounted, setMounted]           = useState(false);
  const [sparkTrigger, setSparkTrigger] = useState(0);
  const [sparkPos, setSparkPos]         = useState({ x: 0, y: 0 });
  const { logoSquare } = useSiteSettings();

  const phaseRef = useRef<AnimPhase>("IDLE");
  const apiRef   = useRef<"success" | "error" | null>(null);
  const timers   = useRef<ReturnType<typeof setTimeout>[]>([]);
  const poll     = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { apiRef.current = apiResult; }, [apiResult]);

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (poll.current) { clearInterval(poll.current); poll.current = null; }
  }, []);

  const go = useCallback((p: AnimPhase) => { phaseRef.current = p; setPhase(p); }, []);

  const after = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms); timers.current.push(t);
  }, []);

  const runSuccess = useCallback(() => {
    go("LINE_COMPLETE");
    if (origin) {
      // Spark at 12 o'clock of ring
      const logoEndTop = origin.top - GAP - LOGO_SIZE;
      const logoCenterY = logoEndTop + LOGO_SIZE / 2;
      setSparkPos({ x: origin.centerX, y: logoCenterY - 40 });
      setSparkTrigger(n => n + 1);
    }
    after(() => go("TICK_MORPH"),  200);
    after(() => go("CELEBRATE"),   620);
    after(() => go("EXIT"),       1050);
    after(() => onComplete(),     1500);
  }, [go, after, origin, onComplete]);

  // ── Main sequence ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) { clearAll(); go("IDLE"); return; }

    clearAll();
    go("LOGO_BIRTH");
    after(() => go("LOGO_ASCENT"),  320);
    after(() => go("LOGO_SETTLE"), 1120);
    after(() => go("LINE_DRAWING"),1320);

    after(() => {
      const r = apiRef.current;
      if      (r === "success") runSuccess();
      else if (r === "error")   go("ERROR");
      else {
        poll.current = setInterval(() => {
          const r2 = apiRef.current;
          if (r2 === "success") {
            clearInterval(poll.current!); poll.current = null;
            runSuccess();
          } else if (r2 === "error") {
            clearInterval(poll.current!); poll.current = null;
            go("ERROR");
          }
        }, 80);
      }
    }, 2320);

    return clearAll;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (apiResult === "error" && phaseRef.current === "LINE_DRAWING") {
      clearAll(); go("ERROR");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiResult]);

  if (!mounted || !isActive || !origin || phase === "IDLE") return null;

  // ── Positioning (all in viewport px) ─────────────────────────────────────
  const logoEndTop   = origin.top - GAP - LOGO_SIZE;          // resting y for logo
  const logoStartTop = origin.centerY - LOGO_SIZE / 2;        // logo starts at button center
  const yStart       = logoStartTop - logoEndTop;             // offset to animate FROM
  const logoLeft     = origin.centerX - LOGO_SIZE / 2;

  const logoCenterY  = logoEndTop + LOGO_SIZE / 2;
  const svgLeft      = origin.centerX - SVG_SIZE / 2;
  const svgTop       = logoCenterY - SVG_SIZE / 2;

  // ── Derived booleans ──────────────────────────────────────────────────────
  const showRing   = ["LINE_DRAWING","LINE_COMPLETE"].includes(phase);
  const showTick   = phase === "TICK_MORPH" || phase === "CELEBRATE";
  const showSvg    = ["LINE_DRAWING","LINE_COMPLETE","TICK_MORPH","CELEBRATE","EXIT"].includes(phase);
  const showGlow   = ["LOGO_ASCENT","LOGO_SETTLE","LINE_DRAWING"].includes(phase);

  // ── Logo y / scale / rotateX per phase ───────────────────────────────────
  const logoY = (): number | number[] => {
    if (phase === "LOGO_BIRTH")  return yStart;
    if (phase === "EXIT")        return -200;
    if (phase === "ERROR")       return yStart;
    return 0;
  };
  const logoScale = (): number | number[] => {
    if (phase === "LOGO_BIRTH")  return 0.12;
    if (phase === "LOGO_SETTLE") return [1, 1.14, 1];
    if (phase === "CELEBRATE")   return [1, 1.1, 1];
    if (phase === "EXIT")        return 0.3;
    if (phase === "ERROR")       return 0.12;
    return 1;
  };
  const logoRotX = (): number => {
    if (phase === "LOGO_BIRTH" || phase === "ERROR") return 170;
    return 0;
  };
  const logoOpacity = (): number => {
    if (phase === "LOGO_BIRTH")  return 0.5;
    if (phase === "EXIT")        return 0;
    if (phase === "ERROR")       return 0;
    return 1;
  };
  const logoFilter = (): string | string[] => {
    if (phase === "LOGO_SETTLE")
      return ["drop-shadow(0 0 18px rgba(99,102,241,0.8))","drop-shadow(0 0 32px rgba(99,102,241,1.0))","drop-shadow(0 0 18px rgba(99,102,241,0.8))"];
    if (phase === "LOGO_ASCENT" || phase === "LINE_DRAWING" || phase === "LINE_COMPLETE")
      return "drop-shadow(0 0 18px rgba(99,102,241,0.85))";
    if (phase === "CELEBRATE")
      return ["drop-shadow(0 0 14px rgba(99,102,241,0.8))","drop-shadow(0 0 22px rgba(16,185,129,0.9))","drop-shadow(0 0 14px rgba(99,102,241,0.7))"];
    if (phase === "ERROR")
      return "drop-shadow(0 0 10px rgba(239,68,68,0.5))";
    return "drop-shadow(0 0 12px rgba(99,102,241,0.6))";
  };
  const logoTrans = (): Transition => {
    if (phase === "LOGO_ASCENT")  return { duration: 0.78, ease: [0.34, 1.56, 0.64, 1] as number[] };
    if (phase === "LOGO_SETTLE")  return { duration: 0.3, ease: "easeOut" };
    if (phase === "CELEBRATE")    return { duration: 0.4 };
    if (phase === "EXIT")         return { duration: 0.38, ease: "easeIn" };
    if (phase === "ERROR")        return { duration: 0.5, ease: "easeIn" };
    return { duration: 0.15 };
  };
  const logoColor = phase === "CELEBRATE" ? "#10B981" : phase === "ERROR" ? "#EF4444" : "white";

  return createPortal(
    <>
      <SparkBurst x={sparkPos.x} y={sparkPos.y} trigger={sparkTrigger} />

      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9998 }}>

        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(5,5,16,0.84)", backdropFilter: "blur(4px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "EXIT" ? 0 : 0.9 }}
          transition={{ duration: phase === "EXIT" ? 0.5 : 0.3 }}
        />

        {/* ── Logo — GPU-only transforms (y, scale, rotateX) ─────────────── */}
        <motion.div
          style={{
            position: "absolute",
            left: logoLeft,
            top:  logoEndTop,         // fixed position; movement is via y transform
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          initial={{ y: yStart, scale: 0.1, rotateX: 180, opacity: 0 }}
          animate={{
            y:        logoY(),
            scale:    logoScale(),
            rotateX:  logoRotX(),
            opacity:  logoOpacity(),
            filter:   logoFilter(),
          }}
          transition={logoTrans()}
        >
          <LogoMark size={LOGO_SIZE - 8} color={logoColor} logoUrl={logoSquare || undefined} />
        </motion.div>

        {/* Light streak following logo during ascent */}
        <AnimatePresence>
          {phase === "LOGO_ASCENT" && (
            <motion.div
              style={{
                position: "absolute",
                left: origin.centerX - 0.5,
                top: logoEndTop + LOGO_SIZE,
                width: 1,
                transformOrigin: "top",
                background: "linear-gradient(to bottom, rgba(99,102,241,0.55), transparent)",
              }}
              initial={{ height: 0, opacity: 0.8 }}
              animate={{ height: GAP + LOGO_SIZE + origin.height * 0.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.72, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* ── SVG: ring + tick ───────────────────────────────────────────── */}
        <AnimatePresence>
          {showSvg && (
            <motion.svg
              key="ring-svg"
              width={SVG_SIZE} height={SVG_SIZE}
              viewBox="0 0 100 100"
              overflow="visible"
              style={{ position: "absolute", left: svgLeft, top: svgTop }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: phase === "EXIT" ? -200 : 0 }}
              exit={{ opacity: 0 }}
              transition={phase === "EXIT" ? { duration: 0.38, ease: "easeIn" } : { duration: 0.1 }}
            >
              <defs>
                <filter id="va-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="va-glow2" x="-70%" y="-70%" width="240%" height="240%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Progress ring — draws from 12 o'clock */}
              <motion.circle
                cx="50" cy="50" r="40"
                fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"
                transform="rotate(-90 50 50)"
                filter="url(#va-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  showRing
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 1, opacity: 0 }
                }
                transition={
                  phase === "LINE_DRAWING"
                    ? { pathLength: { duration: 1, ease: "linear" }, opacity: { duration: 0.1 } }
                    : { duration: 0.25 }
                }
              />

              {/* Leading glow dot at ring tip */}
              {phase === "LINE_DRAWING" && (
                <motion.circle
                  cx="50" cy="10" r="4"
                  fill="#10B981" filter="url(#va-glow2)" opacity="0.85"
                  style={{ originX: "50px", originY: "50px" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              )}

              {/* Checkmark */}
              <AnimatePresence>
                {showTick && (
                  <motion.g
                    key="tick"
                    style={{ originX: "50px", originY: "50px" }}
                    animate={phase === "CELEBRATE" ? { scale: [1, 1.28, 1] } : { scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.path
                      d="M 24,52 L 42,67 L 76,33"
                      fill="none"
                      stroke={phase === "CELEBRATE" ? "#ffffff" : "#10B981"}
                      strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
                      filter={phase === "CELEBRATE" ? "url(#va-glow2)" : "url(#va-glow)"}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.15 } }}
                      transition={{ pathLength: { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] as number[] }, opacity: { duration: 0.04 } }}
                    />
                  </motion.g>
                )}
              </AnimatePresence>

              {/* Ripple on celebrate */}
              {phase === "CELEBRATE" && (
                <motion.circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke="rgba(16,185,129,0.4)" strokeWidth="1.5"
                  style={{ originX: "50px", originY: "50px" }}
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              )}
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Button pulse border while loading */}
        {showGlow && (
          <motion.div
            style={{
              position: "absolute",
              left:   origin.centerX - origin.width / 2 - 5,
              top:    origin.top - 5,
              width:  origin.width + 10,
              height: origin.height + 10,
              borderRadius: 16,
              border: "1.5px solid",
              pointerEvents: "none",
            }}
            animate={{
              borderColor: ["rgba(99,102,241,0.1)","rgba(99,102,241,0.65)","rgba(99,102,241,0.1)"],
              boxShadow:   ["0 0 0px rgba(99,102,241,0)","0 0 22px rgba(99,102,241,0.3)","0 0 0px rgba(99,102,241,0)"],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Green "Verified!" button on CELEBRATE */}
        {phase === "CELEBRATE" && (
          <motion.div
            style={{
              position: "absolute",
              left:   origin.centerX - origin.width / 2,
              top:    origin.top,
              width:  origin.width,
              height: origin.height,
              borderRadius: 12,
              background: "linear-gradient(135deg,#059669,#10B981)",
              boxShadow: "0 0 32px rgba(16,185,129,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22 }}
          >
            <motion.span
              className="text-white font-semibold text-sm tracking-wide"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              ✓ &nbsp;Success!
            </motion.span>
          </motion.div>
        )}

        {/* Error toast */}
        <AnimatePresence>
          {phase === "ERROR" && (
            <motion.div
              style={{
                position: "absolute",
                left: origin.centerX - 155,
                top:  origin.top + origin.height + 14,
                width: 310,
                pointerEvents: "all",
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="bg-red-500/10 border border-red-500/25 rounded-2xl px-5 py-4 text-center">
                <p className="text-red-400 text-sm mb-2.5">
                  {errorMessage || "Something went wrong. Please try again."}
                </p>
                <button
                  onClick={onErrorDismiss}
                  className="text-xs text-red-400/70 hover:text-red-300 transition-colors hover:underline underline-offset-2"
                >
                  ← Try again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>,
    document.body
  );
}

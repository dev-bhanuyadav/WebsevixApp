"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useAuthFlow, type RegisterData } from "@/hooks/useAuthFlow";
import { useBlast, type BlastPhase } from "@/hooks/useBlast";
import { useAuth } from "@/hooks/useAuth";
import { BlastCanvas, type BlastCanvasHandle } from "./BlastCanvas";
import { EmailStep }           from "./EmailStep";
import { LoginPasswordStep }   from "./LoginPasswordStep";
import { SignupFormStep }       from "./SignupFormStep";
import { SuccessStep }          from "./SuccessStep";
import { VerifyAnimation, type ButtonOrigin } from "./VerifyAnimation";
import { stepForwardVariants, stepBackwardVariants, modalVariants } from "@/lib/animations";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import styles from "./AuthModal.module.css";

const LiquidGlass = dynamic(
  () => import("liquid-glass-react").then((m) => m.default),
  { ssr: false }
);

const API = "/api/auth";

interface AuthModalProps {
  defaultMode?: "login" | "signup";
  onSuccess?: () => void;
  /** If true, blast fires from screen center on mount */
  autoBlast?: boolean;
  /** If true, modal shows immediately without blast (e.g. on home page) */
  showImmediately?: boolean;
}

export function AuthModal({ defaultMode = "login", onSuccess, autoBlast = true, showImmediately = false }: AuthModalProps) {
  const prefersReduced = useReducedMotion();
  const { login } = useAuth();
  const { logoWide } = useSiteSettings();
  const { phase, origin, trigger, reset: resetBlast } = useBlast();
  const {
    state, setEmail, setUserExists, setUserNew,
    setAuthSuccess, setError, setLoading, reset,
  } = useAuthFlow(defaultMode);

  const canvasRef         = useRef<BlastCanvasHandle>(null);
  const modalRef          = useRef<HTMLDivElement>(null);
  const microParticleRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingAuthRef    = useRef<{ accessToken: string; user: unknown } | null>(null);

  const [vignetteVisible, setVignetteVisible]   = useState(false);
  const [chromatic, setChromatic]               = useState(false);
  const [warp, setWarp]                         = useState(false);
  const [direction, setDirection]               = useState<"forward" | "backward">("forward");
  const [borderGlowColor, setBorderGlowColor]   = useState<string | null>(null);
  const [verifyAnim, setVerifyAnim]             = useState<{
    active: boolean;
    apiResult: "success" | "error" | null;
    origin: ButtonOrigin | null;
    errorMsg: string | null;
  }>({ active: false, apiResult: null, origin: null, errorMsg: null });

  // ── Fire blast on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoBlast) return;

    // Read coordinates stored by Navbar before navigation
    let ox: number | undefined;
    let oy: number | undefined;
    try {
      const stored = sessionStorage.getItem("blast_origin");
      if (stored) {
        const parsed = JSON.parse(stored) as { x: number; y: number };
        ox = parsed.x;
        oy = parsed.y;
        sessionStorage.removeItem("blast_origin");
      }
    } catch { /* ignore */ }

    // Small delay so the page paint is done first
    const t = setTimeout(() => trigger(ox, oy), 80);
    return () => clearTimeout(t);
  }, [autoBlast, trigger]);

  // ── Drive canvas effects based on phase ─────────────────────────────────────
  useEffect(() => {
    if (prefersReduced) return;
    if (phase === "blast") {
      const { x, y } = origin;
      canvasRef.current?.rings(x, y);
      setTimeout(() => canvasRef.current?.explode(x, y), 100);
      setTimeout(() => setWarp(true), 200);
      setTimeout(() => setWarp(false), 500);
      setTimeout(() => setVignetteVisible(true), 400);
      setTimeout(() => { setChromatic(true);  }, 600);
      setTimeout(() => { setChromatic(false); }, 720);
    }
    if (phase === "portal") {
      const { x, y } = origin;
      canvasRef.current?.implosion(x, y);
    }
      if (phase === "ambient") {
      // Micro particles — slow interval to avoid jank
      microParticleRef.current = setInterval(() => {
        if (!modalRef.current) return;
        const rect = modalRef.current.getBoundingClientRect();
        const mx = rect.left + Math.random() * rect.width;
        const my = rect.bottom - 4;
        canvasRef.current?.microParticle(mx, my);
      }, 2000);
    }
    return () => {
      if (microParticleRef.current) clearInterval(microParticleRef.current);
    };
  }, [phase, origin, prefersReduced]);

  // ── Error → flash red border + error burst ──────────────────────────────────
  useEffect(() => {
    if (!state.error) return;
    setBorderGlowColor("#EF4444");
    const t = setTimeout(() => setBorderGlowColor(null), 350);
    return () => clearTimeout(t);
  }, [state.error]);

  // ── Auth handlers ─────────────────────────────────────────────────────────────
  const handleEmailSubmit = useCallback(
    async (email: string) => {
      setLoading(true);
      setError(null);
      setDirection("forward");
      try {
        const res  = await fetch(`${API}/check-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json() as { exists: boolean; firstName?: string; error?: string };
        if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
        setEmail(email);
        if (data.exists) {
          setUserExists(data.firstName);       // → LOGIN_PASSWORD step
        } else {
          setUserNew();                         // → SIGNUP_DETAILS step
        }
      } catch { setError("Network error. Please try again."); }
      finally   { setLoading(false); }
    },
    [setEmail, setLoading, setError, setUserExists, setUserNew]
  );

  const handleLoginPasswordSubmit = useCallback(
    async (password: string, origin: ButtonOrigin) => {
      setLoading(true);
      setError(null);
      pendingAuthRef.current = null;
      setVerifyAnim({ active: true, apiResult: null, origin, errorMsg: null });
      try {
        const res  = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: state.email, password }),
        });
        const data = await res.json() as { error?: string; accessToken?: string; user?: unknown };
        if (!res.ok) {
          setVerifyAnim(s => ({ ...s, apiResult: "error", errorMsg: data.error ?? "Invalid email or password" }));
          return;
        }
        pendingAuthRef.current = { accessToken: data.accessToken!, user: data.user };
        setVerifyAnim(s => ({ ...s, apiResult: "success" }));
      } catch {
        setVerifyAnim(s => ({ ...s, apiResult: "error", errorMsg: "Network error. Please try again." }));
      } finally { setLoading(false); }
    },
    [state.email, setLoading, setError]
  );

  const handleSignupFormSubmit = useCallback(
    async (data: RegisterData, origin: ButtonOrigin) => {
      setDirection("forward");
      setLoading(true);
      setError(null);
      pendingAuthRef.current = null;
      setVerifyAnim({ active: true, apiResult: null, origin, errorMsg: null });
      try {
        const res  = await fetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: state.email, firstName: data.firstName, lastName: data.lastName, phone: data.phone, password: data.password, role: "client" }),
        });
        const resData = await res.json() as { error?: string; accessToken?: string; user?: unknown };
        if (!res.ok) {
          setVerifyAnim(s => ({ ...s, apiResult: "error", errorMsg: resData.error ?? "Registration failed" }));
          return;
        }
        pendingAuthRef.current = { accessToken: resData.accessToken!, user: resData.user };
        setVerifyAnim(s => ({ ...s, apiResult: "success" }));
      } catch {
        setVerifyAnim(s => ({ ...s, apiResult: "error", errorMsg: "Network error. Please try again." }));
      } finally { setLoading(false); }
    },
    [state.email, setLoading, setError]
  );

  const handleVerifyComplete = useCallback(() => {
    if (pendingAuthRef.current) {
      login({ accessToken: pendingAuthRef.current.accessToken as string, user: pendingAuthRef.current.user as Parameters<typeof login>[0]["user"] });
    }
    setVerifyAnim({ active: false, apiResult: null, origin: null, errorMsg: null });
    onSuccess?.();
  }, [login, onSuccess]);

  const handleVerifyErrorDismiss = useCallback(() => {
    setVerifyAnim({ active: false, apiResult: null, origin: null, errorMsg: null });
    setLoading(false);
    setError(null);
  }, [setLoading, setError]);

  const stepVariants = direction === "forward" ? stepForwardVariants : stepBackwardVariants;
  const showContent  = ((phase === "content" || phase === "ambient") && !prefersReduced) || showImmediately;
  const modalVisible = (phase !== "idle" && phase !== "blast") || showImmediately;

  // ── Clean layout when showImmediately (home page): no canvas, no overlays, no blur ──
  const cardContent = (
    <>
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <motion.div
          animate={phase === "ambient" && !showImmediately ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Link href="/">
            {logoWide
              ? <img src={logoWide} alt="Websevix" style={{ height: 24, width: "auto", objectFit: "contain" }} />
              : <span className="font-display font-bold text-lg text-snow tracking-tight">Websevix</span>}
          </Link>
        </motion.div>
        <Link href="/" className="text-xs text-slate hover:text-silver transition-colors px-3 py-1 rounded-lg hover:bg-white/[0.04]">
          ← Home
        </Link>
      </div>
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {state.step === "EMAIL" && (
            <motion.div key="email" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <EmailStep
                onSubmit={handleEmailSubmit}
                isLoading={state.isLoading}
                error={state.error}
                showContent={showContent || phase === "modal"}
              />
            </motion.div>
          )}
          {state.step === "LOGIN_PASSWORD" && (
            <motion.div key="login-password" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <LoginPasswordStep
                email={state.email}
                firstName={state.firstName}
                onSubmit={handleLoginPasswordSubmit}
                onBack={() => { setDirection("backward"); reset(); }}
                isLoading={state.isLoading}
                error={state.error}
              />
            </motion.div>
          )}
          {state.step === "SIGNUP_DETAILS" && (
            <motion.div key="signup-form" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <SignupFormStep
                email={state.email}
                onSubmit={handleSignupFormSubmit}
                onBack={() => { setDirection("backward"); reset(); }}
                isLoading={state.isLoading}
                error={state.error}
              />
            </motion.div>
          )}
          {state.step === "SUCCESS" && (
            <motion.div key="success" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <SuccessStep
                firstName={(state.userData.firstName ?? state.firstName) || ""}
                canvasRef={canvasRef}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {(state.step === "EMAIL" || state.step === "LOGIN_PASSWORD" || state.step === "SIGNUP_DETAILS") && (
        <motion.div
          className="px-5 pb-4 text-center text-xs text-slate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {state.step === "EMAIL" ? (
            <>New to Websevix?{" "}
              <Link href="/signup" className="text-indigo-400 hover:underline">Create account</Link>
            </>
          ) : (
            <>Already have an account?{" "}
              <button type="button" onClick={() => { setDirection("backward"); reset(); }} className="text-indigo-400 hover:underline">
                Sign in
              </button>
            </>
          )}
        </motion.div>
      )}
    </>
  );

  if (showImmediately) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-[#050510]">
        <VerifyAnimation
          isActive={verifyAnim.active}
          apiResult={verifyAnim.apiResult}
          origin={verifyAnim.origin}
          errorMessage={verifyAnim.errorMsg}
          onComplete={handleVerifyComplete}
          onErrorDismiss={handleVerifyErrorDismiss}
        />
        <div className="relative z-10 w-full max-w-sm mx-4">
          <LiquidGlass
            cornerRadius={24}
            displacementScale={48}
            blurAmount={0.06}
            saturation={140}
            elasticity={0.2}
            overLight={false}
            className="w-full"
            style={{ minHeight: 320 }}
          >
            <div className="rounded-[24px] overflow-hidden bg-[#0e0e1a]/85" style={{ boxShadow: borderGlowColor ? `0 0 0 1.5px ${borderGlowColor}` : undefined }}>
              {cardContent}
            </div>
          </LiquidGlass>
        </div>
      </div>
    );
  }

  // ── Full cinematic layout (blast, canvas, etc.) ──
  return (
    <div className={`relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050510] ${styles.pageWrap}`}>
      <div className={styles.pageLiquidBg} aria-hidden />
      <VerifyAnimation
        isActive={verifyAnim.active}
        apiResult={verifyAnim.apiResult}
        origin={verifyAnim.origin}
        errorMessage={verifyAnim.errorMsg}
        onComplete={handleVerifyComplete}
        onErrorDismiss={handleVerifyErrorDismiss}
      />

      {/* ── Canvas behind content (particles, rings) ── */}
      <BlastCanvas
        ref={canvasRef}
        className="fixed inset-0 z-20 w-full h-full pointer-events-none"
      />

      {/* ── Vignette ── */}
      <motion.div
        className="fixed inset-0 z-40 pointer-events-none"
        animate={vignetteVisible
          ? { background: "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 20%, rgba(5,5,16,0.75) 80%, rgba(5,5,16,0.95) 100%)" }
          : { background: "transparent" }
        }
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* ── Chromatic aberration overlay ── */}
      <AnimatePresence>
        {chromatic && (
          <>
            <motion.div
              className="fixed inset-0 z-[41] pointer-events-none"
              style={{ mixBlendMode: "screen", background: "rgba(255,0,0,0.04)" }}
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: -3, opacity: 1 }}
              exit={{ x: 0, opacity: 0 }}
              transition={{ duration: 0.06 }}
            />
            <motion.div
              className="fixed inset-0 z-[41] pointer-events-none"
              style={{ mixBlendMode: "screen", background: "rgba(0,100,255,0.04)" }}
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: 3, opacity: 1 }}
              exit={{ x: 0, opacity: 0 }}
              transition={{ duration: 0.06 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Portal — scale from point (no gradient) ── */}
      <AnimatePresence>
        {(phase === "portal") && !prefersReduced && (
          <motion.div
            className="fixed inset-0 z-[42] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="rounded-3xl bg-white/10"
              style={{ width: 440, height: 560 }}
              initial={{ scale: 0, borderRadius: "50%" }}
              animate={{ scale: 1, borderRadius: 24 }}
              exit={{ scale: 0, borderRadius: "50%", opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content wrapper (above canvas so login is sharp) ── */}
      <div className="relative z-50 w-full min-h-screen flex items-center justify-center" style={{ perspective: "1000px" }}>
        {/* ── Ambient orbs (solid tint, no gradient) ── */}
        {phase !== "idle" && [
          { color: "rgba(99,102,241,0.12)", left: "20%", top: "15%",  animDur: "7s",  animDelay: "0s"   },
          { color: "rgba(139,92,246,0.12)", left: "65%", top: "60%",  animDur: "9s",  animDelay: "2.5s" },
          { color: "rgba(6,182,212,0.12)",  left: "45%", top: "40%",  animDur: "11s", animDelay: "5s"   },
        ].map((orb, i) => (
          <div
            key={i}
            className="absolute pointer-events-none rounded-full"
            style={{
              background: orb.color,
              width: 480,
              height: 480,
              left: orb.left,
              top: orb.top,
              transform: "translate(-50%,-50%)",
              animation: `auroraSlow ${orb.animDur} ease-in-out infinite`,
              animationDelay: orb.animDelay,
              willChange: "transform",
            }}
          />
        ))}

        {/* ── Modal card ── */}
        <AnimatePresence>
          {modalVisible && (
              <motion.div
              ref={modalRef}
              variants={prefersReduced
                ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
                : modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`relative z-[48] w-full max-w-sm mx-4 ${styles.modalCard}`}
              style={{
                willChange: "transform, filter",
                ...(borderGlowColor
                  ? { boxShadow: `0 0 0 1.5px ${borderGlowColor}, 0 0 24px ${borderGlowColor}44` }
                  : {}),
              }}
            >
              <div className={styles.liquidBg} aria-hidden />
              <div
                className={styles.cardBody}
                style={
                  borderGlowColor
                    ? {
                        boxShadow: `0 0 0 1.5px ${borderGlowColor}, 0 20px 60px rgba(0,0,0,0.6)`,
                        transition: "box-shadow 0.3s",
                      }
                    : { transition: "box-shadow 0.3s" }
                }
              >
                {cardContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

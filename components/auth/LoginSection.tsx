"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { useAuth } from "@/hooks/useAuth";
import { VerifyAnimation, type ButtonOrigin } from "./VerifyAnimation";

const API = "/api/auth";

export default function LoginSection({ onSuccess }: { onSuccess?: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const turbRef = useRef<SVGFETurbulenceElement | null>(null);
  const pendingAuthRef = useRef<{ accessToken: string; user: unknown } | null>(null);

  const { login } = useAuth();
  const {
    state,
    setEmail,
    setUserExists,
    setUserNew,
    setError,
    setLoading,
    setUserData,
    reset,
  } = useAuthFlow("login");

  const [verifyAnim, setVerifyAnim] = useState<{
    active: boolean;
    apiResult: "success" | "error" | null;
    origin: ButtonOrigin | null;
    errorMsg: string | null;
  }>({ active: false, apiResult: null, origin: null, errorMsg: null });

  // Turbulence animation
  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame += 0.012;
      if (turbRef.current) {
        const bfVal = `${0.008 + Math.sin(frame * 0.7) * 0.002} ${0.008 + Math.cos(frame * 0.5) * 0.002}`;
        turbRef.current.setAttribute("baseFrequency", bfVal);
        turbRef.current.setAttribute("seed", String(Math.floor(frame * 8) % 999));
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const tiltX = (mousePos.y - 0.5) * 14;
  const tiltY = (mousePos.x - 0.5) * -14;
  const lightX = mousePos.x * 100;
  const lightY = mousePos.y * 100;

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const email = (form.querySelector('input[type="email"]') as HTMLInputElement)?.value?.trim();
      if (!email) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/check-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = (await res.json()) as { exists: boolean; firstName?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Something went wrong");
          return;
        }
        setEmail(email);
        if (data.exists) setUserExists(data.firstName);
        else setUserNew();
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [setEmail, setLoading, setError, setUserExists, setUserNew]
  );

  const handleLoginPasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const password = (form.querySelector('input[name="password"]') as HTMLInputElement)?.value;
      if (!password) return;
      const btn = form.querySelector('button[type="submit"]');
      const rect = btn?.getBoundingClientRect();
      const origin: ButtonOrigin = rect
        ? { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2, top: rect.top, width: rect.width, height: rect.height }
        : { centerX: window.innerWidth / 2, centerY: window.innerHeight * 0.5, top: window.innerHeight * 0.5 - 22, width: 260, height: 44 };
      setLoading(true);
      setError(null);
      pendingAuthRef.current = null;
      setVerifyAnim({ active: true, apiResult: null, origin, errorMsg: null });
      try {
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: state.email, password }),
        });
        const data = (await res.json()) as { error?: string; accessToken?: string; user?: unknown };
        if (!res.ok) {
          setVerifyAnim((s) => ({ ...s, apiResult: "error", errorMsg: data.error ?? "Invalid email or password" }));
          return;
        }
        pendingAuthRef.current = { accessToken: data.accessToken!, user: data.user };
        setVerifyAnim((s) => ({ ...s, apiResult: "success" }));
      } catch {
        setVerifyAnim((s) => ({ ...s, apiResult: "error", errorMsg: "Network error. Please try again." }));
      } finally {
        setLoading(false);
      }
    },
    [state.email, setLoading, setError]
  );

  const handleSignupSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const firstName = (form.querySelector('input[name="firstName"]') as HTMLInputElement)?.value?.trim();
      const lastName = (form.querySelector('input[name="lastName"]') as HTMLInputElement)?.value?.trim();
      const phone = (form.querySelector('input[name="phone"]') as HTMLInputElement)?.value?.trim();
      const password = (form.querySelector('input[name="password"]') as HTMLInputElement)?.value;
      if (!firstName || !lastName || !phone || !password) return;
      setUserData({ firstName, lastName, phone, password });
      const btn = form.querySelector('button[type="submit"]');
      const rect = btn?.getBoundingClientRect();
      const origin: ButtonOrigin = rect
        ? { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2, top: rect.top, width: rect.width, height: rect.height }
        : { centerX: window.innerWidth / 2, centerY: window.innerHeight * 0.5, top: window.innerHeight * 0.5 - 22, width: 260, height: 44 };
      setLoading(true);
      setError(null);
      pendingAuthRef.current = null;
      setVerifyAnim({ active: true, apiResult: null, origin, errorMsg: null });
      try {
        const res = await fetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: state.email,
            firstName,
            lastName,
            phone,
            password,
            role: "client",
          }),
        });
        const resData = (await res.json()) as { error?: string; accessToken?: string; user?: unknown };
        if (!res.ok) {
          setVerifyAnim((s) => ({ ...s, apiResult: "error", errorMsg: resData.error ?? "Registration failed" }));
          return;
        }
        pendingAuthRef.current = { accessToken: resData.accessToken!, user: resData.user };
        setVerifyAnim((s) => ({ ...s, apiResult: "success" }));
      } catch {
        setVerifyAnim((s) => ({ ...s, apiResult: "error", errorMsg: "Network error. Please try again." }));
      } finally {
        setLoading(false);
      }
    },
    [state.email, setLoading, setError, setUserData]
  );

  const handleVerifyComplete = useCallback(() => {
    if (pendingAuthRef.current) {
      login({
        accessToken: pendingAuthRef.current.accessToken as string,
        user: pendingAuthRef.current.user as Parameters<typeof login>[0]["user"],
      });
    }
    setVerifyAnim({ active: false, apiResult: null, origin: null, errorMsg: null });
    onSuccess?.();
  }, [login, onSuccess]);

  const handleVerifyErrorDismiss = useCallback(() => {
    setVerifyAnim({ active: false, apiResult: null, origin: null, errorMsg: null });
    setLoading(false);
    setError(null);
  }, [setLoading, setError]);

  const goBack = useCallback(() => reset(), [reset]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .lg-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #07070f; position: relative; overflow: hidden; padding-top: 88px; padding-bottom: 2rem; }
        .bg-blob { position: fixed; border-radius: 50%; pointer-events: none; will-change: transform; }
        .b1 { width: 700px; height: 700px; background: radial-gradient(circle at 40% 40%, #5b21b6 0%, #3730a3 45%, transparent 70%); top: -250px; left: -200px; animation: bf1 12s ease-in-out infinite; animation-delay: 0s; }
        .b2 { width: 600px; height: 600px; background: radial-gradient(circle at 55% 50%, #1e40af 0%, #6d28d9 50%, transparent 70%); bottom: -180px; right: -160px; animation: bf2 15s ease-in-out infinite; animation-delay: 2s; }
        .b3 { width: 420px; height: 420px; background: radial-gradient(circle, #0e7490 0%, #4338ca 55%, transparent 70%); top: 35%; left: 42%; animation: bf3 10s ease-in-out infinite; animation-delay: 4s; }
        .b4 { width: 300px; height: 300px; background: radial-gradient(circle, #9d174d 0%, transparent 70%); top: 8%; right: 18%; animation: bf1 9s ease-in-out infinite reverse; animation-delay: 1s; }
        .b5 { width: 200px; height: 200px; background: radial-gradient(circle, #065f46 0%, transparent 70%); bottom: 20%; left: 12%; animation: bf2 11s ease-in-out infinite reverse; animation-delay: 3s; }
        @keyframes bf1 { 0%,100% { transform: translate(0,0) scale(1); } 40% { transform: translate(40px,-50px) scale(1.08); } 70% { transform: translate(-25px,30px) scale(0.95); } }
        @keyframes bf2 { 0%,100% { transform: translate(0,0) scale(1); } 35% { transform: translate(-35px,45px) scale(1.06); } 65% { transform: translate(28px,-20px) scale(0.97); } }
        @keyframes bf3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-35px) scale(1.1); } }
        .displacement-wrap { position: relative; z-index: 10; width: 100%; max-width: 420px; margin: 1.5rem; perspective: 1000px; }
        .glass-card { position: relative; width: 100%; padding: 2.75rem 2.5rem; border-radius: 32px; overflow: hidden; transform-style: preserve-3d; transition: transform 0.1s ease-out; will-change: transform;
          background: linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.06) 100%);
          backdrop-filter: blur(48px) saturate(200%) brightness(1.15) contrast(1.05); -webkit-backdrop-filter: blur(48px) saturate(200%) brightness(1.15) contrast(1.05);
          border: 1px solid rgba(255,255,255,0.28);
          box-shadow: 0 50px 100px rgba(0,0,0,0.65), 0 20px 40px rgba(0,0,0,0.4), 0 0 100px rgba(99,102,241,0.12), inset 0 1.5px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.2), inset 1.5px 0 0 rgba(255,255,255,0.2), inset -1.5px 0 0 rgba(0,0,0,0.1);
        }
        .light-spot { position: absolute; inset: 0; pointer-events: none; z-index: 0; border-radius: 32px; transition: background 0.05s; }
        .glass-card .shimmer { position: absolute; inset: 0; pointer-events: none; z-index: 0; border-radius: 32px; overflow: hidden; }
        .shimmer::before { content: ''; position: absolute; top: -60%; left: -70%; width: 38%; height: 220%; background: linear-gradient(108deg, transparent 0%, rgba(255,255,255,0.04) 35%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.04) 65%, transparent 100%); transform: skewX(-12deg); animation: lightSweep 7s ease-in-out infinite; }
        @keyframes lightSweep { 0% { left: -70%; opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { left: 170%; opacity: 0; } }
        .spec-top { position: absolute; top: 0; left: 8%; right: 20%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8) 25%, rgba(255,255,255,1) 55%, rgba(255,255,255,0.4) 80%, transparent); z-index: 3; pointer-events: none; border-radius: 99px; }
        .spec-left { position: absolute; top: 8%; left: 0; width: 1px; height: 38%; background: linear-gradient(180deg, rgba(255,255,255,0.7), transparent); z-index: 3; pointer-events: none; }
        .caustic { position: absolute; top: -80px; right: -80px; width: 260px; height: 260px; background: radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(99,102,241,0.08) 45%, transparent 70%); border-radius: 50%; pointer-events: none; z-index: 0; animation: causticPulse 5s ease-in-out infinite; }
        @keyframes causticPulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.3) translate(-14px,16px); opacity: 1; } }
        .card-inner { position: relative; z-index: 1; }
        .login-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 700; color: #fff; letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 0.4rem; }
        .login-sub { font-size: 0.875rem; color: rgba(255,255,255,0.38); margin-bottom: 2.25rem; font-weight: 300; letter-spacing: 0.01em; }
        .input-group { margin-bottom: 1.1rem; }
        .input-label { display: block; font-size: 0.7rem; font-weight: 500; color: rgba(255,255,255,0.4); margin-bottom: 0.45rem; letter-spacing: 0.08em; text-transform: uppercase; }
        .input-wrap { position: relative; }
        .glass-input { width: 100%; background: rgba(255,255,255,0.07); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.13); border-radius: 14px; padding: 0.82rem 1rem; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; color: #fff; outline: none; transition: all 0.3s ease; box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.18); }
        .glass-input::placeholder { color: rgba(255,255,255,0.18); }
        .glass-input:focus { background: rgba(255,255,255,0.12); border-color: rgba(139,92,246,0.65); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 3px rgba(139,92,246,0.18), 0 0 28px rgba(139,92,246,0.12); }
        .pw-toggle { position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.28); font-size: 0.7rem; font-family: 'DM Sans', sans-serif; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; transition: color 0.2s; }
        .pw-toggle:hover { color: rgba(255,255,255,0.65); }
        .forgot { display: block; text-align: right; font-size: 0.78rem; color: rgba(139,92,246,0.72); text-decoration: none; margin-top: 0.5rem; transition: color 0.2s; }
        .forgot:hover { color: #c4b5fd; }
        .submit-btn { width: 100%; margin-top: 1.75rem; padding: 0.92rem; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500; color: #fff; letter-spacing: 0.02em; border-radius: 14px; cursor: pointer; position: relative; overflow: hidden; border: 1px solid rgba(167,139,250,0.45); background: linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(139,92,246,0.9) 100%); box-shadow: 0 4px 28px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18); transition: all 0.3s ease; }
        .submit-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent); transition: left 0.5s ease; }
        .submit-btn:hover::before { left: 200%; }
        .submit-btn:hover { background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 10px 40px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.32); transform: translateY(-2px); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .spinner { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.28); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; margin-right: 8px; vertical-align: middle; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .back-btn { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 0.85rem; cursor: pointer; margin-top: 0.5rem; font-family: 'DM Sans', sans-serif; }
        .back-btn:hover { color: #fff; }
        .err-msg { font-size: 0.8rem; color: #f87171; margin-top: 0.5rem; }
        .login-quote { position: relative; z-index: 1; text-align: center; margin-top: 2.5rem; padding: 0 1.5rem; }
        .login-quote p { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: 0.03em; line-height: 1.4; margin: 0 auto; }
        .login-quote .highlight { color: rgba(167,139,250,0.95); }
        .signup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .svg-displacement-overlay { position: absolute; inset: 0; border-radius: 32px; overflow: hidden; pointer-events: none; z-index: 2; opacity: 0.55; mix-blend-mode: overlay; }
        .svg-displacement-overlay svg { width: 100%; height: 100%; }
        @keyframes cardEntry { from { opacity: 0; transform: translateY(30px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .glass-card { animation: cardEntry 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes stepEnter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .step-content { animation: stepEnter 0.4s ease-out both; }
      `}</style>

      <VerifyAnimation
        isActive={verifyAnim.active}
        apiResult={verifyAnim.apiResult}
        origin={verifyAnim.origin}
        errorMessage={verifyAnim.errorMsg}
        onComplete={handleVerifyComplete}
        onErrorDismiss={handleVerifyErrorDismiss}
      />

      <div className="b1 bg-blob" />
      <div className="b2 bg-blob" />
      <div className="b3 bg-blob" />
      <div className="b4 bg-blob" />
      <div className="b5 bg-blob" />

      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="liquid-distort" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0.008 0.008" numOctaves={3} seed={2} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={18} xChannelSelector="R" yChannelSelector="G" result="displaced" />
          </filter>
          <filter id="edge-distort" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="turbulence" baseFrequency="0.02 0.015" numOctaves={2} seed={5} result="noise2" />
            <feDisplacementMap in="SourceGraphic" in2="noise2" scale={8} xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>

      <div className="lg-root">
        <div className="displacement-wrap">
          <div
            className="glass-card"
            ref={cardRef}
            style={{ transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }}
          >
            <div className="spec-top" />
            <div className="spec-left" />
            <div className="caustic" />
            <div className="shimmer" />
            <div
              className="light-spot"
              style={{
                background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,255,255,0.10) 0%, transparent 60%)`,
              }}
            />
            <div className="svg-displacement-overlay">
              <svg viewBox="0 0 420 600" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="edgeGlow" cx="50%" cy="0%" r="70%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect x="0" y="0" width="420" height="600" fill="url(#edgeGlow)" style={{ filter: "url(#edge-distort)" }} />
              </svg>
            </div>

            <div className="card-inner">
              {state.step === "EMAIL" && (
                <div className="step-content" key="email">
                  <h1 className="login-title">Welcome back</h1>
                  <p className="login-sub">Sign in to continue to your dashboard</p>
                  <form onSubmit={handleEmailSubmit}>
                    <div className="input-group">
                      <label className="input-label">Email address</label>
                      <div className="input-wrap">
                        <input
                          type="email"
                          className="glass-input"
                          placeholder="you@example.com"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>
                    {state.error && <p className="err-msg">{state.error}</p>}
                    <button type="submit" className="submit-btn" disabled={state.isLoading}>
                      {state.isLoading && <span className="spinner" />}
                      {state.isLoading ? "Checking..." : "Continue →"}
                    </button>
                  </form>
                </div>
              )}

              {state.step === "LOGIN_PASSWORD" && (
                <div className="step-content" key="password">
                  <h1 className="login-title">{state.firstName ? `Welcome back, ${state.firstName}!` : "Welcome back!"}</h1>
                  <p className="login-sub">{state.email}</p>
                  <form onSubmit={handleLoginPasswordSubmit}>
                    <div className="input-group">
                      <label className="input-label">Password</label>
                      <div className="input-wrap">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          className="glass-input"
                          placeholder="••••••••"
                          required
                          autoComplete="current-password"
                          style={{ paddingRight: "3.5rem" }}
                        />
                        <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <Link href="#" className="forgot">Forgot password?</Link>
                    </div>
                    {state.error && <p className="err-msg">{state.error}</p>}
                    <button type="submit" className="submit-btn" disabled={state.isLoading}>
                      {state.isLoading && <span className="spinner" />}
                      {state.isLoading ? "Signing in..." : "Sign In →"}
                    </button>
                  </form>
                  <button type="button" className="back-btn" onClick={goBack}>← Back to email</button>
                </div>
              )}

              {state.step === "SIGNUP_DETAILS" && (
                <div className="step-content" key="signup">
                  <h1 className="login-title">Create your account</h1>
                  <p className="login-sub">{state.email}</p>
                  <form onSubmit={handleSignupSubmit}>
                    <div className="signup-grid">
                      <div className="input-group">
                        <label className="input-label">First name</label>
                        <input name="firstName" className="glass-input" placeholder="John" required minLength={2} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Last name</label>
                        <input name="lastName" className="glass-input" placeholder="Doe" required minLength={2} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Phone</label>
                      <input name="phone" type="tel" className="glass-input" placeholder="+91 98765 43210" required minLength={5} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Password</label>
                      <div className="input-wrap">
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          className="glass-input"
                          placeholder="Min 8 characters"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          style={{ paddingRight: "3.5rem" }}
                        />
                        <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    {state.error && <p className="err-msg">{state.error}</p>}
                    <button type="submit" className="submit-btn" disabled={state.isLoading}>
                      {state.isLoading && <span className="spinner" />}
                      {state.isLoading ? "Creating account..." : "Create account →"}
                    </button>
                  </form>
                  <button type="button" className="back-btn" onClick={goBack}>← Back to email</button>
                </div>
              )}

              {state.step === "SUCCESS" && (
                <>
                  <h1 className="login-title">You&apos;re in!</h1>
                  <p className="login-sub">Redirecting to your dashboard...</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="login-quote">
          <p>Order your Website in Just <span className="highlight">1 rupee</span> with Websevix</p>
        </div>
      </div>
    </>
  );
}

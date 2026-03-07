"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/context/SiteSettingsContext";

// ─── Particle background canvas ──────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        vx:    (Math.random() - 0.5) * 0.3,
        vy:    (Math.random() - 0.5) * 0.3,
        size:  Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.alpha})`;
        ctx.fill();
      }
      // Draw lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
}

// ─── Main Login Page ──────────────────────────────────────────────
export default function AdminLoginPage() {
  const { login } = useAuth();
  const { logoSquare, logoWide } = useSiteSettings();
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setError("");
    setLoading(true);

    try {
      const res  = await fetch("/api/admin/auth/login", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json() as {
        success?: boolean; error?: string;
        accessToken?: string;
        admin?: { id: string; firstName: string; lastName: string; email: string; role: string };
      };

      if (!res.ok || !data.success) {
        setError(data.error ?? "Login failed.");
        setLoading(false);
        return;
      }

      // Hydrate useAuth so admin panel pages work with accessToken
      if (data.accessToken && data.admin) {
        login({
          accessToken: data.accessToken,
          user: {
            id:              data.admin.id,
            email:           data.admin.email,
            firstName:       data.admin.firstName,
            lastName:        data.admin.lastName,
            role:            data.admin.role as "client" | "developer" | "admin",
            avatar:          null,
            isVerified:      true,
            profileComplete: true,
          },
        });
      }

      setSuccess(true);
      // Hard navigation ensures adminToken cookie is included in the next request
      // (router.push is client-side and may race with cookie being set)
      setTimeout(() => { window.location.href = "/admin"; }, 1000);

    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, #060608 55%)" }}
    >
      {/* Particle network */}
      <ParticleCanvas />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-[400px] mx-4"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top: logo + badge */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        >
          {/* Logo mark */}
          <div className="relative mb-4">
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-black text-2xl text-white overflow-hidden"
              style={{
                background: logoSquare ? "transparent" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)",
                boxShadow:   "0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)",
              }}
              animate={{ boxShadow: ["0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)", "0 0 60px rgba(99,102,241,0.7), 0 0 100px rgba(99,102,241,0.3)", "0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {logoSquare
                ? <img src={logoSquare} alt="logo" style={{ width: 64, height: 64, objectFit: "contain" }} />
                : "W"
              }
            </motion.div>
            {/* Orbit ring */}
            <div className="absolute inset-0 rounded-2xl"
              style={{ border: "1px solid rgba(99,102,241,0.3)", boxShadow: "0 0 20px rgba(99,102,241,0.15)" }} />
          </div>

          {logoWide
            ? <img src={logoWide} alt="Websevix" style={{ height: 36, width: "auto", objectFit: "contain", marginBottom: 4 }} />
            : <h1 className="font-display font-bold text-2xl text-white tracking-tight mb-1">Websevix</h1>
          }
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <ShieldCheck size={12} className="text-red-400" />
            <span className="text-xs font-semibold text-red-400 tracking-wide uppercase">Admin Access Only</span>
          </div>
        </motion.div>

        {/* Login form card */}
        <motion.div
          className="rounded-2xl p-7"
          style={{
            background:   "rgba(255,255,255,0.03)",
            border:       "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow:    "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="font-display font-semibold text-lg text-white mb-1">Sign in to Admin Panel</h2>
          <p className="text-sm text-slate mb-6">Restricted area. Authorised personnel only.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="admin@websevix.com"
                  autoComplete="username"
                  disabled={loading || success}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate/50 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-indigo-500/60 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading || success}
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-slate/50 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-indigo-500/60 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate hover:text-silver transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-300"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <AlertCircle size={14} className="flex-shrink-0 text-red-400" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity mt-2"
              style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.span key="success" className="flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                    <ShieldCheck size={16} /> Access Granted
                  </motion.span>
                ) : loading ? (
                  <motion.span key="loading" className="flex items-center gap-2"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Loader2 size={16} className="animate-spin" /> Verifying…
                  </motion.span>
                ) : (
                  <motion.span key="idle" className="flex items-center gap-2"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Lock size={15} /> Access Admin Panel
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="text-center text-xs text-slate mt-5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        >
          Not an admin?{" "}
          <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Go to client login →
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}

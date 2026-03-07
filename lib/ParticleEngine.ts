/**
 * ParticleEngine — performance-first canvas particle system.
 * Rules:
 *  • NO ctx.filter (blur via software = frame drops)
 *  • Glow faked with multi-pass radial gradients at lower opacity
 *  • Max 50 particles alive at once (dead ones reused)
 *  • globalCompositeOperation = "lighter" for additive glow
 *  • dt-capped at 33ms so a single slow frame won't teleport particles
 */

export interface ParticleData {
  x: number; y: number;
  vx: number; vy: number;
  ax: number; ay: number;
  life: number;   // 1 → 0
  decay: number;
  size: number;
  r: number; g: number; b: number;  // pre-parsed color components
  type: "streak" | "orb" | "spark" | "mega";
  trail: { x: number; y: number }[];
  rotation: number;
  rotationSpeed: number;
  active: boolean;
}

interface RingData {
  x: number; y: number;
  radius: number;
  maxRadius: number;
  life: number;
  speed: number;
  r: number; g: number; b: number;
}

const MAX_PARTICLES = 60;
const MAX_RINGS = 8;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const COLORS = {
  indigo:  hexToRgb("#6366F1"),
  violet:  hexToRgb("#8B5CF6"),
  cyan:    hexToRgb("#06B6D4"),
  purple:  hexToRgb("#A78BFA"),
  white:   [255, 255, 255] as [number, number, number],
  emerald: hexToRgb("#10B981"),
  red:     hexToRgb("#EF4444"),
  gold:    hexToRgb("#F59E0B"),
  pink:    hexToRgb("#EC4899"),
};

export class ParticleEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private _pool: ParticleData[] = [];
  private _rings: RingData[] = [];
  private _animId = 0;
  private _running = false;
  private _lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("No 2d context");
    this.ctx = ctx;
    // Pre-fill particle pool
    for (let i = 0; i < MAX_PARTICLES; i++) this._pool.push(this._makeEmpty());
    for (let i = 0; i < MAX_RINGS; i++) this._rings.push({ x: 0, y: 0, radius: 0, maxRadius: 0, life: 0, speed: 0, r: 0, g: 0, b: 0 });
    this.resize();
  }

  private _makeEmpty(): ParticleData {
    return { x:0,y:0,vx:0,vy:0,ax:0,ay:0,life:0,decay:0,size:0,r:0,g:0,b:0,type:"orb",trail:[],rotation:0,rotationSpeed:0,active:false };
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement?.getBoundingClientRect() ?? this.canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.width  = rect.width  * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  get w() { return this.canvas.width  / (window.devicePixelRatio || 1); }
  get h() { return this.canvas.height / (window.devicePixelRatio || 1); }

  private _spawn(p: Partial<ParticleData> & { x: number; y: number; r: number; g: number; b: number }) {
    const slot = this._pool.find(p => !p.active) ?? this._pool[0];
    Object.assign(slot, { trail: [], active: true, rotation: 0, rotationSpeed: 0, ax: 0, ay: 0, ...p });
  }

  private _spawnRing(x: number, y: number, rgb: [number,number,number], speed: number, max: number) {
    const slot = this._rings.find(r => r.life <= 0) ?? this._rings[0];
    slot.x = x; slot.y = y; slot.radius = 1; slot.maxRadius = max;
    slot.speed = speed; slot.life = 1;
    [slot.r, slot.g, slot.b] = rgb;
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  explode(x: number, y: number, opts?: { mult?: number }) {
    const m = Math.min(opts?.mult ?? 1, 1.5);

    // TYPE A — streaks (max 18)
    for (let i = 0; i < Math.round(18 * m); i++) {
      const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.5;
      const spd   = 250 + Math.random() * 380;
      const [r,g,b] = Math.random() > 0.5 ? COLORS.indigo : COLORS.violet;
      this._spawn({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, ax: -Math.cos(angle)*400, ay: -Math.sin(angle)*400, life:1, decay:0.025+Math.random()*0.012, size:8+Math.random()*4, r,g,b, type:"streak", rotation:angle });
    }
    // TYPE B — orbs (max 10)
    for (let i = 0; i < Math.round(10 * m); i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 60 + Math.random() * 160;
      const [r,g,b] = Math.random() > 0.5 ? COLORS.cyan : COLORS.purple;
      this._spawn({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, ay:40, life:1, decay:0.016+Math.random()*0.008, size:3+Math.random()*3, r,g,b, type:"orb" });
    }
    // TYPE C — sparks (max 12)
    for (let i = 0; i < Math.round(12 * m); i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 180 + Math.random() * 500;
      this._spawn({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, ay:60, life:1, decay:0.012, size:1.5, ...{r:255,g:255,b:255}, type:"spark" });
    }
    // TYPE D — mega (max 5)
    for (let i = 0; i < Math.round(5 * m); i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 35 + Math.random() * 65;
      const [r,g,b] = Math.random() > 0.5 ? COLORS.violet : COLORS.indigo;
      this._spawn({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, life:1, decay:0.013, size:9+Math.random()*5, r,g,b, type:"mega" });
    }
    this._ensureRunning();
  }

  addRing(x: number, y: number, opts?: { color?: [number,number,number]; speed?: number; max?: number }) {
    this._spawnRing(x, y, opts?.color ?? COLORS.indigo, opts?.speed ?? 850, opts?.max ?? 1400);
    this._ensureRunning();
  }

  rings(x: number, y: number) {
    this._spawnRing(x, y, COLORS.indigo,  850, 1500);
    setTimeout(() => { this._spawnRing(x, y, COLORS.violet, 680, 1300); this._ensureRunning(); }, 60);
    setTimeout(() => { this._spawnRing(x, y, COLORS.cyan,   520, 1100); this._ensureRunning(); }, 160);
  }

  addImplosion(x: number, y: number) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 80 + Math.random() * 180;
      const sx = x + Math.cos(angle) * dist;
      const sy = y + Math.sin(angle) * dist;
      const to = Math.atan2(y - sy, x - sx);
      const spd = 160 + Math.random() * 140;
      const [r,g,b] = Math.random() > 0.5 ? COLORS.indigo : COLORS.cyan;
      this._spawn({ x:sx, y:sy, vx:Math.cos(to)*spd, vy:Math.sin(to)*spd, life:1, decay:0.022, size:2+Math.random()*2, r,g,b, type:"orb" });
    }
    this._ensureRunning();
  }

  confetti(x: number, y: number) {
    const palette: [number,number,number][] = [COLORS.gold, COLORS.emerald, COLORS.indigo, COLORS.pink, COLORS.cyan];
    for (let i = 0; i < 35; i++) {
      const angle = -Math.PI/2 + (Math.random()-0.5) * Math.PI * 1.3;
      const spd   = 130 + Math.random() * 280;
      const [r,g,b] = palette[Math.floor(Math.random() * palette.length)];
      this._spawn({ x: x+(Math.random()-0.5)*60, y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd, ay:350, life:1, decay:0.007, size:4+Math.random()*4, r,g,b, type:"orb", rotationSpeed:(Math.random()-0.5)*6 });
    }
    this._ensureRunning();
  }

  microParticle(x: number, y: number) {
    const [r,g,b] = COLORS.purple;
    this._spawn({ x:x+(Math.random()-0.5)*20, y, vx:(Math.random()-0.5)*12, vy:-(30+Math.random()*40), life:1, decay:0.012, size:1.5, r,g,b, type:"orb" });
    this._ensureRunning();
  }

  errorBurst(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 50 + Math.random() * 100;
      const [r,g,b] = COLORS.red;
      this._spawn({ x:x+(Math.random()-0.5)*30, y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd, ay:80, life:1, decay:0.032, size:2+Math.random()*2, r,g,b, type:"orb" });
    }
    this._ensureRunning();
  }

  // ── Loop ─────────────────────────────────────────────────────────────────────

  private _ensureRunning() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    const loop = (now: number) => {
      if (!this._running) return;
      const dt = Math.min((now - this._lastTime) / 1000, 0.033); // cap at 33ms
      this._lastTime = now;
      this._tick(dt);
      this._animId = requestAnimationFrame(loop);
    };
    this._animId = requestAnimationFrame(loop);
  }

  private _tick(dt: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // ── Rings ──
    let anyAlive = false;
    for (const r of this._rings) {
      if (r.life <= 0) continue;
      r.radius += r.speed * dt;
      r.life = Math.max(0, 1 - r.radius / r.maxRadius);
      if (r.life <= 0) continue;
      anyAlive = true;
      const lw = Math.max(0.4, 2.5 * r.life * (1 - r.radius / r.maxRadius * 0.7));
      ctx.save();
      ctx.globalAlpha = r.life * 0.85;
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgb(${r.r},${r.g},${r.b})`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── Particles ──
    for (const p of this._pool) {
      if (!p.active) continue;
      anyAlive = true;
      // Update trail (only for sparks)
      if (p.type === "spark") {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 4) p.trail.shift();
      }
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      p.life -= p.decay;
      p.rotation += p.rotationSpeed * dt;

      if (p.life <= 0) { p.active = false; p.trail = []; continue; }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.globalCompositeOperation = "lighter";

      switch (p.type) {
        case "streak": this._drawStreak(p); break;
        case "orb":    this._drawOrb(p);    break;
        case "spark":  this._drawSpark(p);  break;
        case "mega":   this._drawMega(p);   break;
      }
      ctx.restore();
    }

    if (!anyAlive) {
      this._running = false;
      ctx.clearRect(0, 0, this.w, this.h);
    }
  }

  // ── Draw methods — NO ctx.filter ──────────────────────────────────────────────

  private _drawStreak(p: ParticleData) {
    const ctx = this.ctx;
    const len = p.size * p.life * 1.2 + 4;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    const g = ctx.createLinearGradient(-len/2, 0, len/2, 0);
    g.addColorStop(0, "transparent");
    g.addColorStop(0.4, `rgba(${p.r},${p.g},${p.b},0.7)`);
    g.addColorStop(0.6, `rgb(${p.r},${p.g},${p.b})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(-len/2, -1, len, 2);
    ctx.restore();
  }

  private _drawOrb(p: ParticleData) {
    const ctx = this.ctx;
    const r = p.size;
    // Core bright dot
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.9 * p.life})`);
    g.addColorStop(0.3, `rgba(${p.r},${p.g},${p.b},${0.8 * p.life})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    // Outer soft halo (simulates glow, no filter)
    const g2 = ctx.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r * 2.5);
    g2.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${0.25 * p.life})`);
    g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private _drawSpark(p: ParticleData) {
    const ctx = this.ctx;
    if (p.trail.length > 1) {
      for (let i = 1; i < p.trail.length; i++) {
        const t = i / p.trail.length;
        ctx.save();
        ctx.globalAlpha = p.life * t * 0.5;
        ctx.strokeStyle = `rgba(255,255,255,${t})`;
        ctx.lineWidth = p.size * t;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.trail[i-1].x, p.trail[i-1].y);
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.fillStyle = `rgba(255,255,255,${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  private _drawMega(p: ParticleData) {
    const ctx = this.ctx;
    const pulse = 1 + Math.sin(p.life * Math.PI * 4) * 0.12;
    const r = p.size * pulse;
    // 3-pass glow: inner white, mid color, outer halo (no blur needed)
    const g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 0.4);
    g1.addColorStop(0, `rgba(255,255,255,${0.9 * p.life})`);
    g1.addColorStop(1, `rgba(${p.r},${p.g},${p.b},${0.7 * p.life})`);
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g2.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${0.5 * p.life})`);
    g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    const g3 = ctx.createRadialGradient(p.x, p.y, r * 0.5, p.x, p.y, r * 3);
    g3.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${0.2 * p.life})`);
    g3.addColorStop(1, "transparent");
    ctx.fillStyle = g3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  clear() {
    for (const p of this._pool) { p.active = false; p.trail = []; }
    for (const r of this._rings) { r.life = 0; }
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  destroy() {
    this._running = false;
    cancelAnimationFrame(this._animId);
    this.clear();
  }
}

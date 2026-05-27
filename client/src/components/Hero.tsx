import React, { useEffect, useRef } from "react";
import { Search, Camera, ArrowRight, ShieldCheck, Zap, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onReportLost: () => void;
  onReportFound: () => void;
  onSearch: () => void;
  onOpenImageSearch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

// Animated canvas: grid + traveling pulses along grid lines
function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let w = 0;
    let h = 0;
    const CELL = 48;

    // Each pulse travels along a grid line
    interface Pulse {
      axis: "x" | "y"; // horizontal or vertical line
      line: number;     // which grid line index
      pos: number;      // current position along that line (px)
      speed: number;
      alpha: number;
      len: number;      // tail length
      color: string;
    }

    const pulses: Pulse[] = [];
    const COLORS = [
      "29,78,216",   // blue (primary)
      "59,130,246",  // lighter blue
      "4,120,87",    // green (accent)
    ];

    function spawnPulse() {
      const axis = Math.random() > 0.5 ? "x" : "y";
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      if (axis === "x") {
        const cols = Math.floor(w / CELL);
        pulses.push({
          axis,
          line: Math.floor(Math.random() * Math.floor(h / CELL)),
          pos: Math.random() > 0.5 ? -60 : w + 60,
          speed: (Math.random() * 1.5 + 0.8) * (Math.random() > 0.5 ? 1 : -1),
          alpha: Math.random() * 0.5 + 0.3,
          len: Math.random() * 80 + 40,
          color,
        });
      } else {
        pulses.push({
          axis,
          line: Math.floor(Math.random() * Math.floor(w / CELL)),
          pos: Math.random() > 0.5 ? -60 : h + 60,
          speed: (Math.random() * 1.5 + 0.8) * (Math.random() > 0.5 ? 1 : -1),
          alpha: Math.random() * 0.5 + 0.3,
          len: Math.random() * 80 + 40,
          color,
        });
      }
    }

    function resize() {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    }

    function drawGrid() {
      ctx.clearRect(0, 0, w, h);

      // vertical lines
      ctx.strokeStyle = "rgba(29,78,216,0.07)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += CELL) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // horizontal lines
      for (let y = 0; y <= h; y += CELL) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // intersection dots
      ctx.fillStyle = "rgba(29,78,216,0.12)";
      for (let x = 0; x <= w; x += CELL) {
        for (let y = 0; y <= h; y += CELL) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawPulses() {
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.pos += p.speed;

        // remove if off screen
        if (
          (p.speed > 0 && p.pos - p.len > (p.axis === "x" ? w : h) + 20) ||
          (p.speed < 0 && p.pos + p.len < -20)
        ) {
          pulses.splice(i, 1);
          continue;
        }

        const x1 = p.axis === "x" ? p.pos - p.len * (p.speed > 0 ? 1 : -1) : p.line * CELL;
        const y1 = p.axis === "y" ? p.pos - p.len * (p.speed > 0 ? 1 : -1) : p.line * CELL;
        const x2 = p.axis === "x" ? p.pos : p.line * CELL;
        const y2 = p.axis === "y" ? p.pos : p.line * CELL;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `rgba(${p.color},0)`);
        grad.addColorStop(1, `rgba(${p.color},${p.alpha})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // glowing head dot
        ctx.beginPath();
        ctx.arc(x2, y2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      }
    }

    let spawnTimer = 0;
    function tick() {
      drawGrid();
      drawPulses();
      spawnTimer++;
      if (spawnTimer % 40 === 0 && pulses.length < 18) spawnPulse();
      raf = requestAnimationFrame(tick);
    }

    resize();
    // seed a few pulses immediately
    for (let i = 0; i < 6; i++) spawnPulse();
    tick();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        // fade out toward the right so content stays readable
        WebkitMaskImage: "linear-gradient(to right, black 40%, transparent 100%)",
        maskImage: "linear-gradient(to right, black 40%, transparent 100%)",
      }}
    />
  );
}

export default function Hero({
  onReportLost,
  onReportFound,
  onSearch,
  onOpenImageSearch,
  searchQuery,
  setSearchQuery,
}: HeroProps) {
  const features = [
    { icon: Zap,           title: "Image search",     desc: "Upload a photo to find similar listings." },
    { icon: ShieldCheck,   title: "Verified claims",  desc: "Admins review claims before items are released." },
    {
      icon: MessageCircle,
      title: "Campus assistant",
      desc: "Get help reporting, searching, and claiming.",
      onClick: () => window.dispatchEvent(new CustomEvent("open-campus-chat")),
    },
  ];

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>

      {/* Animated grid canvas */}
      <GridCanvas />

      {/* Blue glow top-left */}
      <div aria-hidden style={{
        position: "absolute", top: -140, left: -140,
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(29,78,216,0.15) 0%, transparent 70%)",
        zIndex: 0, pointerEvents: "none",
      }} />

      {/* Green glow bottom-right */}
      <div aria-hidden style={{
        position: "absolute", bottom: -80, right: -60,
        width: 380, height: 380, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(4,120,87,0.10) 0%, transparent 70%)",
        zIndex: 0, pointerEvents: "none",
      }} />

      {/* Content */}
      <section className="page" style={{ position: "relative", zIndex: 1 }}>

        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginBottom: 24, padding: "4px 12px", borderRadius: 999,
            border: "1px solid rgba(29,78,216,0.25)",
            background: "rgba(29,78,216,0.07)",
            color: "var(--theme-primary)", fontSize: 12, fontWeight: 500,
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "currentColor", animation: "pulse 2s infinite",
          }} />
          Bicol University · Lost &amp; Found Portal
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl">
            Lost something{" "}
            <span style={{ position: "relative", display: "inline-block", color: "var(--theme-primary)" }}>
              on campus?
              <svg aria-hidden style={{ position: "absolute", bottom: -6, left: 0, width: "100%" }}
                viewBox="0 0 200 8" preserveAspectRatio="none" fill="none">
                <path d="M0 6 Q25 1 50 5 Q75 9 100 5 Q125 1 150 5 Q175 9 200 5"
                  stroke="var(--theme-primary)" strokeWidth="2" strokeOpacity="0.35" />
              </svg>
            </span>
          </h1>
          <p className="section-lead text-base sm:text-lg">
            Report, search, and recover items in one place. Built for students and campus security.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onReportLost} className="btn-primary px-6 py-3">
            Report lost <ArrowRight size={16} />
          </button>
          <button type="button" onClick={onReportFound} className="btn-accent px-6 py-3">
            Report found
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mt-12 flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-lg bg-surface px-4 ring-1 ring-border">
            <Search size={18} className="shrink-0 text-muted" />
            <input
              type="text"
              placeholder="Search items…"
              className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-fg outline-none placeholder:text-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
            />
            <button type="button" onClick={onOpenImageSearch} className="btn-ghost p-2" aria-label="Search by image">
              <Camera size={18} />
            </button>
          </div>
          <button type="button" onClick={onSearch} className="btn-primary shrink-0">Search</button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-12 flex flex-wrap gap-x-10 gap-y-3">
          {[
            { label: "Items reported",  value: "500+"   },
            { label: "Items recovered", value: "320+"   },
            { label: "Active students", value: "1,200+" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-fg">{stat.value}</span>
              <span className="text-xs text-muted">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Feature cards */}
        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.button
              key={f.title}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              onClick={f.onClick}
              className={`group relative overflow-hidden rounded-xl border p-6 text-left transition-all duration-300 bg-surface ${
                f.onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg" : "cursor-default"
              }`}
              style={{ borderColor: "var(--theme-border)" }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "radial-gradient(circle at 20% 50%, rgba(29,78,216,0.06), transparent 70%)" }} />
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "rgba(29,78,216,0.09)", color: "var(--theme-primary)" }}>
                <f.icon size={20} />
              </div>
              <h3 className="text-base font-semibold text-fg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
              {f.onClick && (
                <ArrowRight size={14}
                  className="mt-4 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                  style={{ color: "var(--theme-primary)" }} />
              )}
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
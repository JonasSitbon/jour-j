"use client";

import { useRef, useEffect } from "react";
import { motion, useInView, animate as fmAnimate, AnimatePresence } from "framer-motion";
import { TC, GOLD } from "./tokens";

// ─── Animation variants ────────────────────────────────────────────────────────

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

// ─── FadeIn ───────────────────────────────────────────────────────────────────

export function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider border"
      style={{ background: `${TC}18`, borderColor: `${TC}40`, color: TC }}>
      {children}
    </span>
  );
}

// ─── Counter ──────────────────────────────────────────────────────────────────

export function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    fmAnimate(0, to, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { node.textContent = prefix + Math.round(v).toLocaleString("fr-FR") + suffix; },
    });
  }, [inView, to, prefix, suffix]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// ─── Decorative SVG elements ──────────────────────────────────────────────────

export function DecorRings() {
  return (
    <svg width="80" height="40" viewBox="0 0 80 40" fill="none" aria-hidden>
      <circle cx="25" cy="20" r="16" stroke={TC} strokeWidth="2.5" strokeOpacity="0.4" />
      <circle cx="55" cy="20" r="16" stroke={GOLD} strokeWidth="2.5" strokeOpacity="0.4" />
    </svg>
  );
}

export function DecorDots() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden>
      {[0, 1, 2].map(row => [0, 1, 2].map(col => (
        <circle key={`${row}-${col}`} cx={10 + col * 20} cy={10 + row * 20} r="3"
          fill={TC} fillOpacity={0.2 + col * 0.1} />
      )))}
    </svg>
  );
}

export function DecorFloral() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
      <path d="M60 20 Q80 40 60 60 Q40 40 60 20Z" stroke={TC} strokeWidth="1.5" strokeOpacity="0.25" fill="none" />
      <path d="M20 60 Q40 80 60 60 Q40 40 20 60Z" stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.25" fill="none" />
      <path d="M100 60 Q80 80 60 60 Q80 40 100 60Z" stroke={TC} strokeWidth="1.5" strokeOpacity="0.2" fill="none" />
      <path d="M60 100 Q80 80 60 60 Q40 80 60 100Z" stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.2" fill="none" />
      <circle cx="60" cy="60" r="4" fill={TC} fillOpacity="0.3" />
    </svg>
  );
}

// ─── MiniCheckBurst ───────────────────────────────────────────────────────────

export function MiniCheckBurst({ active }: { active: boolean }) {
  const dots = [
    { angle: -60, color: TC }, { angle: -20, color: GOLD }, { angle: 20, color: "#5A9E6F" },
    { angle: 60, color: TC }, { angle: 100, color: GOLD },
  ];
  return (
    <AnimatePresence>
      {active && (
        <div className="absolute left-0 top-0 pointer-events-none">
          {dots.map((d, i) => (
            <motion.div key={i}
              initial={{ opacity: 1, scale: 0, x: 8, y: 4 }}
              animate={{ opacity: 0, scale: 1, x: 8 + Math.cos(d.angle * Math.PI / 180) * 16, y: 4 + Math.sin(d.angle * Math.PI / 180) * 16 }}
              transition={{ duration: 0.45, delay: i * 0.03, ease: "easeOut" }}
              className="absolute w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Lenis hook ───────────────────────────────────────────────────────────────

export function useLenis() {
  useEffect(() => {
    let lenis: any = null;
    import("lenis").then(({ default: Lenis }) => {
      lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
      function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    });
    return () => lenis?.destroy();
  }, []);
}

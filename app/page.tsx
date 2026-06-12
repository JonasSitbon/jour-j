"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, useInView, AnimatePresence,
  stagger, animate as fmAnimate,
} from "framer-motion";
import { Logo } from "@/components/icon";

// ─── Palette ────────────────────────────────────────────────────────────────────

const TC        = "#C96E2C";   // terracotta
const GOLD      = "#D4A340";   // doré
const SAGE      = "#7E9A63";   // vert sauge
const BLUSH     = "#F2D4C8";   // rose blush
const BG_CREAM  = "#FDFAF5";   // fond principal
const WARM_SOFT = "#F4ECDD";   // sections alternées
const TEXT_DARK = "#1C1208";   // titres
const TEXT_MID  = "#6B5744";   // paragraphes
const TEXT_LIGHT= "#A08B78";   // labels, captions
const BROWN_DARK= "#382F23";   // éléments forts

// ─── Lenis smooth scroll ───────────────────────────────────────────────────────

function useLenis() {
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

// ─── Animated counter ──────────────────────────────────────────────────────────

function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
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

// ─── Section fade-up ───────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
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

// ─── Pill ──────────────────────────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider border"
      style={{ background: `${TC}18`, borderColor: `${TC}40`, color: TC }}>
      {children}
    </span>
  );
}

// ─── Icon SVG helpers ──────────────────────────────────────────────────────────

function Ic({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    wallet: "M21 12V7H5a2 2 0 0 1 0-4h14v4M21 12H16a2 2 0 0 0 0 4h5v-4zM3 5v14a2 2 0 0 0 2 2h16v-4",
    calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
    check: "M20 6L9 17l-5-5",
    rings: "M12 8a4 4 0 0 1 4 4M8 12a4 4 0 0 1 4-4M8 12a4 4 0 0 0 4 4M16 12a4 4 0 0 1-4 4",
    music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    sparkle: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
    gift: "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
    key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
    card: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM1 10h22",
    arrow: "M5 12h14M12 5l7 7-7 7",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    check2: "M20 6L9 17l-5-5",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || paths.grid} />
    </svg>
  );
}

// ─── App Mockup: Dashboard ──────────────────────────────────────────────────────

function MockDashboard() {
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] min-w-0 w-full select-none">
      {/* Hero card */}
      <div className="rounded-lg p-4 mb-4 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${TC} 0%, #9B4A1A 100%)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />
        <div className="text-[11px] opacity-75 font-medium mb-1">Camille &amp; Alexandre</div>
        <div className="text-3xl font-bold tracking-tight">J-142</div>
        <div className="text-[11px] opacity-80 mt-0.5">📍 Domaine des Roses · Aix-en-Provence</div>
        <div className="mt-3 flex gap-2">
          {["Été 2026", "147 invités", "24 500 €"].map((t, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/20 backdrop-blur">{t}</span>
          ))}
        </div>
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Invités", val: "147", sub: "12 en attente", color: TC },
          { label: "Checklist", val: "68%", sub: "32 tâches", color: "#6B8C3E" },
          { label: "Budget", val: "70%", sub: "24 500 €", color: GOLD },
          { label: "Prestataires", val: "8/12", sub: "confirmés", color: "#3B6EA5" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-2.5 text-center border border-black/5">
            <div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[9px] font-semibold text-[#382F23]">{s.label}</div>
            <div className="text-[8px] text-[#8a7a6a] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
      {/* Checklist preview */}
      <div className="bg-white rounded-lg p-3 border border-black/5">
        <div className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wide mb-2">Prochaines tâches</div>
        {[
          { t: "Confirmer le traiteur", done: true },
          { t: "Envoyer save-the-dates", done: false },
          { t: "Choisir les musiques cérémonie", done: false },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${item.done ? "border-transparent" : "border-[#ddd]"}`}
              style={{ background: item.done ? TC : "transparent" }}>
              {item.done && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>}
            </div>
            <span className={`text-[10px] ${item.done ? "line-through text-[#aaa]" : "text-[#382F23]"}`}>{item.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Mockup: Guests ────────────────────────────────────────────────────────

function MockGuests() {
  const guests = [
    { name: "Amélie Martin", side: "A", rsvp: "yes", diet: "🌿", table: "T1" },
    { name: "Thomas Dupont", side: "B", rsvp: "pending", diet: "🍽", table: "—" },
    { name: "Claire Bernard", side: "A", rsvp: "yes", diet: "🌿", table: "T3" },
    { name: "Julien Moreau", side: "B", rsvp: "no", diet: "🍽", table: "—" },
    { name: "Sophie Laurent", side: "A", rsvp: "yes", diet: "🥗", table: "T2" },
  ];
  const rsvpStyle: Record<string, string> = {
    yes: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    no: "bg-red-100 text-red-600",
  };
  const rsvpLabel: Record<string, string> = { yes: "Confirmé", pending: "En attente", no: "Décliné" };
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] select-none">
      {/* Stats */}
      <div className="flex gap-2 mb-3">
        {[{ l: "147 invités", c: "bg-white" }, { l: "✓ 98 confirmés", c: "bg-green-50" }, { l: "⏳ 35 en attente", c: "bg-amber-50" }, { l: "✗ 14 déclinés", c: "bg-red-50" }].map((s, i) => (
          <span key={i} className={`${s.c} px-2 py-1 rounded-md text-[9px] font-semibold border border-black/5`}>{s.l}</span>
        ))}
      </div>
      {/* Search bar */}
      <div className="bg-white border border-black/10 rounded-lg px-3 py-2 text-[10px] text-[#aaa] mb-3 flex items-center gap-2">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        Rechercher un invité…
      </div>
      {/* Table */}
      <div className="bg-white rounded-lg border border-black/5 overflow-hidden">
        <div className="grid grid-cols-[2fr_auto_auto_auto] gap-0">
          <div className="col-span-4 grid grid-cols-[2fr_auto_auto_auto] px-3 py-1.5 bg-[#F4ECDD] text-[8px] font-semibold text-[#8a7a6a] uppercase tracking-wide border-b border-black/5">
            <span>Invité</span><span>RSVP</span><span>Régime</span><span>Table</span>
          </div>
          {guests.map((g, i) => (
            <div key={i} className="col-span-4 grid grid-cols-[2fr_auto_auto_auto] px-3 py-2 border-b border-black/5 last:border-0 items-center gap-2">
              <div>
                <div className="text-[10px] font-semibold">{g.name}</div>
                <div className="text-[8px] text-[#8a7a6a]">Côté {g.side === "A" ? "Camille" : "Alexandre"}</div>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-semibold ${rsvpStyle[g.rsvp]}`}>{rsvpLabel[g.rsvp]}</span>
              <span className="text-[12px]">{g.diet}</span>
              <span className="text-[9px] font-mono text-[#8a7a6a]">{g.table}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App Mockup: Budget ────────────────────────────────────────────────────────

function MockBudget() {
  const cats = [
    { label: "Traiteur", pct: 42, amount: "14 700€", color: TC },
    { label: "Salle / Domaine", pct: 18, amount: "6 300€", color: GOLD },
    { label: "Photographe", pct: 12, amount: "4 200€", color: "#6B8C3E" },
    { label: "Musique / DJ", pct: 8, amount: "2 800€", color: "#3B6EA5" },
    { label: "Fleurs & Déco", pct: 10, amount: "3 500€", color: "#B5586E" },
    { label: "Autres", pct: 10, amount: "3 000€", color: "#8a7a6a" },
  ];
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] select-none">
      {/* Total */}
      <div className="bg-white rounded-lg p-3 mb-3 border border-black/5">
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-[9px] text-[#8a7a6a] font-semibold uppercase tracking-wide">Budget total</div>
            <div className="text-xl font-bold">24 500 <span className="text-sm font-semibold text-[#8a7a6a]">/ 35 000€</span></div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-[#8a7a6a]">Restant</div>
            <div className="text-sm font-bold text-green-600">10 500€</div>
          </div>
        </div>
        <div className="h-2 bg-[#F4ECDD] rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TC}, ${GOLD})` }}
            initial={{ width: "0%" }} whileInView={{ width: "70%" }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }} />
        </div>
        <div className="text-[9px] text-[#8a7a6a] mt-1">70% engagé</div>
      </div>
      {/* Categories */}
      <div className="flex flex-col gap-1.5">
        {cats.map((c, i) => (
          <div key={i} className="bg-white rounded-lg px-3 py-2 border border-black/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="text-[10px] flex-1">{c.label}</span>
            <div className="w-16 h-1.5 bg-[#F4ECDD] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: c.color }}
                initial={{ width: 0 }} whileInView={{ width: `${c.pct}%` }} viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <span className="text-[9px] font-semibold text-[#8a7a6a] w-10 text-right">{c.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Mockup: Jour J ───────────────────────────────────────────────────────

function MockDayJ() {
  const events = [
    { time: "09:30", label: "Arrivée mariée & famille", icon: "🌸", duration: "45 min", color: "#B5586E" },
    { time: "11:00", label: "Cérémonie civile", icon: "💍", duration: "30 min", color: TC },
    { time: "12:30", label: "Cocktail & photos", icon: "🥂", duration: "2h", color: GOLD },
    { time: "19:00", label: "Dîner de gala", icon: "🍽", duration: "3h30", color: "#6B8C3E" },
    { time: "22:30", label: "Première danse", icon: "🎵", duration: "5 min", color: "#3B6EA5" },
    { time: "23:00", label: "Soirée & piste de danse", icon: "🎉", duration: "3h", color: "#8a7a6a" },
  ];
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold">Samedi 15 Août 2026</div>
        <span className="px-2 py-0.5 rounded-full text-[8px] font-semibold text-white" style={{ background: TC }}>EN DIRECT</span>
      </div>
      <div className="flex flex-col gap-0 relative">
        <div className="absolute left-[42px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        {events.map((e, i) => (
          <div key={i} className="flex items-start gap-3 py-2 relative">
            <div className="w-[38px] shrink-0 text-[9px] font-mono font-bold text-[#8a7a6a] pt-1 text-right">{e.time}</div>
            <div className="w-3 h-3 rounded-full border-2 border-white shrink-0 mt-1 z-10 shadow-sm" style={{ background: e.color }} />
            <div className="flex-1 bg-white rounded-lg px-2.5 py-2 border border-black/5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px]">{e.icon}</span>
                <span className="text-[10px] font-semibold truncate">{e.label}</span>
              </div>
              <div className="text-[8px] text-[#8a7a6a] mt-0.5">{e.duration}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Mockup: Plan de table ─────────────────────────────────────────────────

function MockSeating() {
  const tables = [
    { id: "T1", name: "Table des Mariés", color: TC, guests: ["Camille", "Alexandre", "Mamie", "Papi", "Lola"] },
    { id: "T2", name: "Table Famille A", color: "#6B8C3E", guests: ["Marc", "Julie", "Paul", "Sarah"] },
    { id: "T3", name: "Table Amis", color: "#3B6EA5", guests: ["Thomas", "Emma", "Léa", "Romain", "Zoé", "Hugo"] },
    { id: "T4", name: "Table Famille B", color: GOLD, guests: ["Henri", "Brigitte", "Nicolas", "Aline"] },
  ];
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold">Plan de table • 147 invités placés</div>
        <div className="flex gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[8px] bg-white border border-black/10">17 tables</span>
          <span className="px-2 py-0.5 rounded-md text-[8px] bg-green-100 text-green-700 border border-green-200">Tous placés ✓</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tables.map((t) => (
          <div key={t.id} className="bg-white rounded-lg p-2.5 border border-black/5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
              <span className="text-[9px] font-bold truncate">{t.name}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {t.guests.map((g) => (
                <span key={g} className="px-1.5 py-0.5 rounded-full text-[8px] font-medium" style={{ background: `${t.color}20`, color: t.color }}>{g}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Visual seating hint */}
      <div className="mt-3 flex items-center gap-2 text-[9px] text-[#8a7a6a]">
        <span>✦</span>
        <span>Glissez-déposez les invités entre les tables</span>
      </div>
    </div>
  );
}

// ─── App Mockup: Dates ────────────────────────────────────────────────────────

function MockDates() {
  const candidates = [
    { date: "Sam 15 Août", score: 94, weather: "☀️", temp: "28°", rain: "2%", note: "Recommandé" },
    { date: "Sam 22 Août", score: 88, weather: "⛅", temp: "25°", rain: "15%", note: "" },
    { date: "Sam 6 Sept", score: 71, weather: "🌦", temp: "22°", rain: "35%", note: "" },
  ];
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] select-none">
      <div className="text-[10px] font-bold mb-3">Comparaison des dates candidates</div>
      <div className="flex flex-col gap-2">
        {candidates.map((c, i) => (
          <div key={i} className={`bg-white rounded-lg px-3 py-2.5 border flex items-center gap-3 ${i === 0 ? `border-[${TC}] ring-1 ring-[${TC}]/30` : "border-black/5"}`}>
            <div className="text-lg">{c.weather}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold">{c.date}</span>
                {c.note && <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold text-white" style={{ background: TC }}>{c.note}</span>}
              </div>
              <div className="text-[8px] text-[#8a7a6a] mt-0.5">{c.temp} · {c.rain} de pluie · Aix-en-Provence</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: c.score >= 90 ? "#6B8C3E" : c.score >= 75 ? GOLD : TC }}>{c.score}</div>
              <div className="text-[8px] text-[#8a7a6a]">score</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[8px] text-[#8a7a6a] text-center">Données météo Open-Meteo en temps réel</div>
    </div>
  );
}

// ─── App Frame (Light) ─────────────────────────────────────────────────────────

function AppFrame({ children, url = "the-cockpit.fr/dashboard" }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(201,110,44,0.15)",
        boxShadow: "0 20px 60px rgba(56,47,35,0.12), 0 4px 16px rgba(56,47,35,0.08)",
      }}>
      {/* Topbar claire */}
      <div style={{ background: WARM_SOFT, borderBottom: "1px solid rgba(201,110,44,0.12)", padding: "10px 16px" }}
        className="flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFB3AE]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFD180]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#A8D5A2]" />
        </div>
        <div style={{ background: "rgba(201,110,44,0.1)", borderRadius: 6, padding: "3px 12px" }}
          className="flex-1 mx-2 text-center">
          <span style={{ fontSize: 10, color: TEXT_LIGHT, fontFamily: "monospace" }}>{url}</span>
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

// ─── Floating badge ────────────────────────────────────────────────────────────

function FloatingBadge({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
      className={`absolute z-10 bg-white rounded-xl border px-3 py-2.5 text-[#382F23] ${className}`}
      style={{ boxShadow: "0 8px 24px rgba(56,47,35,0.12)", borderColor: "rgba(201,110,44,0.12)" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Decorative SVG elements ───────────────────────────────────────────────────

function DecorRings() {
  return (
    <svg width="80" height="40" viewBox="0 0 80 40" fill="none" aria-hidden>
      <circle cx="25" cy="20" r="16" stroke={TC} strokeWidth="2.5" strokeOpacity="0.4" />
      <circle cx="55" cy="20" r="16" stroke={GOLD} strokeWidth="2.5" strokeOpacity="0.4" />
    </svg>
  );
}

function DecorDots() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden>
      {[0, 1, 2].map(row => [0, 1, 2].map(col => (
        <circle key={`${row}-${col}`} cx={10 + col * 20} cy={10 + row * 20} r="3"
          fill={TC} fillOpacity={0.2 + col * 0.1} />
      )))}
    </svg>
  );
}

function DecorFloral() {
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

// ─── Feature card (bento) ──────────────────────────────────────────────────────

const FEATURES = [
  { id: "dashboard",  icon: "grid",    title: "Tableau de bord",      desc: "Vue d'ensemble de votre mariage avec countdown J-X, stats en temps réel et raccourcis intelligents.", color: TC },
  { id: "guests",     icon: "users",   title: "Invités & RSVP",       desc: "Gérez vos 150+ invités, suivez les réponses, les régimes alimentaires et l'hébergement.", color: "#3B6EA5" },
  { id: "budget",     icon: "wallet",  title: "Budget & Paiements",   desc: "Suivez chaque dépense, planifiez les échéances et comparez avec les moyennes nationales.", color: GOLD },
  { id: "timeline",   icon: "list",    title: "Timeline",             desc: "Rétroplanning complet sur 12-18 mois avec navigation par mois et indicateurs de retard.", color: SAGE },
  { id: "dayj",       icon: "clock",   title: "Déroulé Jour J",       desc: "Planifiez chaque minute de votre journée avec 3 templates, mode EN DIRECT et alertes.", color: "#B5586E" },
  { id: "checklist",  icon: "check",   title: "Checklist",            desc: "250+ tâches pré-remplies organisées par catégorie, avec filtres et export PDF.", color: "#1F7A5C" },
  { id: "seating",    icon: "grid",    title: "Plan de table",        desc: "Éditeur visuel drag & drop des tables avec gestion des conflits et contraintes régime.", color: "#8B6E3E" },
  { id: "vendors",    icon: "file",    title: "Prestataires",         desc: "CRM complet pour vos fournisseurs : devis, contrats, relances automatiques.", color: "#6B4A8C" },
  { id: "ceremony",   icon: "rings",   title: "Programme cérémonie",  desc: "Construisez votre programme civil, laïc ou religieux avec musiques et intervenants.", color: TC },
  { id: "music",      icon: "music",   title: "Musique & Playlist",   desc: "10 moments clés, approbation par les mariés, export PDF pour le DJ/orchestre.", color: "#3B6EA5" },
  { id: "dates",      icon: "calendar",title: "Sélecteur de dates",   desc: "Comparez vos dates avec météo réelle Open-Meteo, score automatique et export tableau.", color: "#1F7A5C" },
  { id: "contacts",   icon: "key",     title: "Personnes clés",       desc: "Contacts d'urgence, témoins, cortège — toujours accessibles depuis l'app.", color: "#B5586E" },
  { id: "gifts",      icon: "gift",    title: "Cadeaux",              desc: "Liste de mariage digitale avec suivi des remerciements envoyés.", color: GOLD },
  { id: "journal",    icon: "edit",    title: "Journal de bord",      desc: "Capturez vos inspirations, décisions et souvenirs tout au long de la préparation.", color: SAGE },
  { id: "moodboard",  icon: "sparkle", title: "Mood Board",           desc: "Espace visuel pour votre style, couleurs et inspirations partagées avec vos prestataires.", color: "#8B6E3E" },
  { id: "sharing",    icon: "users",   title: "Collaboration",        desc: "Invitez votre famille, wedding planner et prestataires avec des rôles personnalisés.", color: "#6B4A8C" },
];

function BentoCard({ f, index }: { f: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl border overflow-hidden cursor-default group transition-all duration-300"
      style={{
        background: "#FFFFFF",
        borderColor: "rgba(201,110,44,0.1)",
        boxShadow: "0 2px 12px rgba(56,47,35,0.06)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px rgba(56,47,35,0.12), 0 0 0 1px ${f.color}30`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(56,47,35,0.06)";
      }}
    >
      <div className="p-5 flex flex-col gap-3 h-full">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${f.color}18`, color: f.color }}>
          <Ic name={f.icon} size={20} />
        </div>
        <div>
          <div className="text-[14px] font-semibold mb-1" style={{ color: TEXT_DARK }}>{f.title}</div>
          <div className="text-[12.5px] leading-relaxed" style={{ color: TEXT_MID }}>{f.desc}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Nav ────────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { href: "#features", label: "Fonctionnalités" },
    { href: "#demo", label: "Démo" },
    { href: "#pricing", label: "Tarifs" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[500] transition-all duration-300"
      style={{
        background: scrolled ? "rgba(253,250,245,0.92)" : "rgba(253,250,245,0.75)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid rgba(201,110,44,${scrolled ? "0.12" : "0.06"})`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8" style={{ color: TC }}><Logo size={30} /></div>
          <span className="text-[16px] font-semibold" style={{ color: BROWN_DARK }}>The <b>Cockpit</b></span>
        </Link>

        <div className="hidden md:flex items-center gap-6 flex-1">
          {links.map((l) => (
            <a key={l.href} href={l.href}
              className="text-[13.5px] font-medium transition-colors"
              style={{ color: TEXT_MID }}
              onMouseEnter={(e) => (e.currentTarget.style.color = TC)}
              onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MID)}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 ml-auto">
          <Link href="/login" className="text-[13.5px] font-medium transition-colors px-4 py-2"
            style={{ color: TEXT_MID }}
            onMouseEnter={(e) => (e.currentTarget.style.color = TC)}
            onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MID)}>
            Connexion
          </Link>
          <Link href="/signup"
            className="px-5 py-2 rounded-lg text-[13.5px] font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: TC, boxShadow: `0 4px 14px ${TC}40` }}>
            Commencer gratuitement
          </Link>
        </div>

        <button className="md:hidden ml-auto transition-colors" style={{ color: TEXT_MID }}
          onClick={() => setMobileOpen(!mobileOpen)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {mobileOpen ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></> : <><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></>}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t overflow-hidden"
            style={{ background: "rgba(253,250,245,0.98)", borderColor: "rgba(201,110,44,0.1)" }}>
            <div className="px-6 py-4 flex flex-col gap-3">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  className="text-[14px] font-medium py-1 transition-colors"
                  style={{ color: TEXT_MID }}>{l.label}</a>
              ))}
              <Link href="/signup" onClick={() => setMobileOpen(false)}
                className="mt-2 py-3 rounded-xl text-center text-[14px] font-semibold text-white"
                style={{ background: TC }}>
                Commencer gratuitement →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 px-6 overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 0%, ${WARM_SOFT} 0%, ${BG_CREAM} 60%)` }}
    >
      {/* Subtle depth circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: `radial-gradient(circle, ${BLUSH} 0%, transparent 70%)` }} />
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${WARM_SOFT} 0%, transparent 70%)` }} />
      </div>

      {/* Decorative floral top-left */}
      <div className="absolute top-24 left-8 opacity-60 hidden lg:block">
        <DecorFloral />
      </div>
      {/* Decorative dots top-right */}
      <div className="absolute top-32 right-12 opacity-70 hidden lg:block">
        <DecorDots />
      </div>

      {/* Badge */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8"
          style={{ borderColor: `${TC}40`, background: `${TC}10` }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: TC }} />
          <span className="text-[12.5px] font-semibold" style={{ color: TC }}>100% gratuit • Démarrez en 2 minutes</span>
        </div>
      </motion.div>

      {/* Headline — éditorial asymétrique */}
      <div className="text-center max-w-3xl mb-6 relative z-10">
        <motion.h1
          className="tracking-[-0.02em] leading-[1.08]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="block text-[clamp(2.2rem,5.5vw,4rem)] font-light italic mb-1"
            style={{ color: TEXT_MID }}
          >
            Votre mariage,
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="block text-[clamp(3rem,8vw,5.8rem)] font-extrabold"
            style={{ color: TEXT_DARK }}
          >
            organisé avec soin.
          </motion.span>
        </motion.h1>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-[clamp(1rem,2vw,1.15rem)] text-center max-w-lg mb-10 leading-relaxed relative z-10"
        style={{ color: TEXT_MID }}
      >
        Un espace unique pour tout gérer — invités, budget, Jour J — avec élégance.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="flex flex-wrap items-center justify-center gap-4 mb-16 relative z-10"
      >
        <Link href="/signup"
          className="px-7 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: TC, boxShadow: `0 8px 28px ${TC}45` }}>
          Commencer gratuitement →
        </Link>
        <a href="#features"
          className="px-7 py-3.5 rounded-xl text-[15px] font-semibold border transition-all hover:bg-white/60"
          style={{ color: TC, borderColor: `${TC}40`, background: `${TC}08` }}>
          Voir les fonctionnalités ↓
        </a>
      </motion.div>

      {/* Hero mockup */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl relative z-10"
        whileHover={{ y: -4, transition: { duration: 0.3 } }}
      >
        <AppFrame url="the-cockpit.fr/dashboard">
          <MockDashboard />
        </AppFrame>

        {/* Floating badges */}
        <FloatingBadge className="hidden md:flex -right-8 top-12" delay={0}>
          <div className="flex items-center gap-2">
            <div className="text-lg">🗓</div>
            <div>
              <div className="text-[11px] font-bold" style={{ color: TEXT_DARK }}>J-142</div>
              <div className="text-[9px]" style={{ color: TEXT_LIGHT }}>Compte à rebours</div>
            </div>
          </div>
        </FloatingBadge>

        <FloatingBadge className="hidden md:flex -left-10 top-1/3" delay={1.2}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: SAGE }}>✓</div>
            <div>
              <div className="text-[11px] font-bold" style={{ color: TEXT_DARK }}>98 confirmés</div>
              <div className="text-[9px]" style={{ color: TEXT_LIGHT }}>sur 147 invités</div>
            </div>
          </div>
        </FloatingBadge>

        <FloatingBadge className="hidden md:flex -right-6 bottom-16" delay={0.6}>
          <div className="text-center px-1">
            <div className="text-[18px] font-bold" style={{ color: TC }}>70%</div>
            <div className="text-[9px]" style={{ color: TEXT_LIGHT }}>Budget engagé</div>
            <div className="mt-1 h-1.5 w-16 rounded-full overflow-hidden" style={{ background: WARM_SOFT }}>
              <div className="h-full rounded-full" style={{ width: "70%", background: `linear-gradient(90deg, ${TC}, ${GOLD})` }} />
            </div>
          </div>
        </FloatingBadge>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
          style={{ borderColor: `${TC}40` }}>
          <div className="w-1 h-1.5 rounded-full" style={{ background: TC }} />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Marquee strip ─────────────────────────────────────────────────────────────

function MarqueeStrip() {
  const items = ["16 modules tout-en-un", "Météo en temps réel", "Plan de table drag & drop", "Collaboration multi-utilisateurs", "Export PDF", "Partage lecture seule", "Planner ou couple", "100% gratuit", "Données sécurisées", "Application mobile"];
  const doubled = [...items, ...items];
  return (
    <div className="py-5 overflow-hidden border-y" style={{ background: "#F9EDE3", borderColor: `${TC}20` }}>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        className="flex whitespace-nowrap gap-8"
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-[13px] font-medium shrink-0" style={{ color: TC }}>
            <span className="text-[10px]" style={{ color: GOLD }}>✦</span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Stats section ─────────────────────────────────────────────────────────────

function Stats() {
  const stats = [
    { val: 16, suffix: "+", label: "Modules inclus", icon: "grid" },
    { val: 250, suffix: "+", label: "Tâches pré-remplies", icon: "check" },
    { val: 100, suffix: "%", label: "Gratuit", icon: "sparkle" },
    { val: 2, suffix: " min", label: "Pour démarrer", icon: "clock" },
  ];
  return (
    <section className="py-20 px-6" style={{ background: "#FFFFFF" }}>
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-12">
            <Pill>Chiffres</Pill>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
              Tout ce dont vous avez besoin,<br />
              <span style={{ color: TC }}>rien de superflu.</span>
            </h2>
          </div>
        </FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="rounded-2xl border p-6 text-center transition-all duration-300"
                style={{ background: "#FFFFFF", borderColor: `${TC}20`, boxShadow: "0 2px 12px rgba(56,47,35,0.06)" }}>
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${TC}15`, color: TC }}>
                  <Ic name={s.icon} size={20} />
                </div>
                <div className="text-4xl font-bold mb-1" style={{ color: TC }}>
                  <Counter to={s.val} suffix={s.suffix} />
                </div>
                <div className="text-[13px]" style={{ color: TEXT_LIGHT }}>{s.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features bento grid ───────────────────────────────────────────────────────

function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-6" style={{ background: WARM_SOFT }}>
      <div className="max-w-7xl mx-auto">
        <FadeIn className="text-center mb-16">
          <Pill>Fonctionnalités</Pill>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
            16 modules pour tout planifier,<br />
            <span style={{ color: TC }}>dans une seule app.</span>
          </h2>
          <p className="mt-4 text-[15px] max-w-xl mx-auto" style={{ color: TEXT_MID }}>
            De l'invitation au Jour J, chaque module est pensé pour les futurs mariés comme pour les wedding planners.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <BentoCard key={f.id} f={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Spotlight section helper ──────────────────────────────────────────────────

function Spotlight({
  tag, title, desc, bullets, mockup, reverse = false, id, bg = "#FFFFFF",
}: {
  tag: string; title: React.ReactNode; desc: string; bullets: string[];
  mockup: React.ReactNode; reverse?: boolean; id?: string; bg?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id={id} className="py-24 px-6 overflow-hidden" style={{ background: bg }}>
      <div className={`max-w-6xl mx-auto flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-16`}>
        {/* Text */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: reverse ? 40 : -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Pill>{tag}</Pill>
          <h2 className="text-[clamp(1.8rem,3.5vw,2.5rem)] font-bold mt-5 mb-4 tracking-tight leading-tight" style={{ color: TEXT_DARK }}>{title}</h2>
          <p className="text-[15px] mb-6 leading-relaxed" style={{ color: TEXT_MID }}>{desc}</p>
          <ul className="flex flex-col gap-3 mb-8">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[14px]" style={{ color: TEXT_MID }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${TC}20` }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5 4-4" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                </span>
                {b}
              </li>
            ))}
          </ul>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:scale-105"
            style={{ background: TC, boxShadow: `0 6px 20px ${TC}35` }}>
            Essayer gratuitement <Ic name="arrow" size={15} />
          </Link>
        </motion.div>

        {/* Mockup */}
        <motion.div
          className="flex-1 w-full max-w-lg"
          initial={{ opacity: 0, x: reverse ? -40 : 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4, transition: { duration: 0.3 } }}
        >
          <AppFrame url={`the-cockpit.fr/${id || "app"}`}>
            {mockup}
          </AppFrame>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Testimonials ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { name: "Camille & Thomas", date: "Juin 2026", photo: "CT", text: "The Cockpit nous a sauvé la mise ! En quelques semaines nous avions tout organisé. Le plan de table en drag & drop est magique.", score: 5 },
  { name: "Marie Lefebvre", role: "Wedding planner", photo: "ML", text: "Je gère 12 mariages simultanément avec The Cockpit. La collaboration multi-utilisateurs et les rôles me font gagner 3h par semaine.", score: 5 },
  { name: "Sophie & Alexis", date: "Septembre 2026", photo: "SA", text: "Le sélecteur de dates avec la météo en temps réel nous a aidés à choisir la date parfaite. Et le mode Jour J EN DIRECT était incroyable !", score: 5 },
  { name: "Juliette Moreau", role: "Planner indépendante", photo: "JM", text: "Enfin un outil qui pense aussi aux planners. Je créé un espace par client en 2 minutes. L'export PDF pour les prestataires est top.", score: 5 },
  { name: "Emma & Lucas", date: "Mai 2026", photo: "EL", text: "La checklist avec 250+ tâches pré-remplies nous a évité d'oublier des choses. Le budget avec comparaison nationale était très utile.", score: 5 },
  { name: "Laura Bernard", role: "Wedding designer", photo: "LB", text: "Le mood board et le journal de bord m'ont permis de partager ma vision avec mes clients. Interface élégante, très professionnelle.", score: 5 },
];

function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="py-24 px-6 overflow-hidden" style={{ background: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <Pill>Témoignages</Pill>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
            Des couples qui ont dit <span style={{ color: TC }}>oui</span> à The Cockpit.
          </h2>
        </FadeIn>

        {/* Featured */}
        <div className="relative min-h-[200px] mb-8">
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border p-8 md:p-10 relative"
              style={{
                background: BG_CREAM,
                borderColor: "rgba(201,110,44,0.12)",
                boxShadow: "0 4px 20px rgba(56,47,35,0.07)",
              }}
            >
              <div className="text-[clamp(1.1rem,2.5vw,1.4rem)] font-medium leading-relaxed mb-6 max-w-3xl" style={{ color: TEXT_DARK }}>
                &ldquo;{TESTIMONIALS[active].text}&rdquo;
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                  style={{ background: `linear-gradient(135deg, ${TC}, ${GOLD})` }}>
                  {TESTIMONIALS[active].photo}
                </div>
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: TEXT_DARK }}>{TESTIMONIALS[active].name}</div>
                  <div className="text-[12px]" style={{ color: TEXT_LIGHT }}>
                    {TESTIMONIALS[active].role || TESTIMONIALS[active].date}
                  </div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={GOLD} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === active ? 24 : 8, height: 8, background: i === active ? TC : `${TC}30` }}
            />
          ))}
        </div>

        {/* Grid of all */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <button
                onClick={() => setActive(i)}
                className="text-left w-full rounded-xl border p-5 transition-all duration-200"
                style={{
                  background: i === active ? `${TC}08` : BG_CREAM,
                  borderColor: i === active ? `${TC}50` : "rgba(201,110,44,0.1)",
                  boxShadow: i === active ? `0 4px 16px ${TC}15` : "none",
                }}
              >
                <p className="text-[12.5px] leading-relaxed mb-3 line-clamp-3" style={{ color: TEXT_MID }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: `linear-gradient(135deg, ${TC}, ${GOLD})` }}>{t.photo}</div>
                  <div>
                    <div className="text-[11.5px] font-semibold" style={{ color: TEXT_DARK }}>{t.name}</div>
                    <div className="text-[10px]" style={{ color: TEXT_LIGHT }}>{t.role || t.date}</div>
                  </div>
                </div>
              </button>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing / CTA ─────────────────────────────────────────────────────────────

function PricingCTA() {
  return (
    <section id="pricing" className="py-24 px-6" style={{ background: WARM_SOFT }}>
      <div className="max-w-3xl mx-auto text-center">
        <FadeIn>
          <Pill>Tarifs</Pill>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold mt-4 mb-4 tracking-tight" style={{ color: TEXT_DARK }}>
            Gratuit.<br /><span style={{ color: TC }}>Pour toujours.</span>
          </h2>
          <p className="text-[16px] mb-10 leading-relaxed" style={{ color: TEXT_MID }}>
            The Cockpit est 100% gratuit. Pas d'essai, pas de carte bancaire, pas de limite de temps. Tous les modules, tous les exports, toutes les fonctionnalités.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="rounded-2xl border p-8 md:p-10 mb-8"
            style={{ background: "#FFFFFF", borderColor: "rgba(201,110,44,0.12)", boxShadow: "0 8px 32px rgba(56,47,35,0.1)" }}>
            <div className="text-6xl font-bold mb-1" style={{ color: TC }}>0€</div>
            <div className="text-[14px] mb-8" style={{ color: TEXT_LIGHT }}>Pour toujours</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
              {[
                "16 modules complets", "Invités illimités",
                "Collaboration multi-users", "Exports PDF",
                "Partage lecture seule", "Plan de table visuel",
                "Météo en temps réel", "Données sécurisées Supabase",
                "Mode couple & wedding planner", "Mises à jour continues",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[13.5px]" style={{ color: TEXT_MID }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${TC}18` }}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5 4-4" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
            <Link href="/signup"
              className="block w-full py-4 rounded-xl text-[16px] font-bold text-white text-center transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: TC, boxShadow: `0 12px 36px ${TC}45` }}>
              Créer mon espace gratuitement →
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-[13px]" style={{ color: TEXT_LIGHT }}>
            Déjà un compte ? <Link href="/login" className="underline hover:opacity-80 transition-opacity" style={{ color: TC }}>Se connecter</Link>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── FAQ ────────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "The Cockpit est-il vraiment gratuit ?", a: "Oui, complètement et sans limite. Aucune carte bancaire n'est requise. Tous les modules sont accessibles dès la création de votre compte." },
  { q: "Combien de mariages puis-je gérer ?", a: "Jusqu'à 5 mariages par compte. Les wedding planners peuvent gérer plusieurs clients depuis le même tableau de bord avec une interface dédiée." },
  { q: "Puis-je collaborer avec mon partenaire ou ma wedding planner ?", a: "Oui ! Vous pouvez inviter des collaborateurs avec différents rôles : Administrateur, Éditeur ou Lecteur. Chaque rôle a des permissions précises." },
  { q: "Mes données sont-elles sécurisées ?", a: "Vos données sont hébergées sur Supabase (infrastructure PostgreSQL sécurisée) avec chiffrement en transit et au repos. Seul vous et vos collaborateurs autorisés y ont accès." },
  { q: "L'application fonctionne-t-elle sur mobile ?", a: "The Cockpit est une Progressive Web App (PWA) responsive, installable sur iOS et Android. La navigation est optimisée pour mobile avec une barre de navigation dédiée." },
  { q: "Puis-je exporter mes données ?", a: "Oui, vous pouvez exporter votre liste d'invités en CSV, votre budget en PDF, votre plan de table, votre playlist et bien plus. Toutes vos données vous appartiennent." },
  { q: "La météo est-elle vraiment en temps réel ?", a: "Le sélecteur de dates utilise l'API Open-Meteo (données ECMWF) pour afficher des prévisions météo historiques et statistiques pour votre ville et vos dates candidates. Aucune clé API requise." },
  { q: "Puis-je partager mon espace mariage avec ma famille ?", a: "Oui, via un lien de partage en lecture seule que vous générez depuis les paramètres. Vos proches voient les informations essentielles sans pouvoir modifier quoi que ce soit." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-24 px-6" style={{ background: "#FFFFFF" }}>
      <div className="max-w-3xl mx-auto">
        <FadeIn className="text-center mb-16">
          <Pill>FAQ</Pill>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>Questions fréquentes</h2>
        </FadeIn>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <div className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: open === i ? `${TC}40` : "rgba(201,110,44,0.1)",
                  background: open === i ? `${TC}05` : "#FFFFFF",
                  boxShadow: open === i ? `0 4px 16px ${TC}10` : "none",
                }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-[15px] font-semibold" style={{ color: TEXT_DARK }}>{faq.q}</span>
                  <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ type: "spring", stiffness: 280, damping: 24 }}
                    className="shrink-0" style={{ color: TC }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </motion.span>
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                      <p className="px-6 pb-5 text-[14px] leading-relaxed" style={{ color: TEXT_MID }}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const links = {
    "Produit": [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Se connecter", href: "/login" },
    ],
    "Modules": [
      { label: "Invités & RSVP", href: "/signup" },
      { label: "Budget", href: "/signup" },
      { label: "Plan de table", href: "/signup" },
      { label: "Déroulé Jour J", href: "/signup" },
    ],
    "Légal": [
      { label: "Conditions d'utilisation", href: "#" },
      { label: "Politique de confidentialité", href: "#" },
      { label: "Données personnelles", href: "#" },
    ],
  };
  return (
    <footer style={{ background: BROWN_DARK, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8" style={{ color: TC }}><Logo size={30} /></div>
              <span className="text-[16px] font-semibold text-white">The <b>Cockpit</b></span>
            </Link>
            <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: "rgba(253,250,245,0.55)" }}>
              L'outil tout-en-un pour organiser votre mariage parfait. Budget, invités, prestataires, planning et Jour J — tout en un.
            </p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white"
              style={{ background: TC, boxShadow: `0 4px 14px ${TC}50` }}>
              Commencer gratuitement →
            </Link>
          </div>
          {Object.entries(links).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(253,250,245,0.4)" }}>{cat}</div>
              <ul className="flex flex-col gap-2.5">
                {items.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13.5px] transition-colors hover:text-white" style={{ color: "rgba(253,250,245,0.55)" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-[12.5px]" style={{ color: "rgba(253,250,245,0.3)" }}>
            © 2026 The Cockpit. Tous droits réservés.
          </p>
          <p className="text-[12px]" style={{ color: "rgba(253,250,245,0.25)" }}>
            Fait avec 💍 pour les futurs mariés de France
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Final CTA band ────────────────────────────────────────────────────────────

function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <section ref={ref} className="py-24 px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #F4ECDD 0%, #FDF0E8 100%)" }}>
      {/* Decorative elements */}
      <div className="absolute top-8 left-12 opacity-60 hidden lg:block">
        <DecorRings />
      </div>
      <div className="absolute bottom-8 right-16 opacity-50 hidden lg:block">
        <DecorDots />
      </div>
      {/* Subtle sparkle stars */}
      <div className="absolute top-1/3 right-1/4 opacity-30">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
            stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-6">
            <DecorRings />
            <div className="flex justify-center mt-3"><DecorRings /></div>
          </div>
          <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-bold tracking-tight mb-4" style={{ color: TEXT_DARK }}>
            Votre mariage mérite<br />le meilleur outil.
          </h2>
          <p className="text-[16px] mb-10" style={{ color: TEXT_MID }}>
            Rejoignez des centaines de couples et de wedding planners qui font confiance à The Cockpit.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-[16px] font-bold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: TC, boxShadow: `0 16px 48px ${TC}50` }}>
            Créer mon espace mariage — Gratuit →
          </Link>
          <div className="mt-6 flex items-center justify-center gap-6 text-[12.5px]" style={{ color: TEXT_LIGHT }}>
            {["Aucune carte bancaire", "Démarrage en 2 min", "Données sécurisées"].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span style={{ color: TC }}>✓</span> {t}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: "sparkle",
      title: "Créez votre espace",
      desc: "Choisissez votre période, entrez vos prénoms, c'est prêt en 2 minutes",
    },
    {
      num: "02",
      icon: "grid",
      title: "Personnalisez vos modules",
      desc: "Invités, budget, prestataires, planning… chaque section se configure en quelques clics",
    },
    {
      num: "03",
      icon: "clock",
      title: "Profitez du Jour J",
      desc: "Utilisez le mode EN DIRECT pour suivre votre programme minute par minute",
    },
  ];

  return (
    <section className="py-24 px-6" style={{ background: WARM_SOFT }}>
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-16">
          <Pill>Comment ça marche</Pill>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
            En 3 étapes, votre mariage<br />
            <span style={{ color: TC }}>est organisé.</span>
          </h2>
        </FadeIn>

        <div className="relative">
          {/* Connecting line — desktop */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-[2px] pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${TC}40, ${TC}40, transparent)` }} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <div className="relative flex flex-col items-center text-center group">
                  {i < steps.length - 1 && (
                    <div className="md:hidden w-[2px] h-8 my-0 mx-auto"
                      style={{ background: `linear-gradient(180deg, ${TC}40, transparent)` }} />
                  )}
                  {/* Number badge */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mb-5 relative z-10 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: "#FFFFFF",
                      border: `2px solid ${TC}30`,
                      color: TC,
                      boxShadow: `0 8px 24px ${TC}18`,
                    }}
                  >
                    {step.num}
                  </div>
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${TC}12`, color: TC }}>
                    <Ic name={step.icon} size={20} />
                  </div>
                  <h3 className="text-[16px] font-bold mb-3" style={{ color: TEXT_DARK }}>{step.title}</h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: TEXT_MID }}>{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        <FadeIn delay={0.35} className="text-center mt-12">
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: TC, boxShadow: `0 8px 28px ${TC}40` }}>
            Commencer — c'est gratuit →
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── For Planners ──────────────────────────────────────────────────────────────

function PlannerIllustration() {
  return (
    <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[280px]">
      {/* Stack of documents */}
      <rect x="50" y="80" width="160" height="110" rx="10" fill={WARM_SOFT} stroke={`${TC}30`} strokeWidth="1.5" />
      <rect x="42" y="72" width="160" height="110" rx="10" fill="#FFF8F2" stroke={`${TC}25`} strokeWidth="1.5" />
      <rect x="34" y="64" width="160" height="110" rx="10" fill="#FFFFFF" stroke={`${TC}35`} strokeWidth="1.5" />
      {/* Lines on top doc */}
      <rect x="50" y="84" width="90" height="5" rx="2.5" fill={`${TC}30`} />
      <rect x="50" y="96" width="120" height="4" rx="2" fill={`${TC}18`} />
      <rect x="50" y="107" width="100" height="4" rx="2" fill={`${TC}18`} />
      <rect x="50" y="118" width="80" height="4" rx="2" fill={`${TC}18`} />
      {/* Check badges */}
      <circle cx="160" cy="130" r="16" fill={SAGE} fillOpacity="0.15" />
      <circle cx="160" cy="130" r="12" fill={SAGE} fillOpacity="0.25" />
      <path d="M154 130l4 4 8-8" stroke={SAGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Rings decoration top */}
      <circle cx="200" cy="50" r="20" stroke={TC} strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <circle cx="225" cy="50" r="20" stroke={GOLD} strokeOpacity="0.3" strokeWidth="2" fill="none" />
      {/* Small dots */}
      <circle cx="46" cy="40" r="4" fill={TC} fillOpacity="0.2" />
      <circle cx="60" cy="32" r="3" fill={GOLD} fillOpacity="0.3" />
      <circle cx="76" cy="42" r="2.5" fill={TC} fillOpacity="0.15" />
    </svg>
  );
}

function ForPlanners() {
  const features = [
    "Espaces clients séparés par mariage",
    "Rôles personnalisés (admin, éditeur, lecteur)",
    "Partage lecture seule pour chaque client",
    "Templates de checklist réutilisables",
    "Tableaux de bord indépendants",
  ];

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-6" style={{ background: "#FFFFFF" }}>
      <div ref={ref} className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        {/* Text column */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Pill>Wedding Planners</Pill>
          <h2 className="text-[clamp(1.8rem,3.5vw,2.5rem)] font-bold mt-5 mb-3 tracking-tight leading-tight" style={{ color: TEXT_DARK }}>
            Wedding planner ?<br />
            <span style={{ color: TC }}>The Cockpit est fait pour vous aussi.</span>
          </h2>
          <p className="text-[15px] mb-6 leading-relaxed" style={{ color: TEXT_MID }}>
            Gérez jusqu'à 5 mariages simultanément depuis un seul tableau de bord.
          </p>

          <ul className="flex flex-col gap-3 mb-8">
            {features.map((feat, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-3 text-[14.5px]"
                style={{ color: TEXT_MID }}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${TC}20` }}>
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M2 5l2.5 2.5 4-4" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </span>
                {feat}
              </motion.li>
            ))}
          </ul>

          <Link href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:scale-105"
            style={{ background: TC, boxShadow: `0 6px 20px ${TC}35` }}>
            Créer mon espace planner <Ic name="arrow" size={15} />
          </Link>
        </motion.div>

        {/* Illustration column */}
        <motion.div
          className="flex-1 w-full flex items-center justify-center"
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rounded-2xl p-12 w-full flex items-center justify-center"
            style={{ background: BG_CREAM, border: "1px solid rgba(201,110,44,0.1)" }}>
            <PlannerIllustration />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Comparison Table ──────────────────────────────────────────────────────────

function ComparisonTable() {
  type CellVal = true | false | "partial" | string;

  const rows: { label: string; cockpit: CellVal; excel: CellVal; generic: CellVal }[] = [
    { label: "Invités avec RSVP intégré",       cockpit: true,      excel: false,     generic: "partial" },
    { label: "Budget avec moyennes nationales",  cockpit: true,      excel: false,     generic: "partial" },
    { label: "Plan de table visuel",             cockpit: true,      excel: false,     generic: "partial" },
    { label: "Mode Jour J EN DIRECT",            cockpit: true,      excel: false,     generic: false     },
    { label: "Collaboration multi-users",        cockpit: true,      excel: "partial", generic: "partial" },
    { label: "Météo pour les dates",             cockpit: true,      excel: false,     generic: false     },
    { label: "Export PDF",                       cockpit: true,      excel: "partial", generic: "partial" },
    { label: "Prix",                             cockpit: "Gratuit", excel: "Payant",  generic: "Payant"  },
  ];

  function Cell({ val }: { val: CellVal }) {
    if (val === true) return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full"
        style={{ background: `${SAGE}25`, color: SAGE }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
    );
    if (val === false) return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full"
        style={{ background: "rgba(201,110,44,0.08)", color: TEXT_LIGHT }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </span>
    );
    if (val === "partial") return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full"
        style={{ background: `${GOLD}20`, color: GOLD }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
        </svg>
      </span>
    );
    if (val === "Gratuit") return (
      <span className="text-[12px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: `${SAGE}20`, color: SAGE }}>{val}</span>
    );
    return (
      <span className="text-[12px] font-medium" style={{ color: TEXT_LIGHT }}>{val as string}</span>
    );
  }

  return (
    <section className="py-24 px-6" style={{ background: BG_CREAM }}>
      <div className="max-w-4xl mx-auto">
        <FadeIn className="text-center mb-16">
          <Pill>Comparaison</Pill>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
            Pourquoi The Cockpit<br />
            <span style={{ color: TC }}>plutôt qu'un tableur ?</span>
          </h2>
          <p className="mt-4 text-[15px] max-w-xl mx-auto" style={{ color: TEXT_MID }}>
            Votre mariage mérite mieux qu'une feuille de calcul. Voici pourquoi.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="rounded-2xl overflow-hidden border"
            style={{ borderColor: "rgba(201,110,44,0.12)", boxShadow: "0 4px 20px rgba(56,47,35,0.08)" }}>
            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b" style={{ borderColor: "rgba(201,110,44,0.1)", background: "#FFFFFF" }}>
              <div className="px-5 py-4" />
              {/* The Cockpit header — highlighted */}
              <div className="px-4 py-4 flex flex-col items-center justify-center border-l border-r"
                style={{ background: `${TC}10`, borderColor: `${TC}25` }}>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: TC }}>The Cockpit</span>
              </div>
              <div className="px-4 py-4 flex items-center justify-center border-r" style={{ borderColor: "rgba(201,110,44,0.08)", background: BG_CREAM }}>
                <span className="text-[11px] font-semibold" style={{ color: TEXT_LIGHT }}>Tableur Excel</span>
              </div>
              <div className="px-4 py-4 flex items-center justify-center" style={{ background: BG_CREAM }}>
                <span className="text-[11px] font-semibold" style={{ color: TEXT_LIGHT }}>App générique</span>
              </div>
            </div>

            {/* Rows */}
            {rows.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b last:border-0"
                style={{ borderColor: "rgba(201,110,44,0.07)", background: i % 2 === 0 ? "#FFFFFF" : BG_CREAM }}
              >
                <div className="px-5 py-4 flex items-center text-[13.5px] font-medium" style={{ color: TEXT_DARK }}>
                  {row.label}
                </div>
                <div className="px-4 py-4 flex items-center justify-center border-l border-r"
                  style={{ background: `${TC}06`, borderColor: `${TC}20` }}>
                  <Cell val={row.cockpit} />
                </div>
                <div className="px-4 py-4 flex items-center justify-center border-r" style={{ borderColor: "rgba(201,110,44,0.07)" }}>
                  <Cell val={row.excel} />
                </div>
                <div className="px-4 py-4 flex items-center justify-center">
                  <Cell val={row.generic} />
                </div>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.3} className="text-center mt-10">
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: TC, boxShadow: `0 8px 28px ${TC}40` }}>
            Essayer The Cockpit gratuitement →
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  useLenis();

  return (
    <div style={{ background: BG_CREAM }}>
      <Nav />
      <Hero />
      <MarqueeStrip />
      <Stats />
      <FeaturesGrid />

      <section id="demo" style={{ background: WARM_SOFT }} className="pt-8">
        <div className="max-w-7xl mx-auto px-6 pb-4">
          <FadeIn className="text-center mb-16">
            <Pill>Démo interactive</Pill>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
              Chaque module en détail.
            </h2>
          </FadeIn>
        </div>
      </section>

      <HowItWorks />
      <ForPlanners />
      <ComparisonTable />

      <Spotlight
        id="guests"
        tag="Module Invités"
        title={<>Gérez vos invités <span style={{ color: TC }}>sans friction.</span></>}
        desc="Importez, organisez et suivez les réponses de chaque invité. RSVP en temps réel, régimes alimentaires, hébergement, transport — tout est dans une seule vue."
        bullets={[
          "Import/export CSV compatible Excel",
          "Suivi RSVP avec relances automatiques",
          "Gestion des régimes alimentaires",
          "Filtrage par côté (A/B), groupe, table",
          "Statistiques en temps réel",
        ]}
        mockup={<MockGuests />}
        bg="#FFFFFF"
      />

      <Spotlight
        id="budget"
        tag="Module Budget"
        title={<>Budget sous <span style={{ color: GOLD }}>contrôle total.</span></>}
        desc="Planifiez chaque poste budgétaire, suivez vos dépenses réelles et comparez avec les moyennes nationales pour 11 catégories de mariage en France."
        bullets={[
          "Suivi budget réel vs prévu par catégorie",
          "Paiements & échéances prestataires",
          "Comparaison avec moyennes nationales",
          "Export PDF récapitulatif financier",
          "Alertes dépassement de budget",
        ]}
        mockup={<MockBudget />}
        reverse
        bg={BG_CREAM}
      />

      <Spotlight
        id="dayj"
        tag="Module Jour J"
        title={<>Votre grand jour, <span style={{ color: TC }}>minute par minute.</span></>}
        desc="Construisez le déroulé complet de votre journée avec 3 templates de référence. Mode EN DIRECT avec défilement automatique et alertes de temps."
        bullets={[
          "3 templates : civil, laïc, religieux",
          "Mode EN DIRECT le Jour J",
          "Alertes gap entre événements (>15 min)",
          "Partage avec prestataires & témoins",
          "Ajout de musiques sur chaque moment",
        ]}
        mockup={<MockDayJ />}
        bg="#FFFFFF"
      />

      <Spotlight
        id="seating"
        tag="Plan de table"
        title={<>Places assises, <span style={{ color: SAGE }}>sans casse-tête.</span></>}
        desc="Créez votre plan de table visuellement avec un éditeur drag & drop. Gérez les contraintes alimentaires, les conflits familiaux et imprimez un document professionnel."
        bullets={[
          "Éditeur drag & drop visuel",
          "Formes de salle personnalisables",
          "Indicateurs de contraintes régime",
          "Export PDF prêt à imprimer",
          "Vue par table et par invité",
        ]}
        mockup={<MockSeating />}
        reverse
        bg={BG_CREAM}
      />

      <Spotlight
        id="dates"
        tag="Sélecteur de dates"
        title={<>La date parfaite, <span style={{ color: TC }}>avec la météo.</span></>}
        desc="Comparez vos dates candidates avec les données météo historiques Open-Meteo. Score automatique, comparatif tableau et export PDF pour aider votre décision."
        bullets={[
          "Météo historique Open-Meteo (sans clé)",
          "Score 0-100 basé sur température et pluie",
          "Vue carte et vue tableau comparatif",
          "Export PDF des comparaisons",
          "Sélection et confirmation de date",
        ]}
        mockup={<MockDates />}
        bg="#FFFFFF"
      />

      <Testimonials />
      <PricingCTA />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

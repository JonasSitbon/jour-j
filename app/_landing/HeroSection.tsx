"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TC, GOLD, TEXT_DARK, TEXT_MID, TEXT_LIGHT, WARM_SOFT } from "./tokens";

export default function Hero() {
  const STATS = [
    { value: "2 400+", label: "mariages planifiés" },
    { value: "16",     label: "modules intégrés"   },
    { value: "100%",   label: "gratuit"             },
    { value: "4.9★",   label: "satisfaction"        },
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-20 overflow-hidden"
      style={{ background: "#FFFFFF" }}>

      {/* Thin accent line top */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${TC}, ${GOLD}, transparent)` }} />

      <div className="max-w-7xl mx-auto px-6 w-full py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 lg:gap-20 items-center">

          {/* ── Left: text ── */}
          <div>
            {/* Eyebrow label */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-10">
              <div className="h-px w-10 shrink-0" style={{ background: TC }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: TC }}>
                Wedding Planning Platform
              </span>
            </motion.div>

            {/* Headline */}
            <div className="mb-8">
              <motion.h1 className="leading-[1.04] tracking-[-0.035em]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <motion.span initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="block text-[clamp(2.6rem,6vw,5rem)] font-bold"
                  style={{ color: TEXT_DARK }}>
                  Organisez votre
                </motion.span>
                <motion.span initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="block text-[clamp(2.6rem,6vw,5rem)] font-bold"
                  style={{ color: TEXT_DARK }}>
                  mariage <span style={{ color: TC }}>avec soin.</span>
                </motion.span>
              </motion.h1>
            </div>

            {/* Description */}
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-[1.05rem] leading-[1.75] max-w-[480px] mb-10"
              style={{ color: TEXT_MID }}>
              Un espace tout-en-un pour les mariés et les planners —
              invités, budget, prestataires, plan de table, Jour J.<br />
              Simple, élégant, collaboratif.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.48 }}
              className="flex flex-wrap items-center gap-4 mb-14">
              <Link href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[14.5px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: TEXT_DARK, letterSpacing: "0.01em" }}>
                Commencer gratuitement
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#demo"
                className="inline-flex items-center gap-2 text-[14px] font-medium group transition-colors"
                style={{ color: TEXT_MID }}
                onMouseEnter={(e) => (e.currentTarget.style.color = TC)}
                onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MID)}>
                Voir la démo interactive
                <span className="group-hover:translate-x-1 transition-transform inline-block">↓</span>
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="flex flex-wrap gap-x-10 gap-y-4 pt-8 border-t"
              style={{ borderColor: "rgba(28,18,8,0.08)" }}>
              {STATS.map((s, i) => (
                <div key={i}>
                  <div className="text-[1.35rem] font-bold tracking-tight" style={{ color: TEXT_DARK }}>{s.value}</div>
                  <div className="text-[11px] uppercase tracking-[0.1em]" style={{ color: TEXT_LIGHT }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: minimal visual ── */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col gap-4">

            {/* Countdown card */}
            <div className="rounded-2xl p-8" style={{ background: WARM_SOFT }}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: TEXT_LIGHT }}>
                Camille & Alexandre
              </div>
              <div className="text-[5rem] font-bold leading-none tracking-[-0.04em] mb-1" style={{ color: TC }}>
                J<span style={{ color: TEXT_DARK }}>-142</span>
              </div>
              <div className="text-[13px]" style={{ color: TEXT_MID }}>Samedi 15 Août 2026 · Aix-en-Provence</div>
              <div className="mt-6 h-px" style={{ background: "rgba(201,110,44,0.15)" }} />
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[["147", "invités"], ["68%", "checklist"], ["70%", "budget"]].map(([v, l], i) => (
                  <div key={i} className="bg-white rounded-xl py-2.5">
                    <div className="text-[15px] font-bold" style={{ color: TEXT_DARK }}>{v}</div>
                    <div className="text-[9px] uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Module pills */}
            <div className="rounded-2xl p-5 border" style={{ background: "#FFFFFF", borderColor: "rgba(28,18,8,0.07)" }}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-3" style={{ color: TEXT_LIGHT }}>
                16 modules inclus
              </div>
              <div className="flex flex-wrap gap-2">
                {["Invités", "Budget", "Checklist", "Jour J", "Prestataires", "Plan de table", "Musique", "Moodboard", "Cadeaux", "Journal"].map((m) => (
                  <span key={m} className="px-2.5 py-1 text-[11px] font-medium rounded-md"
                    style={{ background: WARM_SOFT, color: TEXT_DARK }}>{m}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom thin rule */}
      <div className="absolute bottom-0 left-6 right-6 h-px" style={{ background: "rgba(28,18,8,0.06)" }} />
    </section>
  );
}

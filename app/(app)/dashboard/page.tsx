"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { exportWeddingReport } from "@/lib/pdf-report";
import {
  motion, useMotionValue, useSpring, useTransform,
  useMotionTemplate, animate,
} from "framer-motion";
import { useStore } from "@/components/providers";
import { fmt } from "@/lib/format";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Ring } from "@/components/ui";
import type { AppState } from "@/lib/types";

/* ------------------------------------------------------------------ */
const TILE_TONE: Record<string, string> = {
  primary: "bg-primary-soft text-primary-700",
  sage:    "bg-sage-soft text-sage",
  gold:    "bg-gold-soft text-[var(--gold-ink)]",
  amber:   "bg-amber-soft text-[var(--gold-ink)]",
  coral:   "bg-coral-soft text-coral",
  blue:    "bg-primary-softer text-primary",
};

const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 420, damping: 28 } },
};
const pillVariants = {
  hidden:  { opacity: 0, y: 8,  scale: 0.88 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { type: "spring" as const, stiffness: 420, damping: 26 } },
};

/* ================================================================== */
/* HeroCard                                                            */
/* ================================================================== */
interface HeroCardProps {
  w: { partnerA: string; partnerB: string; date: string; venue?: string; city?: string };
  days: number;
  isPast: boolean;
  globalPct: number;
  dateCand: { city: string; temp: number; weather: number } | null;
  confirmed: number;
  totalGuests: number;
  pctSpent: number;
  doneTasks: number;
  totalTasks: number;
  nextUrgent: { val: string; label: string } | null;
}

function HeroCard({ w, days, isPast, globalPct, dateCand, confirmed, totalGuests, pctSpent, doneTasks, totalTasks, nextUrgent }: HeroCardProps) {
  /* 3D tilt -------------------------------------------------------- */
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rawRX = useTransform(mouseY, [0, 1], [6, -6]);
  const rawRY = useTransform(mouseX, [0, 1], [-7, 7]);
  const rotateX = useSpring(rawRX, { stiffness: 180, damping: 28 });
  const rotateY = useSpring(rawRY, { stiffness: 180, damping: 28 });

  /* Shine follows cursor ------------------------------------------ */
  const shineX = useTransform(mouseX, [0, 1], ["5%", "95%"]);
  const shineY = useTransform(mouseY, [0, 1], ["5%", "95%"]);
  const shineBg = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.12) 0%, transparent 62%)`;

  /* Parallax on couple names -------------------------------------- */
  const rawNX = useTransform(mouseX, [0, 1], [5, -5]);
  const rawNY = useTransform(mouseY, [0, 1], [4, -4]);
  const nX = useSpring(rawNX, { stiffness: 110, damping: 22 });
  const nY = useSpring(rawNY, { stiffness: 110, damping: 22 });

  /* Animated countdown counter ------------------------------------ */
  const [countDays, setCountDays] = useState(days > 0 ? days + 22 : days);
  useEffect(() => {
    if (days <= 0) { setCountDays(days); return; }
    const start = days + 22;
    setCountDays(start);
    const ctrl = animate(start, days, {
      duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.5,
      onUpdate: (v) => setCountDays(Math.round(v)),
    });
    return () => ctrl.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width);
    mouseY.set((e.clientY - r.top) / r.height);
  }
  function onLeave() { mouseX.set(0.5); mouseY.set(0.5); }

  const stats = [
    { icon: "users",        val: totalGuests === 0 ? "—" : `${confirmed}/${totalGuests}`, label: "invités"   },
    { icon: "wallet",       val: pctSpent    === 0 ? "—" : `${pctSpent}%`,               label: "budget"    },
    { icon: "check-circle", val: totalTasks  === 0 ? "—" : `${doneTasks}/${totalTasks}`, label: "tâches"    },
    ...(nextUrgent ? [{ icon: "clock", val: nextUrgent.val, label: nextUrgent.label }] : []),
  ];

  return (
    <div style={{ perspective: "1100px" }} className="h-full">
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          rotateX, rotateY,
          background:
            "radial-gradient(120% 130% at 100% 0%, color-mix(in srgb, var(--primary) 88%, #fff), transparent 58%), " +
            "radial-gradient(90% 120% at 0% 100%, color-mix(in srgb, var(--gold) 60%, #6E4423), transparent 60%), " +
            "linear-gradient(125deg, #4A3320 0%, #6E4423 100%)",
        }}
        className="relative overflow-hidden rounded-card shadow-lg flex flex-col min-h-[310px] h-full cursor-default"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Shine overlay */}
        <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ background: shineBg }} />

        {/* Names section — parallax */}
        <motion.div
          style={{ x: nX, y: nY }}
          className="relative z-[1] px-7 md:px-8 pt-7 md:pt-8 flex-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-[12px] text-[#FBF1E0]/70 font-medium flex items-center gap-2 mb-2 uppercase tracking-widest">
            <Icon name="rings" size={13} />
            Le mariage de
          </div>
          <div className="text-[30px] md:text-[36px] font-semibold tracking-[-.03em] text-[#FBF1E0] leading-[1.1]">
            {w.partnerA} &amp; {w.partnerB}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[13px] text-[#FBF1E0]/75">
            <span className="flex items-center gap-1.5"><Icon name="calendar" size={13} />{fmt.date(w.date)}</span>
            {w.venue && (
              <span className="flex items-center gap-1.5">
                <Icon name="pin" size={13} />{w.venue}{w.city ? `, ${w.city}` : ""}
              </span>
            )}
          </div>
        </motion.div>

        {/* Bottom block */}
        <div className="relative z-[1] px-7 md:px-8 pb-7 md:pb-8 mt-5 flex flex-col gap-3">

          {/* Countdown + météo */}
          <div className="flex items-end justify-between gap-3">
            {isPast ? (
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <Icon name="heart" size={28} className="text-[#FBF1E0]" />
                </div>
                <div>
                  <div className="text-[#FBF1E0] font-semibold text-lg leading-tight">Le grand jour est passé</div>
                  <div className="text-[#FBF1E0]/70 text-[13px]">il y a {Math.abs(days)} jours</div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.32, type: "spring", stiffness: 280, damping: 24 }}
                className="flex flex-col items-center justify-center bg-white/12 border border-white/25 rounded-2xl px-5 py-3.5 min-w-[100px]"
              >
                <span className="text-[8.5px] text-[#FBF1E0]/65 font-bold uppercase tracking-[0.18em] mb-1">Compte à rebours</span>
                <span className="font-mono text-[46px] font-bold text-[#FBF1E0] leading-none tabular-nums">{countDays}</span>
                <span className="text-[10px] text-[#FBF1E0]/60 mt-1.5 font-medium">
                  {countDays <= 1 ? "jour restant" : "jours restants"}
                </span>
              </motion.div>
            )}

            {dateCand && !isPast && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3 bg-white/12 border border-white/20 rounded-xl px-4 py-3 backdrop-blur-sm shrink-0"
              >
                <Icon name="sun" size={22} className="text-[#FBF1E0]/90" />
                <div>
                  <div className="font-mono text-[22px] font-bold text-[#FBF1E0] leading-none">{dateCand.temp}°</div>
                  <div className="text-[11px] font-semibold text-[#FBF1E0]/85 mt-0.5">{dateCand.city}</div>
                  <div className="text-[10px] text-[#FBF1E0]/55 mt-0.5">{dateCand.weather}% météo favorable</div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Mini-stats pills — stagger */}
          <motion.div
            className="flex flex-wrap gap-1.5"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.58 } } }}
          >
            {stats.map(({ icon, val, label }) => (
              <motion.div
                key={label}
                variants={pillVariants}
                className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full pl-2 pr-2.5 py-[5px] backdrop-blur-sm"
              >
                <Icon name={icon} size={11} className="text-[#FBF1E0]/70 shrink-0" />
                <span className="font-mono text-[11.5px] font-bold text-[#FBF1E0] tabular-nums">{val}</span>
                <span className="text-[10px] text-[#FBF1E0]/60">{label}</span>
              </motion.div>
            ))}
            {/* Global progress pill */}
            <motion.div
              variants={pillVariants}
              className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full pl-2.5 pr-3 py-[5px] backdrop-blur-sm"
            >
              <div className="w-16 h-[3px] bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/80 rounded-full transition-[width] delay-700 duration-[1000ms]"
                  style={{ width: `${globalPct}%` }} />
              </div>
              <span className="font-mono text-[11.5px] font-bold text-[#FBF1E0]">{globalPct}%</span>
              <span className="text-[10px] text-[#FBF1E0]/60">prêt</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ScoreWidget                                                          */
/* ------------------------------------------------------------------ */
function ScoreWidget({ globalPct, bars }: { globalPct: number; bars: { label: string; pct: number; color: string }[] }) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="sec-title">
        <Icon name="sparkle" size={17} className="text-text-3" />
        Avancement détaillé
      </div>
      <div className="flex flex-col items-center gap-1">
        <Ring value={globalPct} size={110} stroke={10} color="var(--primary)" track="var(--surface-3)">
          <div className="flex flex-col items-center leading-none">
            <span className="font-mono text-[28px] font-bold tracking-tight text-text">{globalPct}</span>
            <span className="text-[11px] text-text-3 font-medium mt-0.5">%</span>
          </div>
        </Ring>
        <span className="text-[11.5px] text-text-3 font-medium">Score global</span>
      </div>
      <div className="flex flex-col gap-3">
        {bars.map(({ label, pct, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-[12.5px] text-text-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                {label}
              </span>
              <span className="font-mono text-[12px] font-semibold text-text-2">{pct}%</span>
            </div>
            <div className="h-[5px] bg-surface-3 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* DeadlineItem                                                         */
/* ------------------------------------------------------------------ */
type DeadlineEntry = { date: string; title: string; meta: string; type: "pay" | "task"; status: string };

function DeadlineItem({ item, isLast }: { item: DeadlineEntry; isLast: boolean }) {
  const d = fmt.daysUntil(item.date);
  const isLate = item.status === "late" || d < 0;
  const isSoon = !isLate && d <= 14;
  const borderColor = isLate ? "border-l-coral" : item.type === "pay" ? "border-l-[var(--gold)]" : "border-l-primary";
  const badgeEl = isLate
    ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-coral bg-coral-soft px-2 py-0.5 rounded-full"><Icon name="alert" size={10} />En retard</span>
    : isSoon
    ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--gold-ink)] bg-amber-soft px-2 py-0.5 rounded-full"><Icon name="clock" size={10} />dans {d}j</span>
    : <span className="text-[11px] font-mono text-text-3">{fmt.date(item.date, { day: "numeric", month: "short" })}</span>;

  return (
    <motion.div
      whileHover={{ x: 3 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`flex items-start gap-3.5 px-4 py-3.5 border-l-[3px] bg-surface rounded-r-md ${borderColor} ${!isLast ? "mb-2" : ""}`}
    >
      <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 ${isLate ? "bg-coral-soft text-coral" : item.type === "pay" ? "bg-gold-soft text-[var(--gold-ink)]" : "bg-primary-soft text-primary-700"}`}>
        <Icon name={item.type === "pay" ? "card" : "check-circle"} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold leading-snug">{item.title}</div>
        <div className="text-[12px] text-text-2 mt-0.5">{item.meta}</div>
      </div>
      <div className="shrink-0 pt-0.5">{badgeEl}</div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* AlertItem                                                            */
/* ------------------------------------------------------------------ */
type AlertEntry = { tone: string; icon: string; t: string; b: string; go: string };

function AlertItem({ alert, isLast }: { alert: AlertEntry; isLast: boolean }) {
  const borderMap: Record<string, string> = { coral: "border-l-coral", amber: "border-l-[var(--gold)]", primary: "border-l-primary", sage: "border-l-sage" };
  const border = borderMap[alert.tone] ?? "border-l-line";
  return (
    <motion.div
      whileHover={{ x: 3 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`flex items-start gap-3.5 px-4 py-3.5 border-l-[3px] bg-surface rounded-r-md ${border} ${!isLast ? "mb-2" : ""}`}
    >
      <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 ${TILE_TONE[alert.tone] ?? TILE_TONE.primary}`}>
        <Icon name={alert.icon} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold leading-snug">{alert.t}</div>
        <div className="text-[12px] text-text-2 mt-0.5">{alert.b}</div>
      </div>
      <Link href={`/${alert.go}`} className="shrink-0 text-[12px] font-semibold text-primary hover:underline whitespace-nowrap flex items-center gap-1 pt-0.5">
        Résoudre<Icon name="chevronR" size={12} />
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* FocusItemRow                                                         */
/* ------------------------------------------------------------------ */
type FocusItem = { tone: "coral" | "gold" | "primary"; icon: string; label: string; href: string };
const FOCUS_BORDER: Record<FocusItem["tone"], string> = { coral: "border-l-coral", gold: "border-l-[var(--gold)]", primary: "border-l-primary" };
const FOCUS_ICON_BG: Record<FocusItem["tone"], string> = { coral: "bg-coral-soft text-coral", gold: "bg-gold-soft text-[var(--gold-ink)]", primary: "bg-primary-soft text-primary-700" };

function FocusItemRow({ item, isLast }: { item: FocusItem; isLast: boolean }) {
  return (
    <motion.div
      whileHover={{ x: 3 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`flex items-center gap-3.5 px-4 py-3 border-l-[3px] bg-surface rounded-r-md ${FOCUS_BORDER[item.tone]} ${!isLast ? "mb-2" : ""}`}
    >
      <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 ${FOCUS_ICON_BG[item.tone]}`}>
        <Icon name={item.icon} size={15} />
      </div>
      <div className="flex-1 min-w-0 text-[13px] font-medium leading-snug truncate">{item.label}</div>
      <Link href={item.href} className="shrink-0 text-[12px] font-semibold text-primary hover:underline whitespace-nowrap flex items-center gap-0.5">
        Voir<Icon name="chevronR" size={12} />
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* GettingStarted                                                      */
/* ------------------------------------------------------------------ */
function GettingStarted({ steps }: { steps: { id: string; label: string; desc: string; done: boolean; href: string; icon: string }[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mb-5 rounded-card border border-line bg-surface p-5 md:p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="font-semibold text-[15px] flex items-center gap-2">
            <Icon name="sparkle" size={17} className="text-primary" />
            Par où commencer ?
          </div>
          <div className="text-text-2 text-[12.5px] mt-0.5">Suivez ces étapes pour préparer votre mariage sereinement.</div>
        </div>
        <div className="font-mono text-[13px] font-semibold text-text-2 shrink-0 bg-surface-2 px-2.5 py-1 rounded-full border border-line">
          {doneCount} / {steps.length}
        </div>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden mb-5">
        <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => {
          const isNext = !s.done && (i === 0 || steps[i - 1].done);
          const content = (
            <motion.span
              whileHover={isNext ? { scale: 1.03, y: -1 } : undefined}
              whileTap={isNext ? { scale: 0.97 } : undefined}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[12.5px] font-medium transition-colors ${
                s.done   ? "border-sage/40 bg-sage-soft/60 text-sage cursor-default"
                : isNext ? "border-primary bg-primary-soft text-primary-700"
                         : "border-line bg-surface-2 text-text-3 cursor-default"}`}
            >
              <span className={`w-[19px] h-[19px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                s.done ? "bg-sage text-white" : isNext ? "bg-primary text-white" : "bg-surface-3 text-text-3"}`}>
                {s.done ? <Icon name="check" size={11} /> : i + 1}
              </span>
              <Icon name={s.icon} size={13} className={s.done ? "text-sage" : isNext ? "text-primary" : "text-text-3"} />
              {s.label}
              {isNext && <Icon name="chevronR" size={12} className="ml-0.5" />}
            </motion.span>
          );
          return s.done || !isNext
            ? <span key={s.id}>{content}</span>
            : <Link key={s.id} href={s.href}>{content}</Link>;
        })}
      </div>
      {(() => {
        const next = steps.find((s) => !s.done);
        if (!next) return null;
        return (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-primary/20 bg-primary-softer px-4 py-3">
            <div>
              <div className="text-[11px] font-semibold text-primary uppercase tracking-wide">Prochaine étape</div>
              <div className="text-sm font-semibold mt-0.5">{next.label}</div>
              <div className="text-[12px] text-text-2 mt-0.5">{next.desc}</div>
            </div>
            <Link href={next.href} className="shrink-0">
              <Button variant="primary" size="sm">Commencer</Button>
            </Link>
          </div>
        );
      })()}
    </motion.div>
  );
}

/* ================================================================== */
/* Reveal wrapper — scroll-triggered                                   */
/* ================================================================== */
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* UpcomingSnapshot                                                    */
/* ------------------------------------------------------------------ */
function UpcomingSnapshot({ state }: { state: AppState }) {
  const today = new Date().toISOString().split("T")[0];

  const urgentTasks = state.tasks
    .filter((t) => !t.done && t.due)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 3);

  const upcomingPayments = state.payments
    .filter((p) => p.status !== "paid" && p.due)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 3);

  if (urgentTasks.length === 0 && upcomingPayments.length === 0) return null;

  return (
    <motion.div variants={fadeUp} className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="sec-title mb-3"><Icon name="check-circle" size={15} className="text-primary" />Tâches prioritaires</div>
          {urgentTasks.length === 0 ? (
            <div className="flex items-center gap-3 py-3 text-text-2 text-sm">
              <div className="w-8 h-8 rounded-[8px] bg-sage-soft flex items-center justify-center shrink-0">
                <Icon name="check-circle" size={16} className="text-sage" />
              </div>
              Aucune tâche urgente — tout est sous contrôle !
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {urgentTasks.map((t) => {
                const isLate = t.due < today;
                const daysLeft = Math.round((new Date(t.due).getTime() - Date.now()) / 86400000);
                return (
                  <Link key={t.id} href="/checklist" className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-line hover:border-line-strong hover:bg-hover transition">
                    <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${isLate ? "bg-coral-soft" : "bg-primary-soft"}`}>
                      <Icon name="check" size={14} className={isLate ? "text-coral" : "text-primary-700"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{t.title}</div>
                      <div className={`text-[11.5px] ${isLate ? "text-coral" : "text-text-3"}`}>
                        {isLate ? `${Math.abs(daysLeft)}j de retard` : `J-${daysLeft}`}
                      </div>
                    </div>
                    <Icon name="chevron-right" size={13} className="text-text-3 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
        {upcomingPayments.length > 0 && (
          <Card>
            <div className="sec-title mb-3"><Icon name="card" size={15} className="text-primary" />Paiements à venir</div>
            <div className="flex flex-col gap-2">
              {upcomingPayments.map((p) => {
                const isLate = p.due < today;
                return (
                  <Link key={p.id} href="/payments" className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-line hover:border-line-strong hover:bg-hover transition">
                    <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${isLate ? "bg-coral-soft" : "bg-amber-soft"}`}>
                      <Icon name="wallet" size={14} className={isLate ? "text-coral" : "text-[var(--gold-ink)]"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{p.label}</div>
                      <div className="text-[11.5px] text-text-3">{p.vendor}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[13px] font-semibold">{p.amount.toLocaleString("fr-FR")} €</div>
                      <div className={`text-[11px] ${isLate ? "text-coral" : "text-text-3"}`}>{new Date(p.due + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* BudgetHealthWidget                                                  */
/* ------------------------------------------------------------------ */
function BudgetHealthWidget({ state }: { state: AppState }) {
  const totalBudget = state.budget.reduce((s, p) => s + p.planned, 0);
  const totalSpent  = state.budget.reduce((s, p) => s + p.spent,   0);
  if (totalBudget === 0 && state.budget.length === 0) return null;

  const pct      = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 999) : 0;
  const isOver   = totalSpent > totalBudget && totalBudget > 0;
  const barWidth = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  const topPosts = [...state.budget]
    .sort((a, b) => b.planned - a.planned)
    .slice(0, 3);

  return (
    <Reveal delay={0.04} className="mb-5">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="sec-title">
            <Icon name="wallet" size={17} className="text-text-3" />
            Santé du budget
          </div>
          <Link href="/budget" className="link text-[13px]">Voir le détail</Link>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 rounded-full overflow-hidden bg-surface-3 mb-2">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ${isOver ? "bg-coral" : "bg-sage"}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        {/* Summary text */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[12.5px] text-text-2">
            <span className="font-mono font-semibold text-text">{fmt.eur(totalSpent)}</span>
            {" dépensés sur "}
            <span className="font-mono font-semibold text-text">{fmt.eur(totalBudget)}</span>
            {" prévus"}
            {totalBudget > 0 && <span className="text-text-3"> ({pct}%)</span>}
          </span>
          {isOver && (
            <span className="text-[12px] font-semibold text-coral flex items-center gap-1">
              <Icon name="alert" size={13} />
              Budget dépassé
            </span>
          )}
        </div>

        {/* Top 3 posts */}
        {topPosts.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {topPosts.map((post) => {
              const postPct    = post.planned > 0 ? Math.min(100, (post.spent / post.planned) * 100) : 0;
              const postIsOver = post.spent > post.planned && post.planned > 0;
              return (
                <div key={post.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12.5px] text-text-2 truncate max-w-[55%]">{post.label}</span>
                    <span className="font-mono text-[12px] font-semibold text-text-2 shrink-0 ml-2">
                      {fmt.eur(post.spent)}
                      {" / "}
                      {fmt.eur(post.planned)}
                    </span>
                  </div>
                  <div className="h-[4px] bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ${postIsOver ? "bg-coral" : "bg-primary"}`}
                      style={{ width: `${Math.max(0, postPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* VendorsToReachWidget                                                */
/* ------------------------------------------------------------------ */
function VendorsToReachWidget({ state }: { state: AppState }) {
  const today = Date.now();
  const MS_14_DAYS = 14 * 24 * 60 * 60 * 1000;

  const toReach = state.vendors.filter((v) => {
    if (v.status !== "pending") return false;
    if (!v.lastContact) return false;
    const last = new Date(v.lastContact).getTime();
    return today - last > MS_14_DAYS;
  });

  if (toReach.length === 0) return null;

  const shown = toReach.slice(0, 3);

  return (
    <Reveal delay={0.05} className="mb-5">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="sec-title">
            <Icon name="alert" size={17} className="text-[var(--gold-ink)]" />
            Prestataires à relancer
          </div>
          <Link href="/vendors" className="link text-[13px]">Voir tout</Link>
        </div>

        {/* Alert badge */}
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-soft border border-amber/30">
          <Icon name="bell" size={14} className="text-[var(--gold-ink)] shrink-0" />
          <span className="text-[12.5px] font-semibold text-[var(--gold-ink)]">
            {toReach.length} prestataire{toReach.length > 1 ? "s" : ""} sans contact depuis +14 jours
          </span>
        </div>

        <div className="flex flex-col gap-2 mb-3">
          {shown.map((v) => {
            const daysSince = Math.round((today - new Date(v.lastContact).getTime()) / 86400000);
            return (
              <div key={v.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-line bg-surface">
                <div className="w-8 h-8 rounded-[8px] bg-amber-soft flex items-center justify-center shrink-0">
                  <Icon name="phone" size={14} className="text-[var(--gold-ink)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{v.name}</div>
                  <div className="text-[11.5px] text-text-3">Dernier contact il y a {daysSince}j</div>
                </div>
              </div>
            );
          })}
        </div>

        <Link href="/vendors">
          <Button variant="secondary" size="sm" icon="phone">Voir les prestataires</Button>
        </Link>
      </Card>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* GiftsLinkWidget                                                     */
/* ------------------------------------------------------------------ */
function GiftsLinkWidget() {
  return (
    <Reveal delay={0.06} className="mb-5">
      <Card>
        <div className="flex items-center justify-between">
          <div className="sec-title">
            <Icon name="gift" size={17} className="text-text-3" />
            Cadeaux &amp; remerciements
          </div>
          <Link href="/gifts" className="link text-[13px] flex items-center gap-1 font-semibold">
            Suivi des cadeaux <Icon name="chevronR" size={13} />
          </Link>
        </div>
      </Card>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* useWeddingWeather hook                                              */
/* ------------------------------------------------------------------ */
interface WeatherData {
  type: "forecast" | "climate";
  temp: number | null;
  precip: number | null;
  description: string;
  emoji: string;
}

function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code <= 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️";
  if (code <= 99) return "⛈️";
  return "🌤️";
}

function weatherDesc(code: number): string {
  if (code === 0) return "Ensoleillé";
  if (code <= 2) return "Partiellement nuageux";
  if (code <= 3) return "Nuageux";
  if (code <= 48) return "Brumeux";
  if (code <= 67) return "Pluvieux";
  if (code <= 77) return "Neigeux";
  if (code <= 82) return "Averses";
  if (code <= 99) return "Orageux";
  return "Variable";
}

function useWeddingWeather(date: string, city: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date || !city) return;

    async function load() {
      setLoading(true);
      try {
        // Step 1: geocode the city with Nominatim
        const geo = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&countrycodes=fr,be,ch`,
          { headers: { "Accept-Language": "fr", "User-Agent": "TheCockpit/1.0" } }
        ).then((r) => r.json());

        if (!geo?.[0]) { setLoading(false); return; }
        const { lat, lon } = geo[0];

        const weddingDate = new Date(date + "T00:00:00");
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const daysUntil = Math.round((weddingDate.getTime() - now.getTime()) / 86400000);

        if (daysUntil >= 0 && daysUntil <= 16) {
          // Forecast: Open-Meteo forecast API
          const fc = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,precipitation_sum,weathercode&timezone=Europe%2FParis&forecast_days=16`
          ).then((r) => r.json());

          const idx = fc.daily?.time?.findIndex((t: string) => t === date);
          if (idx >= 0) {
            const code = fc.daily.weathercode[idx];
            setWeather({
              type: "forecast",
              temp: Math.round(fc.daily.temperature_2m_max[idx]),
              precip: Math.round(fc.daily.precipitation_sum[idx] * 10) / 10,
              description: weatherDesc(code),
              emoji: weatherEmoji(code),
            });
          }
        } else if (daysUntil > 16) {
          // Climate normals: use archive API for same date of previous year
          const prevYear = weddingDate.getFullYear() - 1;
          const startDate = new Date(prevYear, weddingDate.getMonth(), Math.max(1, weddingDate.getDate() - 7)).toISOString().split("T")[0];
          const endDate = new Date(prevYear, weddingDate.getMonth(), Math.min(28, weddingDate.getDate() + 7)).toISOString().split("T")[0];

          const arch = await fetch(
            `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,precipitation_sum&timezone=Europe%2FParis`
          ).then((r) => r.json());

          if (arch.daily?.temperature_2m_max?.length > 0) {
            const temps = arch.daily.temperature_2m_max.filter((t: number | null) => t !== null) as number[];
            const precips = arch.daily.precipitation_sum.filter((p: number | null) => p !== null) as number[];
            const avgTemp = temps.length > 0 ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null;
            const avgPrecip = precips.length > 0 ? Math.round((precips.reduce((a, b) => a + b, 0) / precips.length) * 10) / 10 : null;

            setWeather({
              type: "climate",
              temp: avgTemp,
              precip: avgPrecip,
              description: avgPrecip !== null && avgPrecip > 5 ? "Risque de pluie" : "Généralement ensoleillé",
              emoji: avgPrecip !== null && avgPrecip > 5 ? "🌦️" : "☀️",
            });
          }
        }
      } catch { /* silently fail */ }
      setLoading(false);
    }

    load();
  }, [date, city]);

  return { weather, loading };
}

/* ------------------------------------------------------------------ */
/* WeatherWidget                                                        */
/* ------------------------------------------------------------------ */
function WeatherWidget({ date, city }: { date: string; city: string }) {
  const { weather, loading } = useWeddingWeather(date, city);

  if (!date || !city) return null;

  const daysUntil = Math.round((new Date(date + "T00:00:00").getTime() - Date.now()) / 86400000);
  if (daysUntil < -1) return null; // Mariage passé depuis plus d'un jour

  if (loading) {
    return (
      <div className="mt-4 px-4 py-3 rounded-xl border border-line bg-surface flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin shrink-0" />
        <span className="text-[13px] text-text-3">Chargement des prévisions météo…</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className={`mt-4 rounded-xl border flex items-center gap-4 px-5 py-4 ${weather.precip !== null && weather.precip > 5 ? "border-amber/30 bg-amber-soft/30" : "border-primary/20 bg-primary-soft/20"}`}>
      <span className="text-4xl shrink-0">{weather.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-text">
          {weather.type === "forecast" ? "Météo prévue le Jour J" : "Météo habituelle à cette période"}
        </div>
        <div className="text-[12.5px] text-text-2 mt-0.5">{weather.description} · {city}</div>
      </div>
      <div className="text-right shrink-0">
        {weather.temp !== null && (
          <div className="font-mono text-[22px] font-semibold text-text">{weather.temp}°C</div>
        )}
        {weather.precip !== null && weather.precip > 0 && (
          <div className="text-[11.5px] text-text-3">{weather.precip}mm de pluie</div>
        )}
        {weather.type === "climate" && (
          <div className="text-[10.5px] text-text-3 mt-0.5">Moyenne historique</div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Page                                                                */
/* ================================================================== */
export default function DashboardPage() {
  const { state } = useStore();
  const w = state.wedding;
  const days = fmt.daysUntil(w.date);
  const isPast = days < 0;

  const [greeting, setGreeting] = useState<string>("");
  useEffect(() => {
    const h = new Date().getHours();
    const name = w.partnerA || "";
    if (h >= 6  && h < 12) setGreeting(`Bonjour ${name} 👋`);
    else if (h >= 12 && h < 18) setGreeting(`Bon après-midi ${name} 👋`);
    else if (h >= 18 && h < 23) setGreeting(`Bonsoir ${name} 👋`);
    else                         setGreeting(`Bonne nuit ${name} 🌙`);
  }, [w.partnerA]);

  const todayFr = useMemo(() =>
    new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }), []);

  const confirmed    = state.guests.filter((g) => g.rsvp === "yes").length;
  const pending      = state.guests.filter((g) => g.rsvp === "pending").length;
  const spent        = state.budget.reduce((s, b) => s + b.spent, 0);
  const remaining    = state.budgetTotal - spent;
  const paidAmt      = state.payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const signed       = state.vendors.filter((v) => v.status === "signed").length;
  const pendingV     = state.vendors.filter((v) => v.status === "pending").length;
  const latePayments = state.payments.filter((p) => p.status === "late");
  const dueAmt       = state.payments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const doneTasks    = state.tasks.filter((t) => t.done).length;

  const pctTasks   = state.tasks.length   ? Math.round((doneTasks / state.tasks.length)   * 100) : 0;
  const pctGuests  = state.guests.length  ? Math.round((confirmed / state.guests.length)  * 100) : 0;
  const pctVendors = state.vendors.length ? Math.round((signed    / state.vendors.length) * 100) : 0;
  const pctSpent   = Math.min(100, state.budgetTotal ? Math.round((spent / state.budgetTotal) * 100) : 0);
  const globalPct  = Math.round(pctTasks * 0.4 + pctVendors * 0.25 + pctGuests * 0.2 + pctSpent * 0.15);

  const dateCand  = state.dateCandidates.find((d) => d.id === state.selectedDate) ?? state.dateCandidates[0] ?? null;
  const isNewUser = state.guests.length === 0 && state.vendors.length === 0;

  const nextUrgent = useMemo(() => {
    const items = [
      ...state.payments.filter((p) => p.status !== "paid").map((p) => ({ d: fmt.daysUntil(p.due), name: p.vendor })),
      ...state.tasks.filter((t) => !t.done && t.due).map((t) => ({ d: fmt.daysUntil(t.due), name: t.title })),
    ].filter((x) => x.d >= 0).sort((a, b) => a.d - b.d);
    const first = items[0];
    if (!first) return null;
    const label = first.name.length > 13 ? first.name.slice(0, 13) + "…" : first.name;
    return { val: first.d === 0 ? "Auj." : `J-${first.d}`, label };
  }, [state.payments, state.tasks]);

  const scoreBars = [
    { label: "Checklist",    pct: pctTasks,   color: "var(--primary)" },
    { label: "Invités",      pct: pctGuests,  color: "var(--sage)"    },
    { label: "Prestataires", pct: pctVendors, color: "var(--gold)"    },
    { label: "Budget",       pct: pctSpent,   color: "var(--coral)"   },
  ];

  const setupSteps = [
    { id: "space",     label: "Espace créé",          desc: "Votre espace mariage est configuré",           done: true,                                                          href: "/settings",  icon: "rings"        },
    { id: "date",      label: "Date confirmée",        desc: "Sélectionnez votre date parmi les candidates", done: state.dateCandidates.some((d) => d.id === state.selectedDate), href: "/dates",     icon: "calendar"     },
    { id: "budget",    label: "Budget configuré",      desc: "Définissez vos postes de dépenses",            done: state.budget.length > 0,                                       href: "/budget",    icon: "wallet"       },
    { id: "guests",    label: "Invités ajoutés",       desc: "Construisez votre liste et gérez les RSVP",    done: state.guests.length > 0,                                       href: "/guests",    icon: "users"        },
    { id: "vendors",   label: "Prestataire contacté",  desc: "Comparez les devis et signez vos contrats",    done: state.vendors.length > 0,                                      href: "/vendors",   icon: "file"         },
    { id: "checklist", label: "Checklist initialisée", desc: "Suivez toutes les étapes jusqu'au grand jour", done: state.tasks.length > 0,                                        href: "/checklist", icon: "check-circle" },
  ];

  const modules = [
    { id: "guests",    icon: "users",        tone: "primary", title: "Invités",    val: state.guests.length  === 0 ? "À remplir"   : `${confirmed} / ${state.guests.length}`,  sub: state.guests.length  === 0 ? "Ajoutez vos invités"       : `${pending} en attente`,   empty: state.guests.length  === 0 },
    { id: "budget",    icon: "wallet",       tone: "sage",    title: "Budget",     val: state.budget.length  === 0 ? "À définir"   : fmt.eur(spent),                            sub: state.budget.length  === 0 ? "Configurez les postes"     : `${pctSpent}% engagé`,     empty: state.budget.length  === 0 },
    { id: "vendors",   icon: "file",         tone: "gold",    title: "Devis",      val: state.vendors.length === 0 ? "À contacter" : `${signed} signés`,                        sub: state.vendors.length === 0 ? "Comparez les devis"        : `${pendingV} à arbitrer`,  empty: state.vendors.length === 0 },
    { id: "payments",  icon: "card",         tone: latePayments.length ? "coral" : "blue", title: "Paiements", val: state.payments.length === 0 ? "À suivre" : fmt.eur(dueAmt), sub: state.payments.length === 0 ? "Suivi des échéances" : latePayments.length ? `${latePayments.length} en retard` : "à venir", empty: state.payments.length === 0 },
    { id: "dates",     icon: "calendar",     tone: "amber",   title: "Date",       val: fmt.dateShort(w.date),                                                                   sub: dateCand ? `${dateCand.weather}% météo` : "—",                                        empty: false },
    { id: "checklist", icon: "check-circle", tone: "primary", title: "Checklist",  val: state.tasks.length   === 0 ? "À créer"     : `${doneTasks} / ${state.tasks.length}`,   sub: state.tasks.length   === 0 ? "Initialisez la checklist"  : `${pctTasks}% fait`,       empty: state.tasks.length   === 0 },
  ];

  const alerts = useMemo<AlertEntry[]>(() => {
    const list: AlertEntry[] = [];
    latePayments.forEach((p) => list.push({ tone: "coral", icon: "alert", t: "Paiement en retard", b: `${p.label} — ${p.vendor}`, go: "payments" }));
    state.budget.filter((b) => b.spent > b.planned).forEach((b) => list.push({ tone: "coral", icon: "bars", t: "Dépassement budget", b: `${b.label} · ${fmt.eur(b.spent - b.planned)} au-dessus`, go: "budget" }));
    if (pending  > 0) list.push({ tone: "amber",   icon: "clock", t: `${pending} RSVP en attente`,   b: "Relancez les invités non confirmés",       go: "guests"  });
    if (pendingV > 0) list.push({ tone: "primary",  icon: "file",  t: `${pendingV} devis à arbitrer`, b: "Des prestataires attendent votre réponse", go: "vendors" });
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.payments, state.budget, state.guests, state.vendors]);

  const upcoming = useMemo<DeadlineEntry[]>(() => {
    const list: DeadlineEntry[] = [
      ...state.payments.filter((p) => p.status !== "paid").map((p) => ({ date: p.due, title: p.label, meta: `${p.vendor} · ${fmt.eur(p.amount)}`, type: "pay" as const, status: p.status })),
      ...state.tasks.filter((t) => !t.done && t.due).map((t) => ({ date: t.due, title: t.title, meta: `Tâche · ${t.who === "A" ? w.partnerA : w.partnerB}`, type: "task" as const, status: "" })),
    ];
    return list.sort((a, b) => {
      const aLate = a.status === "late" || fmt.daysUntil(a.date) < 0 ? -1 : 0;
      const bLate = b.status === "late" || fmt.daysUntil(b.date) < 0 ? -1 : 0;
      if (aLate !== bLate) return aLate - bLate;
      return a.date.localeCompare(b.date);
    }).slice(0, 6);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.payments, state.tasks]);

  const focusItems = useMemo<FocusItem[]>(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);
    const list: FocusItem[] = [];
    for (const p of state.payments) if (p.status === "late") list.push({ tone: "coral", icon: "alert", label: `Paiement en retard · ${p.vendor} — ${p.amount}€`, href: "/payments" });
    for (const t of state.tasks) if (!t.done && t.due && t.due < todayIso) list.push({ tone: "coral", icon: "alert", label: `Tâche en retard · ${t.title}`, href: "/checklist" });
    for (const p of state.payments) {
      if (p.status !== "paid") {
        const d = fmt.daysUntil(p.due);
        if (d >= 0 && d <= 7) list.push({ tone: "gold", icon: "clock", label: `Paiement dans ${d}j · ${p.vendor} — ${p.amount}€`, href: "/payments" });
      }
    }
    if (days < 21 && days >= 0 && pending > 0) list.push({ tone: "primary", icon: "users", label: `${pending} invité${pending > 1 ? "s" : ""} sans réponse — J-${days}`, href: "/guests" });
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    const in7Iso = in7.toISOString().slice(0, 10);
    for (const t of state.tasks) if (!t.done && t.due && t.due >= todayIso && t.due <= in7Iso) list.push({ tone: "primary", icon: "clock", label: `Tâche cette semaine · ${t.title}`, href: "/checklist" });
    return list.slice(0, 3);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.payments, state.tasks, state.guests, days, pending]);

  /* ================================================================ */
  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">

      {/* ---- Header ---- */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-[26px] font-semibold tracking-[-.025em]">
            {isNewUser ? "Bienvenue dans Jour J 🎉" : (greeting || `Bonjour ${w.partnerA} 👋`)}
          </h1>
          <div className="text-sm text-text-2 mt-1 capitalize">
            {isNewUser
              ? "Votre espace est prêt. Suivez les étapes ci-dessous pour organiser votre mariage."
              : todayFr}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.3 }}
          className="flex gap-2 items-center flex-wrap">
          <Button variant="secondary" icon="download" onClick={() => exportWeddingReport(state)}>Rapport complet</Button>
          <Link href="/vendors"><Button variant="primary" icon="plus">Ajouter un devis</Button></Link>
        </motion.div>
      </div>

      {/* Getting started */}
      <GettingStarted steps={setupSteps} />

      {/* ---- Bento : Hero 3D + Score ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-5 items-stretch mb-5">
        <HeroCard
          w={w} days={days} isPast={isPast} globalPct={globalPct} dateCand={dateCand}
          confirmed={confirmed} totalGuests={state.guests.length}
          pctSpent={pctSpent} doneTasks={doneTasks} totalTasks={state.tasks.length}
          nextUrgent={nextUrgent}
        />
        <ScoreWidget globalPct={globalPct} bars={scoreBars} />
      </div>

      {/* ---- Focus du jour ---- */}
      <Reveal delay={0.05} className="mb-5">
        <div className="rounded-card border border-line bg-surface p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-[15px] flex items-center gap-2">⚡ Focus du jour</div>
              <div className="text-text-2 text-[12.5px] mt-0.5 capitalize">{todayFr}</div>
            </div>
          </div>
          {focusItems.length === 0 ? (
            <div className="flex items-center gap-3 py-3 text-text-2 text-sm">
              <div className="w-9 h-9 rounded-[10px] bg-sage-soft flex items-center justify-center shrink-0">
                <Icon name="check-circle" size={18} className="text-sage" />
              </div>
              Tout est à jour — profitez de votre journée ! 🎉
            </div>
          ) : (
            <div>{focusItems.map((item, i) => <FocusItemRow key={i} item={item} isLast={i === focusItems.length - 1} />)}</div>
          )}
        </div>
      </Reveal>

      {/* ---- Quick actions ---- */}
      <Reveal delay={0.06} className="mb-8">
        <div className="flex flex-wrap gap-2.5">
          {([
            { icon: "plus",         label: "Ajouter un invité",        href: "/guests"    },
            { icon: "wallet",       label: "Saisir une dépense",       href: "/budget"    },
            { icon: "check-circle", label: "Compléter une tâche",      href: "/checklist" },
            { icon: "phone",        label: "Contacter un prestataire", href: "/vendors"   },
          ] as { icon: string; label: string; href: string }[]).map((action) => (
            <Link key={action.href} href={action.href}>
              <motion.span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line text-text-2 text-[13px] font-medium cursor-pointer select-none"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
              >
                <Icon name={action.icon} size={14} />
                {action.label}
              </motion.span>
            </Link>
          ))}
        </div>
      </Reveal>

      {/* ---- Finances ---- */}
      <Reveal delay={0.04} className="mb-5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="sec-title"><Icon name="wallet" size={17} className="text-text-3" />Finances</div>
            <Link href="/budget" className="link text-[13px]">Voir le détail</Link>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-surface-3 mb-4">
            <div className="flex h-full">
              <span className="block h-full bg-sage transition-[width] duration-700 rounded-l-full"
                style={{ width: `${Math.min(100, (paidAmt / (state.budgetTotal || 1)) * 100)}%` }} />
              <span className="block h-full bg-gold transition-[width] duration-700"
                style={{ width: `${Math.min(100, ((spent - paidAmt) / (state.budgetTotal || 1)) * 100)}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-row sm:gap-8">
            {([
              ["Payé",    fmt.eur(paidAmt),          "var(--sage)",       "text-sage"],
              ["Engagé",  fmt.eur(spent - paidAmt),  "var(--gold)",       ""],
              ["Restant", fmt.eur(remaining),         "var(--line-strong)",""],
            ] as [string, string, string, string][]).map(([l, v, c, cl]) => (
              <div key={l}>
                <div className="flex items-center gap-1.5 text-[12px] text-text-2 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: c }} />{l}
                </div>
                <div className={`font-mono text-[20px] font-semibold tracking-[-.01em] ${cl}`}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      {/* ---- Modules — stagger entrance ---- */}
      <Reveal delay={0.05}>
        <div className="flex items-center justify-between mb-3">
          <div className="sec-title"><Icon name="grid" size={17} className="text-text-3" />Modules</div>
        </div>
      </Reveal>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {modules.map((m) => (
          <motion.div key={m.id} variants={fadeUp}>
            <Link href={`/${m.id}`}>
              <motion.div
                className={`card p-4 flex flex-col gap-3 relative h-full group ${m.empty ? "border-dashed" : ""}`}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <Icon name="chevronR" size={15}
                  className="absolute top-4 right-3.5 text-text-3 opacity-0 group-hover:opacity-100 transition" />
                <div className={`w-10 h-10 rounded-[11px] flex items-center justify-center ${TILE_TONE[m.tone]}`}>
                  <Icon name={m.icon} size={20} />
                </div>
                <div>
                  <div className="text-[12.5px] font-semibold text-text-2 mb-0.5">{m.title}</div>
                  {m.empty ? (
                    <>
                      <div className="text-[11px] text-text-3 italic leading-snug">{m.val}</div>
                      <div className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium text-text-3 border border-dashed border-line px-2 py-0.5 rounded-full">
                        À compléter
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-mono text-[20px] font-bold tracking-[-.015em] leading-tight">{m.val}</div>
                      <div className="text-[11.5px] text-text-3 mt-0.5">{m.sub}</div>
                    </>
                  )}
                </div>
                {m.empty && <span className="absolute bottom-3.5 right-3.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ---- Alertes + Échéances ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <Reveal delay={0}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="sec-title"><Icon name="bell" size={17} className="text-text-3" />Alertes actives</div>
              {alerts.length > 0 && <Badge tone="coral">{alerts.length}</Badge>}
            </div>
            {alerts.length === 0 ? (
              isNewUser ? (
                <div className="flex flex-col gap-2.5 py-1">
                  <div className="text-text-2 text-sm mb-1">Aucune alerte — commencez par ces étapes :</div>
                  {setupSteps.filter((s) => !s.done).slice(0, 3).map((s) => (
                    <Link key={s.id} href={s.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-dashed border-line hover:bg-hover hover:border-line-strong transition">
                      <span className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 bg-primary-soft text-primary-700">
                        <Icon name={s.icon} size={16} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium">{s.label}</div>
                        <div className="text-[11.5px] text-text-2">{s.desc}</div>
                      </div>
                      <Icon name="chevronR" size={14} className="text-text-3" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-4 text-text-2 text-sm">
                  <div className="w-9 h-9 rounded-[10px] bg-sage-soft flex items-center justify-center shrink-0">
                    <Icon name="check-circle" size={18} className="text-sage" />
                  </div>
                  Aucune alerte. Tout est sous contrôle.
                </div>
              )
            ) : (
              <div>{alerts.map((a, i) => <AlertItem key={i} alert={a} isLast={i === alerts.length - 1} />)}</div>
            )}
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="sec-title"><Icon name="clock" size={17} className="text-text-3" />Prochaines échéances</div>
              {upcoming.length > 0 && <Link href="/payments" className="link text-[13px]">Voir tout</Link>}
            </div>
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center">
                  <Icon name="calendar" size={26} className="text-text-3" />
                </div>
                <div className="text-text-2 text-sm max-w-[240px]">
                  {state.payments.length === 0 && state.tasks.length === 0
                    ? "Les paiements et tâches à venir apparaîtront ici une fois ajoutés."
                    : "Aucune échéance à venir. Bien joué !"}
                </div>
                {state.tasks.length === 0 && (
                  <Link href="/checklist">
                    <Button variant="secondary" size="sm" icon="check-circle">Voir la checklist</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div>{upcoming.map((u, i) => <DeadlineItem key={i} item={u} isLast={i === upcoming.length - 1} />)}</div>
            )}
          </Card>
        </Reveal>
      </div>

      {/* ── Upcoming snapshot ─────────────────────────────────── */}
      <UpcomingSnapshot state={state} />

      {/* ── Weather widget ────────────────────────────────────── */}
      <WeatherWidget date={w.date} city={w.city ?? ""} />

      {/* ── Budget health ─────────────────────────────────────── */}
      <BudgetHealthWidget state={state} />

      {/* ── Vendors to reach ──────────────────────────────────── */}
      <VendorsToReachWidget state={state} />

      {/* ── Gifts link ────────────────────────────────────────── */}
      <GiftsLinkWidget />
    </div>
  );
}

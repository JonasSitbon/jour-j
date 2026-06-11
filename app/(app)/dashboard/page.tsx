"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/components/providers";
import { fmt } from "@/lib/format";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Ring } from "@/components/ui";

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
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 420, damping: 28 } },
};

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
          <div className="text-text-2 text-[12.5px] mt-0.5">
            Suivez ces étapes pour préparer votre mariage sereinement.
          </div>
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
                s.done    ? "border-sage/40 bg-sage-soft/60 text-sage cursor-default"
                : isNext  ? "border-primary bg-primary-soft text-primary-700"
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
          return s.done || !isNext ? <span key={s.id}>{content}</span> : <Link key={s.id} href={s.href}>{content}</Link>;
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

/* ------------------------------------------------------------------ */
/* ScoreWidget                                                          */
/* ------------------------------------------------------------------ */
function ScoreWidget({ globalPct, bars }: { globalPct: number; bars: { label: string; pct: number; color: string }[] }) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="sec-title">
        <Icon name="sparkle" size={17} className="text-text-3" />
        Préparation
      </div>
      <div className="flex flex-col items-center gap-1">
        <Ring value={globalPct} size={120} stroke={11} color="var(--primary)" track="var(--surface-3)">
          <div className="flex flex-col items-center leading-none">
            <span className="font-mono text-[30px] font-bold tracking-tight text-text">{globalPct}</span>
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
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
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
/* CountdownRing                                                        */
/* ------------------------------------------------------------------ */
function CountdownRing({ days }: { days: number }) {
  const size = 80, stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const TOTAL_DAYS = 730;
  const elapsed = Math.max(0, TOTAL_DAYS - Math.max(0, days));
  const pct = Math.min(1, elapsed / TOTAL_DAYS);
  const targetOffset = circumference * (1 - pct);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = ringRef.current;
    if (!el) return;
    el.style.strokeDashoffset = String(circumference);
    void el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)";
    el.style.strokeDashoffset = String(targetOffset);
  }, [circumference, targetOffset]);

  const strokeColor = pct < 0.5 ? "var(--sage)" : pct < 0.85 ? "var(--gold)" : "var(--coral)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle ref={ringRef} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference} />
      </svg>
      <div className="relative z-10 flex flex-col items-center leading-none">
        <span className="text-[10px] text-[#FBF1E0]/75 font-semibold uppercase tracking-widest">J-</span>
        <span className="font-mono text-[28px] font-bold text-[#FBF1E0] leading-none">{days}</span>
      </div>
    </div>
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
    if (h >= 6 && h < 12)       setGreeting(`Bonjour ${name} 👋`);
    else if (h >= 12 && h < 18) setGreeting(`Bon après-midi ${name} 👋`);
    else if (h >= 18 && h < 23) setGreeting(`Bonsoir ${name} 👋`);
    else                         setGreeting(`Bonne nuit ${name} 🌙`);
  }, [w.partnerA]);

  const todayFr = useMemo(() => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }), []);

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

  const pctTasks   = state.tasks.length   ? Math.round((doneTasks  / state.tasks.length)   * 100) : 0;
  const pctGuests  = state.guests.length  ? Math.round((confirmed  / state.guests.length)  * 100) : 0;
  const pctVendors = state.vendors.length ? Math.round((signed     / state.vendors.length) * 100) : 0;
  const pctSpent   = Math.min(100, state.budgetTotal ? Math.round((spent / state.budgetTotal) * 100) : 0);
  const globalPct  = Math.round(pctTasks * 0.4 + pctVendors * 0.25 + pctGuests * 0.2 + pctSpent * 0.15);

  const dateCand  = state.dateCandidates.find((d) => d.id === state.selectedDate) ?? state.dateCandidates[0] ?? null;
  const isNewUser = state.guests.length === 0 && state.vendors.length === 0;

  const scoreBars = [
    { label: "Checklist",    pct: pctTasks,   color: "var(--primary)" },
    { label: "Invités",      pct: pctGuests,  color: "var(--sage)"    },
    { label: "Prestataires", pct: pctVendors, color: "var(--gold)"    },
    { label: "Budget",       pct: pctSpent,   color: "var(--coral)"   },
  ];

  const setupSteps = [
    { id: "space",     label: "Espace créé",          desc: "Votre espace mariage est configuré",           done: true,                                                             href: "/settings",  icon: "rings"        },
    { id: "date",      label: "Date confirmée",        desc: "Sélectionnez votre date parmi les candidates", done: state.dateCandidates.some((d) => d.id === state.selectedDate),    href: "/dates",     icon: "calendar"     },
    { id: "budget",    label: "Budget configuré",      desc: "Définissez vos postes de dépenses",            done: state.budget.length > 0,                                          href: "/budget",    icon: "wallet"       },
    { id: "guests",    label: "Invités ajoutés",       desc: "Construisez votre liste et gérez les RSVP",    done: state.guests.length > 0,                                          href: "/guests",    icon: "users"        },
    { id: "vendors",   label: "Prestataire contacté",  desc: "Comparez les devis et signez vos contrats",    done: state.vendors.length > 0,                                         href: "/vendors",   icon: "file"         },
    { id: "checklist", label: "Checklist initialisée", desc: "Suivez toutes les étapes jusqu'au grand jour", done: state.tasks.length > 0,                                           href: "/checklist", icon: "check-circle" },
  ];

  const modules = [
    { id: "guests",   icon: "users",        tone: "primary", title: "Invités",    val: state.guests.length  === 0 ? "À remplir"   : `${confirmed} / ${state.guests.length}`,  sub: state.guests.length  === 0 ? "Ajoutez vos invités"        : `${pending} en attente`,   empty: state.guests.length  === 0 },
    { id: "budget",   icon: "wallet",       tone: "sage",    title: "Budget",     val: state.budget.length  === 0 ? "À définir"   : fmt.eur(spent),                            sub: state.budget.length  === 0 ? "Configurez les postes"      : `${pctSpent}% engagé`,     empty: state.budget.length  === 0 },
    { id: "vendors",  icon: "file",         tone: "gold",    title: "Devis",      val: state.vendors.length === 0 ? "À contacter" : `${signed} signés`,                        sub: state.vendors.length === 0 ? "Comparez les devis"         : `${pendingV} à arbitrer`,  empty: state.vendors.length === 0 },
    { id: "payments", icon: "card",         tone: latePayments.length ? "coral" : "blue", title: "Paiements", val: state.payments.length === 0 ? "À suivre" : fmt.eur(dueAmt), sub: state.payments.length === 0 ? "Suivi des échéances" : latePayments.length ? `${latePayments.length} en retard` : "à venir", empty: state.payments.length === 0 },
    { id: "dates",    icon: "calendar",     tone: "amber",   title: "Date",       val: fmt.dateShort(w.date),                                                                  sub: dateCand ? `${dateCand.weather}% météo` : "—",                                          empty: false },
    { id: "checklist",icon: "check-circle", tone: "primary", title: "Checklist",  val: state.tasks.length   === 0 ? "À créer"     : `${doneTasks} / ${state.tasks.length}`,   sub: state.tasks.length   === 0 ? "Initialisez la checklist"   : `${pctTasks}% fait`,       empty: state.tasks.length   === 0 },
  ];

  const alerts = useMemo<AlertEntry[]>(() => {
    const list: AlertEntry[] = [];
    latePayments.forEach((p) => list.push({ tone: "coral", icon: "alert", t: "Paiement en retard", b: `${p.label} — ${p.vendor}`, go: "payments" }));
    state.budget.filter((b) => b.spent > b.planned).forEach((b) => list.push({ tone: "coral", icon: "bars", t: "Dépassement budget", b: `${b.label} · ${fmt.eur(b.spent - b.planned)} au-dessus`, go: "budget" }));
    if (pending  > 0) list.push({ tone: "amber",   icon: "clock", t: `${pending} RSVP en attente`,   b: "Relancez les invités non confirmés",           go: "guests"  });
    if (pendingV > 0) list.push({ tone: "primary",  icon: "file",  t: `${pendingV} devis à arbitrer`, b: "Des prestataires attendent votre réponse",     go: "vendors" });
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
    for (const p of state.payments) { if (p.status !== "paid") { const d = fmt.daysUntil(p.due); if (d >= 0 && d <= 7) list.push({ tone: "gold", icon: "clock", label: `Paiement dans ${d}j · ${p.vendor} — ${p.amount}€`, href: "/payments" }); } }
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

      {/* ---- Header (greeting unique + actions) ---- */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-[26px] font-semibold tracking-[-.025em]">
            {isNewUser ? "Bienvenue dans Jour J 🎉" : (greeting || `Bonjour ${w.partnerA} 👋`)}
          </h1>
          <div className="text-sm text-text-2 mt-1 capitalize">
            {isNewUser
              ? "Votre espace est prêt. Suivez les étapes ci-dessous pour organiser votre mariage."
              : `${todayFr}${!isPast ? ` · J-${days} avant le grand jour` : ""}`}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12, duration: 0.3 }} className="flex gap-2 items-center flex-wrap">
          <Button variant="secondary" icon="download">Exporter</Button>
          <Link href="/vendors"><Button variant="primary" icon="plus">Ajouter un devis</Button></Link>
        </motion.div>
      </div>

      {/* Getting started */}
      <GettingStarted steps={setupSteps} />

      {/* ---- Bento top : Hero + Score ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 items-stretch mb-5">

        {/* Hero card — animé au survol */}
        <motion.div
          className="relative overflow-hidden rounded-card shadow-md flex flex-col justify-between min-h-[268px] cursor-default"
          style={{
            background: "radial-gradient(120% 130% at 100% 0%, color-mix(in srgb, var(--primary) 88%, #fff), transparent 58%), radial-gradient(90% 120% at 0% 100%, color-mix(in srgb, var(--gold) 60%, #6E4423), transparent 60%), linear-gradient(125deg, #4A3320 0%, #6E4423 100%)",
          }}
          initial="rest"
          whileHover="hover"
          variants={{ rest: { scale: 1 }, hover: { scale: 1.012 } }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          {/* Badge % prêt */}
          <motion.div
            className="absolute top-5 right-5 z-[2]"
            variants={{ rest: { y: 0, x: 0 }, hover: { y: -3, x: -2 } }}
            transition={{ type: "spring", stiffness: 350, damping: 24 }}
          >
            <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 text-[#FBF1E0] text-[12px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Icon name="sparkle" size={13} />
              {globalPct}% prêt
            </span>
          </motion.div>

          {/* Couple names — remonte au hover */}
          <motion.div
            className="relative z-[1] px-7 md:px-8 pt-7 md:pt-8"
            variants={{ rest: { y: 0 }, hover: { y: -5 } }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <div className="text-[12.5px] text-[#FBF1E0]/80 font-medium flex items-center gap-2 mb-2">
              <Icon name="rings" size={15} />
              Le mariage de
            </div>
            <div className="text-[28px] md:text-[34px] font-semibold tracking-[-.03em] text-[#FBF1E0] leading-tight">
              {w.partnerA} &amp; {w.partnerB}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[13px] text-[#FBF1E0]/85">
              <span className="flex items-center gap-1.5"><Icon name="calendar" size={14} />{fmt.date(w.date)}</span>
              {w.venue && <span className="flex items-center gap-1.5"><Icon name="pin" size={14} />{w.venue}{w.city ? `, ${w.city}` : ""}</span>}
            </div>
          </motion.div>

          {/* Countdown + météo — remonte au hover */}
          <motion.div
            className="relative z-[1] px-7 md:px-8 pb-7 md:pb-8 flex items-end justify-between gap-4 mt-6"
            variants={{ rest: { y: 0 }, hover: { y: -3 } }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.03 }}
          >
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
              <div className="flex items-end gap-5">
                <CountdownRing days={days} />
                <div>
                  <div className="text-[#FBF1E0]/80 text-[12px] font-semibold uppercase tracking-widest mb-1">Compte à rebours</div>
                  <div className="text-[#FBF1E0]/70 text-[13px] mt-1">{days === 1 ? "jour avant le grand jour" : "jours avant le grand jour"}</div>
                </div>
              </div>
            )}
            {dateCand && !isPast && (
              <div className="flex items-center gap-3 bg-white/12 border border-white/20 rounded-xl px-4 py-3 backdrop-blur-sm shrink-0">
                <Icon name="sun" size={28} className="text-[#FBF1E0]" />
                <div>
                  <div className="font-mono text-[24px] font-bold text-[#FBF1E0] leading-none">{dateCand.temp}°</div>
                  <div className="text-[11.5px] text-[#FBF1E0]/80 mt-0.5">{dateCand.weather}% favorable</div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Score */}
        <ScoreWidget globalPct={globalPct} bars={scoreBars} />
      </div>

      {/* ---- Focus du jour ---- */}
      <div className="mb-5 rounded-card border border-line bg-surface p-5 md:p-6">
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

      {/* ---- Quick actions ---- */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        {([
          { icon: "plus",         label: "Ajouter un invité",        href: "/guests"    },
          { icon: "wallet",       label: "Saisir une dépense",       href: "/budget"    },
          { icon: "check-circle", label: "Compléter une tâche",      href: "/checklist" },
          { icon: "phone",        label: "Contacter un prestataire", href: "/vendors"   },
        ] as { icon: string; label: string; href: string }[]).map((action) => (
          <Link key={action.href + action.label} href={action.href}>
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

      {/* ---- Finances ---- */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="sec-title"><Icon name="wallet" size={17} className="text-text-3" />Finances</div>
          <Link href="/budget" className="link text-[13px]">Voir le détail</Link>
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-surface-3 mb-4">
          <div className="flex h-full">
            <span className="block h-full bg-sage transition-[width] duration-700 rounded-l-full" style={{ width: `${Math.min(100, (paidAmt / (state.budgetTotal || 1)) * 100)}%` }} />
            <span className="block h-full bg-gold transition-[width] duration-700" style={{ width: `${Math.min(100, ((spent - paidAmt) / (state.budgetTotal || 1)) * 100)}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-row sm:gap-8">
          {([["Payé", fmt.eur(paidAmt), "var(--sage)", "text-sage"], ["Engagé", fmt.eur(spent - paidAmt), "var(--gold)", ""], ["Restant", fmt.eur(remaining), "var(--line-strong)", ""]] as [string, string, string, string][]).map(([l, v, c, cl]) => (
            <div key={l}>
              <div className="flex items-center gap-1.5 text-[12px] text-text-2 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: c }} />{l}
              </div>
              <div className={`font-mono text-[20px] font-semibold tracking-[-.01em] ${cl}`}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ---- Modules — stagger entrance ---- */}
      <div className="flex items-center justify-between mb-3">
        <div className="sec-title"><Icon name="grid" size={17} className="text-text-3" />Modules</div>
      </div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {modules.map((m) => (
          <motion.div key={m.id} variants={fadeUp}>
            <Link href={`/${m.id}`}>
              <motion.div
                className={`card p-4 flex flex-col gap-3 relative h-full group ${m.empty ? "border-dashed" : ""}`}
                whileHover={{ y: -4, boxShadow: "0 8px 24px -8px rgba(0,0,0,.14)" }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
              >
                <Icon name="chevronR" size={15} className="absolute top-4 right-3.5 text-text-3 opacity-0 group-hover:opacity-100 transition" />
                <div className={`w-10 h-10 rounded-[11px] flex items-center justify-center ${TILE_TONE[m.tone]}`}>
                  <Icon name={m.icon} size={20} />
                </div>
                <div>
                  <div className="text-[12.5px] font-semibold text-text-2 mb-0.5">{m.title}</div>
                  {m.empty ? (
                    <>
                      <div className="text-[11px] text-text-3 italic leading-snug">{m.val}</div>
                      <div className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium text-text-3 border border-dashed border-line px-2 py-0.5 rounded-full">À compléter</div>
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
                  <Link key={s.id} href={s.href} className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-dashed border-line hover:bg-hover hover:border-line-strong transition">
                    <span className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 bg-primary-soft text-primary-700"><Icon name={s.icon} size={16} /></span>
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
                <div className="w-9 h-9 rounded-[10px] bg-sage-soft flex items-center justify-center shrink-0"><Icon name="check-circle" size={18} className="text-sage" /></div>
                Aucune alerte. Tout est sous contrôle.
              </div>
            )
          ) : (
            <div>{alerts.map((a, i) => <AlertItem key={i} alert={a} isLast={i === alerts.length - 1} />)}</div>
          )}
        </Card>

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
                {state.payments.length === 0 && state.tasks.length === 0 ? "Les paiements et tâches à venir apparaîtront ici une fois ajoutés." : "Aucune échéance à venir. Bien joué !"}
              </div>
              {state.tasks.length === 0 && <Link href="/checklist"><Button variant="secondary" size="sm" icon="check-circle">Voir la checklist</Button></Link>}
            </div>
          ) : (
            <div>{upcoming.map((u, i) => <DeadlineItem key={i} item={u} isLast={i === upcoming.length - 1} />)}</div>
          )}
        </Card>
      </div>
    </div>
  );
}

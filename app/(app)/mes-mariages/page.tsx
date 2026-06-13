"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useStore } from "@/components/providers";
import { Card, Badge, Button } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { Icon } from "@/components/icon";
import type { WeddingRole, WeddingSummary } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roleLabel(role: WeddingRole) {
  switch (role) {
    case "owner":  return "Propriétaire";
    case "admin":  return "Admin";
    case "editor": return "Éditeur";
    case "viewer": return "Lecteur";
  }
}

function roleTone(role: WeddingRole): "primary" | "sage" | "amber" | "neutral" {
  switch (role) {
    case "owner":  return "primary";
    case "admin":  return "sage";
    case "editor": return "amber";
    case "viewer": return "neutral";
  }
}

function fmtDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDayOfWeek(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { weekday: "long" });
}

/** Returns number of days until wedding. Positive = future, 0 = today, negative = past. */
function daysUntil(dateStr: string): number {
  if (!dateStr) return -1;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

/** Darken a hex color by `amount` (0–1). */
function darkenHex(hex: string, amount = 0.18): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(clean.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(clean.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(clean.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ─── Animation variants ───────────────────────────────────────────────────────

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: "spring" as const, stiffness: 420, damping: 28 },
  },
};

// ─── Countdown badge ──────────────────────────────────────────────────────────

function CountdownBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);

  if (days > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-primary-soft text-primary-700 border border-primary/20">
        <Icon name="clock" size={11} />
        J&minus;{days}
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-sage-soft text-sage border border-sage/20">
        C&apos;est aujourd&apos;hui ! 🎉
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-surface-3 text-text-3 border border-line">
      Terminé
    </span>
  );
}

// ─── Wedding Card ─────────────────────────────────────────────────────────────

function WeddingCard({
  wedding,
  isActive,
  onOpen,
}: {
  wedding: WeddingSummary;
  isActive: boolean;
  onOpen: () => void;
}) {
  const color = wedding.coverColor || "#C96E2C";
  const colorDark = darkenHex(color);

  // Initials for the gradient banner
  const initA = (wedding.partnerA || "A").charAt(0).toUpperCase();
  const initB = (wedding.partnerB || "B").charAt(0).toUpperCase();

  return (
    <motion.div variants={fadeUp}>
      <div
        className={`card overflow-hidden flex flex-col transition-shadow
          ${isActive ? "ring-2 ring-primary border-primary" : "hover:shadow-md hover:border-line-strong"}`}
        style={{ padding: 0 }}
      >
        {/* Gradient banner */}
        <div
          className="h-16 w-full shrink-0 flex items-center justify-center gap-3 relative"
          style={{ background: `linear-gradient(135deg, ${color} 0%, ${colorDark} 100%)` }}
        >
          <span className="text-white/90 font-semibold text-lg tracking-wide drop-shadow-sm select-none">
            {initA} &amp; {initB}
          </span>
          {isActive && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/80 shadow" title="Mariage actif" />
          )}
        </div>

        <div className="flex flex-col gap-3 p-5 flex-1">
          {/* Partner names + badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold leading-tight truncate">
                {wedding.partnerA} &amp; {wedding.partnerB}
              </h3>
              {wedding.name && (
                <p className="text-[11px] text-text-3 truncate mt-0.5 italic">{wedding.name}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              {isActive && <Badge tone="primary" dot>Actif</Badge>}
              <Badge tone={roleTone(wedding.role)}>{roleLabel(wedding.role)}</Badge>
            </div>
          </div>

          {/* City */}
          {wedding.city && (
            <div className="flex items-center gap-1.5 text-[12.5px] text-text-2">
              <Icon name="pin" size={13} className="text-text-3 shrink-0" />
              <span className="truncate">{wedding.city}</span>
            </div>
          )}

          {/* Date row */}
          <div className="flex items-center gap-2 text-[12.5px] text-text-2">
            <Icon name="calendar" size={13} className="text-text-3 shrink-0" />
            <span className="capitalize">{fmtDayOfWeek(wedding.date)}</span>
            <span className="text-text-3">·</span>
            <span>{fmtDate(wedding.date)}</span>
          </div>

          {/* Countdown */}
          <div>
            <CountdownBadge dateStr={wedding.date} />
          </div>

          {/* Action */}
          <div className="mt-auto pt-1">
            <Button
              variant={isActive ? "primary" : "secondary"}
              size="sm"
              icon={isActive ? "check-circle" : "chevronR"}
              onClick={onOpen}
              className="w-full"
            >
              {isActive ? "Mariage actif" : "Ouvrir"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Create-new card ──────────────────────────────────────────────────────────

function NewWeddingCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.div variants={fadeUp}>
      <button
        onClick={onClick}
        className="w-full h-full min-h-[220px] rounded-card border-2 border-dashed border-line-strong
          flex flex-col items-center justify-center gap-3 p-6 text-center
          hover:border-primary hover:bg-primary-softer transition-colors group"
      >
        <span className="w-12 h-12 rounded-full bg-surface-3 group-hover:bg-primary-soft flex items-center justify-center transition-colors">
          <Icon name="plus" size={24} className="text-text-3 group-hover:text-primary transition-colors" />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-text-2 group-hover:text-text transition-colors">
            Nouveau mariage
          </p>
          <p className="text-[12px] text-text-3 mt-0.5">Créer ou rejoindre</p>
        </div>
      </button>
    </motion.div>
  );
}

// ─── Stats summary bar ────────────────────────────────────────────────────────

function StatsSummaryBar({ weddings }: { weddings: WeddingSummary[] }) {
  const owned   = weddings.filter((w) => w.role === "owner").length;
  const shared  = weddings.filter((w) => w.role !== "owner").length;
  const total   = weddings.length;

  return (
    <p className="text-text-2 text-sm mb-6">
      {total} mariage{total > 1 ? "s" : ""}
      {owned > 0 && (
        <>
          {" · "}
          <span className="text-primary-700">{owned} propriétaire{owned > 1 ? "s" : ""}</span>
        </>
      )}
      {shared > 0 && (
        <>
          {" · "}
          {shared} partagé{shared > 1 ? "s" : ""}
        </>
      )}
    </p>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="flex flex-col items-center justify-center gap-6 py-24 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center">
        <Icon name="rings" size={36} className="text-primary" />
      </div>
      <div>
        <h2 className="text-[20px] font-semibold mb-2">Aucun mariage</h2>
        <p className="text-text-2 text-sm max-w-[320px] mx-auto">
          Vous n'avez pas encore de mariage. Créez-en un pour commencer à planifier votre grand jour.
        </p>
      </div>
      <Button
        variant="primary"
        icon="plus"
        onClick={() => router.push("/onboarding?new=1")}
      >
        Créer un mariage
      </Button>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MesMariagesPage() {
  const { state, switchWedding } = useStore();
  const router = useRouter();

  const handleOpen = async (wedding: WeddingSummary) => {
    if (wedding.id !== state.activeWeddingId) {
      await switchWedding(wedding.id);
    }
    router.push("/dashboard");
  };

  const showNewCard = state.myWeddings.length > 0 && state.myWeddings.length < 5;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <PageHead
        title="Mes mariages"
        sub={
          state.myWeddings.length > 0
            ? `${state.myWeddings.length} mariage${state.myWeddings.length > 1 ? "s" : ""} accessible${state.myWeddings.length > 1 ? "s" : ""}`
            : undefined
        }
        actions={
          <Button
            variant="primary"
            icon="plus"
            onClick={() => router.push("/onboarding?new=1")}
          >
            Créer un mariage
          </Button>
        }
      />

      {state.myWeddings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <StatsSummaryBar weddings={state.myWeddings} />

          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {state.myWeddings.map((w) => (
              <WeddingCard
                key={w.id}
                wedding={w}
                isActive={w.id === state.activeWeddingId}
                onOpen={() => handleOpen(w)}
              />
            ))}
            {showNewCard && (
              <NewWeddingCard onClick={() => router.push("/onboarding?new=1")} />
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}

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

  return (
    <motion.div variants={fadeUp}>
      <div
        className={`card overflow-hidden flex flex-col transition-shadow
          ${isActive ? "ring-2 ring-primary border-primary" : "hover:shadow-md hover:border-line-strong"}`}
        style={{ padding: 0 }}
      >
        {/* Color band */}
        <div className="h-2 w-full shrink-0" style={{ background: color }} />

        <div className="flex flex-col gap-4 p-5 flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className="w-5 h-5 rounded-sm shrink-0 border border-black/10 mt-0.5"
                style={{ background: color }}
              />
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold leading-tight truncate">
                  {wedding.partnerA} &amp; {wedding.partnerB}
                </h3>
                {wedding.city && (
                  <p className="text-[12px] text-text-3 truncate mt-0.5">{wedding.city}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isActive && (
                <Badge tone="primary" dot>Actif</Badge>
              )}
              <Badge tone={roleTone(wedding.role)}>{roleLabel(wedding.role)}</Badge>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-[12.5px] text-text-2">
            <Icon name="calendar" size={14} className="text-text-3 shrink-0" />
            <span>{fmtDate(wedding.date)}</span>
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
        </motion.div>
      )}
    </div>
  );
}

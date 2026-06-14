"use client";

// light theme: background "#f6f8fa", cards "#ffffff", borders "#e5e7eb"
// text "#111827", secondary "#6b7280", accent orange "#C96E2C"

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";
import { useAdminTheme } from "@/app/admin/admin-theme-context";

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const STAGES = [
  { id: "prospect",    label: "Prospect",       color: "#6b7280", icon: "users"        },
  { id: "trial",       label: "Essai",           color: "#2563eb", icon: "play"         },
  { id: "qualified",   label: "Qualifié",        color: "#d97706", icon: "check-circle" },
  { id: "offer_sent",  label: "Offre envoyée",   color: "#ea580c", icon: "mail"         },
  { id: "negotiation", label: "Négociation",     color: "#7c3aed", icon: "refresh"      },
  { id: "won",         label: "Client actif",    color: "#16a34a", icon: "sparkle"      },
  { id: "churned",     label: "Churné",          color: "#dc2626", icon: "alert"        },
  { id: "lost",        label: "Perdu",           color: "#c4c8d0", icon: "x"            },
] as const;

type StageId = typeof STAGES[number]["id"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  account_type: string;
  is_subscribed: boolean;
  plan: string | null;
  trial_ends_at: string | null;
  pipeline_stage: string | null;
  created_at: string;
  company: string | null;
}

type AccountTypeFilter = "all" | "couple" | "planner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName].filter(Boolean) as string[];
  return parts.map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase() || "?";
}

function getAvatarColor(accountType: string): string {
  if (accountType === "couple") return "#2563eb";
  if (accountType === "planner") return "#16a34a";
  if (accountType === "super_admin") return "#ea580c";
  return "#9ca3af";
}

function getTrialBadge(profile: PipelineProfile): { label: string; color: string; bg: string } | null {
  if (!profile.trial_ends_at) return null;
  const daysLeft = Math.ceil(
    (new Date(profile.trial_ends_at).getTime() - Date.now()) / 86_400_000
  );
  if (daysLeft > 0) {
    return { label: `Essai J-${daysLeft}`, color: "#2563eb", bg: "#eff6ff" };
  }
  return { label: "Expiré", color: "#dc2626", bg: "#fee2e2" };
}

function getEffectiveStage(profile: PipelineProfile): StageId {
  const stage = profile.pipeline_stage ?? "prospect";
  return STAGES.some((s) => s.id === stage) ? (stage as StageId) : "prospect";
}

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  couple: "Couple",
  planner: "Planner",
  super_admin: "Super Admin",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-3 border space-y-2 animate-pulse"
      style={{ background: "#ffffff", borderColor: "#e5e7eb" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: "#e5e7eb" }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 rounded" style={{ background: "#e5e7eb", width: "70%" }} />
          <div className="h-2.5 rounded" style={{ background: "#f3f4f6", width: "90%" }} />
        </div>
      </div>
      <div className="h-2.5 rounded" style={{ background: "#f3f4f6", width: "50%" }} />
      <div className="flex gap-1.5">
        <div className="h-5 w-14 rounded-full" style={{ background: "#e5e7eb" }} />
        <div className="h-5 w-16 rounded-full" style={{ background: "#e5e7eb" }} />
      </div>
    </div>
  );
}

function SkeletonColumn({ stageId, label, color }: { stageId: string; label: string; color: string }) {
  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        minWidth: 260,
        maxWidth: 300,
        background: "#f9fafb",
        borderColor: "#e5e7eb",
        flexShrink: 0,
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b"
        style={{ borderColor: "#e5e7eb" }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span className="text-[12.5px] font-semibold flex-1" style={{ color: "#6b7280" }}>
          {label}
        </span>
        <span
          className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "#e5e7eb", color: "#c4c8d0" }}
        >
          —
        </span>
      </div>
      {/* Cards */}
      <div className="p-2 space-y-2 flex-1">
        {Array.from({ length: stageId === "prospect" ? 3 : stageId === "trial" ? 2 : 1 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Client Card ──────────────────────────────────────────────────────────────

interface ClientCardProps {
  profile: PipelineProfile;
  isDragging: boolean;
  isMoving: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  accentHue: string;
  accent: string;
  accentBorder: string;
  accentSoft: string;
}

function ClientCard({ profile, isDragging, isMoving, onDragStart, onDragEnd, accentHue, accent, accentBorder, accentSoft }: ClientCardProps) {
  const initials    = getInitials(profile.first_name, profile.last_name);
  const fullName    = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—";
  const avatarColor = getAvatarColor(profile.account_type);
  const trialBadge  = getTrialBadge(profile);
  const typeLabel   = ACCOUNT_TYPE_LABEL[profile.account_type] ?? profile.account_type;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, profile.id)}
      onDragEnd={onDragEnd}
      className="rounded-xl border p-3 space-y-2.5 transition-all hover:border-[#C96E2C55] select-none"
      style={{
        background: "#ffffff",
        borderColor: isDragging ? accent : "#e5e7eb",
        opacity: isDragging || isMoving ? 0.45 : 1,
        boxShadow: isDragging ? `0 8px 24px ${accentBorder}` : "0 1px 3px rgba(0,0,0,0.06)",
        cursor: isDragging ? "grabbing" : "grab",
        transform: isDragging ? "scale(0.97)" : undefined,
      }}
    >
      {/* Avatar + name */}
      <div className="flex items-start gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ background: `${avatarColor}20`, color: avatarColor }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[12.5px] leading-tight truncate" style={{ color: "#111827" }}>
            {fullName}
          </div>
          {profile.email && (
            <div className="text-[11px] truncate mt-0.5" style={{ color: "#c4c8d0" }}>
              {profile.email}
            </div>
          )}
        </div>
      </div>

      {/* Company */}
      {profile.company && (
        <div className="text-[11px] flex items-center gap-1" style={{ color: "#9ca3af" }}>
          <Icon name="home" size={10} />
          <span className="truncate">{profile.company}</span>
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: profile.account_type === "planner" ? "#dcfce7" :
                        profile.account_type === "couple"  ? "#dbeafe" : accentSoft,
            color:      profile.account_type === "planner" ? "#15803d" :
                        profile.account_type === "couple"  ? "#1d4ed8" : accentHue,
          }}
        >
          {typeLabel}
        </span>
        {profile.is_subscribed && (
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>
            Abonné{profile.plan ? ` · ${profile.plan}` : ""}
          </span>
        )}
        {!profile.is_subscribed && trialBadge && (
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: trialBadge.bg, color: trialBadge.color }}>
            {trialBadge.label}
          </span>
        )}
      </div>

      {/* Fiche link */}
      <div className="flex items-center pt-0.5">
        <Link
          href={`/admin/crm/${profile.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] font-medium transition-colors hover:opacity-80"
          style={{ color: accentHue }}
        >
          Voir fiche →
        </Link>
        <div className="flex-1" />
        <span className="text-[10px]" style={{ color: "#d1d5db" }}>⠿⠿</span>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

interface ColumnProps {
  stage: typeof STAGES[number];
  profiles: PipelineProfile[];
  isDragOver: boolean;
  draggingId: string | null;
  movingId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, stageId: StageId) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, stageId: StageId) => void;
  accentHue: string;
  accent: string;
  accentBorder: string;
  accentSoft: string;
}

function KanbanColumn({
  stage, profiles, isDragOver, draggingId, movingId,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  accentHue, accent, accentBorder, accentSoft,
}: ColumnProps) {
  const count   = profiles.length;
  const isEmpty = count === 0;

  return (
    <div
      onDragOver={(e) => onDragOver(e, stage.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, stage.id)}
      className="rounded-xl border flex flex-col transition-all"
      style={{
        minWidth: 260,
        maxWidth: 300,
        width: 280,
        background: isDragOver ? `${stage.color}08` : "#ffffff",
        borderColor: isDragOver ? stage.color : "#e5e7eb",
        borderWidth: isDragOver ? 2 : 1,
        flexShrink: 0,
        maxHeight: "calc(100vh - 320px)",
        minHeight: 200,
        boxShadow: isDragOver
          ? `0 0 0 3px ${stage.color}30`
          : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b sticky top-0 rounded-t-xl"
        style={{ borderColor: isDragOver ? `${stage.color}30` : "#e5e7eb", background: isDragOver ? `${stage.color}0a` : "#ffffff", zIndex: 1 }}
      >
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stage.color }} />
        <Icon name={stage.icon} size={13} style={{ color: stage.color }} />
        <span className="text-[12.5px] font-semibold flex-1" style={{ color: "#374151" }}>
          {stage.label}
        </span>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: isEmpty ? "#f3f4f6" : `${stage.color}20`, color: isEmpty ? "#d1d5db" : stage.color }}
        >
          {count}
        </span>
      </div>

      {/* Cards area */}
      <div className="p-2 space-y-2 overflow-y-auto flex-1">
        {isEmpty && !isDragOver ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-dashed border"
            style={{ borderColor: "#e5e7eb", color: "#d1d5db" }}
          >
            <Icon name={stage.icon} size={20} style={{ color: "#d1d5db" }} />
            <span className="text-[11px]">Aucun client</span>
          </div>
        ) : isEmpty && isDragOver ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-dashed border-2"
            style={{ borderColor: stage.color, color: stage.color }}
          >
            <Icon name={stage.icon} size={20} style={{ color: stage.color }} />
            <span className="text-[11px] font-semibold">Déposer ici</span>
          </div>
        ) : (
          <>
            {profiles.map((profile) => (
              <ClientCard
                key={profile.id}
                profile={profile}
                isDragging={draggingId === profile.id}
                isMoving={movingId === profile.id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                accentHue={accentHue}
                accent={accent}
                accentBorder={accentBorder}
                accentSoft={accentSoft}
              />
            ))}
            {isDragOver && (
              <div
                className="rounded-xl border-2 border-dashed py-4 flex items-center justify-center text-[11px] font-semibold"
                style={{ borderColor: stage.color, color: stage.color, background: `${stage.color}08` }}
              >
                Déposer ici
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const { tc } = useAdminTheme();
  const [profiles, setProfiles] = useState<PipelineProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<AccountTypeFilter>("all");
  const [movingId, setMovingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageId | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const sb = createClient();
      const { data } = await sb
        .from("profiles")
        .select(
          "id, first_name, last_name, email, account_type, is_subscribed, plan, trial_ends_at, pipeline_stage, created_at, company"
        )
        .order("created_at", { ascending: false });

      setProfiles((data as PipelineProfile[] | null) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // ── Move card ─────────────────────────────────────────────────────────────

  async function moveToStage(profileId: string, newStage: StageId) {
    setMovingId(profileId);
    // Optimistic update
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId ? { ...p, pipeline_stage: newStage } : p
      )
    );
    try {
      const sb = createClient();
      await sb
        .from("profiles")
        .update({ pipeline_stage: newStage })
        .eq("id", profileId);
    } catch {
      // On error, reload to reconcile
      const sb = createClient();
      const { data } = await sb
        .from("profiles")
        .select(
          "id, first_name, last_name, email, account_type, is_subscribed, plan, trial_ends_at, pipeline_stage, created_at, company"
        )
        .order("created_at", { ascending: false });
      setProfiles((data as PipelineProfile[] | null) ?? []);
    } finally {
      setMovingId(null);
    }
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("profileId", id);
    setDraggingId(id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStage(null);
  }

  function handleDragOver(e: React.DragEvent, stageId: StageId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  async function handleDrop(e: React.DragEvent, stageId: StageId) {
    e.preventDefault();
    const profileId = e.dataTransfer.getData("profileId");
    setDraggingId(null);
    setDragOverStage(null);
    if (profileId && profileId !== "") {
      const currentStage = getEffectiveStage(profiles.find((p) => p.id === profileId)!);
      if (currentStage !== stageId) {
        await moveToStage(profileId, stageId);
      }
    }
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...profiles];
    if (accountFilter === "couple") {
      list = list.filter((p) => p.account_type === "couple");
    } else if (accountFilter === "planner") {
      list = list.filter((p) => p.account_type === "planner");
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
        return name.includes(q) || (p.email ?? "").toLowerCase().includes(q);
      });
    }
    return list;
  }, [profiles, accountFilter, search]);

  // ── Cards grouped by stage ────────────────────────────────────────────────

  const byStage = useMemo(() => {
    const map: Record<StageId, PipelineProfile[]> = {} as Record<StageId, PipelineProfile[]>;
    for (const s of STAGES) map[s.id] = [];
    for (const p of filtered) {
      const stage = getEffectiveStage(p);
      map[stage].push(p);
    }
    return map;
  }, [filtered]);

  // ── Summary metrics ──────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const all = profiles;
    const prospectCount  = all.filter((p) => getEffectiveStage(p) === "prospect").length;
    const trialCount     = all.filter((p) => getEffectiveStage(p) === "trial").length;
    const qualifiedCount = all.filter((p) => {
      const s = getEffectiveStage(p);
      return s === "qualified" || s === "offer_sent" || s === "negotiation";
    }).length;
    const wonCount     = all.filter((p) => getEffectiveStage(p) === "won").length;
    const lostCount    = all.filter((p) => getEffectiveStage(p) === "churned" || getEffectiveStage(p) === "lost").length;
    return { prospectCount, trialCount, qualifiedCount, wonCount, lostCount };
  }, [profiles]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#f6f8fa", color: "#111827" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between gap-4 px-6 pt-6 pb-4 border-b flex-shrink-0"
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/admin/crm"
            className="flex items-center gap-1.5 text-[12px] transition-colors hover:opacity-70"
            style={{ color: "#6b7280" }}
          >
            <Icon name="chevronL" size={14} />
            CRM
          </Link>
          <span style={{ color: "#e5e7eb" }}>/</span>
          <div>
            <h1
              className="text-[20px] font-bold flex items-center gap-2"
              style={{ color: "#111827" }}
            >
              <Icon name="grid" size={18} />
              Pipeline CRM
            </h1>
          </div>
        </div>
        <div
          className="text-[12px] px-3 py-1.5 rounded-lg border"
          style={{ background: "#ffffff", borderColor: "#e5e7eb", color: "#9ca3af" }}
        >
          {loading ? "…" : profiles.length} client{profiles.length !== 1 ? "s" : ""} au total
        </div>
      </div>

      {/* ── Summary metrics bar ── */}
      <div
        className="flex items-center gap-4 px-6 py-3 border-b flex-shrink-0 overflow-x-auto"
        style={{ borderColor: tc.lineSoft, background: "#fafafa" }}
      >
        {[
          { label: "Prospects",    value: metrics.prospectCount,  color: "#9ca3af", icon: "users"        },
          { label: "En essai",     value: metrics.trialCount,     color: "#2563eb", icon: "play"         },
          { label: "Qualifiés+",   value: metrics.qualifiedCount, color: "#d97706", icon: "check-circle" },
          { label: "Actifs",       value: metrics.wonCount,       color: "#16a34a", icon: "sparkle"      },
          { label: "Perdus/Churné",value: metrics.lostCount,      color: "#dc2626", icon: "alert"        },
        ].map((m, i) => (
          <div
            key={m.label}
            className="flex items-center gap-2 flex-shrink-0"
            style={
              i < 4
                ? { paddingRight: "1rem", borderRight: `1px solid ${tc.lineSoft}` }
                : undefined
            }
          >
            <Icon name={m.icon} size={13} style={{ color: m.color }} />
            <span className="text-[13px] font-bold" style={{ color: m.color }}>
              {loading ? "—" : m.value}
            </span>
            <span className="text-[11px]" style={{ color: "#c4c8d0" }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: tc.lineSoft }}
      >
        {/* Account type pills */}
        <div className="flex items-center gap-2">
          {(["all", "couple", "planner"] as AccountTypeFilter[]).map((key) => {
            const labels: Record<AccountTypeFilter, string> = {
              all: "Tous",
              couple: "Couple",
              planner: "Planner",
            };
            const active = accountFilter === key;
            return (
              <button
                key={key}
                onClick={() => setAccountFilter(key)}
                className="px-3 py-1 rounded-full text-[12px] font-medium transition-all"
                style={{
                  background: active ? tc.accentSoft : "#ffffff",
                  color: active ? tc.accentHue : "#9ca3af",
                  border: active ? `1px solid ${tc.accentBorder}` : `1px solid ${tc.line}`,
                }}
              >
                {labels[key]}
              </button>
            );
          })}
        </div>

        <div className="w-px h-5" style={{ background: "#e5e7eb" }} />

        {/* Search */}
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#c4c8d0" }}
          >
            <Icon name="search" size={13} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom ou email…"
            className="pl-8 pr-8 py-1.5 rounded-lg text-[12px] border outline-none transition-colors"
            style={{
              background: "#ffffff",
              borderColor: "#d1d5db",
              color: "#374151",
              width: 200,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
              style={{ color: "#c4c8d0" }}
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        {(search || accountFilter !== "all") && (
          <span className="text-[11px] px-2 py-1 rounded-lg" style={{ background: "#ffffff", color: "#9ca3af", border: "1px solid #e5e7eb" }}>
            {filtered.length} affiché{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Kanban board ── */}
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden"
        style={{ minHeight: 0 }}
      >
        <div
          className="flex gap-3 p-4 h-full"
          style={{ width: "max-content", minHeight: "100%" }}
        >
          {loading ? (
            STAGES.map((stage) => (
              <SkeletonColumn
                key={stage.id}
                stageId={stage.id}
                label={stage.label}
                color={stage.color}
              />
            ))
          ) : (
            STAGES.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                profiles={byStage[stage.id]}
                isDragOver={dragOverStage === stage.id}
                draggingId={draggingId}
                movingId={movingId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                accentHue={tc.accentHue}
                accent={tc.accent}
                accentBorder={tc.accentBorder}
                accentSoft={tc.accentSoft}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

// dark theme: background "#0d0d1a", cards "#1a1a2e", borders "#2a2a3e"
// text "#f0ead8", secondary "#9ca3af", accent orange "#C96E2C"

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const STAGES = [
  { id: "prospect",    label: "Prospect",       color: "#6b7280", icon: "users"        },
  { id: "trial",       label: "Essai",           color: "#60a5fa", icon: "play"         },
  { id: "qualified",   label: "Qualifié",        color: "#fbbf24", icon: "check-circle" },
  { id: "offer_sent",  label: "Offre envoyée",   color: "#f97316", icon: "mail"         },
  { id: "negotiation", label: "Négociation",     color: "#a78bfa", icon: "refresh"      },
  { id: "won",         label: "Client actif",    color: "#4ade80", icon: "sparkle"      },
  { id: "churned",     label: "Churné",          color: "#ef4444", icon: "alert"        },
  { id: "lost",        label: "Perdu",           color: "#4b5563", icon: "x"            },
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
  if (accountType === "couple") return "#60a5fa";
  if (accountType === "planner") return "#4ade80";
  if (accountType === "super_admin") return "#f97316";
  return "#9ca3af";
}

function getTrialBadge(profile: PipelineProfile): { label: string; color: string; bg: string } | null {
  if (!profile.trial_ends_at) return null;
  const daysLeft = Math.ceil(
    (new Date(profile.trial_ends_at).getTime() - Date.now()) / 86_400_000
  );
  if (daysLeft > 0) {
    return { label: `Essai J-${daysLeft}`, color: "#60a5fa", bg: "#60a5fa18" };
  }
  return { label: "Expiré", color: "#ef4444", bg: "#ef444418" };
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
      style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: "#2a2a3e" }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 rounded" style={{ background: "#2a2a3e", width: "70%" }} />
          <div className="h-2.5 rounded" style={{ background: "#232336", width: "90%" }} />
        </div>
      </div>
      <div className="h-2.5 rounded" style={{ background: "#232336", width: "50%" }} />
      <div className="flex gap-1.5">
        <div className="h-5 w-14 rounded-full" style={{ background: "#2a2a3e" }} />
        <div className="h-5 w-16 rounded-full" style={{ background: "#2a2a3e" }} />
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
        background: "#111120",
        borderColor: "#2a2a3e",
        flexShrink: 0,
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b"
        style={{ borderColor: "#2a2a3e" }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span className="text-[12.5px] font-semibold flex-1" style={{ color: "#9ca3af" }}>
          {label}
        </span>
        <span
          className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "#2a2a3e", color: "#4b5563" }}
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
  currentStage: StageId;
  onMove: (profileId: string, newStage: StageId) => void;
  moving: boolean;
}

function ClientCard({ profile, currentStage, onMove, moving }: ClientCardProps) {
  const initials   = getInitials(profile.first_name, profile.last_name);
  const fullName   = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—";
  const avatarColor = getAvatarColor(profile.account_type);
  const trialBadge  = getTrialBadge(profile);
  const typeLabel   = ACCOUNT_TYPE_LABEL[profile.account_type] ?? profile.account_type;

  return (
    <div
      className="rounded-xl border p-3 space-y-2.5 transition-all hover:border-[#3a3a50]"
      style={{
        background: "#1a1a2e",
        borderColor: "#2a2a3e",
        opacity: moving ? 0.6 : 1,
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
          <div
            className="font-semibold text-[12.5px] leading-tight truncate"
            style={{ color: "#f0ead8" }}
          >
            {fullName}
          </div>
          {profile.email && (
            <div
              className="text-[11px] truncate mt-0.5"
              style={{ color: "#4b5563" }}
            >
              {profile.email}
            </div>
          )}
        </div>
      </div>

      {/* Company */}
      {profile.company && (
        <div className="text-[11px] flex items-center gap-1" style={{ color: "#6b7280" }}>
          <Icon name="home" size={10} />
          <span className="truncate">{profile.company}</span>
        </div>
      )}

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        {/* Account type */}
        <span
          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: profile.account_type === "planner" ? "#4ade8018" :
                        profile.account_type === "couple"  ? "#60a5fa18" : "#f9731618",
            color:      profile.account_type === "planner" ? "#4ade80" :
                        profile.account_type === "couple"  ? "#60a5fa" : "#f97316",
          }}
        >
          {typeLabel}
        </span>

        {/* Subscribed */}
        {profile.is_subscribed && (
          <span
            className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "#4ade8018", color: "#4ade80" }}
          >
            Abonné{profile.plan ? ` · ${profile.plan}` : ""}
          </span>
        )}

        {/* Trial / Expired */}
        {!profile.is_subscribed && trialBadge && (
          <span
            className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: trialBadge.bg, color: trialBadge.color }}
          >
            {trialBadge.label}
          </span>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 pt-0.5">
        <Link
          href={`/admin/crm/${profile.id}`}
          className="text-[11px] font-medium transition-colors hover:opacity-80"
          style={{ color: "#C96E2C" }}
        >
          Voir fiche →
        </Link>

        <div className="flex-1" />

        {/* Move dropdown */}
        <select
          disabled={moving}
          onChange={(e) => {
            if (e.target.value) onMove(profile.id, e.target.value as StageId);
            e.target.value = "";
          }}
          defaultValue=""
          className="text-[10.5px] rounded-lg px-2 py-1 border outline-none cursor-pointer transition-colors hover:border-[#C96E2C55] disabled:opacity-40"
          style={{
            background: "#0d0d1a",
            borderColor: "#2a2a3e",
            color: "#9ca3af",
            maxWidth: 110,
          }}
          title="Déplacer vers..."
        >
          <option value="" disabled>Déplacer →</option>
          {STAGES.filter((s) => s.id !== currentStage).map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

interface ColumnProps {
  stage: typeof STAGES[number];
  profiles: PipelineProfile[];
  onMove: (profileId: string, newStage: StageId) => void;
  movingId: string | null;
}

function KanbanColumn({ stage, profiles, onMove, movingId }: ColumnProps) {
  const count = profiles.length;
  const isEmpty = count === 0;

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        minWidth: 260,
        maxWidth: 300,
        width: 280,
        background: "#0e0e1c",
        borderColor: "#2a2a3e",
        flexShrink: 0,
        maxHeight: "calc(100vh - 320px)",
        minHeight: 200,
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b sticky top-0 rounded-t-xl"
        style={{ borderColor: "#2a2a3e", background: "#0e0e1c", zIndex: 1 }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: stage.color }}
        />
        <Icon name={stage.icon} size={13} style={{ color: stage.color }} />
        <span className="text-[12.5px] font-semibold flex-1" style={{ color: "#d1cec8" }}>
          {stage.label}
        </span>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: isEmpty ? "#1a1a2e" : `${stage.color}20`,
            color: isEmpty ? "#3a3a50" : stage.color,
          }}
        >
          {count}
        </span>
      </div>

      {/* Cards area */}
      <div className="p-2 space-y-2 overflow-y-auto flex-1">
        {isEmpty ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-dashed border"
            style={{ borderColor: "#2a2a3e", color: "#2a2a3e" }}
          >
            <Icon name={stage.icon} size={20} style={{ color: "#2a2a3e" }} />
            <span className="text-[11px]">Aucun client</span>
          </div>
        ) : (
          profiles.map((profile) => (
            <ClientCard
              key={profile.id}
              profile={profile}
              currentStage={stage.id}
              onMove={onMove}
              moving={movingId === profile.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [profiles, setProfiles] = useState<PipelineProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<AccountTypeFilter>("all");
  const [movingId, setMovingId] = useState<string | null>(null);

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
      style={{ background: "#0d0d1a", color: "#f0ead8" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between gap-4 px-6 pt-6 pb-4 border-b flex-shrink-0"
        style={{ borderColor: "#2a2a3e" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/admin/crm"
            className="flex items-center gap-1.5 text-[12px] transition-colors hover:opacity-70"
            style={{ color: "#9ca3af" }}
          >
            <Icon name="chevronL" size={14} />
            CRM
          </Link>
          <span style={{ color: "#2a2a3e" }}>/</span>
          <div>
            <h1
              className="text-[20px] font-bold flex items-center gap-2"
              style={{ color: "#f0ead8" }}
            >
              <Icon name="grid" size={18} />
              Pipeline CRM
            </h1>
          </div>
        </div>
        <div
          className="text-[12px] px-3 py-1.5 rounded-lg border"
          style={{ background: "#1a1a2e", borderColor: "#2a2a3e", color: "#6b7280" }}
        >
          {loading ? "…" : profiles.length} client{profiles.length !== 1 ? "s" : ""} au total
        </div>
      </div>

      {/* ── Summary metrics bar ── */}
      <div
        className="flex items-center gap-4 px-6 py-3 border-b flex-shrink-0 overflow-x-auto"
        style={{ borderColor: "#1e1e30", background: "#0a0a16" }}
      >
        {[
          { label: "Prospects",    value: metrics.prospectCount,  color: "#6b7280", icon: "users"        },
          { label: "En essai",     value: metrics.trialCount,     color: "#60a5fa", icon: "play"         },
          { label: "Qualifiés+",   value: metrics.qualifiedCount, color: "#fbbf24", icon: "check-circle" },
          { label: "Actifs",       value: metrics.wonCount,       color: "#4ade80", icon: "sparkle"      },
          { label: "Perdus/Churné",value: metrics.lostCount,      color: "#ef4444", icon: "alert"        },
        ].map((m, i) => (
          <div
            key={m.label}
            className="flex items-center gap-2 flex-shrink-0"
            style={
              i < 4
                ? { paddingRight: "1rem", borderRight: "1px solid #1e1e30" }
                : undefined
            }
          >
            <Icon name={m.icon} size={13} style={{ color: m.color }} />
            <span className="text-[13px] font-bold" style={{ color: m.color }}>
              {loading ? "—" : m.value}
            </span>
            <span className="text-[11px]" style={{ color: "#4b5563" }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: "#1e1e30" }}
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
                  background: active ? "#C96E2C22" : "#1a1a2e",
                  color: active ? "#e2945a" : "#6b7280",
                  border: active ? "1px solid #C96E2C55" : "1px solid #2a2a3e",
                }}
              >
                {labels[key]}
              </button>
            );
          })}
        </div>

        <div className="w-px h-5" style={{ background: "#2a2a3e" }} />

        {/* Search */}
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#4b5563" }}
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
              background: "#1a1a2e",
              borderColor: "#2a2a3e",
              color: "#d1cec8",
              width: 200,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
              style={{ color: "#4b5563" }}
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        {(search || accountFilter !== "all") && (
          <span className="text-[11px] px-2 py-1 rounded-lg" style={{ background: "#1a1a2e", color: "#6b7280", border: "1px solid #2a2a3e" }}>
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
                onMove={moveToStage}
                movingId={movingId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

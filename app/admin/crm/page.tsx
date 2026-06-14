"use client";

// light theme : background "#f6f8fa" pour la page, "#ffffff" pour les cards, "#e5e7eb" pour les borders
// couleur texte principale : "#111827", secondaire : "#6b7280", tertiaire : "#c4c8d0"
// accent orange : "#C96E2C"

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CrmProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  account_type: "couple" | "planner" | "super_admin";
  is_subscribed: boolean;
  plan: string | null;
  trial_ends_at: string | null;
  created_at: string;
  crm_tags: string[] | null;
  crm_notes: string | null;
  // enrichis côté client
  last_activity: string | null;
  wedding_count: number;
}

type SortKey = "name" | "status" | "created_at";
type SortDir = "asc" | "desc";
type FilterKey = "all" | "subscribed" | "trial" | "expired" | "planner" | "couple";

// ─── Constantes de style ──────────────────────────────────────────────────────

const ACCOUNT_BADGE: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  couple:      { label: "Couple",          bg: "#dbeafe", color: "#1d4ed8" },
  planner:     { label: "Wedding Planner", bg: "#dcfce7", color: "#15803d" },
  super_admin: { label: "Super Admin",     bg: "#fff7ed", color: "#C96E2C" },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",        label: "Tous"      },
  { key: "subscribed", label: "Abonnés"   },
  { key: "trial",      label: "En essai"  },
  { key: "expired",    label: "Expiré"    },
  { key: "planner",    label: "Planner"   },
  { key: "couple",     label: "Couple"    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName].filter(Boolean) as string[];
  return parts.map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase() || "?";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtShortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function getStatusInfo(profile: CrmProfile): {
  label: string;
  bg: string;
  color: string;
  sortWeight: number;
} {
  if (profile.is_subscribed) {
    return { label: "✓ Abonné", bg: "#dcfce7", color: "#16a34a", sortWeight: 0 };
  }
  if (profile.trial_ends_at) {
    const daysLeft = Math.ceil(
      (new Date(profile.trial_ends_at).getTime() - Date.now()) / 86_400_000
    );
    if (daysLeft > 0) {
      return {
        label: `Essai J-${daysLeft}`,
        bg: "#fef3c7",
        color: "#d97706",
        sortWeight: 1,
      };
    }
    return { label: "Expiré", bg: "#fee2e2", color: "#dc2626", sortWeight: 2 };
  }
  return { label: "—", bg: "#e5e7eb", color: "#c4c8d0", sortWeight: 3 };
}

function isExpired(profile: CrmProfile): boolean {
  if (profile.is_subscribed) return false;
  if (!profile.trial_ends_at) return false;
  return new Date(profile.trial_ends_at).getTime() <= Date.now();
}

function isTrial(profile: CrmProfile): boolean {
  if (profile.is_subscribed) return false;
  if (!profile.trial_ends_at) return false;
  return new Date(profile.trial_ends_at).getTime() > Date.now();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr style={{ borderTop: "1px solid #f0f0f0" }}>
      {[40, 80, 60, 60, 80, 70, 40, 50].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 rounded animate-pulse"
            style={{ width: `${w}%`, background: "#e5e7eb" }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Sort arrow ───────────────────────────────────────────────────────────────

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span style={{ color: "#e5e7eb", marginLeft: 4 }}>↕</span>;
  return (
    <span style={{ color: "#C96E2C", marginLeft: 4 }}>
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCrmPage() {
  const [profiles, setProfiles] = useState<CrmProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Chargement ──────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const sb = createClient();

      // Requête principale : profiles
      const { data: profilesRaw } = await sb
        .from("profiles")
        .select(
          "id, first_name, last_name, email, phone, company, account_type, is_subscribed, plan, trial_ends_at, created_at, crm_tags, crm_notes"
        )
        .order("created_at", { ascending: false });

      if (!profilesRaw || profilesRaw.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Requête dernière activité (crm_events) — on récupère le max par user
      const { data: eventsRaw } = await sb
        .from("crm_events")
        .select("user_id, created_at")
        .order("created_at", { ascending: false });

      // Requête mariages — count par user_id
      const { data: weddingsRaw } = await sb
        .from("wedding")
        .select("user_id");

      // Indexer les événements par user_id (premier = le plus récent car trié DESC)
      const lastActivityByUser: Record<string, string> = {};
      for (const ev of eventsRaw ?? []) {
        const uid = (ev as { user_id: string; created_at: string }).user_id;
        if (!lastActivityByUser[uid]) {
          lastActivityByUser[uid] = (ev as { user_id: string; created_at: string }).created_at;
        }
      }

      // Compter les mariages par user_id
      const weddingCountByUser: Record<string, number> = {};
      for (const w of weddingsRaw ?? []) {
        const uid = (w as { user_id: string }).user_id;
        weddingCountByUser[uid] = (weddingCountByUser[uid] ?? 0) + 1;
      }

      // Fusionner
      const enriched: CrmProfile[] = (profilesRaw as CrmProfile[]).map((p) => ({
        ...p,
        last_activity: lastActivityByUser[p.id] ?? null,
        wedding_count: weddingCountByUser[p.id] ?? 0,
      }));

      setProfiles(enriched);
      setLoading(false);
    }

    load();
  }, []);

  // ── Stats rapides ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total      = profiles.length;
    const subscribed = profiles.filter((p) => p.is_subscribed).length;
    const trial      = profiles.filter(isTrial).length;
    const expired    = profiles.filter(isExpired).length;
    return { total, subscribed, trial, expired };
  }, [profiles]);

  // ── Filtrage + tri ───────────────────────────────────────────────────────────

  const displayed = useMemo(() => {
    let list = [...profiles];

    // Filtre rapide
    if (filter === "subscribed") list = list.filter((p) => p.is_subscribed);
    else if (filter === "trial")  list = list.filter(isTrial);
    else if (filter === "expired") list = list.filter(isExpired);
    else if (filter === "planner") list = list.filter((p) => p.account_type === "planner");
    else if (filter === "couple")  list = list.filter((p) => p.account_type === "couple");

    // Recherche texte
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
        return (
          name.includes(q) ||
          (p.email ?? "").toLowerCase().includes(q) ||
          (p.company ?? "").toLowerCase().includes(q)
        );
      });
    }

    // Tri
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        const na = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim().toLowerCase();
        const nb = `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim().toLowerCase();
        cmp = na.localeCompare(nb, "fr");
      } else if (sortKey === "status") {
        cmp = getStatusInfo(a).sortWeight - getStatusInfo(b).sortWeight;
      } else {
        // created_at
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [profiles, filter, search, sortKey, sortDir]);

  // ── Gestion tri colonnes ─────────────────────────────────────────────────────

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-[1300px] mx-auto" style={{ color: "#111827" }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-bold flex items-center gap-2.5" style={{ color: "#111827" }}>
            <Icon name="users" size={20} />
            CRM Clients
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "#6b7280" }}>
            Vue complète de tous les clients · {profiles.length} comptes chargés
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold opacity-40 cursor-not-allowed"
          style={{ background: "#C96E2C", color: "#fffaf2" }}
          title="Fonctionnalité à venir"
        >
          <Icon name="plus" size={15} />
          Ajouter une note
        </button>
      </div>

      {/* ── Stats rapides ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Total clients",  value: stats.total,      color: "#6b7280", icon: "users"    },
          { label: "Abonnés",        value: stats.subscribed, color: "#16a34a", icon: "check-circle" },
          { label: "En essai",       value: stats.trial,      color: "#d97706", icon: "clock"    },
          { label: "Expirés",        value: stats.expired,    color: "#dc2626", icon: "alert"    },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 border flex items-center gap-3"
            style={{ background: "#ffffff", borderColor: "#e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}18`, color: s.color }}
            >
              <Icon name={s.icon} size={17} />
            </div>
            <div>
              <div className="text-[24px] font-bold leading-none" style={{ color: s.color }}>
                {loading ? (
                  <div className="w-8 h-5 rounded animate-pulse" style={{ background: "#e5e7eb" }} />
                ) : s.value}
              </div>
              <div className="text-[11.5px] mt-1" style={{ color: "#9ca3af" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barre de recherche ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#c4c8d0" }}
          >
            <Icon name="search" size={15} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, société…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border outline-none transition-colors"
            style={{
              background: "#ffffff",
              borderColor: "#d1d5db",
              color: "#111827",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
              style={{ color: "#c4c8d0" }}
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#ffffff", color: "#c4c8d0", border: "1px solid #e5e7eb" }}>
          {displayed.length} résultat{displayed.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Filtres rapides ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all"
              style={{
                background: active ? "#fff7ed" : "#ffffff",
                color: active ? "#C96E2C" : "#9ca3af",
                border: active ? "1px solid #C96E2C55" : "1px solid #e5e7eb",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "#ffffff", borderColor: "#e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                {/* Nom/Email */}
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-70"
                    style={{ color: sortKey === "name" ? "#C96E2C" : "#c4c8d0" }}
                  >
                    Client
                    <SortArrow active={sortKey === "name"} dir={sortDir} />
                  </button>
                </th>
                {/* Type */}
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>
                  Type
                </th>
                {/* Statut */}
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-70"
                    style={{ color: sortKey === "status" ? "#C96E2C" : "#c4c8d0" }}
                  >
                    Statut
                    <SortArrow active={sortKey === "status"} dir={sortDir} />
                  </button>
                </th>
                {/* Plan */}
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>
                  Plan
                </th>
                {/* Société */}
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>
                  Société
                </th>
                {/* Dernière activité */}
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>
                  Dernière activité
                </th>
                {/* Mariages */}
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>
                  Mariages
                </th>
                {/* Inscription */}
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort("created_at")}
                    className="flex items-center text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-70"
                    style={{ color: sortKey === "created_at" ? "#C96E2C" : "#c4c8d0" }}
                  >
                    Inscrit le
                    <SortArrow active={sortKey === "created_at"} dir={sortDir} />
                  </button>
                </th>
                {/* Action */}
                <th className="px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-[13px]" style={{ color: "#c4c8d0" }}>
                    Aucun client ne correspond à votre recherche
                  </td>
                </tr>
              ) : (
                displayed.map((profile, i) => {
                  const initials  = getInitials(profile.first_name, profile.last_name);
                  const fullName  = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—";
                  const badge     = ACCOUNT_BADGE[profile.account_type] ?? { label: profile.account_type, bg: "#f3f4f6", color: "#6b7280" };
                  const status    = getStatusInfo(profile);

                  return (
                    <tr
                      key={profile.id}
                      className="transition-colors hover:bg-[#00000005]"
                      style={{
                        borderTop: i > 0 ? "1px solid #f0f0f0" : undefined,
                        background: i % 2 === 0 ? "transparent" : "#fafafa",
                      }}
                    >
                      {/* Avatar + Nom + Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: "#fff7ed", color: "#C96E2C" }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div
                              className="font-medium text-[13px] leading-tight truncate max-w-[180px]"
                              style={{ color: "#374151" }}
                            >
                              {fullName}
                            </div>
                            {profile.email && (
                              <div
                                className="text-[11px] truncate max-w-[180px] mt-0.5"
                                style={{ color: "#c4c8d0" }}
                              >
                                {profile.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-mono" style={{ color: "#9ca3af" }}>
                          {profile.plan ?? "—"}
                        </span>
                      </td>

                      {/* Société */}
                      <td className="px-4 py-3">
                        <span className="text-[12px]" style={{ color: "#6b7280" }}>
                          {profile.company || "—"}
                        </span>
                      </td>

                      {/* Dernière activité */}
                      <td className="px-4 py-3">
                        <span className="text-[12px]" style={{ color: "#9ca3af" }}>
                          {fmtShortDate(profile.last_activity)}
                        </span>
                      </td>

                      {/* # Mariages */}
                      <td className="px-4 py-3">
                        <span
                          className="text-[12px] font-semibold"
                          style={{ color: profile.wedding_count > 0 ? "#9333ea" : "#e5e7eb" }}
                        >
                          {profile.wedding_count > 0 ? profile.wedding_count : "—"}
                        </span>
                      </td>

                      {/* Inscrit le */}
                      <td className="px-4 py-3">
                        <span className="text-[12px]" style={{ color: "#c4c8d0" }}>
                          {fmtDate(profile.created_at)}
                        </span>
                      </td>

                      {/* Bouton Voir */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/crm/${profile.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap hover:opacity-80"
                          style={{
                            background: "#fff7ed",
                            color: "#C96E2C",
                            border: "1px solid rgba(201,110,44,0.15)",
                          }}
                        >
                          <Icon name="eye" size={13} />
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer table */}
        {!loading && displayed.length > 0 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "#e5e7eb" }}
          >
            <span className="text-xs" style={{ color: "#c4c8d0" }}>
              {displayed.length} client{displayed.length !== 1 ? "s" : ""} affiché{displayed.length !== 1 ? "s" : ""}
              {profiles.length !== displayed.length && (
                <> · {profiles.length} au total</>
              )}
            </span>
            <span className="text-xs" style={{ color: "#e5e7eb" }}>
              Trié par{" "}
              <span style={{ color: "#c4c8d0" }}>
                {sortKey === "name" ? "nom" : sortKey === "status" ? "statut" : "date d'inscription"}
              </span>
              {" "}({sortDir === "desc" ? "décroissant" : "croissant"})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

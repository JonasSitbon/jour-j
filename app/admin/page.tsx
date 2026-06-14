"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";

interface Stats {
  totalUsers: number;
  totalWeddings: number;
  newThisWeek: number;
  newThisMonth: number;
  couples: number;
  planners: number;
  super_admins: number;
  trialsActive: number;
  trialsExpiringSoon: number;
  trialsExpired: number;
  subscribed: number;
}

interface RecentUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  account_type: string;
  created_at: string;
  trial_ends_at: string | null;
  is_subscribed: boolean;
  plan: string | null;
}

interface DayCount {
  date: string;
  count: number;
}

interface EventCount {
  event_name: string;
  count: number;
}

interface RecentEvent {
  id: string;
  event_name: string;
  path: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const QUICK_ACTIONS = [
  { href: "/admin/users",    label: "Gérer les utilisateurs", icon: "users",   color: "#60a5fa" },
  { href: "/admin/roles",    label: "Gérer les rôles",        icon: "key",     color: "#c084fc" },
  { href: "/admin/features", label: "Feature flags",          icon: "flag",    color: "#4ade80" },
  { href: "/admin/emails",   label: "Envoyer un email",       icon: "mail",    color: "#fb923c" },
];

const EVENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  signup_complete:        { label: "Inscriptions",          color: "#4ade80", icon: "users"   },
  login:                  { label: "Connexions",            color: "#60a5fa", icon: "key"     },
  password_reset_request: { label: "Réinitial. mdp",        color: "#fb923c", icon: "mail"    },
  logout:                 { label: "Déconnexions",          color: "#9ca3af", icon: "arrow"   },
  cta_click:              { label: "Clics CTA",             color: "#c084fc", icon: "sparkle" },
  pricing_view:           { label: "Vues tarifs",           color: "#fbbf24", icon: "wallet"  },
  trial_banner_click:     { label: "Clics bandeau essai",   color: "#f472b6", icon: "clock"   },
};

function StatCard({ label, value, icon, color, sub, href }: {
  label: string; value: number | string; icon: string; color: string; sub?: string; href?: string;
}) {
  const inner = (
    <div className="rounded-xl p-5 flex items-start gap-4 border transition-colors"
      style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}>
        <span style={{ color }}><Icon name={icon} size={18} /></span>
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold" style={{ color: "#f0ead8" }}>{value}</div>
        <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{label}</div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: color + "cc" }}>{sub}</div>}
      </div>
    </div>
  );
  if (href) return <Link href={href} className="block hover:opacity-80 transition-opacity">{inner}</Link>;
  return inner;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentUser[]>([]);
  const [chart, setChart] = useState<DayCount[]>([]);
  const [eventCounts, setEventCounts] = useState<EventCount[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const c = createClient();
      const now = new Date();
      const weekAgo  = new Date(now.getTime() - 7  * 86_400_000);
      const monthAgo = new Date(now.getTime() - 30 * 86_400_000);

      const [{ data: profiles }, { data: weddings }, { data: events }] = await Promise.all([
        c.from("profiles").select("id, first_name, last_name, account_type, created_at, trial_ends_at, is_subscribed, plan").order("created_at", { ascending: false }),
        c.from("wedding").select("id, created_at", { count: "exact" }),
        c.from("analytics_events").select("id, event_name, path, metadata, created_at").order("created_at", { ascending: false }).limit(200),
      ]);

      const allProfiles = profiles ?? [];
      const allEvents   = events   ?? [];

      // ── User stats ──────────────────────────────────────────────────────────
      const newThisWeek  = allProfiles.filter((p) => new Date(p.created_at) >= weekAgo).length;
      const newThisMonth = allProfiles.filter((p) => new Date(p.created_at) >= monthAgo).length;
      const couples      = allProfiles.filter((p) => p.account_type === "couple").length;
      const planners     = allProfiles.filter((p) => p.account_type === "planner").length;
      const superAdmins  = allProfiles.filter((p) => p.account_type === "super_admin").length;

      // ── Trial stats ──────────────────────────────────────────────────────────
      const trialsActive       = allProfiles.filter((p) => p.trial_ends_at && new Date(p.trial_ends_at) > now).length;
      const trialsExpiringSoon = allProfiles.filter((p) => {
        if (!p.trial_ends_at) return false;
        const end = new Date(p.trial_ends_at);
        return end > now && end <= new Date(now.getTime() + 3 * 86_400_000);
      }).length;
      const trialsExpired = allProfiles.filter((p) => p.trial_ends_at && new Date(p.trial_ends_at) <= now && !p.is_subscribed).length;
      const subscribed    = allProfiles.filter((p) => p.is_subscribed).length;

      // ── 30-day chart ─────────────────────────────────────────────────────────
      const days: DayCount[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86_400_000);
        const dayStr = d.toISOString().split("T")[0];
        days.push({ date: dayStr, count: allProfiles.filter((p) => p.created_at?.startsWith(dayStr)).length });
      }

      // ── Event counts (last 30 days) ──────────────────────────────────────────
      const recentEvts = allEvents.filter((e) => new Date(e.created_at) >= monthAgo);
      const countByName: Record<string, number> = {};
      for (const e of recentEvts) {
        countByName[e.event_name] = (countByName[e.event_name] ?? 0) + 1;
      }
      const eCounts = Object.entries(countByName)
        .map(([event_name, count]) => ({ event_name, count }))
        .sort((a, b) => b.count - a.count);

      setStats({ totalUsers: allProfiles.length, totalWeddings: (weddings ?? []).length, newThisWeek, newThisMonth, couples, planners, super_admins: superAdmins, trialsActive, trialsExpiringSoon, trialsExpired, subscribed });
      setRecent(allProfiles.slice(0, 6) as RecentUser[]);
      setChart(days);
      setEventCounts(eCounts);
      setRecentEvents(allEvents.slice(0, 15) as RecentEvent[]);
      setLoading(false);
    }
    load();
  }, []);

  const maxCount = Math.max(...chart.map((d) => d.count), 1);

  const accountTypeBadge: Record<string, { bg: string; color: string; label: string }> = {
    couple:      { bg: "#1e3a5f33", color: "#60a5fa", label: "Couple"         },
    planner:     { bg: "#16562233", color: "#4ade80", label: "Wedding Planner" },
    super_admin: { bg: "#c96e2c33", color: "#fb923c", label: "Super Admin"     },
  };

  function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
    return new Date(iso).toLocaleDateString("fr-FR", opts ?? { day: "numeric", month: "short" });
  }

  function trialStatus(trialEndsAt: string | null) {
    if (!trialEndsAt) return null;
    const now = Date.now();
    const end = new Date(trialEndsAt).getTime();
    const daysLeft = Math.ceil((end - now) / 86_400_000);
    if (daysLeft <= 0)  return { label: "Expiré",         color: "#ef4444" };
    if (daysLeft <= 3)  return { label: `J-${daysLeft}`,  color: "#fb923c" };
    return { label: `J-${daysLeft}`, color: "#4ade80" };
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#f0ead8" }}>Dashboard Super Admin</h1>
        <p className="text-sm" style={{ color: "#6b7280" }}>Vue d&apos;ensemble de la plateforme Jour J</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* ── Utilisateurs ── */}
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#4b5563" }}>Utilisateurs</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total" value={stats.totalUsers} icon="users" color="#60a5fa" href="/admin/users" />
            <StatCard label="Mariages créés" value={stats.totalWeddings} icon="rings" color="#c084fc" />
            <StatCard label="Nouveaux cette semaine" value={stats.newThisWeek} icon="sparkle" color="#4ade80" />
            <StatCard label="Nouveaux ce mois" value={stats.newThisMonth} icon="calendar" color="#fbbf24" />
          </div>

          {/* ── Abonnements ── */}
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#4b5563" }}>Abonnements</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Abonnés payants" value={stats.subscribed} icon="check-circle" color="#4ade80"
              sub={stats.subscribed > 0 ? `${Math.round((stats.subscribed / stats.totalUsers) * 100)}% des comptes` : "Aucun abonné"} />
            <StatCard label="En essai" value={stats.trialsActive} icon="clock" color="#fbbf24"
              sub={stats.trialsExpiringSoon > 0 ? `dont ${stats.trialsExpiringSoon} expirent dans 3j` : undefined} />
            <StatCard label="Essai expiré (non payé)" value={stats.trialsExpired} icon="alert" color="#ef4444" />
            <StatCard label="Taux conversion" value={stats.totalUsers > 0 ? `${Math.round((stats.subscribed / stats.totalUsers) * 100)}%` : "—"} icon="bars" color="#c084fc" />
          </div>

          {/* ── Liste comptes avec statut ── */}
          <div className="rounded-xl border overflow-hidden mb-8" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#2a2a3e" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Comptes — Abonnement &amp; Essai</h2>
              <Link href="/admin/users" className="text-[11px] transition-colors hover:opacity-70" style={{ color: "#C96E2C" }}>Voir tous →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ background: "#0f1117", color: "#4b5563" }}>
                    {["Compte", "Type", "Statut", "Essai / Plan", "Inscrit le"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((u, i) => {
                    const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                    const badge = accountTypeBadge[u.account_type] ?? { bg: "#33333344", color: "#9ca3af", label: u.account_type };
                    const trial = trialStatus(u.trial_ends_at);
                    const isExpired = u.trial_ends_at && new Date(u.trial_ends_at) <= new Date() && !u.is_subscribed;
                    return (
                      <tr key={u.id} style={{ background: i % 2 === 0 ? "transparent" : "#0f1117" }}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                              style={{ background: "#C96E2C22", color: "#e2945a" }}>
                              {(name[0] || "?").toUpperCase()}
                            </div>
                            <span style={{ color: "#d1cec8" }}>{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {u.is_subscribed ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#4ade8022", color: "#4ade80" }}>✓ Abonné</span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#ef444422", color: "#ef4444" }}>Expiré</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#fbbf2422", color: "#fbbf24" }}>Essai</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: "#6b7280" }}>
                          {u.is_subscribed
                            ? (u.plan ?? "—")
                            : trial
                              ? <span style={{ color: trial.color }}>{trial.label}</span>
                              : "—"}
                        </td>
                        <td className="px-4 py-2.5" style={{ color: "#4b5563" }}>{fmtDate(u.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Essai ── */}
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#4b5563" }}>Prospects (essai en cours)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="Essais actifs" value={stats.trialsActive} icon="clock" color="#4ade80"
              sub={stats.trialsExpiringSoon > 0 ? `dont ${stats.trialsExpiringSoon} expirent dans 3j` : undefined} />
            <StatCard label="Essais expirés (non convertis)" value={stats.trialsExpired} icon="alert" color="#ef4444" />
            <StatCard label="Prospects à relancer" value={stats.trialsExpiringSoon} icon="flag" color="#60a5fa" />
          </div>

          {/* ── Répartition comptes + actions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Répartition */}
            <div className="rounded-xl p-5 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: "#6b7280" }}><Icon name="pie" size={16} /></span>
                <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Répartition des comptes</h2>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Couples",       count: stats.couples,      color: "#60a5fa" },
                  { label: "Planners",      count: stats.planners,     color: "#4ade80" },
                  { label: "Super Admins",  count: stats.super_admins, color: "#fb923c" },
                ].map((item) => {
                  const pct = stats.totalUsers > 0 ? Math.round((item.count / stats.totalUsers) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: "#9ca3af" }}>{item.label}</span>
                        <span className="text-xs font-semibold" style={{ color: item.color }}>{pct}% · {item.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2a2a3e" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-xl p-5 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: "#6b7280" }}><Icon name="grid" size={16} /></span>
                <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Actions rapides</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((a) => (
                  <Link key={a.href} href={a.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors hover:opacity-80"
                    style={{ background: "#0f1117", borderColor: "#2a2a3e" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${a.color}22` }}>
                      <span style={{ color: a.color }}><Icon name={a.icon} size={18} /></span>
                    </div>
                    <span className="text-xs font-medium text-center leading-tight" style={{ color: "#9ca3af" }}>{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Graphique inscriptions 30j ── */}
          <div className="rounded-xl p-5 border mb-6" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
            <div className="flex items-center gap-2 mb-5">
              <span style={{ color: "#6b7280" }}><Icon name="bars" size={16} /></span>
              <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Inscriptions — 30 derniers jours</h2>
            </div>
            <div className="flex items-end gap-1 h-28">
              {chart.map((d) => {
                const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                const day = new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
                const isWeekend = [0, 6].includes(new Date(d.date + "T00:00:00").getDay());
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group" title={`${day} : ${d.count}`}>
                    <div className="text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: d.count > 0 ? "#C96E2C" : "transparent" }}>
                      {d.count || ""}
                    </div>
                    <div className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(pct, d.count > 0 ? 8 : 3)}%`,
                        background: d.count > 0 ? "#C96E2C" : "#2a2a3e",
                        opacity: isWeekend ? 0.6 : 1,
                        minHeight: "3px",
                      }} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: "#4b5563" }}>J-30</span>
              <span className="text-[10px]" style={{ color: "#4b5563" }}>Aujourd'hui</span>
            </div>
          </div>

          {/* ── Analytics événements ── */}
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3 mt-6" style={{ color: "#4b5563" }}>Analytics (30 derniers jours)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Comptage par événement */}
            <div className="rounded-xl p-5 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: "#6b7280" }}><Icon name="sparkle" size={16} /></span>
                <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Événements par type</h2>
              </div>
              {eventCounts.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "#4b5563" }}>Aucun événement enregistré</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {eventCounts.map((e) => {
                    const info = EVENT_LABELS[e.event_name] ?? { label: e.event_name, color: "#9ca3af", icon: "sparkle" };
                    const maxEvt = Math.max(...eventCounts.map((x) => x.count), 1);
                    return (
                      <div key={e.event_name} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: `${info.color}22`, color: info.color }}>
                          <Icon name={info.icon} size={11} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px]" style={{ color: "#d1cec8" }}>{info.label}</span>
                            <span className="text-[12px] font-bold" style={{ color: info.color }}>{e.count}</span>
                          </div>
                          <div className="h-1 rounded-full" style={{ background: "#2a2a3e" }}>
                            <div className="h-full rounded-full" style={{ width: `${(e.count / maxEvt) * 100}%`, background: info.color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Flux récent */}
            <div className="rounded-xl p-5 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: "#6b7280" }}><Icon name="clock" size={16} /></span>
                <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Activité récente</h2>
              </div>
              {recentEvents.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "#4b5563" }}>Aucun événement</p>
              ) : (
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[260px]">
                  {recentEvents.map((e, i) => {
                    const info = EVENT_LABELS[e.event_name] ?? { label: e.event_name, color: "#9ca3af", icon: "sparkle" };
                    return (
                      <div key={e.id}
                        className="flex items-center gap-2.5 py-2 px-3 rounded-lg"
                        style={{ background: i % 2 === 0 ? "#0f1117" : "transparent" }}>
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: `${info.color}18`, color: info.color }}>
                          <Icon name={info.icon} size={11} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px]" style={{ color: "#d1cec8" }}>{info.label}</span>
                          {e.path && <span className="text-[11px] ml-1.5" style={{ color: "#4b5563" }}>{e.path}</span>}
                        </div>
                        <span className="text-[10px] flex-shrink-0" style={{ color: "#4b5563" }}>
                          {fmtDate(e.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Derniers inscrits ── */}
          <div className="rounded-xl p-5 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: "#6b7280" }}><Icon name="users" size={16} /></span>
              <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Derniers inscrits</h2>
              <Link href="/admin/users" className="ml-auto text-[11px] transition-colors hover:opacity-70" style={{ color: "#C96E2C" }}>
                Voir tous
              </Link>
            </div>
            <div className="flex flex-col gap-1.5">
              {recent.map((u) => {
                const badge = accountTypeBadge[u.account_type] ?? { bg: "#33333344", color: "#9ca3af", label: u.account_type };
                const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                const trial = trialStatus(u.trial_ends_at);
                return (
                  <div key={u.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: "#0f1117" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{ background: "#C96E2C22", color: "#e2945a" }}>
                      {(name[0] || "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: "#d1cec8" }}>{name}</div>
                      <div className="text-[11px]" style={{ color: "#4b5563" }}>{fmtDate(u.created_at)}</div>
                    </div>
                    {trial && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${trial.color}20`, color: trial.color }}>
                        Essai {trial.label}
                      </span>
                    )}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

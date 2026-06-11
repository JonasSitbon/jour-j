"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";

interface Stats {
  totalUsers: number;
  totalWeddings: number;
  newThisWeek: number;
  couples: number;
  planners: number;
  super_admins: number;
}

interface RecentUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  account_type: string;
  created_at: string;
  email?: string;
}

interface DayCount {
  date: string;
  count: number;
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div
      className="rounded-xl p-5 flex items-start gap-4 border"
      style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}
      >
        <span style={{ color }}><Icon name={icon} size={18} /></span>
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: "#f0ead8" }}>{value}</div>
        <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentUser[]>([]);
  const [chart, setChart] = useState<DayCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const c = createClient();

      const [{ data: profiles }, { data: weddings }] = await Promise.all([
        c.from("profiles").select("id, first_name, last_name, account_type, created_at").order("created_at", { ascending: false }),
        c.from("wedding").select("id, created_at", { count: "exact" }),
      ]);

      const allProfiles = profiles ?? [];
      const allWeddings = weddings ?? [];

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const newThisWeek = allProfiles.filter((p) => new Date(p.created_at) >= weekAgo).length;
      const couples = allProfiles.filter((p) => p.account_type === "couple").length;
      const planners = allProfiles.filter((p) => p.account_type === "planner").length;
      const superAdmins = allProfiles.filter((p) => p.account_type === "super_admin").length;

      // Build 7-day chart
      const days: DayCount[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toISOString().split("T")[0];
        const count = allProfiles.filter((p) => p.created_at?.startsWith(dayStr)).length;
        days.push({ date: dayStr, count });
      }

      setStats({
        totalUsers: allProfiles.length,
        totalWeddings: allWeddings.length,
        newThisWeek,
        couples,
        planners,
        super_admins: superAdmins,
      });
      setRecent(allProfiles.slice(0, 5) as RecentUser[]);
      setChart(days);
      setLoading(false);
    }
    load();
  }, []);

  const maxCount = Math.max(...chart.map((d) => d.count), 1);

  const accountTypeLabel: Record<string, string> = {
    couple: "Couple",
    planner: "Wedding Planner",
    super_admin: "Super Admin",
  };

  const accountTypeBadge: Record<string, { bg: string; color: string }> = {
    couple: { bg: "#1e3a5f33", color: "#60a5fa" },
    planner: { bg: "#16562233", color: "#4ade80" },
    super_admin: { bg: "#c96e2c33", color: "#fb923c" },
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#f0ead8" }}>Dashboard Super Admin</h1>
        <p className="text-sm" style={{ color: "#6b7280" }}>Vue d'ensemble de la plateforme Jour J</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="Utilisateurs totaux" value={stats.totalUsers} icon="users" color="#60a5fa" />
            <StatCard label="Mariages créés" value={stats.totalWeddings} icon="rings" color="#c084fc" />
            <StatCard label="Nouveaux cette semaine" value={stats.newThisWeek} icon="sparkle" color="#4ade80" />
            <StatCard label="Couples" value={stats.couples} icon="heart" color="#60a5fa" />
            <StatCard label="Wedding Planners" value={stats.planners} icon="flag" color="#4ade80" />
            <StatCard label="Super Admins" value={stats.super_admins} icon="key" color="#fb923c" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="rounded-xl p-5 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
              <div className="flex items-center gap-2 mb-5">
                <span style={{ color: "#6b7280" }}><Icon name="bars" size={16} /></span>
                <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Inscriptions — 7 derniers jours</h2>
              </div>
              <div className="flex items-end gap-2 h-32">
                {chart.map((d) => {
                  const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                  const day = new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short" });
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[10px]" style={{ color: "#6b7280" }}>
                        {d.count > 0 ? d.count : ""}
                      </div>
                      <div className="w-full rounded-t-sm transition-all" style={{
                        height: `${Math.max(pct, d.count > 0 ? 8 : 4)}%`,
                        background: d.count > 0 ? "#C96E2C" : "#2a2a3e",
                        minHeight: "4px",
                      }} />
                      <div className="text-[10px] capitalize" style={{ color: "#4b5563" }}>{day}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent users */}
            <div className="rounded-xl p-5 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: "#6b7280" }}><Icon name="users" size={16} /></span>
                <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>5 derniers inscrits</h2>
              </div>
              <div className="flex flex-col gap-2">
                {recent.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: "#4b5563" }}>Aucun utilisateur</p>
                )}
                {recent.map((u) => {
                  const badge = accountTypeBadge[u.account_type] ?? { bg: "#33333344", color: "#9ca3af" };
                  const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                  const date = u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—";
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg"
                      style={{ background: "#0f1117" }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                        style={{ background: "#C96E2C22", color: "#e2945a" }}
                      >
                        {(name[0] || "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate" style={{ color: "#d1cec8" }}>{name}</div>
                        <div className="text-[11px]" style={{ color: "#4b5563" }}>{date}</div>
                      </div>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {accountTypeLabel[u.account_type] ?? u.account_type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Type breakdown */}
          <div className="mt-6 rounded-xl p-5 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: "#6b7280" }}><Icon name="pie" size={16} /></span>
              <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Répartition des comptes</h2>
            </div>
            <div className="flex gap-6">
              {[
                { label: "Couples", count: stats.couples, color: "#60a5fa" },
                { label: "Planners", count: stats.planners, color: "#4ade80" },
                { label: "Super Admins", count: stats.super_admins, color: "#fb923c" },
              ].map((item) => {
                const pct = stats.totalUsers > 0 ? Math.round((item.count / stats.totalUsers) * 100) : 0;
                return (
                  <div key={item.label} className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs" style={{ color: "#9ca3af" }}>{item.label}</span>
                      <span className="text-xs font-semibold" style={{ color: item.color }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2a2a3e" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: "#4b5563" }}>{item.count} comptes</div>
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

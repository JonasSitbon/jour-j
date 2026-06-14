"use client";

import { useEffect, useState, useMemo } from "react";
import { adminLoadAllProfiles, adminUpdateAccountType } from "@/lib/db";
import { Icon } from "@/components/icon";
import type { AccountType } from "@/lib/types";

interface UserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  account_type: AccountType;
  created_at: string;
  avatar_url: string | null;
}

const ACCOUNT_BADGE: Record<AccountType, { label: string; bg: string; color: string }> = {
  couple:      { label: "Couple",          bg: "#dbeafe", color: "#1d4ed8" },
  planner:     { label: "Wedding Planner", bg: "#dcfce7", color: "#15803d" },
  super_admin: { label: "Super Admin",     bg: "#fff7ed", color: "#C96E2C" },
};

const ACCOUNT_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "couple", label: "Couple" },
  { value: "planner", label: "Wedding Planner" },
  { value: "super_admin", label: "Super Admin" },
];

const PAGE_SIZE = 50;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [page, setPage] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await adminLoadAllProfiles();
      setUsers(data as UserRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...users];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((u) => {
        const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
        return name.includes(q) || u.id.toLowerCase().includes(q);
      });
    }
    if (sortBy === "name") {
      list.sort((a, b) => {
        const na = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim().toLowerCase();
        const nb = `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim().toLowerCase();
        return na.localeCompare(nb, "fr");
      });
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [users, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function changeType(userId: string, newType: AccountType) {
    setUpdating(userId);
    await adminUpdateAccountType(userId, newType);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, account_type: newType } : u));
    setUpdating(null);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>Utilisateurs</h1>
        <p className="text-sm" style={{ color: "#6b7280" }}>Gérez les comptes et types d'accès</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#c4c8d0" }}><Icon name="search" size={15} /></span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher par nom ou ID…"
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border outline-none transition-colors"
            style={{ background: "#ffffff", borderColor: "#d1d5db", color: "#111827" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "#6b7280" }}>Trier par</span>
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#e5e7eb" }}>
            {(["date", "name"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: sortBy === s ? "#fff7ed" : "#ffffff",
                  color: sortBy === s ? "#C96E2C" : "#6b7280",
                }}
              >
                {s === "date" ? "Date" : "Nom"}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#f9fafb", color: "#c4c8d0" }}>
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#ffffff", borderColor: "#e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#c4c8d0" }}>Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#c4c8d0" }}>ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#c4c8d0" }}>Type de compte</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#c4c8d0" }}>Inscription</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#c4c8d0" }}>Changer type</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="w-7 h-7 rounded-full border-2 border-orange-400 border-t-transparent animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm" style={{ color: "#c4c8d0" }}>
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : paged.map((u, i) => {
                const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "Sans nom";
                const badge = ACCOUNT_BADGE[u.account_type] ?? { label: u.account_type, bg: "#f3f4f6", color: "#6b7280" };
                const date = u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";
                const initials = name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
                return (
                  <tr
                    key={u.id}
                    className="transition-colors"
                    style={{
                      borderTop: i > 0 ? "1px solid #f0f0f0" : undefined,
                      background: i % 2 === 0 ? "transparent" : "#f9fafb",
                    }}
                  >
                    {/* Avatar + nom */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                          style={{ background: "#fff7ed", color: "#C96E2C" }}
                        >
                          {initials || "?"}
                        </div>
                        <span className="font-medium text-[13px]" style={{ color: "#374151" }}>{name}</span>
                      </div>
                    </td>
                    {/* ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px]" style={{ color: "#c4c8d0" }}>
                        {u.id.slice(0, 8)}…
                      </span>
                    </td>
                    {/* Badge type */}
                    <td className="px-4 py-3">
                      <span
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3">
                      <span className="text-[12px]" style={{ color: "#6b7280" }}>{date}</span>
                    </td>
                    {/* Select type */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={u.account_type}
                          onChange={(e) => changeType(u.id, e.target.value as AccountType)}
                          disabled={updating === u.id}
                          className="text-[12px] pr-7 pl-2.5 py-1 rounded-lg border appearance-none cursor-pointer outline-none transition-colors disabled:opacity-50"
                          style={{
                            background: "#f9fafb",
                            borderColor: "#e5e7eb",
                            color: "#374151",
                            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236b7280' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E\")",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 6px center",
                          }}
                        >
                          {ACCOUNT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        {updating === u.id && (
                          <div className="absolute right-7 top-1/2 -translate-y-1/2">
                            <div className="w-3 h-3 rounded-full border border-orange-400 border-t-transparent animate-spin" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "#e5e7eb" }}
          >
            <span className="text-xs" style={{ color: "#c4c8d0" }}>
              Page {page + 1} / {totalPages} · {filtered.length} utilisateurs
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-30"
                style={{ background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }}
              >
                <Icon name="chevronL" size={13} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-30"
                style={{ background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }}
              >
                <Icon name="chevronR" size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

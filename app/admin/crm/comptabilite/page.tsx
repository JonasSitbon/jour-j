"use client";

// light theme: background "#f9fafb" for page, "#ffffff" for cards, "#e5e7eb" for borders
// text "#111827" primary, "#6b7280" secondary, "#374151" tertiary
// accent orange "#C96E2C" / "#C96E2C"

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  account_type: string;
  is_subscribed: boolean;
  plan: string | null;
  subscribed_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string | null;
  amount_cents: number;
  currency: string;
  plan: string | null;
  billing_period: string | null;
  status: string;
  invoice_date: string;
  paid_at: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function planLabel(plan: string | null): string {
  switch (plan) {
    case "couple_monthly":  return "Couple mensuel";
    case "couple_annual":   return "Couple annuel";
    case "planner_monthly": return "Planner mensuel";
    case "planner_annual":  return "Planner annuel";
    default:                return plan ?? "—";
  }
}

function monthlyValue(plan: string | null): number {
  switch (plan) {
    case "couple_monthly":  return 3;
    case "couple_annual":   return 2.5;
    case "planner_monthly": return 12;
    case "planner_annual":  return 10;
    default:                return 0;
  }
}

function annualValue(plan: string | null): number {
  switch (plan) {
    case "couple_monthly":  return 36;
    case "couple_annual":   return 30;
    case "planner_monthly": return 144;
    case "planner_annual":  return 120;
    default:                return 0;
  }
}

function fmtEuro(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function fmtEuroFromEuros(euros: number): string {
  return euros.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function fmtMonthYear(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function fmtLongDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtShortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(first: string | null, last: string | null): string {
  return [first, last]
    .filter(Boolean)
    .map((s) => (s as string)[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function monthKey(isoDate: string): string {
  // "2026-06" — for grouping
  return isoDate.slice(0, 7);
}

// ─── Plan badge style ──────────────────────────────────────────────────────────

function planBadgeStyle(plan: string | null): { bg: string; color: string } {
  if (plan?.startsWith("planner")) return { bg: "#dcfce7", color: "#15803d" };
  if (plan?.startsWith("couple"))  return { bg: "#dbeafe", color: "#1d4ed8" };
  return { bg: "#f3f4f6", color: "#6b7280" };
}

// ─── Invoice status badge ──────────────────────────────────────────────────────

function invoiceStatusBadge(status: string): { label: string; bg: string; color: string } {
  switch (status) {
    case "paid":       return { label: "Payée",    bg: "#dcfce7", color: "#16a34a" };
    case "sent":       return { label: "Envoyée",  bg: "#dbeafe", color: "#2563eb" };
    case "draft":      return { label: "Brouillon",bg: "#f3f4f6", color: "#6b7280" };
    case "overdue":    return { label: "En retard",bg: "#fee2e2", color: "#dc2626" };
    case "cancelled":  return { label: "Annulée",  bg: "#f3f4f6", color: "#6b7280" };
    default:           return { label: status,     bg: "#f3f4f6", color: "#6b7280" };
  }
}

// ─── Skeleton components ───────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "#ffffff", borderColor: "#e5e7eb" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: "#e5e7eb" }} />
        <div className="w-24 h-3 rounded animate-pulse" style={{ background: "#e5e7eb" }} />
      </div>
      <div className="w-28 h-8 rounded animate-pulse" style={{ background: "#e5e7eb" }} />
    </div>
  );
}

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <tr style={{ borderTop: "1px solid #f0f0f0" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 rounded animate-pulse"
            style={{ width: `${55 + ((i * 17) % 40)}%`, background: "#e5e7eb" }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-4 border-b"
      style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}
    >
      <Icon name={icon} size={16} style={{ color: "#C96E2C" }} />
      <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>
        {title}
        {count !== undefined && (
          <span
            className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{ background: "#fff7ed", color: "#C96E2C" }}
          >
            {count}
          </span>
        )}
      </h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComptabilitePage() {
  const [profiles, setProfiles] = useState<SubProfile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Data loading ─────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const sb = createClient();

      const [{ data: profilesRaw }, { data: invoicesRaw }] = await Promise.all([
        sb
          .from("profiles")
          .select(
            "id, first_name, last_name, email, account_type, is_subscribed, plan, subscribed_at, trial_ends_at, created_at"
          )
          .order("created_at", { ascending: false }),
        sb
          .from("crm_invoices")
          .select(
            "id, user_id, invoice_number, amount_cents, currency, plan, billing_period, status, invoice_date, paid_at, created_at"
          )
          .order("invoice_date", { ascending: false }),
      ]);

      setProfiles((profilesRaw ?? []) as SubProfile[]);
      setInvoices((invoicesRaw ?? []) as Invoice[]);
      setLoading(false);
    }
    load();
  }, []);

  // ── Profile lookup map for invoice display ────────────────────────────────────

  const profileMap = useMemo(() => {
    const m: Record<string, SubProfile> = {};
    for (const p of profiles) m[p.id] = p;
    return m;
  }, [profiles]);

  // ── KPI computations ──────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const subscribed = profiles.filter((p) => p.is_subscribed);
    const now = Date.now();

    const mrr = subscribed.reduce((acc, p) => acc + monthlyValue(p.plan), 0);
    const arr = mrr * 12;

    const totalRevenue = invoices
      .filter((inv) => inv.status === "paid")
      .reduce((acc, inv) => acc + inv.amount_cents, 0);

    const activeCount = subscribed.length;

    const trialCount = profiles.filter(
      (p) =>
        !p.is_subscribed &&
        p.trial_ends_at !== null &&
        new Date(p.trial_ends_at).getTime() > now
    ).length;

    const expiredCount = profiles.filter(
      (p) =>
        !p.is_subscribed &&
        p.trial_ends_at !== null &&
        new Date(p.trial_ends_at).getTime() <= now
    ).length;

    const conversionDenominator = activeCount + expiredCount;
    const conversionRate =
      conversionDenominator > 0
        ? Math.round((activeCount / conversionDenominator) * 100)
        : 0;

    return { mrr, arr, totalRevenue, activeCount, trialCount, expiredCount, conversionRate };
  }, [profiles, invoices]);

  // ── Revenue by month ──────────────────────────────────────────────────────────

  const revenueByMonth = useMemo(() => {
    const map: Record<string, { month: string; count: number; total: number }> = {};

    for (const inv of invoices) {
      if (inv.status !== "paid") continue;
      const key = monthKey(inv.invoice_date);
      if (!map[key]) {
        map[key] = { month: fmtMonthYear(inv.invoice_date), count: 0, total: 0 };
      }
      map[key].count += 1;
      map[key].total += inv.amount_cents;
    }

    // Sort by month key descending
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, v]) => v);
  }, [invoices]);

  const maxMonthRevenue = useMemo(
    () => Math.max(...revenueByMonth.map((r) => r.total), 1),
    [revenueByMonth]
  );

  // ── Active subscribers (newest first) ────────────────────────────────────────

  const activeSubscribers = useMemo(
    () =>
      profiles
        .filter((p) => p.is_subscribed)
        .sort((a, b) => {
          const ta = a.subscribed_at ? new Date(a.subscribed_at).getTime() : 0;
          const tb = b.subscribed_at ? new Date(b.subscribed_at).getTime() : 0;
          return tb - ta;
        }),
    [profiles]
  );

  // ── Export CSV ────────────────────────────────────────────────────────────────

  function exportCsv() {
    const header = ["Nom", "Email", "Plan", "Valeur mensuelle (€)", "Abonné depuis"];
    const rows = activeSubscribers.map((p) => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "—";
      return [
        name,
        p.email ?? "",
        planLabel(p.plan),
        monthlyValue(p.plan).toFixed(2),
        fmtShortDate(p.subscribed_at),
      ];
    });

    const csvContent = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const url = `data:text/csv;charset=utf-8,﻿${encodeURIComponent(csvContent)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `abonnes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  // ─── Render ────────────────────────────────────────────────────────────────────

  const kpiCards = [
    {
      icon: "bars",
      label: "MRR",
      sublabel: "Revenu mensuel récurrent",
      value: loading ? null : fmtEuroFromEuros(kpis.mrr),
      color: "#C96E2C",
      highlight: true,
    },
    {
      icon: "wallet",
      label: "ARR",
      sublabel: "Revenu annuel récurrent",
      value: loading ? null : fmtEuroFromEuros(kpis.arr),
      color: "#C96E2C",
      highlight: false,
    },
    {
      icon: "receipt",
      label: "Total facturé",
      sublabel: "Factures payées",
      value: loading ? null : fmtEuro(kpis.totalRevenue),
      color: "#7c3aed",
      highlight: false,
    },
    {
      icon: "check-circle",
      label: "Abonnés actifs",
      sublabel: "Comptes avec abonnement",
      value: loading ? null : String(kpis.activeCount),
      color: "#16a34a",
      highlight: false,
    },
    {
      icon: "clock",
      label: "En essai",
      sublabel: "Période d'essai active",
      value: loading ? null : String(kpis.trialCount),
      color: "#d97706",
      highlight: false,
    },
    {
      icon: "zap",
      label: "Taux de conversion",
      sublabel: "Essais → Abonnés",
      value: loading ? null : `${kpis.conversionRate}%`,
      color: "#2563eb",
      highlight: false,
    },
  ];

  return (
    <div className="p-8 max-w-[1300px] mx-auto" style={{ color: "#111827" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/crm"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "#9ca3af" }}
          >
            <Icon name="chevronL" size={15} />
            CRM
          </Link>
          <span style={{ color: "#e5e7eb" }}>|</span>
          <div>
            <h1 className="text-[22px] font-bold flex items-center gap-2.5" style={{ color: "#111827" }}>
              <Icon name="receipt" size={20} style={{ color: "#C96E2C" }} />
              Comptabilité &amp; Revenus
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "#6b7280" }}>
              Suivi financier · MRR, ARR, abonnements et facturation
            </p>
          </div>
        </div>

        <button
          onClick={exportCsv}
          disabled={loading || activeSubscribers.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#C96E2C", color: "#fffaf2" }}
        >
          <Icon name="download" size={15} />
          Exporter CSV
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpiCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border p-5 flex flex-col gap-3"
                style={{
                  background: card.highlight ? "#fff7ed" : "#ffffff",
                  borderColor: card.highlight ? "rgba(201,110,44,0.2)" : "#e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${card.color}20`, color: card.color }}
                  >
                    <Icon name={card.icon} size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: card.color }}>
                      {card.label}
                    </div>
                    <div className="text-[10.5px] leading-tight mt-0.5" style={{ color: "#c4c8d0" }}>
                      {card.sublabel}
                    </div>
                  </div>
                </div>
                <div
                  className="text-[22px] font-bold leading-none tabular-nums"
                  style={{ color: card.highlight ? card.color : "#111827" }}
                >
                  {card.value}
                </div>
              </div>
            ))}
      </div>

      {/* ── Revenue by month ── */}
      <div
        className="rounded-xl border overflow-hidden mb-8"
        style={{ background: "#ffffff", borderColor: "#e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <SectionHeader icon="bars" title="Revenus par mois" />

        {loading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 h-3 rounded animate-pulse" style={{ background: "#e5e7eb" }} />
                <div className="flex-1 h-5 rounded-md animate-pulse" style={{ background: "#e5e7eb", maxWidth: `${40 + i * 20}%` }} />
                <div className="w-16 h-3 rounded animate-pulse" style={{ background: "#e5e7eb" }} />
              </div>
            ))}
          </div>
        ) : revenueByMonth.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#fff7ed", color: "#C96E2C" }}
            >
              <Icon name="receipt" size={22} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "#6b7280" }}>
              Aucune facturation enregistrée
            </p>
            <p className="text-[12px] max-w-sm mx-auto" style={{ color: "#c4c8d0" }}>
              Les factures seront créées automatiquement à chaque abonnement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Mois</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Factures</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider w-full" style={{ color: "#c4c8d0" }}>Distribution</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Revenus</th>
                </tr>
              </thead>
              <tbody>
                {revenueByMonth.map((row, i) => {
                  const pct = Math.round((row.total / maxMonthRevenue) * 100);
                  return (
                    <tr
                      key={row.month + i}
                      className="transition-colors hover:bg-black/[0.02]"
                      style={{ borderTop: i > 0 ? "1px solid #f0f0f0" : undefined }}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] font-medium capitalize" style={{ color: "#374151" }}>
                          {row.month}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px]" style={{ color: "#6b7280" }}>
                          {row.count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 w-full">
                        <div className="h-5 rounded-md overflow-hidden" style={{ background: "#f3f4f6", maxWidth: 360 }}>
                          <div
                            className="h-full rounded-md transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, #C96E2C, #e2945a)`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#111827" }}>
                          {fmtEuro(row.total)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e5e7eb" }}>
                  <td className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#c4c8d0" }} colSpan={2}>
                    Total
                  </td>
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3 text-right">
                    <span className="text-[14px] font-bold tabular-nums" style={{ color: "#C96E2C" }}>
                      {fmtEuro(revenueByMonth.reduce((a, r) => a + r.total, 0))}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Active subscribers table ── */}
      <div
        className="rounded-xl border overflow-hidden mb-8"
        style={{ background: "#ffffff", borderColor: "#e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <SectionHeader
          icon="check-circle"
          title="Abonnés actifs"
          count={loading ? undefined : activeSubscribers.length}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Plan</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Valeur / mois</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Valeur / an</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Abonné depuis</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : activeSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-[13px]" style={{ color: "#c4c8d0" }}>
                    Aucun abonné actif pour le moment
                  </td>
                </tr>
              ) : (
                activeSubscribers.map((p, i) => {
                  const initials = getInitials(p.first_name, p.last_name);
                  const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ") || "—";
                  const { bg: planBg, color: planColor } = planBadgeStyle(p.plan);
                  const typeBadge = p.account_type === "planner"
                    ? { label: "Planner", bg: "#dcfce7", color: "#15803d" }
                    : { label: "Couple",  bg: "#dbeafe", color: "#1d4ed8" };

                  return (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-black/[0.02]"
                      style={{
                        borderTop: i > 0 ? "1px solid #f0f0f0" : undefined,
                        background: i % 2 === 0 ? "transparent" : "#fafafa",
                      }}
                    >
                      {/* Client */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: "rgba(201,110,44,0.15)", color: "#C96E2C" }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium truncate max-w-[180px]" style={{ color: "#374151" }}>
                              {fullName}
                            </div>
                            {p.email && (
                              <div className="text-[11px] truncate max-w-[180px] mt-0.5" style={{ color: "#c4c8d0" }}>
                                {p.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5">
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: typeBadge.bg, color: typeBadge.color }}
                        >
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-3.5">
                        <span
                          className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: planBg, color: planColor }}
                        >
                          {planLabel(p.plan)}
                        </span>
                      </td>

                      {/* Monthly value */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#111827" }}>
                          {fmtEuroFromEuros(monthlyValue(p.plan))}
                        </span>
                      </td>

                      {/* Annual value */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[13px] tabular-nums" style={{ color: "#6b7280" }}>
                          {fmtEuroFromEuros(annualValue(p.plan))}
                        </span>
                      </td>

                      {/* Subscribed since */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12.5px]" style={{ color: "#6b7280" }}>
                          {fmtLongDate(p.subscribed_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {!loading && activeSubscribers.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: "2px solid #e5e7eb" }}>
                  <td className="px-5 py-3 text-xs" style={{ color: "#c4c8d0" }} colSpan={3}>
                    {activeSubscribers.length} abonné{activeSubscribers.length > 1 ? "s" : ""}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: "#C96E2C" }}>
                      {fmtEuroFromEuros(kpis.mrr)} / mois
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#6b7280" }}>
                      {fmtEuroFromEuros(kpis.arr)} / an
                    </span>
                  </td>
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Invoices table ── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "#ffffff", borderColor: "#e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <SectionHeader
          icon="file"
          title="Historique des factures"
          count={loading ? undefined : invoices.length}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}># Numéro</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Plan</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Montant</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#c4c8d0" }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 px-6 text-center">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "#dbeafe", color: "#2563eb" }}
                    >
                      <Icon name="file" size={22} />
                    </div>
                    <p className="text-sm font-medium mb-1" style={{ color: "#6b7280" }}>
                      Aucune facture pour le moment
                    </p>
                    <p className="text-[12px] max-w-xs mx-auto" style={{ color: "#c4c8d0" }}>
                      Les factures seront créées automatiquement à chaque activation ou renouvellement d&apos;abonnement.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv, i) => {
                  const profile = profileMap[inv.user_id];
                  const fullName = profile
                    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—"
                    : `User ${inv.user_id.slice(0, 8)}…`;
                  const { label: statusLabel, bg: statusBg, color: statusColor } = invoiceStatusBadge(inv.status);
                  const { bg: planBg, color: planColor } = planBadgeStyle(inv.plan);

                  return (
                    <tr
                      key={inv.id}
                      className="transition-colors hover:bg-black/[0.02]"
                      style={{
                        borderTop: i > 0 ? "1px solid #f0f0f0" : undefined,
                        background: i % 2 === 0 ? "transparent" : "#fafafa",
                      }}
                    >
                      {/* Invoice number */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-mono" style={{ color: "#9ca3af" }}>
                          {inv.invoice_number ?? `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="text-[13px] font-medium" style={{ color: "#374151" }}>
                            {fullName}
                          </span>
                          {profile?.email && (
                            <div className="text-[11px] mt-0.5" style={{ color: "#c4c8d0" }}>
                              {profile.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-3.5">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: planBg, color: planColor }}
                        >
                          {planLabel(inv.plan)}
                        </span>
                        {inv.billing_period && (
                          <div className="text-[10.5px] mt-1" style={{ color: "#c4c8d0" }}>
                            {inv.billing_period}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#111827" }}>
                          {fmtEuro(inv.amount_cents)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12.5px]" style={{ color: "#6b7280" }}>
                          {fmtShortDate(inv.invoice_date)}
                        </span>
                        {inv.paid_at && inv.status === "paid" && (
                          <div className="text-[10.5px] mt-0.5" style={{ color: "#16a34a" }}>
                            Payée le {fmtShortDate(inv.paid_at)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: statusBg, color: statusColor }}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && invoices.length > 0 && (
          <div
            className="flex items-center justify-between px-5 py-3 border-t text-xs"
            style={{ borderColor: "#e5e7eb", color: "#c4c8d0" }}
          >
            <span>
              {invoices.length} facture{invoices.length > 1 ? "s" : ""} au total
            </span>
            <span>
              {invoices.filter((i) => i.status === "paid").length} payée{invoices.filter((i) => i.status === "paid").length > 1 ? "s" : ""}
              {" · "}
              {invoices.filter((i) => i.status === "draft").length} brouillon{invoices.filter((i) => i.status === "draft").length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

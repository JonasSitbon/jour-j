"use client";

// dark theme : background "#0d0d1a" pour la page, "#1a1a2e" pour les cards, "#2a2a3e" pour les borders
// couleur texte principale : "#f0ead8", secondaire : "#9ca3af", tertiaire : "#4b5563"
// accent orange : "#C96E2C" / "#e2945a"

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
  if (plan?.startsWith("planner")) return { bg: "#16562222", color: "#4ade80" };
  if (plan?.startsWith("couple"))  return { bg: "#1e3a5f22", color: "#60a5fa" };
  return { bg: "#2a2a3e", color: "#9ca3af" };
}

// ─── Invoice status badge ──────────────────────────────────────────────────────

function invoiceStatusBadge(status: string): { label: string; bg: string; color: string } {
  switch (status) {
    case "paid":       return { label: "Payée",    bg: "#4ade8022", color: "#4ade80" };
    case "sent":       return { label: "Envoyée",  bg: "#3b82f622", color: "#60a5fa" };
    case "draft":      return { label: "Brouillon",bg: "#2a2a3e",   color: "#6b7280" };
    case "overdue":    return { label: "En retard",bg: "#ef444422", color: "#ef4444" };
    case "cancelled":  return { label: "Annulée",  bg: "#2a2a3e",   color: "#6b7280" };
    default:           return { label: status,     bg: "#2a2a3e",   color: "#6b7280" };
  }
}

// ─── Skeleton components ───────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: "#2a2a3e" }} />
        <div className="w-24 h-3 rounded animate-pulse" style={{ background: "#2a2a3e" }} />
      </div>
      <div className="w-28 h-8 rounded animate-pulse" style={{ background: "#2a2a3e" }} />
    </div>
  );
}

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <tr style={{ borderTop: "1px solid #1e1e30" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 rounded animate-pulse"
            style={{ width: `${55 + ((i * 17) % 40)}%`, background: "#2a2a3e" }}
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
      style={{ borderColor: "#2a2a3e", background: "#0f1117" }}
    >
      <Icon name={icon} size={16} style={{ color: "#C96E2C" }} />
      <h2 className="text-sm font-semibold" style={{ color: "#f0ead8" }}>
        {title}
        {count !== undefined && (
          <span
            className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{ background: "#C96E2C22", color: "#e2945a" }}
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
      color: "#e2945a",
      highlight: false,
    },
    {
      icon: "receipt",
      label: "Total facturé",
      sublabel: "Factures payées",
      value: loading ? null : fmtEuro(kpis.totalRevenue),
      color: "#c084fc",
      highlight: false,
    },
    {
      icon: "check-circle",
      label: "Abonnés actifs",
      sublabel: "Comptes avec abonnement",
      value: loading ? null : String(kpis.activeCount),
      color: "#4ade80",
      highlight: false,
    },
    {
      icon: "clock",
      label: "En essai",
      sublabel: "Période d'essai active",
      value: loading ? null : String(kpis.trialCount),
      color: "#fbbf24",
      highlight: false,
    },
    {
      icon: "zap",
      label: "Taux de conversion",
      sublabel: "Essais → Abonnés",
      value: loading ? null : `${kpis.conversionRate}%`,
      color: "#38bdf8",
      highlight: false,
    },
  ];

  return (
    <div className="p-8 max-w-[1300px] mx-auto" style={{ color: "#f0ead8" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/crm"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "#6b7280" }}
          >
            <Icon name="chevronL" size={15} />
            CRM
          </Link>
          <span style={{ color: "#2a2a3e" }}>|</span>
          <div>
            <h1 className="text-[22px] font-bold flex items-center gap-2.5" style={{ color: "#f0ead8" }}>
              <Icon name="receipt" size={20} style={{ color: "#C96E2C" }} />
              Comptabilité &amp; Revenus
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "#9ca3af" }}>
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
                  background: card.highlight ? `${card.color}12` : "#1a1a2e",
                  borderColor: card.highlight ? `${card.color}44` : "#2a2a3e",
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
                    <div className="text-[10.5px] leading-tight mt-0.5" style={{ color: "#4b5563" }}>
                      {card.sublabel}
                    </div>
                  </div>
                </div>
                <div
                  className="text-[22px] font-bold leading-none tabular-nums"
                  style={{ color: card.highlight ? card.color : "#f0ead8" }}
                >
                  {card.value}
                </div>
              </div>
            ))}
      </div>

      {/* ── Revenue by month ── */}
      <div
        className="rounded-xl border overflow-hidden mb-8"
        style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
      >
        <SectionHeader icon="bars" title="Revenus par mois" />

        {loading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 h-3 rounded animate-pulse" style={{ background: "#2a2a3e" }} />
                <div className="flex-1 h-5 rounded-md animate-pulse" style={{ background: "#2a2a3e", maxWidth: `${40 + i * 20}%` }} />
                <div className="w-16 h-3 rounded animate-pulse" style={{ background: "#2a2a3e" }} />
              </div>
            ))}
          </div>
        ) : revenueByMonth.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#C96E2C18", color: "#C96E2C" }}
            >
              <Icon name="receipt" size={22} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "#9ca3af" }}>
              Aucune facturation enregistrée
            </p>
            <p className="text-[12px] max-w-sm mx-auto" style={{ color: "#4b5563" }}>
              Les factures seront créées automatiquement à chaque abonnement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a3e", background: "#0f1117" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Mois</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Factures</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider w-full" style={{ color: "#4b5563" }}>Distribution</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Revenus</th>
                </tr>
              </thead>
              <tbody>
                {revenueByMonth.map((row, i) => {
                  const pct = Math.round((row.total / maxMonthRevenue) * 100);
                  return (
                    <tr
                      key={row.month + i}
                      className="transition-colors hover:bg-white/[0.03]"
                      style={{ borderTop: i > 0 ? "1px solid #1e1e30" : undefined }}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] font-medium capitalize" style={{ color: "#d1cec8" }}>
                          {row.month}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px]" style={{ color: "#9ca3af" }}>
                          {row.count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 w-full">
                        <div className="h-5 rounded-md overflow-hidden" style={{ background: "#0d0d1a", maxWidth: 360 }}>
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
                        <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#f0ead8" }}>
                          {fmtEuro(row.total)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #2a2a3e" }}>
                  <td className="px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#4b5563" }} colSpan={2}>
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
        style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
      >
        <SectionHeader
          icon="check-circle"
          title="Abonnés actifs"
          count={loading ? undefined : activeSubscribers.length}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a3e", background: "#0f1117" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Plan</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Valeur / mois</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Valeur / an</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Abonné depuis</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : activeSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-[13px]" style={{ color: "#4b5563" }}>
                    Aucun abonné actif pour le moment
                  </td>
                </tr>
              ) : (
                activeSubscribers.map((p, i) => {
                  const initials = getInitials(p.first_name, p.last_name);
                  const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ") || "—";
                  const { bg: planBg, color: planColor } = planBadgeStyle(p.plan);
                  const typeBadge = p.account_type === "planner"
                    ? { label: "Planner", bg: "#16562222", color: "#4ade80" }
                    : { label: "Couple",  bg: "#1e3a5f22", color: "#60a5fa" };

                  return (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-white/[0.03]"
                      style={{
                        borderTop: i > 0 ? "1px solid #1e1e30" : undefined,
                        background: i % 2 === 0 ? "transparent" : "#0a0a14",
                      }}
                    >
                      {/* Client */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: "#C96E2C22", color: "#e2945a" }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium truncate max-w-[180px]" style={{ color: "#d1cec8" }}>
                              {fullName}
                            </div>
                            {p.email && (
                              <div className="text-[11px] truncate max-w-[180px] mt-0.5" style={{ color: "#4b5563" }}>
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
                        <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#f0ead8" }}>
                          {fmtEuroFromEuros(monthlyValue(p.plan))}
                        </span>
                      </td>

                      {/* Annual value */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[13px] tabular-nums" style={{ color: "#9ca3af" }}>
                          {fmtEuroFromEuros(annualValue(p.plan))}
                        </span>
                      </td>

                      {/* Subscribed since */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12.5px]" style={{ color: "#9ca3af" }}>
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
                <tr style={{ borderTop: "2px solid #2a2a3e" }}>
                  <td className="px-5 py-3 text-xs" style={{ color: "#4b5563" }} colSpan={3}>
                    {activeSubscribers.length} abonné{activeSubscribers.length > 1 ? "s" : ""}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: "#C96E2C" }}>
                      {fmtEuroFromEuros(kpis.mrr)} / mois
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#9ca3af" }}>
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
        style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
      >
        <SectionHeader
          icon="file"
          title="Historique des factures"
          count={loading ? undefined : invoices.length}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a3e", background: "#0f1117" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}># Numéro</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Plan</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Montant</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>Statut</th>
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
                      style={{ background: "#1e3a5f22", color: "#60a5fa" }}
                    >
                      <Icon name="file" size={22} />
                    </div>
                    <p className="text-sm font-medium mb-1" style={{ color: "#9ca3af" }}>
                      Aucune facture pour le moment
                    </p>
                    <p className="text-[12px] max-w-xs mx-auto" style={{ color: "#4b5563" }}>
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
                      className="transition-colors hover:bg-white/[0.03]"
                      style={{
                        borderTop: i > 0 ? "1px solid #1e1e30" : undefined,
                        background: i % 2 === 0 ? "transparent" : "#0a0a14",
                      }}
                    >
                      {/* Invoice number */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-mono" style={{ color: "#6b7280" }}>
                          {inv.invoice_number ?? `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="text-[13px] font-medium" style={{ color: "#d1cec8" }}>
                            {fullName}
                          </span>
                          {profile?.email && (
                            <div className="text-[11px] mt-0.5" style={{ color: "#4b5563" }}>
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
                          <div className="text-[10.5px] mt-1" style={{ color: "#4b5563" }}>
                            {inv.billing_period}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#f0ead8" }}>
                          {fmtEuro(inv.amount_cents)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12.5px]" style={{ color: "#9ca3af" }}>
                          {fmtShortDate(inv.invoice_date)}
                        </span>
                        {inv.paid_at && inv.status === "paid" && (
                          <div className="text-[10.5px] mt-0.5" style={{ color: "#4ade8088" }}>
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
            style={{ borderColor: "#2a2a3e", color: "#4b5563" }}
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

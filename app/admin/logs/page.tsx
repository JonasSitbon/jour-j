"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";

type CheckState = "checking" | "ok" | "fail" | "warn";

interface Check {
  id: string;
  label: string;
  desc: string;
  icon: string;
  state: CheckState;
  detail: string;
  latencyMs?: number;
}

interface Metrics {
  profiles: number | null;
  weddings: number | null;
  byType: Record<string, number>;
}

const STATE_META: Record<CheckState, { label: string; color: string; bg: string }> = {
  checking: { label: "Vérification…", color: "#9ca3af", bg: "#9ca3af22" },
  ok:       { label: "Opérationnel",  color: "#4ade80", bg: "#4ade8022" },
  warn:     { label: "Non configuré", color: "#fbbf24", bg: "#fbbf2422" },
  fail:     { label: "Échec",         color: "#f87171", bg: "#f8717122" },
};

function StatusPill({ state }: { state: CheckState }) {
  const m = STATE_META[state];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold shrink-0"
      style={{ background: m.bg, color: m.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

export default function AdminLogsPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ profiles: null, weddings: null, byType: {} });
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  const runChecks = useCallback(async () => {
    setRunning(true);
    const sb = createClient();
    const results: Check[] = [];

    // ── 1. Base de données Supabase (requête timée) ──────────────
    {
      const t0 = performance.now();
      const { error } = await sb.from("profiles").select("id", { count: "exact", head: true });
      const ms = Math.round(performance.now() - t0);
      results.push({
        id: "db", label: "Base de données", icon: "database",
        desc: "Connexion Postgres (Supabase)",
        state: error ? "fail" : "ok",
        detail: error ? error.message : `Requête exécutée en ${ms} ms`,
        latencyMs: ms,
      });
    }

    // ── 2. Authentification ──────────────────────────────────────
    {
      const t0 = performance.now();
      const { data, error } = await sb.auth.getUser();
      const ms = Math.round(performance.now() - t0);
      results.push({
        id: "auth", label: "Authentification", icon: "key",
        desc: "Service Supabase Auth",
        state: error || !data.user ? "fail" : "ok",
        detail: error ? error.message : `Session valide · ${ms} ms`,
        latencyMs: ms,
      });
    }

    // ── 3. Sentry (monitoring d'erreurs) ─────────────────────────
    {
      const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      results.push({
        id: "sentry", label: "Monitoring d'erreurs", icon: "activity",
        desc: "Sentry",
        state: dsn ? "ok" : "warn",
        detail: dsn ? "DSN configuré — capture active" : "Aucun DSN — monitoring inactif",
      });
    }

    // ── 4. Recherche musicale (iTunes via /api) ──────────────────
    {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/music-search?q=test");
        const ms = Math.round(performance.now() - t0);
        const json = await res.json().catch(() => null);
        const ok = res.ok && Array.isArray(json?.results);
        results.push({
          id: "music", label: "Recherche musicale", icon: "music",
          desc: "API iTunes Search",
          state: ok ? "ok" : "fail",
          detail: ok ? `${json.results.length} résultats · ${ms} ms` : `HTTP ${res.status}`,
          latencyMs: ms,
        });
      } catch (e) {
        results.push({
          id: "music", label: "Recherche musicale", icon: "music",
          desc: "API iTunes Search", state: "fail",
          detail: e instanceof Error ? e.message : "Inaccessible",
        });
      }
    }

    // ── 5. Géocodage (Nominatim / OpenStreetMap) ─────────────────
    {
      const t0 = performance.now();
      try {
        const res = await fetch(
          "https://nominatim.openstreetmap.org/search?q=Paris&format=json&limit=1",
          { headers: { "Accept-Language": "fr" } }
        );
        const ms = Math.round(performance.now() - t0);
        results.push({
          id: "geo", label: "Géocodage des lieux", icon: "pin",
          desc: "Nominatim (OpenStreetMap)",
          state: res.ok ? "ok" : "fail",
          detail: res.ok ? `Réponse en ${ms} ms` : `HTTP ${res.status}`,
          latencyMs: ms,
        });
      } catch (e) {
        results.push({
          id: "geo", label: "Géocodage des lieux", icon: "pin",
          desc: "Nominatim (OpenStreetMap)", state: "fail",
          detail: e instanceof Error ? e.message : "Inaccessible",
        });
      }
    }

    // ── 6. Configuration (variables d'environnement) ─────────────
    {
      const envs = [
        ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
        ["NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
      ] as const;
      const missing = envs.filter(([, v]) => !v).map(([k]) => k);
      results.push({
        id: "env", label: "Configuration", icon: "server",
        desc: "Variables d'environnement requises",
        state: missing.length ? "fail" : "ok",
        detail: missing.length ? `Manquante(s) : ${missing.join(", ")}` : "Toutes les variables requises sont présentes",
      });
    }

    setChecks(results);

    // ── Métriques plateforme (super admin) ───────────────────────
    const [{ count: profiles }, { count: weddings }, { data: types }] = await Promise.all([
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("wedding").select("id", { count: "exact", head: true }),
      sb.from("profiles").select("account_type"),
    ]);
    const byType: Record<string, number> = {};
    for (const row of types ?? []) {
      const t = (row as { account_type: string }).account_type ?? "couple";
      byType[t] = (byType[t] || 0) + 1;
    }
    setMetrics({ profiles: profiles ?? null, weddings: weddings ?? null, byType });

    setLastRun(new Date());
    setRunning(false);
  }, []);

  useEffect(() => { runChecks(); }, [runChecks]);

  const okCount = checks.filter((c) => c.state === "ok").length;
  const failCount = checks.filter((c) => c.state === "fail").length;
  const warnCount = checks.filter((c) => c.state === "warn").length;

  return (
    <div className="p-8 max-w-[1100px] mx-auto" style={{ color: "#e8e4dc" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[22px] font-bold flex items-center gap-2.5" style={{ color: "#f0ead8" }}>
            <Icon name="activity" size={20} />
            Logs &amp; Statut système
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "#9ca3af" }}>
            État en temps réel des intégrations et services de la plateforme.
            {lastRun && <> Dernière vérification : {lastRun.toLocaleTimeString("fr-FR")}.</>}
          </p>
        </div>
        <button
          onClick={runChecks}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold shrink-0 transition-colors disabled:opacity-60"
          style={{ background: "#C96E2C", color: "#fffaf2" }}
        >
          <Icon name="refresh" size={15} className={running ? "animate-spin" : ""} />
          {running ? "Vérification…" : "Relancer"}
        </button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: "Opérationnels", value: okCount, color: "#4ade80" },
          { label: "Avertissements", value: warnCount, color: "#fbbf24" },
          { label: "En échec", value: failCount, color: "#f87171" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
            <div className="text-[26px] font-bold leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[12.5px] mt-1.5" style={{ color: "#9ca3af" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste des checks */}
      <div className="rounded-xl border overflow-hidden mb-7" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
        <div className="px-5 py-3 border-b text-[12px] font-semibold uppercase tracking-wider" style={{ borderColor: "#2a2a3e", color: "#6b7280" }}>
          Intégrations &amp; services
        </div>
        {checks.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: "#6b7280" }}>Vérification en cours…</div>
        ) : (
          checks.map((c) => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0" style={{ borderColor: "#2a2a3e" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#22223a", color: "#9ca3af" }}>
                <Icon name={c.icon} size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium" style={{ color: "#e8e4dc" }}>{c.label}</div>
                <div className="text-[12px] mt-0.5" style={{ color: "#6b7280" }}>{c.desc} — {c.detail}</div>
              </div>
              <StatusPill state={c.state} />
            </div>
          ))
        )}
      </div>

      {/* Métriques plateforme */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
        <div className="px-5 py-3 border-b text-[12px] font-semibold uppercase tracking-wider" style={{ borderColor: "#2a2a3e", color: "#6b7280" }}>
          Métriques plateforme
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: "#2a2a3e" }}>
          {[
            { label: "Utilisateurs", value: metrics.profiles, icon: "users" },
            { label: "Mariages", value: metrics.weddings, icon: "rings" },
            { label: "Couples", value: metrics.byType["couple"] ?? 0, icon: "heart" },
            { label: "Wedding planners", value: metrics.byType["planner"] ?? 0, icon: "star" },
          ].map((m) => (
            <div key={m.label} className="px-5 py-4 flex flex-col gap-1" style={{ background: "#1a1a2e" }}>
              <div className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "#6b7280" }}>
                <Icon name={m.icon} size={13} />{m.label}
              </div>
              <div className="text-[22px] font-bold" style={{ color: "#f0ead8" }}>
                {m.value === null ? "—" : m.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

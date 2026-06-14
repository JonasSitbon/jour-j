"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";

type CheckState = "checking" | "ok" | "fail" | "warn" | "optional";
type ErrorLevel = "info" | "warning" | "error" | "critical";

interface Check {
  id: string;
  label: string;
  desc: string;
  icon: string;
  state: CheckState;
  detail: string;
  latencyMs?: number;
}

interface ErrorLog {
  id: string;
  level: ErrorLevel;
  message: string;
  stack: string | null;
  path: string | null;
  notified: boolean;
  resolved: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface Metrics {
  profiles: number | null;
  weddings: number | null;
  byType: Record<string, number>;
}

const STATE_META: Record<CheckState, { label: string; color: string; bg: string }> = {
  checking: { label: "Vérification…",    color: "#9ca3af", bg: "#9ca3af22" },
  ok:       { label: "Opérationnel",     color: "#4ade80", bg: "#4ade8022" },
  warn:     { label: "Non configuré",    color: "#fbbf24", bg: "#fbbf2422" },
  fail:     { label: "Échec",            color: "#f87171", bg: "#f8717122" },
  optional: { label: "Non activé",       color: "#6b7280", bg: "#6b728022" },
};

const LEVEL_META: Record<ErrorLevel, { label: string; color: string; bg: string; icon: string }> = {
  info:     { label: "Info",     color: "#60a5fa", bg: "#60a5fa18", icon: "info"     },
  warning:  { label: "Warning",  color: "#fbbf24", bg: "#fbbf2418", icon: "alert"    },
  error:    { label: "Erreur",   color: "#f87171", bg: "#f8717118", icon: "alert"    },
  critical: { label: "Critique", color: "#ef4444", bg: "#ef444430", icon: "activity" },
};

function StatusPill({ state }: { state: CheckState }) {
  const m = STATE_META[state];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold shrink-0"
      style={{ background: m.bg, color: m.color }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

function LevelBadge({ level }: { level: ErrorLevel }) {
  const m = LEVEL_META[level];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0"
      style={{ background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

export default function AdminLogsPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ profiles: null, weddings: null, byType: {} });
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  // Error logs
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [errorFilter, setErrorFilter] = useState<ErrorLevel | "all">("all");
  const [showStack, setShowStack] = useState<string | null>(null);
  const [errorStats, setErrorStats] = useState<Record<ErrorLevel, number>>({ info: 0, warning: 0, error: 0, critical: 0 });

  const runChecks = useCallback(async () => {
    setRunning(true);
    const sb = createClient();
    const results: Check[] = [];

    // ── 1. Base de données ─────────────────────────────────────────
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

    // ── 2. Authentification ────────────────────────────────────────
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

    // ── 3. Alertes email Resend ────────────────────────────────────
    {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/admin/health");
        const ms = Math.round(performance.now() - t0);
        const json: { resend: boolean; alertEmail: boolean } = await res.json();
        const ok = json.resend && json.alertEmail;
        results.push({
          id: "resend", label: "Alertes email (Resend)", icon: "mail",
          desc: "Notifications erreur/critique par mail",
          state: ok ? "ok" : json.resend ? "warn" : "warn",
          detail: ok
            ? `Configuré — envoi depuis monitoring@the-cockpit.fr · ${ms} ms`
            : !json.resend
              ? "RESEND_API_KEY manquante — alertes désactivées"
              : "MONITORING_ALERT_EMAIL manquant",
          latencyMs: ms,
        });
      } catch {
        results.push({ id: "resend", label: "Alertes email (Resend)", icon: "mail", desc: "Notifications erreur/critique par mail", state: "fail", detail: "Endpoint /api/admin/health inaccessible" });
      }
    }

    // ── 4. Sentry (optionnel) ──────────────────────────────────────
    {
      const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      results.push({
        id: "sentry", label: "Sentry (optionnel)", icon: "activity",
        desc: "Double capture d'erreurs externe — non requis",
        state: dsn ? "ok" : "optional",
        detail: dsn ? "DSN configuré — double capture active" : "Non activé — alertes Resend suffisantes",
      });
    }

    // ── 5. API musique ─────────────────────────────────────────────
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
        results.push({ id: "music", label: "Recherche musicale", icon: "music", desc: "API iTunes Search", state: "fail", detail: e instanceof Error ? e.message : "Inaccessible" });
      }
    }

    // ── 6. Géocodage ───────────────────────────────────────────────
    {
      const t0 = performance.now();
      try {
        const res = await fetch("https://nominatim.openstreetmap.org/search?q=Paris&format=json&limit=1", { headers: { "Accept-Language": "fr" } });
        const ms = Math.round(performance.now() - t0);
        results.push({ id: "geo", label: "Géocodage des lieux", icon: "pin", desc: "Nominatim (OpenStreetMap)", state: res.ok ? "ok" : "fail", detail: res.ok ? `Réponse en ${ms} ms` : `HTTP ${res.status}`, latencyMs: ms });
      } catch (e) {
        results.push({ id: "geo", label: "Géocodage des lieux", icon: "pin", desc: "Nominatim (OpenStreetMap)", state: "fail", detail: e instanceof Error ? e.message : "Inaccessible" });
      }
    }

    // ── 7. Variables d'environnement ───────────────────────────────
    {
      const envs = [
        ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
        ["NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
      ] as const;
      const missing = envs.filter(([, v]) => !v).map(([k]) => k);
      results.push({
        id: "env", label: "Variables d'environnement", icon: "server",
        desc: "Variables requises",
        state: missing.length ? "fail" : "ok",
        detail: missing.length ? `Manquante(s) : ${missing.join(", ")}` : "Toutes présentes",
      });
    }

    setChecks(results);

    // ── Métriques plateforme ───────────────────────────────────────
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

  const loadErrorLogs = useCallback(async () => {
    const sb = createClient();
    const { data } = await sb
      .from("error_logs")
      .select("id, level, message, stack, path, notified, resolved, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(100);

    const logs = (data ?? []) as ErrorLog[];
    setErrorLogs(logs);

    const stats = { info: 0, warning: 0, error: 0, critical: 0 };
    for (const l of logs) stats[l.level] = (stats[l.level] ?? 0) + 1;
    setErrorStats(stats);
  }, []);

  const markResolved = async (id: string) => {
    const sb = createClient();
    await sb.from("error_logs").update({ resolved: true }).eq("id", id);
    setErrorLogs((prev) => prev.map((l) => l.id === id ? { ...l, resolved: true } : l));
  };

  useEffect(() => {
    runChecks();
    loadErrorLogs();
  }, [runChecks, loadErrorLogs]);

  const okCount   = checks.filter((c) => c.state === "ok").length;
  const failCount = checks.filter((c) => c.state === "fail").length;
  const warnCount = checks.filter((c) => c.state === "warn").length;

  const filteredLogs = errorFilter === "all"
    ? errorLogs
    : errorLogs.filter((l) => l.level === errorFilter);

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="p-8 max-w-[1100px] mx-auto" style={{ color: "#e8e4dc" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[22px] font-bold flex items-center gap-2.5" style={{ color: "#f0ead8" }}>
            <Icon name="activity" size={20} />
            Logs &amp; Monitoring
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "#9ca3af" }}>
            État en temps réel des services + suivi des erreurs applicatives.
            {lastRun && <> Dernière vérif : {lastRun.toLocaleTimeString("fr-FR")}.</>}
          </p>
        </div>
        <button onClick={() => { runChecks(); loadErrorLogs(); }} disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold shrink-0 transition-colors disabled:opacity-60"
          style={{ background: "#C96E2C", color: "#fffaf2" }}>
          <Icon name="refresh" size={15} className={running ? "animate-spin" : ""} />
          {running ? "Vérification…" : "Relancer"}
        </button>
      </div>

      {/* Résumé santé */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: "Services OK", value: okCount, color: "#4ade80" },
          { label: "Avertissements", value: warnCount, color: "#fbbf24" },
          { label: "En échec", value: failCount, color: "#f87171" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
            <div className="text-[26px] font-bold leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[12.5px] mt-1.5" style={{ color: "#9ca3af" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Checks */}
      <div className="rounded-xl border overflow-hidden mb-8" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
        <div className="px-5 py-3 border-b text-[12px] font-semibold uppercase tracking-wider" style={{ borderColor: "#2a2a3e", color: "#6b7280" }}>
          Intégrations &amp; services
        </div>
        {checks.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: "#6b7280" }}>Vérification en cours…</div>
        ) : checks.map((c) => (
          <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0" style={{ borderColor: "#2a2a3e" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#22223a", color: "#9ca3af" }}>
              <Icon name={c.icon} size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium" style={{ color: "#e8e4dc" }}>{c.label}</div>
              <div className="text-[12px] mt-0.5" style={{ color: "#6b7280" }}>{c.desc} — {c.detail}</div>
            </div>
            {c.latencyMs !== undefined && (
              <span className="text-[11px] font-mono" style={{ color: c.latencyMs < 200 ? "#4ade80" : c.latencyMs < 800 ? "#fbbf24" : "#f87171" }}>
                {c.latencyMs}ms
              </span>
            )}
            <StatusPill state={c.state} />
          </div>
        ))}
      </div>

      {/* ── Erreurs applicatives ── */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold" style={{ color: "#f0ead8" }}>
          Erreurs applicatives
          {errorStats.critical > 0 && (
            <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#ef444430", color: "#ef4444" }}>
              {errorStats.critical} critique{errorStats.critical > 1 ? "s" : ""}
            </span>
          )}
        </h2>
        <div className="flex gap-1.5">
          {(["all", "critical", "error", "warning", "info"] as const).map((f) => (
            <button key={f} onClick={() => setErrorFilter(f)}
              className="px-3 py-1 rounded-lg text-[12px] font-medium transition-colors"
              style={{
                background: errorFilter === f ? "#C96E2C22" : "#1a1a2e",
                color: errorFilter === f ? "#e2945a" : "#6b7280",
                border: errorFilter === f ? "1px solid #C96E2C44" : "1px solid #2a2a3e",
              }}>
              {f === "all" ? `Tous (${errorLogs.length})` : `${LEVEL_META[f].label} (${errorStats[f]})`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats erreurs */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {(["critical", "error", "warning", "info"] as const).map((l) => {
          const m = LEVEL_META[l];
          return (
            <div key={l} className="rounded-xl p-3.5 border flex items-center gap-3"
              style={{ background: "#1a1a2e", borderColor: errorStats[l] > 0 && l !== "info" ? m.color + "40" : "#2a2a3e" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: m.bg, color: m.color }}>
                <Icon name={m.icon} size={15} />
              </div>
              <div>
                <div className="text-xl font-bold leading-none" style={{ color: errorStats[l] > 0 ? m.color : "#4b5563" }}>{errorStats[l]}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>{m.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border overflow-hidden mb-8" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
        {filteredLogs.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px]" style={{ color: "#4b5563" }}>
            {errorFilter === "all" ? "Aucune erreur enregistrée" : `Aucune erreur de niveau « ${errorFilter} »`}
          </div>
        ) : filteredLogs.map((log, i) => {
          const m = LEVEL_META[log.level];
          const isExpanded = showStack === log.id;
          return (
            <div key={log.id} className="border-b last:border-0" style={{ borderColor: "#2a2a3e", opacity: log.resolved ? 0.45 : 1 }}>
              <div className="flex items-start gap-3 px-5 py-3.5"
                style={{ background: i % 2 === 0 ? "transparent" : "#0f1117" }}>
                <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: m.bg, color: m.color }}>
                  <Icon name={m.icon} size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <LevelBadge level={log.level} />
                    {log.path && (
                      <span className="text-[11px] font-mono" style={{ color: "#4b5563" }}>{log.path}</span>
                    )}
                    {log.notified && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#fbbf2418", color: "#fbbf24" }}>
                        webhook envoyé
                      </span>
                    )}
                    {log.resolved && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#4ade8018", color: "#4ade80" }}>
                        résolu
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] mt-1 font-mono leading-snug" style={{ color: "#d1cec8" }}>
                    {log.message}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px]" style={{ color: "#4b5563" }}>{fmtDate(log.created_at)}</span>
                    {log.stack && (
                      <button onClick={() => setShowStack(isExpanded ? null : log.id)}
                        className="text-[11px] underline transition-colors hover:opacity-80"
                        style={{ color: "#6b7280" }}>
                        {isExpanded ? "Masquer" : "Stack trace"}
                      </button>
                    )}
                    {!log.resolved && (
                      <button onClick={() => markResolved(log.id)}
                        className="text-[11px] underline transition-colors hover:opacity-80"
                        style={{ color: "#4ade80" }}>
                        Marquer résolu
                      </button>
                    )}
                  </div>
                  {isExpanded && log.stack && (
                    <pre className="mt-2 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed max-h-48"
                      style={{ background: "#0a0a14", color: "#9ca3af" }}>
                      {log.stack}
                    </pre>
                  )}
                </div>
                <span className="text-[10px] shrink-0" style={{ color: "#2a2a3e" }}>#{log.id.slice(0, 6)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Métriques plateforme */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
        <div className="px-5 py-3 border-b text-[12px] font-semibold uppercase tracking-wider" style={{ borderColor: "#2a2a3e", color: "#6b7280" }}>
          Métriques plateforme
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: "#2a2a3e" }}>
          {[
            { label: "Utilisateurs",      value: metrics.profiles,            icon: "users" },
            { label: "Mariages",          value: metrics.weddings,            icon: "rings" },
            { label: "Couples",           value: metrics.byType["couple"]  ?? 0, icon: "heart" },
            { label: "Wedding planners",  value: metrics.byType["planner"] ?? 0, icon: "star"  },
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

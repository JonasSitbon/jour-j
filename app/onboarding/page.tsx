"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, Icon } from "@/components/icon";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { seedDefaultTasks, seedDefaultDayJ, seedDefaultBudget, seedDefaultDateCandidates, seedDefaultTables } from "@/lib/seed";

type AccountType = "couple" | "planner";
type Step = 1 | 2 | 3;

// ─── Period helpers ───────────────────────────────────────────────────────────

const SEASON_DATA = [
  { label: "Printemps", emoji: "🌸", startMonth: 3,  approxMonth: "05" },
  { label: "Été",       emoji: "☀️",  startMonth: 6,  approxMonth: "07" },
  { label: "Automne",   emoji: "🍂", startMonth: 9,  approxMonth: "10" },
  { label: "Hiver",     emoji: "❄️",  startMonth: 12, approxMonth: "12" },
] as const;

function getAvailablePeriods() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const periods: Array<{ value: string; emoji: string; approxDate: string | null }> = [];
  for (const year of [currentYear, currentYear + 1, currentYear + 2]) {
    for (const s of SEASON_DATA) {
      if (year === currentYear && s.startMonth < currentMonth) continue;
      periods.push({ value: `${s.label} ${year}`, emoji: s.emoji, approxDate: `${year}-${s.approxMonth}-15` });
    }
  }
  periods.push({ value: "Je ne sais pas encore", emoji: "🤷", approxDate: null });
  return periods;
}

function periodToApproxDate(period: string): string | null {
  return getAvailablePeriods().find((p) => p.value === period)?.approxDate ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Compte" },
  { num: 2, label: "Mariage" },
  { num: 3, label: "Finalisation" },
];

const LOADING_MESSAGES = [
  "Création de votre espace...",
  "Configuration des tâches par défaut...",
  "Préparation du tableau de bord...",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    partnerA: "",
    partnerB: "",
    period: "",
    venue: "",
    city: "",
    theme: "",
    guestTarget: "100",
    budgetTotal: "20000",
    workspaceName: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // ─── Step 1 → Step 2 ───────────────────────────────────────────────────────
  const goToStep2 = async () => {
    if (!accountType) return;
    setErr("");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { router.push("/login"); return; }
    await sb.from("profiles").update({ account_type: accountType }).eq("id", user.id);
    setStep(2);
  };

  // ─── Step 2 → Step 3 (submit & seed) ─────────────────────────────────────
  const goToStep3 = async () => {
    setErr("");
    if (!form.partnerA || !form.partnerB) {
      setErr("Les prénoms des mariés sont obligatoires."); return;
    }
    if (!form.period) {
      setErr("Veuillez sélectionner une période pour le mariage."); return;
    }

    setStep(3);

    let msgIdx = 0;
    setLoadingMsg(0);
    const interval = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, LOADING_MESSAGES.length - 1);
      setLoadingMsg(msgIdx);
    }, 1200);

    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const approxDate = periodToApproxDate(form.period);

      const { data: newWedding, error } = await sb.from("wedding").insert({
        partner_a: form.partnerA.trim(),
        partner_b: form.partnerB.trim(),
        date: approxDate,
        venue: form.venue.trim(),
        city: form.city.trim(),
        theme: form.theme.trim(),
        guest_target: parseInt(form.guestTarget) || 100,
        budget_total: parseInt(form.budgetTotal) || 20000,
        user_id: user.id,
        name: accountType === "planner" ? form.workspaceName.trim() || null : null,
      }).select("id").single();

      if (error || !newWedding) {
        clearInterval(interval);
        setErr(error?.message ?? "Erreur création mariage");
        setStep(2);
        return;
      }

      const wId = newWedding.id;
      const budget = parseInt(form.budgetTotal) || 20000;
      await Promise.all([
        seedDefaultTasks(sb, wId, approxDate ?? ""),
        seedDefaultDayJ(sb, wId),
        seedDefaultBudget(sb, wId, budget),
        seedDefaultDateCandidates(sb, wId, approxDate ?? ""),
        seedDefaultTables(sb, wId),
      ]);

      clearInterval(interval);
      window.location.href = "/dashboard";
    } catch (e: unknown) {
      clearInterval(interval);
      setErr(e instanceof Error ? e.message : "Une erreur est survenue");
      setStep(2);
    }
  };

  const periods = getAvailablePeriods();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 py-12" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 text-primary"><Logo size={34} /></div>
            <div className="text-[17px] font-semibold">Jour <b>J</b></div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-[13px] text-text-3 hover:text-text transition">
            <Icon name="logout" size={15} />Se déconnecter
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-start mb-10">
          {STEPS.map((s, i) => {
            const isCurrent = s.num === step;
            const isDone = s.num < step;
            return (
              <div key={s.num} className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  <div className={`flex-1 h-[2px] ${i === 0 ? "invisible" : isDone || isCurrent ? "bg-sage" : "bg-surface-3"}`} />
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 transition-colors
                      ${isCurrent ? "bg-primary text-white" : isDone ? "bg-sage text-white" : "bg-surface-3 text-text-3"}`}
                  >
                    {isDone ? <Icon name="check" size={14} /> : s.num}
                  </div>
                  <div className={`flex-1 h-[2px] ${i === STEPS.length - 1 ? "invisible" : isDone ? "bg-sage" : "bg-surface-3"}`} />
                </div>
                <div className={`mt-1.5 text-[11.5px] font-medium ${isCurrent ? "text-primary" : isDone ? "text-text-2" : "text-text-3"}`}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="flex flex-col gap-6 p-7 rounded-card border" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
            <div>
              <h1 className="text-[26px] font-semibold tracking-[-.03em] mb-1">Bienvenue sur The Cockpit !</h1>
              <p className="text-text-2 text-[14.5px]">Vous êtes...</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType("couple")}
                className={`flex flex-col items-start gap-3 p-5 rounded-xl border text-left transition
                  ${accountType === "couple"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-line hover:border-text-3"}`}
              >
                <span className="text-2xl">💍</span>
                <div>
                  <div className="text-[14.5px] font-semibold">Couple</div>
                  <div className="text-[12.5px] text-text-2 mt-0.5">Nous planifions notre mariage</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType("planner")}
                className={`flex flex-col items-start gap-3 p-5 rounded-xl border text-left transition
                  ${accountType === "planner"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-line hover:border-text-3"}`}
              >
                <span className="text-2xl">📋</span>
                <div>
                  <div className="text-[14.5px] font-semibold">Wedding planner</div>
                  <div className="text-[12.5px] text-text-2 mt-0.5">Je gère des mariages pour mes clients</div>
                </div>
              </button>
            </div>

            <Button variant="primary" size="lg" block type="button" disabled={!accountType} onClick={goToStep2}>
              Continuer →
            </Button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5 p-7 rounded-card border" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
            <div>
              <h1 className="text-[22px] font-semibold tracking-[-.03em] mb-1">
                {accountType === "planner" ? "Votre premier mariage" : "Votre mariage"}
              </h1>
              <p className="text-text-2 text-[13.5px]">
                {accountType === "planner"
                  ? "Créez votre premier espace client."
                  : "Quelques infos pour personnaliser votre tableau de bord."}
              </p>
            </div>

            {accountType === "planner" && (
              <Field label="Nom de l'espace *">
                <Input value={form.workspaceName} onChange={set("workspaceName")} placeholder="Mariage de Camille & Alex" />
              </Field>
            )}

            {/* Partners */}
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3 mb-3 flex items-center gap-2">
                <Icon name="rings" size={14} />Les mariés
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom A *">
                  <Input value={form.partnerA} onChange={set("partnerA")} placeholder="Camille" />
                </Field>
                <Field label="Prénom B *">
                  <Input value={form.partnerB} onChange={set("partnerB")} placeholder="Alex" />
                </Field>
              </div>
            </div>

            {/* Period selector */}
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3 mb-3 flex items-center gap-2">
                <Icon name="calendar" size={14} />
                Période envisagée {accountType === "couple" ? "*" : "(optionnelle)"}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {periods.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, period: p.value }))}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-center transition text-[13px] font-medium
                      ${form.period === p.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-primary"
                        : "border-line hover:border-text-3 text-text-2"}`}
                  >
                    <span className="text-[18px] leading-none">{p.emoji}</span>
                    <span className="leading-tight">{p.value}</span>
                  </button>
                ))}
              </div>
              {form.period && (
                <p className="mt-2 text-[12px] text-text-3">
                  Vous pourrez affiner la date exacte depuis le sélecteur de dates de l&apos;app.
                </p>
              )}
            </div>

            {/* Couple-only fields */}
            {accountType === "couple" && (
              <>
                <div>
                  <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3 mb-3 flex items-center gap-2">
                    <Icon name="calendar" size={14} />Le lieu
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Lieu / domaine">
                      <Input value={form.venue} onChange={set("venue")} placeholder="Domaine des Tilleuls" />
                    </Field>
                    <Field label="Ville">
                      <Input value={form.city} onChange={set("city")} placeholder="Aix-en-Provence" />
                    </Field>
                  </div>
                </div>
                <Field label="Style / thème">
                  <Input value={form.theme} onChange={set("theme")} placeholder="Champêtre élégant" />
                </Field>
              </>
            )}

            {/* Estimations */}
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3 mb-3 flex items-center gap-2">
                <Icon name="wallet" size={14} />Estimations
              </div>
              <div className="grid grid-cols-2 gap-3">
                {accountType === "couple" && (
                  <Field label="Nombre d'invités">
                    <Input type="number" value={form.guestTarget} onChange={set("guestTarget")} placeholder="100" min="1" />
                  </Field>
                )}
                <Field label="Budget total (€)">
                  <Input type="number" value={form.budgetTotal} onChange={set("budgetTotal")} placeholder="20000" min="0" />
                </Field>
              </div>
            </div>

            {accountType === "planner" && (
              <p className="text-[12.5px] text-text-3 border border-line rounded-lg px-3 py-2.5" style={{ background: "var(--surface-2)" }}>
                Vous pourrez créer d&apos;autres mariages depuis votre tableau de bord.
              </p>
            )}

            {err && (
              <div className="flex items-center gap-2 text-[13.5px] px-3 py-2 rounded-lg" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
                <Icon name="alert" size={14} />{err}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="ghost" size="lg" type="button" onClick={() => setStep(1)}>
                ← Retour
              </Button>
              <Button variant="primary" size="lg" block type="button" onClick={goToStep3}>
                Continuer →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="flex flex-col items-center gap-6 p-10 rounded-card border text-center" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
            <div className="w-12 h-12 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            <div>
              <h1 className="text-[20px] font-semibold tracking-[-.025em] mb-2">Création en cours</h1>
              <p className="text-text-2 text-[14px] min-h-[20px] transition-all">{LOADING_MESSAGES[loadingMsg]}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

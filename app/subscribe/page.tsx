"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo, Icon } from "@/components/icon";
import { createClient } from "@/lib/supabase";

interface TrialInfo {
  daysLeft: number;       // <0 = expiré
  isSubscribed: boolean;
}

interface Pricing { price: string; period: string; id: string; sub?: string; }
interface Plan { id: string; name: string; monthly: Pricing; annual: Pricing; color: string; highlight?: boolean; features: string[]; }

const PLANS: Plan[] = [
  {
    id: "couple",
    name: "Couple",
    monthly: { price: "3€",   period: "/ mois", id: "couple_monthly" },
    annual:  { price: "30€",  period: "/ an",   id: "couple_annual",  sub: "soit 2,50€/mois — économisez 6€" },
    color: "#C96E2C",
    features: [
      "Tableau de bord complet",
      "Invités & RSVP illimités",
      "Budget & paiements",
      "Planning & checklist",
      "Partage collaboratif",
      "Mode Jour J",
    ],
  },
  {
    id: "planner",
    name: "Wedding Planner",
    monthly: { price: "12€",  period: "/ mois", id: "planner_monthly" },
    annual:  { price: "120€", period: "/ an",   id: "planner_annual", sub: "soit 10€/mois — économisez 24€" },
    color: "#7E9A63",
    highlight: true,
    features: [
      "Tout le plan Couple",
      "Gestion multi-mariages",
      "Espace prestataires avancé",
      "Export PDF professionnel",
      "Accès prioritaire",
      "Support dédié",
    ],
  },
];

export default function SubscribePage() {
  const [annual, setAnnual] = useState(false);
  const [trial, setTrial] = useState<TrialInfo | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await createClient()
        .from("profiles")
        .select("trial_ends_at, is_subscribed")
        .eq("id", user.id)
        .single();
      if (!data) return;
      const daysLeft = data.trial_ends_at
        ? Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / 86_400_000)
        : -999;
      setTrial({ daysLeft, isSubscribed: data.is_subscribed ?? false });
    });
  }, []);

  const expired  = trial && trial.daysLeft <= 0 && !trial.isSubscribed;
  const inTrial  = trial && trial.daysLeft > 0  && !trial.isSubscribed;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 py-14"
      style={{ background: "var(--bg)" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 text-primary"><Logo size={34} /></div>
        <div className="text-[17px] font-semibold">Jour <b>J</b></div>
      </div>

      {/* Header */}
      <div className="text-center mb-8 max-w-[500px]">
        {expired ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-4"
            style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
            <Icon name="clock" size={13} />
            Votre essai gratuit a expiré
          </div>
        ) : inTrial ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-4"
            style={{ background: "rgba(201,110,44,0.08)", color: "var(--primary)" }}>
            <Icon name="sparkle" size={13} />
            Essai gratuit — {trial!.daysLeft} jour{trial!.daysLeft > 1 ? "s" : ""} restant{trial!.daysLeft > 1 ? "s" : ""}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-4"
            style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" }}>
            <Icon name="key" size={13} />
            Choisissez votre plan
          </div>
        )}

        <h1 className="text-[28px] font-semibold tracking-[-.025em] mb-3">
          {expired
            ? "Continuez à organiser votre mariage"
            : "Un plan pour chaque projet"}
        </h1>
        <p className="text-[14.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>
          {expired
            ? "Choisissez le plan qui vous correspond. Accès immédiat, sans engagement mensuel."
            : "Choisissez la formule adaptée à votre mariage ou à votre activité de wedding planner."}
        </p>
      </div>

      {/* Toggle mensuel / annuel */}
      <div className="flex items-center gap-3 mb-8 p-1 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <button onClick={() => setAnnual(false)}
          className="px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all"
          style={{
            background: !annual ? "var(--bg)" : "transparent",
            color: !annual ? "var(--text)" : "var(--text-3)",
            boxShadow: !annual ? "0 1px 3px rgba(0,0,0,.08)" : undefined,
          }}>
          Mensuel
        </button>
        <button onClick={() => setAnnual(true)}
          className="px-5 py-2 rounded-lg text-[13.5px] font-semibold transition-all flex items-center gap-2"
          style={{
            background: annual ? "var(--bg)" : "transparent",
            color: annual ? "var(--text)" : "var(--text-3)",
            boxShadow: annual ? "0 1px 3px rgba(0,0,0,.08)" : undefined,
          }}>
          Annuel
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "color-mix(in srgb, var(--sage) 15%, transparent)", color: "var(--sage)" }}>
            -17%
          </span>
        </button>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[660px] mb-8">
        {PLANS.map((plan) => {
          const pricing = annual ? plan.annual : plan.monthly;
          return (
            <div key={plan.id}
              className="rounded-2xl border p-6 flex flex-col gap-4 relative"
              style={{
                background: plan.highlight ? "color-mix(in srgb, var(--primary) 4%, var(--surface))" : "var(--surface)",
                borderColor: plan.highlight ? "var(--primary)" : "var(--line)",
                boxShadow: plan.highlight ? "0 0 0 1px var(--primary)" : undefined,
              }}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
                  style={{ background: "var(--primary)", color: "#fff" }}>
                  Recommandé
                </span>
              )}

              <div>
                <div className="text-[13px] font-semibold mb-1" style={{ color: plan.color }}>{plan.name}</div>
                <div className="flex items-end gap-1.5">
                  <span className="text-[36px] font-bold tracking-tight leading-none">{pricing.price}</span>
                  <span className="text-[14px] mb-1" style={{ color: "var(--text-2)" }}>{pricing.period}</span>
                </div>
                {annual && "sub" in pricing && (
                  <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>
                    {pricing.sub}
                  </p>
                )}
              </div>

              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13.5px]">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in srgb, ${plan.color} 15%, transparent)`, color: plan.color }}>
                      <Icon name="check" size={10} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <a href={`mailto:contact@the-cockpit.fr?subject=Abonnement Jour J — ${plan.name} ${annual ? "annuel" : "mensuel"}&body=Bonjour, je souhaite souscrire au plan ${plan.name} (${pricing.price}${pricing.period}).`}
                className="mt-2 w-full py-3 rounded-xl text-center text-[14px] font-semibold transition-opacity hover:opacity-85 block"
                style={{ background: plan.color, color: "#fff" }}>
                Souscrire au plan {plan.name}
              </a>
            </div>
          );
        })}
      </div>

      <p className="text-[12.5px] text-center max-w-[400px]" style={{ color: "var(--text-3)" }}>
        Paiement sécurisé. Envoyez-nous un email et nous activerons votre compte manuellement sous 24h.
      </p>

      {inTrial && (
        <Link href="/dashboard" className="mt-6 text-[13.5px] font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--primary)" }}>
          ← Retour à mon espace (essai encore actif)
        </Link>
      )}

      <Link href="/" className="mt-4 text-[13px] transition-opacity hover:opacity-60"
        style={{ color: "var(--text-3)" }}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

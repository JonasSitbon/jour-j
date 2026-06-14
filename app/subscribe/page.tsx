import Link from "next/link";
import type { Metadata } from "next";
import { Logo, Icon } from "@/components/icon";

export const metadata: Metadata = { title: "Choisir un plan | Jour J" };

const PLANS: Array<{
  id: string; name: string; price: string; period: string; annual: string;
  color: string; highlight?: boolean; features: readonly string[]; cta: string;
}> = [
  {
    id: "couple_monthly",
    name: "Couple",
    price: "3€",
    period: "/ mois",
    annual: "ou 30€/an — économisez 6€",
    color: "#C96E2C",
    features: [
      "Tableau de bord complet",
      "Invités & RSVP illimités",
      "Budget & paiements",
      "Planning & checklist",
      "Partage collaboratif",
      "Mode Jour J",
    ],
    cta: "Commencer avec Couple",
  },
  {
    id: "planner_monthly",
    name: "Wedding Planner",
    price: "12€",
    period: "/ mois",
    annual: "ou 120€/an — économisez 24€",
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
    cta: "Commencer avec Planner",
  },
] as const;

export default function SubscribePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--bg)" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 text-primary"><Logo size={34} /></div>
        <div className="text-[17px] font-semibold">Jour <b>J</b></div>
      </div>

      {/* Header */}
      <div className="text-center mb-10 max-w-[480px]">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-4"
          style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
          <Icon name="clock" size={13} />
          Votre essai gratuit a expiré
        </div>
        <h1 className="text-[30px] font-semibold tracking-[-.025em] mb-3">
          Continuez à organiser votre mariage
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-2)" }}>
          Choisissez le plan qui correspond à vos besoins.
          Accès immédiat, sans engagement mensuel.
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[640px] mb-8">
        {PLANS.map((plan) => (
          <div key={plan.id}
            className="rounded-2xl border p-6 flex flex-col gap-4 relative"
            style={{
              background: plan.highlight ? "color-mix(in srgb, var(--primary) 4%, var(--surface))" : "var(--surface)",
              borderColor: plan.highlight ? "var(--primary)" : "var(--line)",
              boxShadow: plan.highlight ? "0 0 0 1px var(--primary)" : undefined,
            }}>
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: "var(--primary)", color: "#fff" }}>
                Recommandé
              </span>
            )}
            <div>
              <div className="text-[13px] font-semibold mb-1" style={{ color: plan.color }}>{plan.name}</div>
              <div className="flex items-end gap-1">
                <span className="text-[36px] font-bold tracking-tight leading-none">{plan.price}</span>
                <span className="text-[14px] mb-1" style={{ color: "var(--text-2)" }}>{plan.period}</span>
              </div>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>{plan.annual}</p>
            </div>

            <ul className="flex flex-col gap-2.5">
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

            <Link href={`mailto:contact@the-cockpit.fr?subject=Abonnement Jour J — ${plan.name}`}
              className="mt-auto w-full py-3 rounded-xl text-center text-[14px] font-semibold transition-opacity hover:opacity-85"
              style={{ background: plan.color, color: "#fff" }}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-[12.5px] text-center max-w-[380px]" style={{ color: "var(--text-3)" }}>
        Paiement sécurisé. Pour activer votre abonnement, contactez-nous par email
        et nous activerons votre compte manuellement sous 24h.
      </p>

      <Link href="/" className="mt-6 text-[13px] transition-opacity hover:opacity-70"
        style={{ color: "var(--text-3)" }}>
        ← Retour à l&apos;accueil
      </Link>
    </div>
  );
}

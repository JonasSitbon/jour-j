"use client";

import { useState } from "react";
import Link from "next/link";
import { TC, WARM_SOFT, TEXT_DARK, TEXT_MID, TEXT_LIGHT } from "./tokens";
import { FadeIn, Pill } from "./shared";

const Check = () => (
  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${TC}18` }}>
    <svg width="10" height="10" viewBox="0 0 10 10">
      <path d="M2 5l2.5 2.5 4-4" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  </div>
);

const Cross = () => (
  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(0,0,0,0.06)" }}>
    <svg width="10" height="10" viewBox="0 0 10 10">
      <path d="M3 3l4 4M7 3l-4 4" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

const coupleFeatures = [
  { label: "1 espace mariage", ok: true },
  { label: "16 modules complets", ok: true },
  { label: "Invités & RSVP illimités", ok: true },
  { label: "Exports PDF", ok: true },
  { label: "Collaboration (partenaire + témoins)", ok: true },
  { label: "Plan de table visuel", ok: true },
  { label: "Météo & sélecteur de dates", ok: true },
  { label: "Données sécurisées", ok: true },
  { label: "Plusieurs mariages simultanés", ok: false },
  { label: "Archivage clients", ok: false },
];

const plannerFeatures = [
  { label: "5 mariages actifs simultanément", ok: true },
  { label: "16 modules complets par mariage", ok: true },
  { label: "Archivage illimité (consultation seule)", ok: true },
  { label: "Exports PDF", ok: true },
  { label: "Collaboration multi-utilisateurs par mariage", ok: true },
  { label: "Plan de table visuel", ok: true },
  { label: "Météo & sélecteur de dates", ok: true },
  { label: "Données sécurisées", ok: true },
  { label: "Tableau de bord multi-mariages", ok: true },
  { label: "Rôles personnalisés par client", ok: true },
];

export default function PricingCTA() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 px-6" style={{ background: WARM_SOFT }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-12">
            <Pill>Tarifs</Pill>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold mt-4 mb-4 tracking-tight" style={{ color: TEXT_DARK }}>
              Simple et transparent.
            </h2>
            <p className="text-[16px] mb-8 leading-relaxed max-w-xl mx-auto" style={{ color: TEXT_MID }}>
              7 jours d&apos;essai gratuit, sans carte bancaire. Accès complet dès le premier jour.
            </p>

            {/* Toggle annuel / mensuel */}
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-2 py-1.5 shadow-sm border"
              style={{ borderColor: "rgba(201,110,44,0.15)" }}>
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${!annual ? "text-white" : ""}`}
                style={{ background: !annual ? TC : "transparent", color: !annual ? "#fff" : TEXT_MID }}>
                Mensuel
              </button>
              <button
                onClick={() => setAnnual(true)}
                className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-2"
                style={{ background: annual ? TC : "transparent", color: annual ? "#fff" : TEXT_MID }}>
                Annuel
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: annual ? "rgba(255,255,255,0.25)" : `${TC}18`, color: annual ? "#fff" : TC }}>
                  −17%
                </span>
              </button>
            </div>
          </div>
        </FadeIn>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Couple */}
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border p-8 h-full flex flex-col"
              style={{ background: "#FFFFFF", borderColor: "rgba(201,110,44,0.12)", boxShadow: "0 8px 32px rgba(56,47,35,0.08)" }}>
              <div className="mb-6">
                <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: TC }}>Couple</div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-5xl font-bold" style={{ color: TEXT_DARK }}>
                    {annual ? "30€" : "3€"}
                  </span>
                  <span className="text-[14px] mb-1.5" style={{ color: TEXT_LIGHT }}>
                    {annual ? "/ an" : "/ mois"}
                  </span>
                </div>
                {annual && (
                  <p className="text-[12px]" style={{ color: TEXT_LIGHT }}>soit 2,50€/mois — économisez 6€</p>
                )}
                <p className="text-[13.5px] mt-3 leading-relaxed" style={{ color: TEXT_MID }}>
                  Tout ce qu&apos;il faut pour organiser votre mariage de A à Z, ensemble.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mb-8 flex-1">
                {coupleFeatures.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5 text-[13.5px]" style={{ color: f.ok ? TEXT_MID : "rgba(0,0,0,0.3)" }}>
                    {f.ok ? <Check /> : <Cross />}
                    {f.label}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Link href="/signup"
                  className="block w-full py-3.5 rounded-xl text-[15px] font-bold text-white text-center transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: TC, boxShadow: `0 10px 28px ${TC}40` }}>
                  Essayer 7 jours gratuitement →
                </Link>
                <p className="text-center text-[12px]" style={{ color: TEXT_LIGHT }}>
                  Sans carte bancaire · Annulation à tout moment
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Plan Planner */}
          <FadeIn delay={0.2}>
            <div className="rounded-2xl border-2 p-8 h-full flex flex-col relative overflow-hidden"
              style={{ background: "#FFFFFF", borderColor: TC, boxShadow: `0 12px 40px ${TC}25` }}>
              {/* Badge */}
              <div className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1 rounded-full text-white"
                style={{ background: TC }}>
                PRO
              </div>

              <div className="mb-6">
                <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: TC }}>Wedding Planner</div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-5xl font-bold" style={{ color: TEXT_DARK }}>
                    {annual ? "120€" : "12€"}
                  </span>
                  <span className="text-[14px] mb-1.5" style={{ color: TEXT_LIGHT }}>
                    {annual ? "/ an" : "/ mois"}
                  </span>
                </div>
                {annual ? (
                  <p className="text-[12px]" style={{ color: TEXT_LIGHT }}>soit 10€/mois — économisez 24€</p>
                ) : (
                  <p className="text-[12px]" style={{ color: TEXT_LIGHT }}>facturation mensuelle</p>
                )}
                <p className="text-[13.5px] mt-3 leading-relaxed" style={{ color: TEXT_MID }}>
                  Gérez jusqu&apos;à 5 mariages actifs en simultané avec un historique complet de vos clients passés.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mb-8 flex-1">
                {plannerFeatures.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5 text-[13.5px]" style={{ color: f.ok ? TEXT_MID : "rgba(0,0,0,0.3)" }}>
                    {f.ok ? <Check /> : <Cross />}
                    {f.label}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Link href="/signup"
                  className="block w-full py-3.5 rounded-xl text-[15px] font-bold text-white text-center transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: TC, boxShadow: `0 10px 28px ${TC}40` }}>
                  Essayer 7 jours gratuitement →
                </Link>
                <p className="text-center text-[12px]" style={{ color: TEXT_LIGHT }}>
                  Sans carte bancaire · Annulation à tout moment
                </p>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Mention essai */}
        <FadeIn delay={0.3}>
          <div className="mt-8 text-center">
            <p className="text-[13px]" style={{ color: TEXT_LIGHT }}>
              Déjà un compte ?{" "}
              <Link href="/login" className="underline hover:opacity-80 transition-opacity" style={{ color: TC }}>
                Se connecter
              </Link>
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

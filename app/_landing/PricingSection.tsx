"use client";

import Link from "next/link";
import { TC, WARM_SOFT, TEXT_DARK, TEXT_MID, TEXT_LIGHT } from "./tokens";
import { FadeIn, Pill } from "./shared";

export default function PricingCTA() {
  const features = [
    "16 modules complets", "Invités illimités",
    "Collaboration multi-users", "Exports PDF",
    "Partage lecture seule", "Plan de table visuel",
    "Météo pour choisir votre date", "Données sécurisées",
    "Mode couple & wedding planner", "Mises à jour continues",
  ];

  return (
    <section id="pricing" className="py-24 px-6" style={{ background: WARM_SOFT }}>
      <div className="max-w-3xl mx-auto text-center">
        <FadeIn>
          <Pill>Tarifs</Pill>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold mt-4 mb-4 tracking-tight" style={{ color: TEXT_DARK }}>
            Gratuit.<br /><span style={{ color: TC }}>Pour toujours.</span>
          </h2>
          <p className="text-[16px] mb-10 leading-relaxed" style={{ color: TEXT_MID }}>
            Jour J est 100% gratuit. Pas d&apos;essai, pas de carte bancaire, pas de limite de temps. Tous les modules, tous les exports, toutes les fonctionnalités.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="rounded-2xl border p-8 md:p-10 mb-8"
            style={{ background: "#FFFFFF", borderColor: "rgba(201,110,44,0.12)", boxShadow: "0 8px 32px rgba(56,47,35,0.1)" }}>
            <div className="text-6xl font-bold mb-1" style={{ color: TC }}>0€</div>
            <div className="text-[14px] mb-8" style={{ color: TEXT_LIGHT }}>Pour toujours</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[13.5px]" style={{ color: TEXT_MID }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${TC}18` }}>
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <path d="M2 5l2.5 2.5 4-4" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
            <Link href="/signup"
              className="block w-full py-4 rounded-xl text-[16px] font-bold text-white text-center transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: TC, boxShadow: `0 12px 36px ${TC}45` }}>
              Créer mon espace gratuitement →
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-[13px]" style={{ color: TEXT_LIGHT }}>
            Déjà un compte ?{" "}
            <Link href="/login" className="underline hover:opacity-80 transition-opacity" style={{ color: TC }}>
              Se connecter
            </Link>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

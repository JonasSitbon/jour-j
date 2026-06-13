"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TC, TEXT_DARK, TEXT_MID } from "./tokens";
import { FadeIn, Pill } from "./shared";

const FAQS = [
  { q: "Jour J est-il vraiment gratuit ?", a: "Oui, complètement et sans limite. Aucune carte bancaire n'est requise. Tous les modules sont accessibles dès la création de votre compte." },
  { q: "Combien de mariages puis-je gérer ?", a: "Jusqu'à 5 mariages par compte. Les wedding planners peuvent gérer plusieurs clients depuis le même tableau de bord avec une interface dédiée." },
  { q: "Puis-je collaborer avec mon partenaire ou ma wedding planner ?", a: "Oui ! Vous pouvez inviter des collaborateurs avec différents rôles : Administrateur, Éditeur ou Lecteur. Chaque rôle a des permissions précises." },
  { q: "Mes données sont-elles sécurisées ?", a: "Vos données sont hébergées sur des serveurs sécurisés et chiffrées. Seul vous et vos collaborateurs autorisés y ont accès — nous ne partageons jamais vos informations." },
  { q: "L'application fonctionne-t-elle sur mobile ?", a: "Oui, Jour J fonctionne sur tous les appareils — téléphone, tablette, ordinateur. Vous pouvez même l'installer sur votre écran d'accueil iOS ou Android, comme une vraie application." },
  { q: "Puis-je exporter mes données ?", a: "Oui, vous pouvez exporter votre liste d'invités en CSV, votre budget en PDF, votre plan de table, votre playlist et bien plus. Toutes vos données vous appartiennent." },
  { q: "Comment fonctionne la météo pour choisir ma date ?", a: "L'outil météo affiche automatiquement les prévisions pour votre ville et vos dates candidates : température, probabilité de pluie, ensoleillement. Vous obtenez un score pour chaque date afin de choisir sereinement." },
  { q: "Puis-je partager mon espace mariage avec ma famille ?", a: "Oui, via un lien de partage en lecture seule que vous générez depuis les paramètres. Vos proches voient les informations essentielles sans pouvoir modifier quoi que ce soit." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6" style={{ background: "#FFFFFF" }}>
      <div className="max-w-3xl mx-auto">
        <FadeIn className="text-center mb-16">
          <Pill>FAQ</Pill>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
            Questions fréquentes
          </h2>
        </FadeIn>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <div className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  borderColor: open === i ? `${TC}40` : "rgba(201,110,44,0.1)",
                  background: open === i ? `${TC}05` : "#FFFFFF",
                  boxShadow: open === i ? `0 4px 16px ${TC}10` : "none",
                }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-[15px] font-semibold" style={{ color: TEXT_DARK }}>{faq.q}</span>
                  <motion.span
                    animate={{ rotate: open === i ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                    className="shrink-0" style={{ color: TC }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </motion.span>
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden">
                      <p className="px-6 pb-5 text-[14px] leading-relaxed" style={{ color: TEXT_MID }}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

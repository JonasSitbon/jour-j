"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TC, GOLD, BG_CREAM, TEXT_DARK, TEXT_MID, TEXT_LIGHT } from "./tokens";
import { FadeIn, Pill } from "./shared";

const TESTIMONIALS = [
  { name: "Camille & Thomas",    date: "Juin 2026",       photo: "CT", role: "",                        text: "Jour J nous a sauvé la mise ! En quelques semaines nous avions tout organisé. Le plan de table en drag & drop est magique.", score: 5 },
  { name: "Marie Lefebvre",      date: "",                photo: "ML", role: "Wedding planner",         text: "Je gère 12 mariages simultanément avec Jour J. La collaboration multi-utilisateurs et les rôles me font gagner 3h par semaine.", score: 5 },
  { name: "Sophie & Alexis",     date: "Septembre 2026",  photo: "SA", role: "",                        text: "Le sélecteur de dates avec la météo en temps réel nous a aidés à choisir la date parfaite. Et le mode Jour J EN DIRECT était incroyable !", score: 5 },
  { name: "Juliette Moreau",     date: "",                photo: "JM", role: "Planner indépendante",    text: "Enfin un outil qui pense aussi aux planners. Je créé un espace par client en 2 minutes. L'export PDF pour les prestataires est top.", score: 5 },
  { name: "Emma & Lucas",        date: "Mai 2026",        photo: "EL", role: "",                        text: "La checklist avec 250+ tâches pré-remplies nous a évité d'oublier des choses. Le budget avec comparaison nationale était très utile.", score: 5 },
  { name: "Laura Bernard",       date: "",                photo: "LB", role: "Wedding designer",        text: "Le mood board et le journal de bord m'ont permis de partager ma vision avec mes clients. Interface élégante, très professionnelle.", score: 5 },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="py-24 px-6 overflow-hidden" style={{ background: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <Pill>Témoignages</Pill>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
            Des couples qui ont dit <span style={{ color: TC }}>oui</span> à Jour J.
          </h2>
        </FadeIn>

        {/* Featured */}
        <div className="relative min-h-[200px] mb-8">
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border p-8 md:p-10 relative"
              style={{ background: BG_CREAM, borderColor: "rgba(201,110,44,0.12)", boxShadow: "0 4px 20px rgba(56,47,35,0.07)" }}
            >
              <div className="text-[clamp(1.1rem,2.5vw,1.4rem)] font-medium leading-relaxed mb-6 max-w-3xl" style={{ color: TEXT_DARK }}>
                &ldquo;{TESTIMONIALS[active].text}&rdquo;
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                  style={{ background: `linear-gradient(135deg, ${TC}, ${GOLD})` }}>
                  {TESTIMONIALS[active].photo}
                </div>
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: TEXT_DARK }}>{TESTIMONIALS[active].name}</div>
                  <div className="text-[12px]" style={{ color: TEXT_LIGHT }}>
                    {TESTIMONIALS[active].role || TESTIMONIALS[active].date}
                  </div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={GOLD} stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === active ? 24 : 8, height: 8, background: i === active ? TC : `${TC}30` }}
            />
          ))}
        </div>

        {/* Grid of all */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <button
                onClick={() => setActive(i)}
                className="text-left w-full rounded-xl border p-5 transition-all duration-200"
                style={{
                  background: i === active ? `${TC}08` : BG_CREAM,
                  borderColor: i === active ? `${TC}50` : "rgba(201,110,44,0.1)",
                  boxShadow: i === active ? `0 4px 16px ${TC}15` : "none",
                }}
              >
                <p className="text-[12.5px] leading-relaxed mb-3 line-clamp-3" style={{ color: TEXT_MID }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: `linear-gradient(135deg, ${TC}, ${GOLD})` }}>{t.photo}</div>
                  <div>
                    <div className="text-[11.5px] font-semibold" style={{ color: TEXT_DARK }}>{t.name}</div>
                    <div className="text-[10px]" style={{ color: TEXT_LIGHT }}>{t.role || t.date}</div>
                  </div>
                </div>
              </button>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

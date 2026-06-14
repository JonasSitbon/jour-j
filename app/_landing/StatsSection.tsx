"use client";

import { TC, TEXT_DARK, TEXT_LIGHT } from "./tokens";
import { FadeIn, Counter } from "./shared";
import { Ic } from "./visuals";
import { Pill } from "./shared";

export default function Stats() {
  const stats = [
    { val: 16, suffix: "+", label: "Modules inclus", icon: "grid" },
    { val: 250, suffix: "+", label: "Tâches pré-remplies", icon: "check" },
    { val: 100, suffix: "%", label: "Essai gratuit", icon: "sparkle" },
    { val: 2, suffix: " min", label: "Pour démarrer", icon: "clock" },
  ];
  return (
    <section className="py-20 px-6" style={{ background: "#FFFFFF" }}>
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="text-center mb-12">
            <Pill>Chiffres</Pill>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
              Tout ce dont vous avez besoin,<br />
              <span style={{ color: TC }}>rien de superflu.</span>
            </h2>
          </div>
        </FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="rounded-2xl border p-6 text-center transition-all duration-300"
                style={{ background: "#FFFFFF", borderColor: `${TC}20`, boxShadow: "0 2px 12px rgba(56,47,35,0.06)" }}>
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${TC}15`, color: TC }}>
                  <Ic name={s.icon} size={20} />
                </div>
                <div className="text-4xl font-bold mb-1" style={{ color: TC }}>
                  <Counter to={s.val} suffix={s.suffix} />
                </div>
                <div className="text-[13px]" style={{ color: TEXT_LIGHT }}>{s.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

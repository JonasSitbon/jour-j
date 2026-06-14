"use client";

import Link from "next/link";
import { Logo } from "@/components/icon";
import { TC, BROWN_DARK } from "./tokens";

export default function Footer() {
  const links = {
    "Produit": [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Se connecter", href: "/login" },
    ],
    "Modules": [
      { label: "Invités & RSVP", href: "/guests" },
      { label: "Budget", href: "/budget" },
      { label: "Plan de table", href: "/guests" },
      { label: "Déroulé Jour J", href: "/dayj" },
    ],
    "Légal": [
      { label: "Conditions d'utilisation", href: "/terms" },
      { label: "Politique de confidentialité", href: "/privacy" },
      { label: "Données personnelles", href: "/privacy#donnees" },
    ],
  };

  return (
    <footer style={{ background: BROWN_DARK, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8" style={{ color: TC }}><Logo size={30} /></div>
              <span className="text-[16px] font-semibold text-white">Jour J</span>
            </Link>
            <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: "rgba(253,250,245,0.55)" }}>
              L&apos;outil tout-en-un pour organiser votre mariage parfait. Budget, invités, prestataires, planning et Jour J — tout en un.
            </p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white"
              style={{ background: TC, boxShadow: `0 4px 14px ${TC}50` }}>
              Commencer gratuitement →
            </Link>
          </div>

          {Object.entries(links).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-4"
                style={{ color: "rgba(253,250,245,0.4)" }}>{cat}</div>
              <ul className="flex flex-col gap-2.5">
                {items.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13.5px] transition-colors hover:text-white"
                      style={{ color: "rgba(253,250,245,0.55)" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-[12.5px]" style={{ color: "rgba(253,250,245,0.3)" }}>
            © 2026 Jour J by The Cockpit. Tous droits réservés.
          </p>
          <p className="text-[12px]" style={{ color: "rgba(253,250,245,0.25)" }}>
            Fait avec 💍 pour les futurs mariés de France
          </p>
        </div>
      </div>
    </footer>
  );
}

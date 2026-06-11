"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const CREAM = "#F4ECDD";
const TERRACOTTA = "#C96E2C";
const DARK_BROWN = "#382F23";
const TERRACOTTA_LIGHT = "#F5E4D4";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const features = [
  {
    icon: "💍",
    title: "Sélecteur de dates",
    desc: "Météo réelle, jours fériés, disponibilités. Choisissez la date parfaite avec des données concrètes.",
  },
  {
    icon: "👥",
    title: "Gestion des invités",
    desc: "Liste, RSVP, plan de table, régimes alimentaires. Chaque invité géré sans effort.",
  },
  {
    icon: "💰",
    title: "Budget intelligent",
    desc: "Suivi par poste, répartition du couple, comparatif aux moyennes françaises.",
  },
  {
    icon: "📋",
    title: "Checklist J-24 mois",
    desc: "180+ tâches pré-remplies classées par catégorie. Ne rien oublier, vraiment.",
  },
  {
    icon: "🎭",
    title: "Prestataires",
    desc: "Devis, scores, contrats, gestion des paiements. Tous vos prestataires au même endroit.",
  },
  {
    icon: "🗓",
    title: "Déroulé du Jour J",
    desc: "Heure par heure, depuis les préparatifs jusqu'au bal. Votre journée, orchestrée.",
  },
];

const differentiators = [
  {
    icon: "🌦",
    title: "Météo réelle",
    desc: "Comparez vos dates candidates avec 5 ans d'historique météo réel (Open-Meteo). Pas des estimations.",
  },
  {
    icon: "📤",
    title: "Liens RSVP personnalisés",
    desc: "Envoyez un lien unique à chaque invité. Ils répondent en un clic, vous voyez tout en temps réel.",
  },
  {
    icon: "📊",
    title: "Benchmark budgétaire",
    desc: "Comparez votre budget aux moyennes françaises par catégorie. Identifiez où vous êtes hors-norme.",
  },
];

function MockupDashboard() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 340,
        background: CREAM,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(56,47,35,0.22), 0 4px 16px rgba(56,47,35,0.12)",
        fontFamily: FONT,
        border: `1px solid rgba(201,110,44,0.15)`,
      }}
    >
      {/* Mockup header bar */}
      <div
        style={{
          background: DARK_BROWN,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>
          Jour J · Mon Mariage
        </div>
      </div>

      {/* Sidebar + content */}
      <div style={{ display: "flex", height: 280 }}>
        {/* Mini sidebar */}
        <div
          style={{
            width: 48,
            background: DARK_BROWN,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 16,
            gap: 14,
          }}
        >
          {["💍", "👥", "💰", "📋", "🎭"].map((icon, i) => (
            <div
              key={i}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                background: i === 0 ? `rgba(201,110,44,0.35)` : "transparent",
                cursor: "default",
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, padding: "14px 12px", overflowY: "hidden", background: "#FAF6EF" }}>
          {/* Stat cards row */}
          <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
            {[
              { label: "Invités", value: "147", sub: "+12 confirmés" },
              { label: "Budget", value: "18 400€", sub: "82% alloué" },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  flex: 1,
                  background: "white",
                  borderRadius: 10,
                  padding: "8px 10px",
                  boxShadow: "0 1px 4px rgba(56,47,35,0.06)",
                  border: "1px solid rgba(201,110,44,0.1)",
                }}
              >
                <div style={{ fontSize: 9, color: "rgba(56,47,35,0.45)", marginBottom: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: DARK_BROWN, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 8.5, color: TERRACOTTA, marginTop: 2, fontWeight: 500 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Countdown */}
          <div
            style={{
              background: `linear-gradient(135deg, ${TERRACOTTA} 0%, #A8551C 100%)`,
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>Votre Jour J</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginTop: 1 }}>12 Juin 2026</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "white", lineHeight: 1 }}>187</div>
              <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>jours restants</div>
            </div>
          </div>

          {/* Checklist preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { done: true, text: "Réserver la salle de réception" },
              { done: true, text: "Choisir le traiteur" },
              { done: false, text: "Envoyer les faire-parts" },
              { done: false, text: "Organiser le plan de table" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "white",
                  borderRadius: 7,
                  padding: "5px 8px",
                  boxShadow: "0 1px 3px rgba(56,47,35,0.04)",
                }}
              >
                <div
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: 4,
                    border: item.done ? "none" : `1.5px solid rgba(56,47,35,0.25)`,
                    background: item.done ? TERRACOTTA : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.done && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    color: item.done ? "rgba(56,47,35,0.4)" : DARK_BROWN,
                    textDecoration: item.done ? "line-through" : "none",
                    fontWeight: item.done ? 400 : 500,
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setAuthChecked(true);
      }
    });
  }, []);

  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: CREAM,
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: `2.5px solid ${TERRACOTTA}`,
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT, color: DARK_BROWN, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-animate { animation: fadeUp 0.7s ease both; }
        .hero-animate-2 { animation: fadeUp 0.7s 0.12s ease both; }
        .hero-animate-3 { animation: fadeUp 0.7s 0.24s ease both; }
        .hero-animate-4 { animation: fadeUp 0.7s 0.36s ease both; }
        .hero-animate-5 { animation: fadeUp 0.7s 0.6s ease both; }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: ${TERRACOTTA};
          color: white;
          padding: 13px 26px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
          box-shadow: 0 2px 12px rgba(201,110,44,0.28);
          font-family: inherit;
          letter-spacing: -0.01em;
        }
        .btn-primary:hover {
          background: #B8601F;
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(201,110,44,0.38);
        }
        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: ${DARK_BROWN};
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          border: 1.5px solid rgba(56,47,35,0.22);
          cursor: pointer;
          transition: border-color 0.18s, background 0.18s, transform 0.15s;
          font-family: inherit;
          letter-spacing: -0.01em;
        }
        .btn-outline:hover {
          border-color: ${TERRACOTTA};
          color: ${TERRACOTTA};
          background: rgba(201,110,44,0.04);
          transform: translateY(-1px);
        }
        .nav-link {
          color: ${DARK_BROWN};
          text-decoration: none;
          font-size: 14.5px;
          font-weight: 500;
          opacity: 0.75;
          transition: opacity 0.15s, color 0.15s;
        }
        .nav-link:hover { opacity: 1; color: ${TERRACOTTA}; }
        .feature-card {
          background: white;
          border-radius: 16px;
          padding: 28px 26px;
          border: 1px solid rgba(201,110,44,0.1);
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
          box-shadow: 0 2px 8px rgba(56,47,35,0.04);
        }
        .feature-card:hover {
          box-shadow: 0 8px 32px rgba(56,47,35,0.1);
          transform: translateY(-3px);
          border-color: rgba(201,110,44,0.25);
        }
        .diff-item {
          background: white;
          border-radius: 16px;
          padding: 28px 30px;
          border: 1px solid rgba(201,110,44,0.1);
          box-shadow: 0 2px 8px rgba(56,47,35,0.04);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .diff-item:hover {
          box-shadow: 0 8px 32px rgba(56,47,35,0.1);
          transform: translateY(-3px);
        }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .diff-grid { grid-template-columns: 1fr !important; }
          .nav-btns { gap: 8px !important; }
          .hero-ctas { flex-direction: column !important; align-items: flex-start !important; }
          .hero-heading { font-size: 34px !important; }
          .mockup-wrapper { display: none !important; }
          .section-pad { padding: 64px 20px !important; }
        }
      `}</style>

      {/* ─── Navbar ─── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(56,47,35,0.07)",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: DARK_BROWN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: CREAM, fontSize: 14, fontWeight: 700, letterSpacing: "-0.03em" }}>J</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: DARK_BROWN, letterSpacing: "-0.04em" }}>
            jour <span style={{ color: TERRACOTTA }}>j</span>
          </span>
        </div>

        {/* Nav actions */}
        <div className="nav-btns" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/login" className="nav-link">
            Se connecter
          </Link>
          <Link href="/signup" className="btn-primary" style={{ padding: "9px 18px", fontSize: 14 }}>
            Commencer
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section
        style={{
          background: `linear-gradient(155deg, ${CREAM} 0%, #EEE0CC 40%, #F0DFCA 70%, #EDD5B8 100%)`,
          padding: "80px 24px 96px",
          minHeight: "calc(100vh - 60px)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto", width: "100%" }}>
          <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 64 }}>
            {/* Text content */}
            <div style={{ flex: "0 0 auto", maxWidth: 560 }}>
              <div
                className="hero-animate"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: "rgba(201,110,44,0.1)",
                  border: `1px solid rgba(201,110,44,0.2)`,
                  borderRadius: 99,
                  padding: "6px 14px",
                  fontSize: 13,
                  color: TERRACOTTA,
                  fontWeight: 600,
                  marginBottom: 28,
                  letterSpacing: "0.01em",
                }}
              >
                <span>✨</span>
                <span>Organisez le plus beau jour de votre vie</span>
              </div>

              <h1
                className="hero-animate-2 hero-heading"
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  lineHeight: 1.08,
                  letterSpacing: "-0.04em",
                  color: DARK_BROWN,
                  marginBottom: 22,
                }}
              >
                Le wedding planner digital pour les{" "}
                <span
                  style={{
                    color: TERRACOTTA,
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  couples exigeants
                  <svg
                    viewBox="0 0 260 18"
                    style={{ position: "absolute", bottom: -6, left: 0, width: "100%", height: 8, overflow: "visible" }}
                    preserveAspectRatio="none"
                  >
                    <path d="M4 10 Q65 3 130 10 Q195 17 256 10" stroke={TERRACOTTA} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.45" />
                  </svg>
                </span>
              </h1>

              <p
                className="hero-animate-3"
                style={{
                  fontSize: 17.5,
                  lineHeight: 1.65,
                  color: `rgba(56,47,35,0.65)`,
                  marginBottom: 38,
                  maxWidth: 480,
                }}
              >
                Invités, budget, prestataires, checklist, plan de table... Tout ce dont vous avez besoin pour votre mariage, en un seul endroit.
              </p>

              <div className="hero-animate-4 hero-ctas" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36, flexWrap: "wrap" }}>
                <Link href="/signup" className="btn-primary">
                  Commencer gratuitement →
                </Link>
                <Link href="/dashboard" className="btn-outline">
                  Voir une démo
                </Link>
              </div>

              <div
                className="hero-animate-5"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  flexWrap: "wrap",
                }}
              >
                {["Gratuit", "Données sécurisées", "Made in France 🇫🇷"].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13.5,
                      color: `rgba(56,47,35,0.55)`,
                      fontWeight: 500,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="7" fill={TERRACOTTA} opacity="0.15" />
                      <path d="M4.5 7l1.8 1.8 3.2-3.2" stroke={TERRACOTTA} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div
              className="mockup-wrapper hero-animate-4"
              style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}
            >
              <MockupDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features grid ─── */}
      <section
        className="section-pad"
        style={{ background: CREAM, padding: "96px 24px" }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TERRACOTTA, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Fonctionnalités
            </p>
            <h2
              style={{
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: DARK_BROWN,
                lineHeight: 1.15,
                marginBottom: 16,
              }}
            >
              Tout ce dont vous avez besoin
            </h2>
            <p style={{ fontSize: 17, color: `rgba(56,47,35,0.6)`, maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
              Une suite complète d'outils pensée pour les mariages français, de la première date jusqu'au Jour J.
            </p>
          </div>

          <div
            className="features-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: TERRACOTTA_LIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    marginBottom: 18,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: DARK_BROWN,
                    marginBottom: 8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: 14.5, color: `rgba(56,47,35,0.6)`, lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Divider strip ─── */}
      <div
        style={{
          background: DARK_BROWN,
          padding: "28px 24px",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          flexWrap: "wrap",
        }}
      >
        {[
          { n: "180+", label: "tâches checklist" },
          { n: "100%", label: "des features gratuites" },
          { n: "5 ans", label: "d'historique météo" },
          { n: "1 lien", label: "RSVP par invité" },
        ].map((s) => (
          <div key={s.n} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: CREAM, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {s.n}
            </div>
            <div style={{ fontSize: 13, color: `rgba(244,236,221,0.5)`, marginTop: 4, fontWeight: 500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Differentiators ─── */}
      <section
        className="section-pad"
        style={{
          background: `linear-gradient(180deg, ${CREAM} 0%, #EDE0CC 100%)`,
          padding: "96px 24px",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: TERRACOTTA, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Ce qui nous distingue
            </p>
            <h2
              style={{
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: DARK_BROWN,
                lineHeight: 1.15,
              }}
            >
              Conçu pour aller plus loin
            </h2>
          </div>

          <div
            className="diff-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {differentiators.map((d) => (
              <div key={d.title} className="diff-item">
                <div style={{ fontSize: 36, marginBottom: 18 }}>{d.icon}</div>
                <h3
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    color: DARK_BROWN,
                    marginBottom: 10,
                    letterSpacing: "-0.025em",
                  }}
                >
                  {d.title}
                </h3>
                <p style={{ fontSize: 15, color: `rgba(56,47,35,0.65)`, lineHeight: 1.65 }}>
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section
        className="section-pad"
        style={{ background: DARK_BROWN, padding: "96px 24px" }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: `rgba(244,236,221,0.55)`, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Tarifs
          </p>
          <h2
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: CREAM,
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Simple et gratuit
          </h2>
          <p style={{ fontSize: 17, color: `rgba(244,236,221,0.55)`, marginBottom: 48, lineHeight: 1.6 }}>
            Toutes les fonctionnalités. Aucune carte bancaire requise.
          </p>

          <div
            style={{
              background: "rgba(244,236,221,0.07)",
              border: `1px solid rgba(244,236,221,0.15)`,
              borderRadius: 20,
              padding: "44px 40px",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 4,
                marginBottom: 28,
              }}
            >
              <span style={{ fontSize: 56, fontWeight: 900, color: CREAM, letterSpacing: "-0.05em", lineHeight: 1 }}>0€</span>
              <span style={{ fontSize: 18, color: `rgba(244,236,221,0.5)`, fontWeight: 500 }}>/ pour toujours</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 36, textAlign: "left" }}>
              {[
                "Toutes les fonctionnalités incluses",
                "Invités illimités",
                "Données sauvegardées en sécurité",
                "Accès à vie, sans abonnement",
                "Mises à jour incluses",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      background: TERRACOTTA,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 15, color: `rgba(244,236,221,0.8)`, fontWeight: 450 }}>{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "15px 24px", fontSize: 16 }}
            >
              Commencer gratuitement →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section
        style={{
          background: `linear-gradient(135deg, ${TERRACOTTA} 0%, #A8551C 100%)`,
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>💍</div>
          <h2
            style={{
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "white",
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Votre mariage mérite le meilleur outil
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", marginBottom: 36, lineHeight: 1.6 }}>
            Rejoignez les couples qui organisent leur mariage avec sérénité. C'est gratuit, et ça prend 2 minutes.
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "white",
              color: TERRACOTTA,
              padding: "15px 32px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              textDecoration: "none",
              transition: "transform 0.15s, box-shadow 0.2s",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.15)"; }}
          >
            Créer mon espace mariage →
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        style={{
          background: `#2A2218`,
          padding: "48px 24px 36px",
          color: `rgba(244,236,221,0.6)`,
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 32,
              marginBottom: 40,
              paddingBottom: 40,
              borderBottom: "1px solid rgba(244,236,221,0.08)",
            }}
          >
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    background: TERRACOTTA,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>J</span>
                </div>
                <span style={{ fontSize: 17, fontWeight: 700, color: CREAM, letterSpacing: "-0.03em" }}>
                  jour <span style={{ color: TERRACOTTA }}>j</span>
                </span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: 240 }}>
                Le wedding planner digital pour les couples qui veulent vivre leur mariage sereinement.
              </p>
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: CREAM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                  Application
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Se connecter", href: "/login" },
                    { label: "S'inscrire", href: "/signup" },
                    { label: "Tableau de bord", href: "/dashboard" },
                  ].map((l) => (
                    <Link
                      key={l.label}
                      href={l.href}
                      style={{
                        color: `rgba(244,236,221,0.55)`,
                        textDecoration: "none",
                        fontSize: 14,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = CREAM)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = `rgba(244,236,221,0.55)`)}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13 }}>© 2025 Jour J · Made with love in France 🇫🇷</span>
            <span style={{ fontSize: 12, opacity: 0.6 }}>
              Vos données sont stockées de façon sécurisée via Supabase.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

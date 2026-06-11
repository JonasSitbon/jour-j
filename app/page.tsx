"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const CREAM = "#F4ECDD";
const TERRACOTTA = "#C96E2C";
const DARK = "#382F23";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="7" fill={TERRACOTTA} opacity=".15" />
      <path d="M4.5 7l1.8 1.8 3.2-3.2" stroke={TERRACOTTA} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FEATURES = [
  { icon: "💍", title: "Sélecteur de dates", desc: "Météo réelle sur 5 ans, jours fériés, disponibilités. Choisissez la date parfaite avec des données concrètes." },
  { icon: "👥", title: "Gestion des invités", desc: "Liste, RSVP, plan de table, régimes alimentaires. Chaque invité géré sans effort." },
  { icon: "💰", title: "Budget intelligent", desc: "Suivi par poste, répartition du couple, comparatif aux moyennes françaises." },
  { icon: "📋", title: "Checklist J‑24 mois", desc: "180+ tâches pré-remplies classées par catégorie. Ne rien oublier, vraiment." },
  { icon: "🎭", title: "Prestataires", desc: "Devis, scores, contrats, gestion des paiements. Tous vos prestataires au même endroit." },
  { icon: "🗓", title: "Déroulé du Jour J", desc: "Heure par heure, depuis les préparatifs jusqu'au bal. Votre journée, orchestrée." },
];

const STEPS = [
  { n: "1", title: "Créez votre espace", desc: "Inscrivez-vous en 30 secondes avec Google ou votre email. Renseignez les infos de base." },
  { n: "2", title: "Construisez votre mariage", desc: "Budget, invités, prestataires, dates — personnalisez votre tableau de bord à votre image." },
  { n: "3", title: "Vivez votre Jour J", desc: "Le mode Jour J orchestre votre journée heure par heure. Plus de stress, que de la joie." },
];

const DIFFERENTIATORS = [
  { icon: "🌦", title: "Météo réelle", desc: "Comparez vos dates candidates avec 5 ans d'historique météo réel (Open-Meteo). Pas des estimations." },
  { icon: "📤", title: "RSVP personnalisés", desc: "Un lien unique par invité. Ils répondent en un clic, vous voyez tout en temps réel." },
  { icon: "📊", title: "Benchmark budgétaire", desc: "Comparez votre budget aux moyennes françaises par catégorie. Sachez où vous vous situez vraiment." },
];

export default function LandingPage() {
  const router = useRouter();
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/dashboard");
    });
  }, []);

  const handleGoogle = async () => {
    setOauthLoading(true);
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div style={{ fontFamily: FONT, color: DARK, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        .a1 { animation: fadeUp .6s ease both; }
        .a2 { animation: fadeUp .6s .1s ease both; }
        .a3 { animation: fadeUp .6s .2s ease both; }
        .a4 { animation: fadeUp .6s .32s ease both; }
        .a5 { animation: fadeUp .6s .48s ease both; }

        .nav-link { color: ${DARK}; text-decoration: none; font-size: 14.5px; font-weight: 500; opacity: .7; transition: opacity .15s, color .15s; }
        .nav-link:hover { opacity: 1; color: ${TERRACOTTA}; }

        .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: ${TERRACOTTA}; color: white; padding: 13px 24px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; transition: background .18s, transform .15s, box-shadow .18s; box-shadow: 0 2px 12px rgba(201,110,44,.3); font-family: inherit; letter-spacing: -.01em; width: 100%; }
        .btn-primary:hover { background: #B8601F; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,110,44,.4); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; transform: none; }

        .btn-google { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 13px 24px; border-radius: 10px; border: 1.5px solid rgba(56,47,35,.13); background: white; color: ${DARK}; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; letter-spacing: -.01em; transition: border-color .18s, box-shadow .18s, transform .15s; box-shadow: 0 1px 4px rgba(56,47,35,.06); }
        .btn-google:hover { border-color: rgba(56,47,35,.28); box-shadow: 0 4px 16px rgba(56,47,35,.1); transform: translateY(-1px); }
        .btn-google:disabled { opacity: .6; cursor: not-allowed; transform: none; }

        .btn-outline-white { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,.12); color: white; padding: 14px 28px; border-radius: 12px; font-size: 15.5px; font-weight: 600; text-decoration: none; border: 1.5px solid rgba(255,255,255,.32); transition: background .18s; font-family: inherit; }
        .btn-outline-white:hover { background: rgba(255,255,255,.2); }

        .nav-cta { display: inline-flex; align-items: center; gap: 8px; background: ${TERRACOTTA}; color: white; padding: 9px 18px; border-radius: 9px; font-size: 14px; font-weight: 600; text-decoration: none; border: none; transition: background .18s, transform .15s; }
        .nav-cta:hover { background: #B8601F; transform: translateY(-1px); }

        .feature-card { background: white; border-radius: 16px; padding: 28px 26px; border: 1px solid rgba(201,110,44,.1); transition: box-shadow .22s, transform .22s, border-color .22s; box-shadow: 0 2px 8px rgba(56,47,35,.04); }
        .feature-card:hover { box-shadow: 0 10px 36px rgba(56,47,35,.11); transform: translateY(-4px); border-color: rgba(201,110,44,.22); }

        .diff-card { background: white; border-radius: 16px; padding: 30px 28px; border: 1px solid rgba(201,110,44,.1); box-shadow: 0 2px 8px rgba(56,47,35,.04); transition: box-shadow .22s, transform .22s; }
        .diff-card:hover { box-shadow: 0 10px 36px rgba(56,47,35,.11); transform: translateY(-4px); }

        @media (max-width: 960px) {
          .hero-grid { flex-direction: column !important; gap: 52px !important; }
          .hero-text { max-width: 100% !important; }
          .auth-card { max-width: 100% !important; width: 100% !important; flex: auto !important; }
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .diff-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .step-connector { display: none !important; }
          .hero-h1 { font-size: 38px !important; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .diff-grid { grid-template-columns: 1fr !important; }
          .hero-h1 { font-size: 30px !important; }
          .nav-actions { gap: 8px !important; }
          .stats-wrap { gap: 28px !important; }
          .cta-btns { flex-direction: column !important; align-items: center !important; }
          .section-pad { padding: 64px 20px !important; }
          .footer-cols { flex-direction: column !important; gap: 32px !important; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,.96)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: "1px solid rgba(56,47,35,.07)", padding: "0 28px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: DARK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: CREAM, fontSize: 14, fontWeight: 800, letterSpacing: "-.03em" }}>J</span>
          </div>
          <span style={{ fontSize: 18.5, fontWeight: 800, color: DARK, letterSpacing: "-.045em" }}>
            jour <span style={{ color: TERRACOTTA }}>j</span>
          </span>
        </div>
        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/login" className="nav-link">Se connecter</Link>
          <Link href="/signup" className="nav-cta">S'inscrire</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: `linear-gradient(150deg, ${CREAM} 0%, #EDE0CB 45%, #EDD4B5 100%)`, padding: "80px 28px 100px", minHeight: "calc(100vh - 62px)", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", width: "100%" }}>
          <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 80 }}>

            {/* ── Left: pitch ── */}
            <div className="hero-text" style={{ flex: "1 1 0", minWidth: 0 }}>
              <div className="a1" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(201,110,44,.1)", border: "1px solid rgba(201,110,44,.2)", borderRadius: 99, padding: "6px 14px", fontSize: 13, color: TERRACOTTA, fontWeight: 600, marginBottom: 28, letterSpacing: ".01em" }}>
                <span>✨</span>
                <span>Wedding planner digital · 100% gratuit</span>
              </div>

              <h1 className="a2 hero-h1" style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.09, letterSpacing: "-.045em", color: DARK, marginBottom: 22 }}>
                Organisez votre mariage{" "}
                <span style={{ color: TERRACOTTA, position: "relative", whiteSpace: "nowrap" }}>
                  sereinement
                  <svg viewBox="0 0 220 14" style={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: 7, overflow: "visible" }} preserveAspectRatio="none">
                    <path d="M3 9 Q55 2 110 9 Q165 16 217 9" stroke={TERRACOTTA} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".4" />
                  </svg>
                </span>
              </h1>

              <p className="a3" style={{ fontSize: 17.5, lineHeight: 1.7, color: "rgba(56,47,35,.58)", marginBottom: 36, maxWidth: 500 }}>
                Budget, invités, prestataires, plan de table, checklist et déroulé du Jour J — tout votre mariage réuni dans un seul outil élégant.
              </p>

              <div className="a4" style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 40 }}>
                {["Gratuit pour toujours", "Sans carte bancaire", "Made in France 🇫🇷"].map(label => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "rgba(56,47,35,.5)", fontWeight: 500 }}>
                    <CheckIcon />{label}
                  </div>
                ))}
              </div>

              {/* Mini feature list */}
              <div className="a4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                {["Checklist 180+ tâches", "Plan de table visuel", "Météo réelle par date", "RSVP par invité", "Budget par poste", "Déroulé Jour J"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "rgba(56,47,35,.62)", fontWeight: 450 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <circle cx="8" cy="8" r="8" fill="rgba(201,110,44,.12)" />
                      <path d="M5 8l2.2 2.2 3.8-3.8" stroke={TERRACOTTA} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: auth panel ── */}
            <div className="a5 auth-card" style={{ flex: "0 0 400px", width: 400 }}>
              <div style={{ background: "white", borderRadius: 22, padding: "38px 34px", boxShadow: "0 28px 72px rgba(56,47,35,.13), 0 4px 20px rgba(56,47,35,.07)", border: "1px solid rgba(201,110,44,.1)" }}>
                <div style={{ textAlign: "center", marginBottom: 30 }}>
                  <h2 style={{ fontSize: 20.5, fontWeight: 700, color: DARK, letterSpacing: "-.03em", marginBottom: 6 }}>
                    Créer votre espace mariage
                  </h2>
                  <p style={{ fontSize: 13.5, color: "rgba(56,47,35,.45)", lineHeight: 1.5 }}>
                    Gratuit · Sans engagement · 30 secondes
                  </p>
                </div>

                {/* Google */}
                <button className="btn-google" onClick={handleGoogle} disabled={oauthLoading} style={{ marginBottom: 14 }}>
                  {oauthLoading
                    ? <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid rgba(56,47,35,.15)`, borderTopColor: DARK, animation: "spin .7s linear infinite" }} />
                    : <GoogleIcon />
                  }
                  {oauthLoading ? "Redirection…" : "Continuer avec Google"}
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(56,47,35,.09)" }} />
                  <span style={{ fontSize: 12, color: "rgba(56,47,35,.38)", fontWeight: 500 }}>ou</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(56,47,35,.09)" }} />
                </div>

                {/* Email CTA */}
                <Link href="/signup" className="btn-primary" style={{ marginBottom: 22 }}>
                  S'inscrire avec un email →
                </Link>

                <p style={{ textAlign: "center", fontSize: 13.5, color: "rgba(56,47,35,.42)" }}>
                  Déjà un compte ?{" "}
                  <Link href="/login" style={{ color: TERRACOTTA, fontWeight: 600, textDecoration: "none" }}>
                    Se connecter
                  </Link>
                </p>
              </div>

              {/* Trust badges */}
              <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 14, flexWrap: "wrap" }}>
                {["🔒 Données chiffrées", "🇫🇷 Hébergé en Europe", "✨ Sans publicité"].map(b => (
                  <span key={b} style={{ fontSize: 11.5, color: "rgba(56,47,35,.4)", fontWeight: 500 }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div style={{ background: DARK, padding: "34px 28px" }}>
        <div className="stats-wrap" style={{ maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 60, flexWrap: "wrap" }}>
          {[
            { n: "180+", label: "tâches checklist" },
            { n: "100%", label: "des fonctionnalités gratuites" },
            { n: "5 ans", label: "d'historique météo" },
            { n: "0€", label: "sans surprise" },
          ].map(s => (
            <div key={s.n} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: CREAM, letterSpacing: "-.05em", lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 12.5, color: "rgba(244,236,221,.42)", marginTop: 5, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="section-pad" style={{ background: CREAM, padding: "100px 28px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: TERRACOTTA, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>Fonctionnalités</p>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.035em", color: DARK, lineHeight: 1.13, marginBottom: 16 }}>
              Tout ce dont vous avez besoin
            </h2>
            <p style={{ fontSize: 17, color: "rgba(56,47,35,.58)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Une suite complète pensée pour les mariages français, de la première date jusqu'au Jour J.
            </p>
          </div>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div style={{ width: 48, height: 48, borderRadius: 13, background: "#F5E4D4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 18 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: DARK, marginBottom: 9, letterSpacing: "-.025em" }}>{f.title}</h3>
                <p style={{ fontSize: 14.5, color: "rgba(56,47,35,.56)", lineHeight: 1.68 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section-pad" style={{ background: `linear-gradient(180deg, #EDE0CB 0%, ${CREAM} 100%)`, padding: "100px 28px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 68 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: TERRACOTTA, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>Comment ça marche</p>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.035em", color: DARK, lineHeight: 1.13 }}>
              Prêt en 3 étapes
            </h2>
          </div>
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48, position: "relative" }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ textAlign: "center", position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div className="step-connector" style={{ position: "absolute", top: 21, left: "58%", right: "-20%", height: 1, background: `rgba(201,110,44,.2)` }} />
                )}
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: TERRACOTTA, color: "white", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", boxShadow: "0 4px 18px rgba(201,110,44,.32)" }}>{s.n}</div>
                <h3 style={{ fontSize: 18.5, fontWeight: 700, color: DARK, marginBottom: 10, letterSpacing: "-.025em" }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: "rgba(56,47,35,.58)", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Differentiators ── */}
      <section className="section-pad" style={{ background: CREAM, padding: "100px 28px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: TERRACOTTA, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>Ce qui nous distingue</p>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.035em", color: DARK, lineHeight: 1.13 }}>
              Conçu pour aller plus loin
            </h2>
          </div>
          <div className="diff-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {DIFFERENTIATORS.map(d => (
              <div key={d.title} className="diff-card">
                <div style={{ fontSize: 38, marginBottom: 20 }}>{d.icon}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: DARK, marginBottom: 10, letterSpacing: "-.025em" }}>{d.title}</h3>
                <p style={{ fontSize: 15, color: "rgba(56,47,35,.6)", lineHeight: 1.7 }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ background: DARK, padding: "100px 28px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(244,236,221,.5)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>Tarifs</p>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.035em", color: CREAM, lineHeight: 1.13, marginBottom: 14 }}>
            Simple et gratuit
          </h2>
          <p style={{ fontSize: 17, color: "rgba(244,236,221,.5)", marginBottom: 52, lineHeight: 1.7 }}>
            Toutes les fonctionnalités. Aucune carte bancaire.
          </p>

          <div style={{ background: "rgba(244,236,221,.06)", border: "1px solid rgba(244,236,221,.12)", borderRadius: 22, padding: "46px 42px", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6, marginBottom: 32 }}>
              <span style={{ fontSize: 60, fontWeight: 900, color: CREAM, letterSpacing: "-.06em", lineHeight: 1 }}>0€</span>
              <span style={{ fontSize: 17, color: "rgba(244,236,221,.4)", fontWeight: 500 }}>/ pour toujours</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 38, textAlign: "left" }}>
              {["Toutes les fonctionnalités incluses", "Invités illimités", "Données sauvegardées en sécurité", "Accès à vie, sans abonnement", "Mises à jour incluses"].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: TERRACOTTA, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span style={{ fontSize: 15, color: "rgba(244,236,221,.75)", fontWeight: 450 }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={handleGoogle} disabled={oauthLoading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: "15px 24px", borderRadius: 12, background: "white", color: DARK, fontSize: 15.5, fontWeight: 600, border: "none", cursor: "pointer", transition: "opacity .18s, transform .15s", fontFamily: FONT, marginBottom: 12 }}>
              <GoogleIcon />
              {oauthLoading ? "Redirection…" : "Commencer avec Google"}
            </button>
            <Link href="/signup" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "14px 24px", borderRadius: 12, background: "transparent", color: "rgba(244,236,221,.7)", fontSize: 15, fontWeight: 500, border: "1.5px solid rgba(244,236,221,.18)", textDecoration: "none", transition: "border-color .18s" }}>
              S'inscrire avec un email →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ background: `linear-gradient(135deg, ${TERRACOTTA} 0%, #A0501A 100%)`, padding: "96px 28px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 44, marginBottom: 22 }}>💍</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.04em", color: "white", lineHeight: 1.12, marginBottom: 16 }}>
            Votre mariage mérite le meilleur outil
          </h2>
          <p style={{ fontSize: 17.5, color: "rgba(255,255,255,.7)", marginBottom: 42, lineHeight: 1.7 }}>
            Rejoignez les couples qui organisent leur mariage avec sérénité. Gratuit, sans engagement.
          </p>
          <div className="cta-btns" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleGoogle} disabled={oauthLoading} style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "white", color: DARK, padding: "15px 30px", borderRadius: 12, fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", transition: "transform .15s, box-shadow .2s", boxShadow: "0 4px 24px rgba(0,0,0,.18)", fontFamily: FONT }}>
              <GoogleIcon />
              Continuer avec Google
            </button>
            <Link href="/signup" className="btn-outline-white">
              S'inscrire avec un email →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#261E14", padding: "56px 28px 40px", color: "rgba(244,236,221,.5)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="footer-cols" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 36, marginBottom: 48, paddingBottom: 48, borderBottom: "1px solid rgba(244,236,221,.07)" }}>
            <div style={{ maxWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: TERRACOTTA, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontSize: 13, fontWeight: 800 }}>J</span>
                </div>
                <span style={{ fontSize: 17, fontWeight: 800, color: CREAM, letterSpacing: "-.04em" }}>jour <span style={{ color: TERRACOTTA }}>j</span></span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(244,236,221,.42)" }}>
                Le wedding planner digital pour les couples qui veulent vivre leur mariage sereinement.
              </p>
            </div>

            <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: CREAM, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>Application</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {[{ label: "S'inscrire", href: "/signup" }, { label: "Se connecter", href: "/login" }].map(l => (
                    <Link key={l.label} href={l.href} style={{ color: "rgba(244,236,221,.45)", textDecoration: "none", fontSize: 14.5, transition: "color .15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = CREAM)}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(244,236,221,.45)")}
                    >{l.label}</Link>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: CREAM, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>Légal</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {[{ label: "Mentions légales", href: "/legal" }, { label: "Confidentialité", href: "/privacy" }].map(l => (
                    <Link key={l.label} href={l.href} style={{ color: "rgba(244,236,221,.45)", textDecoration: "none", fontSize: 14.5, transition: "color .15s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = CREAM)}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(244,236,221,.45)")}
                    >{l.label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13, color: "rgba(244,236,221,.35)" }}>© 2025 Jour J · Made with love in France 🇫🇷</span>
            <span style={{ fontSize: 12.5, color: "rgba(244,236,221,.28)" }}>Données sécurisées · Hébergement européen</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

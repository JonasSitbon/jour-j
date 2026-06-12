"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo, Icon } from "@/components/icon";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { OAuthButtons } from "@/components/oauth-buttons";

const FEATURES = [
  "Tableau de bord complet",
  "Gestion illimitée des invités",
  "Suivi budget & paiements",
  "Gestion des prestataires",
  "Checklist & mode Jour J",
  "Sélecteur de dates intelligent",
];

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { setErr("Prénom et nom sont obligatoires"); return; }
    if (!email.includes("@")) { setErr("Adresse email invalide"); return; }
    if (pw.length < 8) { setErr("Le mot de passe doit contenir au moins 8 caractères"); return; }
    if (pw !== pw2) { setErr("Les mots de passe ne correspondent pas"); return; }
    setErr(""); setLoading(true);

    const { data, error } = await createClient().auth.signUp({
      email,
      password: pw,
      options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } },
    });
    if (error) { setErr(error.message); setLoading(false); return; }

    if (data.session) {
      window.location.href = "/onboarding";
    } else {
      setDone(true);
    }
  };

  return (
    <div className="relative z-[1] min-h-screen grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
      {/* Panneau visuel */}
      <div className="hidden md:flex relative overflow-hidden flex-col justify-between p-14"
        style={{ background: "radial-gradient(120% 90% at 12% 10%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 60%), radial-gradient(100% 100% at 95% 95%, color-mix(in srgb, var(--gold) 18%, transparent), transparent 55%), var(--surface-3)" }}>
        <div className="relative z-[1] flex items-center gap-3">
          <div className="w-10 h-10 text-primary"><Logo size={38} /></div>
          <div>
            <div className="text-[17px] font-semibold">Jour <b>J</b></div>
            <div className="text-[11px] text-text-3 font-mono">wedding studio</div>
          </div>
        </div>

        <div className="relative z-[1]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-6"
            style={{ background: "color-mix(in srgb, var(--sage) 15%, transparent)", color: "var(--sage)" }}>
            <Icon name="sparkle" size={13} />Accès gratuit · Sans carte bancaire
          </div>
          <h2 className="text-[34px] font-semibold tracking-[-.03em] leading-[1.18] mb-6">
            Tout ce dont vous avez besoin pour organiser votre mariage.
          </h2>
          <div className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-[14px] text-text-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "color-mix(in srgb, var(--sage) 15%, transparent)", color: "var(--sage)" }}>
                  <Icon name="check" size={12} />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-[1] text-[12px] text-text-3">
          Rejoignez des centaines de futurs mariés qui organisent leur grand jour avec Jour J.
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center p-8 md:p-10 relative" style={{ background: "var(--bg)" }}>
        <Link href="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:opacity-70"
          style={{ color: "var(--text-2)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Retour
        </Link>
        <div className="w-full max-w-[380px]">
          <div className="md:hidden flex items-center gap-3 justify-center mb-7">
            <div className="w-9 h-9 text-primary"><Logo size={34} /></div>
            <div className="text-[17px] font-semibold">Jour <b>J</b></div>
          </div>

          {done ? (
            <div className="flex flex-col items-center text-center gap-5 py-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "color-mix(in srgb, var(--sage) 15%, transparent)", color: "var(--sage)" }}>
                <Icon name="mail" size={28} />
              </div>
              <div>
                <h1 className="text-[22px] font-semibold mb-2">Vérifiez votre email</h1>
                <p className="text-[14px] text-text-2 leading-relaxed">
                  Un lien de confirmation a été envoyé à <b>{email}</b>.<br />
                  Cliquez dessus pour activer votre compte.
                </p>
              </div>
              <Link href="/login" className="text-[13.5px] text-text-2 hover:text-text transition">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h1 className="text-[26px] font-semibold tracking-[-.025em]">Créer un compte</h1>
              <p className="text-[14.5px] text-text-2 mt-1.5 mb-[28px]">
                Gratuit, sans engagement.
              </p>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom">
                    <Input
                      value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Marie" autoComplete="given-name"
                    />
                  </Field>
                  <Field label="Nom">
                    <Input
                      value={lastName} onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dupont" autoComplete="family-name"
                    />
                  </Field>
                </div>

                <Field label="Adresse email">
                  <Input
                    icon="mail" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@email.fr" autoComplete="email"
                  />
                </Field>

                <Field label="Mot de passe">
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"} value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder="8 caractères minimum" className="pr-11"
                      autoComplete="new-password"
                    />
                    <button type="button" className="icon-btn w-8 h-8 absolute right-1.5 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPw((s) => !s)}>
                      <Icon name="eye" size={18} />
                    </button>
                  </div>
                </Field>

                <Field label="Confirmer le mot de passe">
                  <Input
                    type={showPw ? "text" : "password"} value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    autoComplete="new-password"
                  />
                </Field>

                {err && (
                  <div className="flex items-center gap-2 text-[13.5px] px-3 py-2 rounded-lg"
                    style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
                    <Icon name="alert" size={14} />{err}
                  </div>
                )}

                <Button variant="primary" size="lg" block type="submit" disabled={loading}>
                  {loading ? "Création en cours…" : "Créer mon compte"}
                </Button>

                <OAuthButtons mode="signup" />

                <p className="text-center text-[13.5px] text-text-2">
                  Déjà un compte ?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Se connecter
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

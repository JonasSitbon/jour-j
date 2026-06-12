"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo, Icon } from "@/components/icon";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { OAuthButtons } from "@/components/oauth-buttons";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  // Si l'utilisateur est déjà connecté avec un mariage → dashboard direct
  // Si connecté sans mariage → affiche un bouton de déconnexion
  const [loggedInNoWedding, setLoggedInNoWedding] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setChecking(false); return; }
      // Check mariage owned
      const { data: wedding } = await sb.from("wedding").select("id").eq("user_id", user.id).limit(1).maybeSingle();
      if (wedding) { router.replace("/dashboard"); return; }
      // Check mariage partagé
      const { data: shared } = await sb.from("wedding_access").select("id").eq("user_id", user.id).not("accepted_at", "is", null).limit(1).maybeSingle();
      if (shared) { router.replace("/dashboard"); return; }
      setLoggedInNoWedding(true);
      setChecking(false);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setErr("Adresse email invalide"); return; }
    setErr(""); setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password: pw });
    if (error) { setErr("Email ou mot de passe incorrect"); setLoading(false); return; }
    window.location.href = "/dashboard";
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setErr("Adresse email invalide"); return; }
    setErr(""); setLoading(true);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) { setErr("Impossible d'envoyer le lien, réessayez."); return; }
    setMagicSent(true);
  };

  const logout = async () => {
    await createClient().auth.signOut();
    setLoggedInNoWedding(false);
    setChecking(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="relative z-[1] min-h-screen grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
      {/* Panneau visuel */}
      <div className="hidden md:flex relative overflow-hidden flex-col justify-between p-14"
        style={{ background: "radial-gradient(120% 90% at 12% 10%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 60%), radial-gradient(100% 100% at 95% 95%, color-mix(in srgb, var(--gold) 18%, transparent), transparent 55%), var(--surface-3)" }}>
        <div className="relative z-[1] flex items-center gap-3">
          <div className="w-10 h-10 text-primary"><Logo size={38} /></div>
          <div><div className="text-[17px] font-semibold">Jour <b>J</b></div><div className="text-[11px] text-text-3 font-mono">wedding studio</div></div>
        </div>
        <div className="relative z-[1] max-w-[460px]">
          <h2 className="text-[34px] font-semibold tracking-[-.03em] leading-[1.18]">Organisez le plus beau jour de votre vie, <em className="not-italic text-primary">sereinement</em>.</h2>
          <p className="mt-4 text-[15px] text-text-2 leading-relaxed">Invités, budget, prestataires, paiements et checklist — tout votre mariage réuni dans un espace clair et élégant.</p>
        </div>
        <div className="relative z-[1] flex items-center gap-4 bg-surface/70 backdrop-blur border border-line rounded-card px-[18px] py-4 shadow-sm max-w-[360px]">
          <Icon name="rings" size={28} className="text-primary shrink-0" />
          <div className="text-[13.5px] text-text-2 leading-relaxed">Votre espace mariage vous attend. Connectez-vous pour reprendre là où vous en étiez.</div>
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

          {loggedInNoWedding ? (
            /* Cas : connecté mais pas de mariage créé */
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-[24px] font-semibold tracking-[-.025em]">Compte sans espace</h1>
                <p className="text-[14px] text-text-2 mt-2">Tu es connecté mais tu n'as pas encore créé ton espace mariage.</p>
              </div>
              <Button variant="primary" size="lg" block icon="rings" onClick={() => router.push("/onboarding")}>
                Créer mon espace mariage
              </Button>
              <button onClick={logout} className="flex items-center justify-center gap-2 text-[13.5px] text-text-2 hover:text-text transition py-2">
                <Icon name="logout" size={15} />Se déconnecter
              </button>
            </div>
          ) : (
            /* Cas normal : formulaire de connexion */
            <div>
              <h1 className="text-[26px] font-semibold tracking-[-.025em]">Bon retour</h1>
              <p className="text-[14.5px] text-text-2 mt-1.5 mb-6">Connectez-vous pour reprendre vos préparatifs.</p>

              {/* Toggle mode */}
              <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "var(--surface-2)" }}>
                {([["password", "Mot de passe"], ["magic", "Lien magique"]] as const).map(([m, label]) => (
                  <button key={m} type="button"
                    onClick={() => { setMode(m); setErr(""); setMagicSent(false); }}
                    className="flex-1 py-2 rounded-lg text-[13.5px] font-medium transition-all"
                    style={{
                      background: mode === m ? "var(--surface)" : "transparent",
                      color: mode === m ? "var(--text)" : "var(--text-2)",
                      boxShadow: mode === m ? "var(--sh-sm)" : "none",
                    }}>
                    {m === "magic" ? "✨ " : "🔑 "}{label}
                  </button>
                ))}
              </div>

              {mode === "password" ? (
                <form onSubmit={submit}>
                  <div className="flex flex-col gap-4">
                    <Field label="Adresse email">
                      <Input icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.fr" autoComplete="email" />
                    </Field>
                    <Field label="Mot de passe">
                      <div className="relative">
                        <Input type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" className="pr-11" autoComplete="current-password" />
                        <button type="button" className="icon-btn w-8 h-8 absolute right-1.5 top-1/2 -translate-y-1/2" onClick={() => setShowPw((s) => !s)}>
                          <Icon name="eye" size={18} />
                        </button>
                      </div>
                      <div className="text-right mt-1">
                        <a href="/reset-password" className="text-[12px] text-primary hover:underline">Mot de passe oublié ?</a>
                      </div>
                    </Field>
                    {err && (
                      <div className="flex items-center gap-2 text-[13.5px] px-3 py-2 rounded-lg" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
                        <Icon name="alert" size={14} />{err}
                      </div>
                    )}
                    <Button variant="primary" size="lg" block type="submit" disabled={loading}>
                      {loading ? "Connexion…" : "Se connecter"}
                    </Button>
                  </div>
                </form>
              ) : magicSent ? (
                /* État succès magic link */
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: "var(--primary-soft)" }}>
                    ✉️
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold" style={{ color: "var(--text)" }}>Vérifiez votre boîte mail</p>
                    <p className="text-[13.5px] mt-1.5" style={{ color: "var(--text-2)" }}>
                      Un lien de connexion a été envoyé à<br />
                      <strong style={{ color: "var(--text)" }}>{email}</strong>
                    </p>
                  </div>
                  <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Le lien expire dans 1 heure. Pensez à vérifier vos spams.</p>
                  <button type="button" onClick={() => { setMagicSent(false); setEmail(""); }}
                    className="text-[13px] underline" style={{ color: "var(--text-2)" }}>
                    Utiliser une autre adresse
                  </button>
                </div>
              ) : (
                /* Formulaire magic link */
                <form onSubmit={sendMagicLink}>
                  <div className="flex flex-col gap-4">
                    <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                      Entrez votre adresse email et recevez un lien pour vous connecter en un clic — sans mot de passe.
                    </p>
                    <Field label="Adresse email">
                      <Input icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.fr" autoComplete="email" />
                    </Field>
                    {err && (
                      <div className="flex items-center gap-2 text-[13.5px] px-3 py-2 rounded-lg" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
                        <Icon name="alert" size={14} />{err}
                      </div>
                    )}
                    <Button variant="primary" size="lg" block type="submit" disabled={loading}>
                      {loading ? "Envoi…" : "Recevoir mon lien de connexion"}
                    </Button>
                  </div>
                </form>
              )}

              <div className="mt-5">
                <OAuthButtons mode="login" />
              </div>

              <p className="text-center text-[13.5px] text-text-2 mt-5">
                Pas encore de compte ?{" "}
                <Link href="/signup" className="text-primary font-medium hover:underline">
                  S&apos;inscrire gratuitement
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

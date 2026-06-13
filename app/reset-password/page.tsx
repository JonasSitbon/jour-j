"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo, Icon } from "@/components/icon";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setErr("Adresse email invalide"); return; }
    setErr(""); setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/callback",
    });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
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
            <div className="text-[11px] text-text-3 font-mono">by The Cockpit</div>
          </div>
        </div>
        <div className="relative z-[1] max-w-[460px]">
          <h2 className="text-[34px] font-semibold tracking-[-.03em] leading-[1.18]">
            Réinitialisez votre mot de passe <em className="not-italic text-primary">en toute sécurité</em>.
          </h2>
          <p className="mt-4 text-[15px] text-text-2 leading-relaxed">
            Nous vous enverrons un lien par email pour créer un nouveau mot de passe.
          </p>
        </div>
        <div className="relative z-[1] flex items-center gap-4 bg-surface/70 backdrop-blur border border-line rounded-card px-[18px] py-4 shadow-sm max-w-[360px]">
          <Icon name="mail" size={28} className="text-primary shrink-0" />
          <div className="text-[13.5px] text-text-2 leading-relaxed">
            Un email vous sera envoyé avec un lien valable 24 heures.
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center p-8 md:p-10" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-[380px]">
          <div className="md:hidden flex items-center gap-3 justify-center mb-7">
            <div className="w-9 h-9 text-primary"><Logo size={34} /></div>
            <div className="text-[17px] font-semibold">Jour <b>J</b></div>
          </div>

          {sent ? (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-[24px] font-semibold tracking-[-.025em]">Email envoyé !</h1>
                <p className="text-[14px] text-text-2 mt-2">
                  Vérifiez votre boîte mail. Le lien de réinitialisation expire dans 24 heures.
                </p>
              </div>
              <Link href="/login" className="text-[13.5px] text-primary hover:underline flex items-center gap-1.5">
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h1 className="text-[26px] font-semibold tracking-[-.025em]">Mot de passe oublié</h1>
              <p className="text-[14.5px] text-text-2 mt-1.5 mb-[30px]">
                Entrez votre email et nous vous enverrons un lien de réinitialisation.
              </p>
              <div className="flex flex-col gap-4">
                <Field label="Adresse email">
                  <Input
                    icon="mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@email.fr"
                    autoComplete="email"
                  />
                </Field>

                {err && (
                  <div className="flex items-center gap-2 text-[13.5px] px-3 py-2 rounded-lg" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
                    <Icon name="alert" size={14} />{err}
                  </div>
                )}

                <Button variant="primary" size="lg" block type="submit" disabled={loading}>
                  {loading ? "Envoi en cours…" : "Envoyer le lien"}
                </Button>

                <p className="text-center text-[13.5px] text-text-2">
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    ← Retour à la connexion
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

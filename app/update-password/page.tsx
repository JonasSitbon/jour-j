"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, Icon } from "@/components/icon";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("Le mot de passe doit contenir au moins 8 caractères."); return;
    }
    if (password !== confirm) {
      setErr("Les mots de passe ne correspondent pas."); return;
    }
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  return (
    <div className="relative z-[1] min-h-screen grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
      {/* Panneau visuel */}
      <div
        className="hidden md:flex relative overflow-hidden flex-col justify-between p-14"
        style={{
          background:
            "radial-gradient(120% 90% at 12% 10%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 60%), radial-gradient(100% 100% at 95% 95%, color-mix(in srgb, var(--gold) 18%, transparent), transparent 55%), var(--surface-3)",
        }}
      >
        <div className="relative z-[1] flex items-center gap-3">
          <div className="w-10 h-10 text-primary"><Logo size={38} /></div>
          <div>
            <div className="text-[17px] font-semibold">Jour <b>J</b></div>
            <div className="text-[11px] text-text-3 font-mono">by The Cockpit</div>
          </div>
        </div>
        <div className="relative z-[1] max-w-[460px]">
          <h2 className="text-[34px] font-semibold tracking-[-.03em] leading-[1.18]">
            Créez votre <em className="not-italic text-primary">nouveau mot de passe</em>.
          </h2>
          <p className="mt-4 text-[15px] text-text-2 leading-relaxed">
            Choisissez un mot de passe sécurisé d&apos;au moins 8 caractères.
          </p>
        </div>
        <div className="relative z-[1] flex items-center gap-4 bg-surface/70 backdrop-blur border border-line rounded-card px-[18px] py-4 shadow-sm max-w-[360px]">
          <Icon name="key" size={28} className="text-primary shrink-0" />
          <div className="text-[13.5px] text-text-2 leading-relaxed">
            Votre session est sécurisée. Vous serez redirigé vers votre tableau de bord après la mise à jour.
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

          {done ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-sage-soft flex items-center justify-center mx-auto">
                <Icon name="check-circle" size={28} className="text-sage" />
              </div>
              <div>
                <h1 className="text-[22px] font-semibold tracking-[-.025em]">Mot de passe mis à jour !</h1>
                <p className="text-[14px] text-text-2 mt-2">Vous allez être redirigé vers votre tableau de bord…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h1 className="text-[26px] font-semibold tracking-[-.025em]">Nouveau mot de passe</h1>
              <p className="text-[14.5px] text-text-2 mt-1.5 mb-[30px]">
                Entrez et confirmez votre nouveau mot de passe.
              </p>
              <div className="flex flex-col gap-4">
                <Field label="Nouveau mot de passe">
                  <Input
                    icon="key"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8 caractères minimum"
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirmer le mot de passe">
                  <Input
                    icon="key"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    autoComplete="new-password"
                  />
                </Field>

                {password && (
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <div className={`flex-1 h-1.5 rounded-full ${password.length >= 12 ? "bg-sage" : password.length >= 8 ? "bg-gold" : "bg-coral"}`} />
                    <span className="text-text-3 shrink-0">
                      {password.length >= 12 ? "Fort" : password.length >= 8 ? "Correct" : "Trop court"}
                    </span>
                  </div>
                )}

                {err && (
                  <div className="flex items-center gap-2 text-[13.5px] px-3 py-2 rounded-lg" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
                    <Icon name="alert" size={14} />{err}
                  </div>
                )}

                <Button variant="primary" size="lg" block type="submit" disabled={loading}>
                  {loading ? "Mise à jour…" : "Enregistrer le mot de passe"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

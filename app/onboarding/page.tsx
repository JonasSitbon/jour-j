"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, Icon } from "@/components/icon";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase";
import { seedDefaultTasks, seedDefaultDayJ, seedDefaultBudget, seedDefaultDateCandidates, seedDefaultTables } from "@/lib/seed";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    partnerA: "", partnerB: "", date: "",
    venue: "", city: "", theme: "",
    guestTarget: "100", budgetTotal: "20000",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partnerA || !form.partnerB || !form.date) {
      setErr("Les prénoms et la date sont obligatoires."); return;
    }
    setErr(""); setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: newWedding, error } = await sb.from("wedding").insert({
      partner_a: form.partnerA.trim(),
      partner_b: form.partnerB.trim(),
      date: form.date,
      venue: form.venue.trim(),
      city: form.city.trim(),
      theme: form.theme.trim(),
      guest_target: parseInt(form.guestTarget) || 100,
      budget_total: parseInt(form.budgetTotal) || 20000,
      user_id: user.id,
    }).select("id").single();

    if (error || !newWedding) { setErr(error?.message ?? "Erreur création mariage"); setLoading(false); return; }
    const wId = newWedding.id;

    // Seeder les tâches et le Jour J par défaut
    const budget = parseInt(form.budgetTotal) || 20000;
    await Promise.all([
      seedDefaultTasks(sb, wId, form.date),
      seedDefaultDayJ(sb, wId),
      seedDefaultBudget(sb, wId, budget),
      seedDefaultDateCandidates(sb, wId, form.date),
      seedDefaultTables(sb, wId),
    ]);

    window.location.href = "/dashboard";
  };

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 py-12" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[500px]">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 text-primary"><Logo size={34} /></div>
            <div className="text-[17px] font-semibold">Jour <b>J</b></div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-[13px] text-text-3 hover:text-text transition">
            <Icon name="logout" size={15} />Se déconnecter
          </button>
        </div>

        <h1 className="text-[30px] font-semibold tracking-[-.03em] mb-1">Créez votre espace</h1>
        <p className="text-text-2 text-[14.5px] mb-8">Quelques infos pour personnaliser votre tableau de bord.</p>

        <form onSubmit={submit} className="flex flex-col gap-5 p-7 rounded-card border" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>

          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3 mb-3 flex items-center gap-2">
              <Icon name="rings" size={14} />Les mariés
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom A *">
                <Input value={form.partnerA} onChange={set("partnerA")} placeholder="Camille" />
              </Field>
              <Field label="Prénom B *">
                <Input value={form.partnerB} onChange={set("partnerB")} placeholder="Alex" />
              </Field>
            </div>
          </div>

          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3 mb-3 flex items-center gap-2">
              <Icon name="calendar" size={14} />Le mariage
            </div>
            <div className="flex flex-col gap-3">
              <Field label="Date du mariage *">
                <Input type="date" value={form.date} onChange={set("date")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Lieu / domaine">
                  <Input value={form.venue} onChange={set("venue")} placeholder="Domaine des Tilleuls" />
                </Field>
                <Field label="Ville">
                  <Input value={form.city} onChange={set("city")} placeholder="Aix-en-Provence" />
                </Field>
              </div>
              <Field label="Style / thème">
                <Input value={form.theme} onChange={set("theme")} placeholder="Champêtre élégant" />
              </Field>
            </div>
          </div>

          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3 mb-3 flex items-center gap-2">
              <Icon name="wallet" size={14} />Estimations
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre d'invités">
                <Input type="number" value={form.guestTarget} onChange={set("guestTarget")} placeholder="100" min="1" />
              </Field>
              <Field label="Budget total (€)">
                <Input type="number" value={form.budgetTotal} onChange={set("budgetTotal")} placeholder="20000" min="0" />
              </Field>
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 text-[13.5px] px-3 py-2 rounded-lg" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
              <Icon name="alert" size={14} />{err}
            </div>
          )}

          <Button variant="primary" size="lg" block type="submit" disabled={loading} icon="rings">
            {loading ? "Création en cours…" : "Créer mon espace mariage"}
          </Button>
        </form>
      </div>
    </div>
  );
}

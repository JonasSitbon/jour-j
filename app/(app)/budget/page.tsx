"use client";

import { useState, useMemo } from "react";
import { useStore, useToast } from "@/components/providers";
import { fmt } from "@/lib/format";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Select, Donut, Drawer, Field, Input } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { PageTutorial } from "@/components/tutorial";
import type { BudgetPost, Payment } from "@/lib/types";
import { BUDGET_RULES as RULES, splitPost } from "@/lib/budget";
import { lazyExportBudgetPDF } from "@/lib/pdf-lazy";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from "recharts";
import { createClient } from "@/lib/supabase";
import { getWeddingId } from "@/lib/db";
import { seedDefaultBudget } from "@/lib/seed";
import { ScrollReveal } from "@/components/scroll-reveal";

/* ─── French wedding benchmarks (moyenne 2024 ≈ 29 200 €) ─────────────── */
const FR_AVERAGE_TOTAL = 29200;
const FR_AVERAGE_GUESTS = 80;
const FR_BENCHMARKS = [
  { cat: "Salle de réception",    pct: 22, avgEur: 6500, icon: "home",    keywords: ["salle", "réception", "lieu", "domaine", "chateau", "château"] },
  { cat: "Traiteur & restauration", pct: 30, avgEur: 8800, icon: "star",   keywords: ["traiteur", "restaur", "repas", "cocktail", "vin d'honneur", "buffet"] },
  { cat: "Photographie & vidéo",  pct: 12, avgEur: 3500, icon: "camera",  keywords: ["photo", "vidéo", "video", "photographe", "filmage"] },
  { cat: "Fleurs & décoration",   pct: 8,  avgEur: 2300, icon: "flower",  keywords: ["fleur", "déco", "deco", "bouquet", "floral", "centrepiece"] },
  { cat: "Musique & animation",   pct: 6,  avgEur: 1800, icon: "music",   keywords: ["musique", "music", "dj", "groupe", "animation", "orchestre"] },
  { cat: "Tenue des mariés",      pct: 7,  avgEur: 2100, icon: "rings",   keywords: ["robe", "tenue", "costume", "habit", "marié", "marie"] },
  { cat: "Transport & voiture",   pct: 4,  avgEur: 1200, icon: "car",     keywords: ["transport", "voiture", "limousine", "véhicule", "navette"] },
  { cat: "Faire-part & papeterie",pct: 3,  avgEur: 900,  icon: "mail",    keywords: ["faire-part", "papeterie", "invitation", "menu", "plan de table"] },
  { cat: "Coiffure & maquillage", pct: 3,  avgEur: 850,  icon: "sparkle", keywords: ["coiffure", "maquillage", "beauty", "esthétique", "coiffeur"] },
  { cat: "Divers & imprévus",     pct: 5,  avgEur: 1500, icon: "dots",    keywords: ["divers", "imprévu", "autre", "misc"] },
];

/* ─── Smart post picker presets ────────────────────────────────────────── */
const POST_PRESETS = [
  { label: "Salle & Lieu",            icon: "🏛",  avgPct: 22, example: "Domaine, château, salle des fêtes" },
  { label: "Traiteur & Boissons",     icon: "🍽",  avgPct: 30, example: "Menu, cocktail, vin d'honneur" },
  { label: "Photographe",             icon: "📷",  avgPct: 12, example: "Reportage complet, album" },
  { label: "Vidéaste",                icon: "🎬",  avgPct: 6,  example: "Film de mariage, drone" },
  { label: "Fleurs & Décoration",     icon: "🌸",  avgPct: 8,  example: "Bouquets, centres de table" },
  { label: "DJ & Animation",          icon: "🎵",  avgPct: 6,  example: "DJ, animation soirée" },
  { label: "Groupe / Orchestre",      icon: "🎷",  avgPct: 5,  example: "Groupe live, quartet" },
  { label: "Tenue de la mariée",      icon: "👗",  avgPct: 7,  example: "Robe, accessoires, voile" },
  { label: "Tenue du marié",          icon: "🤵",  avgPct: 3,  example: "Costume, smoking" },
  { label: "Coiffure & Maquillage",   icon: "💄",  avgPct: 3,  example: "Mariée + témoins" },
  { label: "Faire-part & Papeterie",  icon: "💌",  avgPct: 3,  example: "Invitations, menus, plans de table" },
  { label: "Transport & Voiture",     icon: "🚗",  avgPct: 4,  example: "Voiture de mariés, navette invités" },
  { label: "Hébergement",             icon: "🏨",  avgPct: 2,  example: "Nuit de noces, hébergement famille" },
  { label: "Alliance & Bijoux",       icon: "💍",  avgPct: 4,  example: "Alliances, bijoux mariée" },
  { label: "Gâteau & Pièce montée",   icon: "🎂",  avgPct: 2,  example: "Wedding cake, croquembouche" },
  { label: "Animation invités",       icon: "🎪",  avgPct: 2,  example: "Photo booth, jeux, baby sitting" },
  { label: "Lune de miel",            icon: "✈️", avgPct: 5,  example: "Voyage, hôtel destination" },
  { label: "Autre / Divers",          icon: "⚡",  avgPct: 3,  example: "Imprévus, tips, divers" },
];

function matchBudgetPosts(posts: BudgetPost[], keywords: string[]): number {
  return posts
    .filter((p) => keywords.some((kw) => p.label.toLowerCase().includes(kw.toLowerCase())))
    .reduce((s, p) => s + p.planned, 0);
}

const PALETTE = ["#C96E2C", "#D6A22F", "#7E9A63", "#C0533A", "#E0B05A", "#9C6B3A", "#8FA873", "#B98A5C", "#D98B4E", "#C7A86A", "#A08A4E", "#7C6F4A"];

/* ─── New Post Drawer with 2-step wizard ───────────────────────────────── */
interface PostPreset {
  label: string;
  icon: string;
  avgPct: number;
  example: string;
}

interface NewPostDrawerProps {
  onClose: () => void;
  budgetTotal: number;
  existingLabels: string[];
}

function NewPostDrawer({ onClose, budgetTotal, existingLabels }: NewPostDrawerProps) {
  const { state, update } = useStore();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [form, setForm] = useState({ label: "", cat: state.vendorCats[0]?.id ?? "salle", planned: "", rule: "split50" });

  const handlePresetClick = (preset: PostPreset) => {
    const suggested = budgetTotal > 0
      ? Math.round(budgetTotal * preset.avgPct / 100 / 100) * 100
      : 0;
    setForm((f) => ({
      ...f,
      label: preset.label,
      planned: suggested > 0 ? String(suggested) : "",
    }));
    setStep("form");
  };

  const handleCustomClick = () => {
    setForm((f) => ({ ...f, label: "", planned: "" }));
    setStep("form");
  };

  // Count how many benchmark posts don't yet exist
  const missingPresets = POST_PRESETS.filter(
    (p) => !existingLabels.some((l) => l.toLowerCase() === p.label.toLowerCase())
  );

  const handleBulkCreate = async () => {
    setShowBulkConfirm(false);
    setSaving(true);
    const wId = getWeddingId();
    const newPosts: BudgetPost[] = missingPresets.map((preset) => {
      const suggested = budgetTotal > 0
        ? Math.round(budgetTotal * preset.avgPct / 100 / 100) * 100
        : 0;
      return {
        id: Date.now() + Math.random(),
        label: preset.label,
        cat: state.vendorCats[0]?.id ?? "salle",
        planned: suggested,
        spent: 0,
        rule: "split50" as const,
        custom: null,
      };
    });
    if (wId) {
      await createClient().from("budget_posts").insert(
        newPosts.map((p) => ({ ...p, wedding_id: wId }))
      );
    }
    update("budget", (l) => [...l, ...newPosts]);
    toast(`${newPosts.length} postes ajoutés`);
    setSaving(false);
    onClose();
  };

  const save = async () => {
    if (!form.label.trim()) { toast("Le libellé est obligatoire", "err"); return; }
    if (!form.planned || isNaN(parseInt(form.planned))) { toast("Le montant est obligatoire", "err"); return; }
    setSaving(true);
    const wId = getWeddingId();
    const newPost: BudgetPost = { id: Date.now(), label: form.label.trim(), cat: form.cat, planned: parseInt(form.planned), spent: 0, rule: form.rule as BudgetPost["rule"], custom: null };
    if (wId) {
      await createClient().from("budget_posts").insert({ ...newPost, wedding_id: wId });
    }
    update("budget", (l) => [...l, newPost]);
    toast("Poste de budget ajouté");
    setSaving(false);
    onClose();
  };

  /* Step 1 — Picker */
  if (step === "pick") {
    return (
      <>
        <Drawer
          title="Choisir un poste"
          onClose={onClose}
          footer={
            <>
              <Button variant="ghost" onClick={onClose}>Annuler</Button>
              <div className="flex-1" />
              <Button
                variant="secondary"
                icon="sparkle"
                onClick={() => setShowBulkConfirm(true)}
                disabled={missingPresets.length === 0}
              >
                Répartition automatique
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-text-2">Sélectionnez un poste type pour le pré-remplir, ou créez un poste personnalisé.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {POST_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="flex flex-col items-start gap-1.5 rounded-[14px] border border-line bg-surface p-3.5 text-left hover:bg-hover hover:border-primary/40 transition-all group"
                >
                  <div className="text-[22px] leading-none">{preset.icon}</div>
                  <div className="font-semibold text-[13px] leading-tight">{preset.label}</div>
                  <div className="text-[11px] text-primary font-medium">~{preset.avgPct}% du budget</div>
                  <div className="text-[11px] text-text-3 leading-tight">{preset.example}</div>
                </button>
              ))}
              {/* Custom post option */}
              <button
                onClick={handleCustomClick}
                className="flex flex-col items-start gap-1.5 rounded-[14px] border border-dashed border-line bg-surface p-3.5 text-left hover:bg-hover hover:border-primary/40 transition-all"
              >
                <div className="text-[22px] leading-none">✏️</div>
                <div className="font-semibold text-[13px] leading-tight">Poste personnalisé</div>
                <div className="text-[11px] text-text-3 leading-tight">Libellé et montant libres</div>
              </button>
            </div>
          </div>
        </Drawer>

        {/* Bulk confirm modal */}
        {showBulkConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-surface rounded-[20px] shadow-xl border border-line p-6 max-w-sm w-full flex flex-col gap-4">
              <div className="font-semibold text-[16px]">Répartition automatique</div>
              <p className="text-[13.5px] text-text-2 leading-relaxed">
                Créer <span className="font-semibold text-text-1">{missingPresets.length}</span> postes budgétaires basés sur les moyennes françaises ?
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowBulkConfirm(false)}>Annuler</Button>
                <Button variant="primary" icon="sparkle" onClick={handleBulkCreate} disabled={saving}>
                  {saving ? "Création…" : "Créer les postes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* Step 2 — Form */
  return (
    <Drawer
      title="Nouveau poste de budget"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={() => setStep("pick")}>Retour</Button>
          <div className="flex-1" />
          <Button variant="primary" icon="check" onClick={save} disabled={saving}>
            {saving ? "Enregistrement…" : "Ajouter"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Libellé *"><Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Ex : Photographe" /></Field>
        <div className="flex gap-3">
          <Field label="Catégorie">
            <Select value={form.cat} onChange={(v) => setForm((f) => ({ ...f, cat: v }))} options={state.vendorCats.map((c) => ({ value: c.id, label: c.label }))} />
          </Field>
          <Field label="Montant prévu (€) *">
            <Input type="number" value={form.planned} onChange={(e) => setForm((f) => ({ ...f, planned: e.target.value }))} placeholder="0" min="0" />
          </Field>
        </div>
        <Field label="Répartition">
          <Select value={form.rule} onChange={(v) => setForm((f) => ({ ...f, rule: v }))} options={Object.entries(RULES).map(([k, l]) => ({ value: k, label: l }))} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ─── Benchmark Tab ────────────────────────────────────────────────────── */
function BenchmarkTab() {
  const { state } = useStore();
  const totalBudget = state.budgetTotal || 0;
  const totalGuests = state.guests.filter((g) => g.rsvp !== "declined").length || FR_AVERAGE_GUESTS;

  // Budget tier
  const tier =
    totalBudget < 10000 ? { label: "Économique", color: "text-sage", tone: "sage" as const } :
    totalBudget < 25000 ? { label: "Standard",   color: "text-primary", tone: "primary" as const } :
    totalBudget < 50000 ? { label: "Premium",    color: "text-[var(--gold-ink)]", tone: "gold" as const } :
                          { label: "Luxe",        color: "text-coral", tone: "coral" as const };

  const diffPct = totalBudget && FR_AVERAGE_TOTAL
    ? Math.round((totalBudget - FR_AVERAGE_TOTAL) / FR_AVERAGE_TOTAL * 100)
    : 0;
  const diffAbove = diffPct >= 0;
  const costPerPerson = totalGuests ? Math.round(totalBudget / totalGuests) : 0;
  const avgCostPerPerson = Math.round(FR_AVERAGE_TOTAL / FR_AVERAGE_GUESTS);

  // Category matching
  const rows = FR_BENCHMARKS.map((bm) => {
    const userAmt = matchBudgetPosts(state.budget, bm.keywords);
    const scaledAvg = totalBudget ? Math.round(totalBudget * bm.pct / 100) : bm.avgEur;
    const hasMatch = userAmt > 0;
    const ratio = scaledAvg > 0 ? userAmt / scaledAvg : 0;
    const status: "over" | "under" | "ok" | "none" =
      !hasMatch ? "none" :
      ratio > 1.15 ? "over" :
      ratio < 0.85 ? "under" : "ok";
    return { ...bm, userAmt, scaledAvg, hasMatch, ratio, status };
  });

  // Smart insights
  const insights: { icon: string; tone: "coral" | "sage" | "primary" | "amber"; text: string }[] = [];
  const traiteurRow = rows.find((r) => r.cat === "Traiteur & restauration");
  const salleRow = rows.find((r) => r.cat === "Salle de réception");
  const photoRow = rows.find((r) => r.cat === "Photographie & vidéo");

  if (salleRow && !salleRow.hasMatch)
    insights.push({ icon: "info", tone: "primary", text: `La salle représente en moyenne 22 % du budget — pensez à l'inclure (≈ ${fmt.eur(salleRow.scaledAvg)}).` });
  if (traiteurRow && traiteurRow.hasMatch && traiteurRow.userAmt / totalBudget > 0.35)
    insights.push({ icon: "alert", tone: "coral", text: `La part traiteur est élevée (${Math.round(traiteurRow.userAmt / totalBudget * 100)} % vs 30 % en moyenne). Envisagez de rééquilibrer.` });
  if (photoRow && !photoRow.hasMatch)
    insights.push({ icon: "info", tone: "amber", text: `La photographie n'est pas encore budgétisée. Elle représente ~12 % du budget d'un mariage (≈ ${fmt.eur(photoRow.scaledAvg)}).` });
  if (totalBudget > FR_AVERAGE_TOTAL)
    insights.push({ icon: "check", tone: "sage", text: `Votre budget (${fmt.eur(totalBudget)}) est supérieur à la moyenne française (${fmt.eur(FR_AVERAGE_TOTAL)}). Vous avez une marge de confort.` });
  else if (totalBudget > 0 && totalBudget < FR_AVERAGE_TOTAL)
    insights.push({ icon: "info", tone: "primary", text: `Votre budget est ${Math.abs(diffPct)} % sous la moyenne française. Priorisez bien vos postes essentiels.` });
  const overRows = rows.filter((r) => r.status === "over");
  if (overRows.length > 0)
    insights.push({ icon: "alert", tone: "amber", text: `${overRows.map((r) => r.cat).join(", ")} : au-dessus de la norme. Négociez ou rééquilibrez pour rester dans l'enveloppe.` });

  // Gauge: 0=< €10K, 1= €25K, 2= €50K, 3= >€50K
  const gaugeStops = [0, 10000, 25000, 50000, 70000];
  const gaugeLabels = ["0", "10 K", "25 K", "50 K", "70 K+"];
  const gaugePct = Math.min(100, totalBudget / 70000 * 100);

  return (
    <div className="flex flex-col gap-5">

      {/* ── 1. Summary header ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Budget vs average card */}
        <Card className="flex flex-col gap-4">
          <div className="sec-title mb-1"><Icon name="bars" size={17} className="text-text-3" />Votre budget vs. la moyenne</div>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3 mb-0.5">Votre budget</div>
              <div className="font-mono text-[28px] font-semibold tracking-[-.02em]">{fmt.eur(totalBudget)}</div>
            </div>
            <div className="text-text-3 text-[22px] font-thin mb-1">vs</div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3 mb-0.5">Moyenne France</div>
              <div className="font-mono text-[28px] font-semibold tracking-[-.02em] text-text-2">{fmt.eur(FR_AVERAGE_TOTAL)}</div>
            </div>
            <div className="ml-auto">
              <Badge tone={diffAbove ? "sage" : "primary"} icon={diffAbove ? "check" : "info"}>
                {diffAbove ? "+" : ""}{diffPct} %
              </Badge>
            </div>
          </div>

          {/* Gauge bar */}
          <div className="mt-1">
            <div className="relative h-3 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                style={{ width: `${gaugePct}%`, background: "linear-gradient(90deg, var(--sage) 0%, var(--primary) 40%, var(--gold) 70%, var(--coral) 100%)" }}
              />
              {/* tick marks */}
              {gaugeStops.slice(1, -1).map((stop) => (
                <div key={stop} className="absolute top-0 bottom-0 w-px bg-surface opacity-60" style={{ left: `${stop / 70000 * 100}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {gaugeLabels.map((l) => (
                <span key={l} className="text-[10.5px] text-text-3">{l}</span>
              ))}
            </div>
            <div className="flex justify-between mt-0.5 px-0">
              <span className="text-[10px] text-text-3 italic">économique</span>
              <span className="text-[10px] text-text-3 italic">standard</span>
              <span className="text-[10px] text-text-3 italic">premium</span>
              <span className="text-[10px] text-text-3 italic">luxe</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Badge tone={tier.tone}>{tier.label}</Badge>
            <span className="text-[12.5px] text-text-2">Catégorie de budget</span>
          </div>
        </Card>

        {/* Guests & per-person card */}
        <Card className="flex flex-col gap-4">
          <div className="sec-title mb-1"><Icon name="users" size={17} className="text-text-3" />Coût par invité</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[12px] bg-surface-2 p-4 flex flex-col gap-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Vos invités</div>
              <div className="font-mono text-[26px] font-semibold tracking-[-.02em]">{totalGuests}</div>
              <div className="text-[12px] text-text-2">personnes confirmées</div>
            </div>
            <div className="rounded-[12px] bg-surface-2 p-4 flex flex-col gap-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Moyenne France</div>
              <div className="font-mono text-[26px] font-semibold tracking-[-.02em] text-text-2">{FR_AVERAGE_GUESTS}</div>
              <div className="text-[12px] text-text-2">invités en moyenne</div>
            </div>
            <div className="rounded-[12px] bg-primary-soft p-4 flex flex-col gap-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-primary-700">Votre coût / personne</div>
              <div className="font-mono text-[26px] font-semibold tracking-[-.02em] text-primary-700">{fmt.eur(costPerPerson)}</div>
              <div className="text-[12px] text-primary-700 opacity-70">par invité</div>
            </div>
            <div className="rounded-[12px] bg-surface-2 p-4 flex flex-col gap-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Moyenne / personne</div>
              <div className="font-mono text-[26px] font-semibold tracking-[-.02em] text-text-2">{fmt.eur(avgCostPerPerson)}</div>
              <div className="text-[12px] text-text-2">par invité en France</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 2. Category breakdown ─────────────────────────────────────────── */}
      <Card pad={false}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="sec-title"><Icon name="pie" size={17} className="text-text-3" />Analyse par poste</div>
          <span className="text-[12px] text-text-3">Comparaison à la moyenne française 2024</span>
        </div>
        {/* header */}
        <div className="hidden md:grid grid-cols-[2fr_90px_1fr_1fr_140px_80px] gap-3 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-3 bg-surface-2">
          <div>Catégorie</div>
          <div className="text-right">% moyen</div>
          <div className="text-right">Moy. France</div>
          <div className="text-right">Votre budget</div>
          <div className="pl-2">Comparaison</div>
          <div className="text-center">Statut</div>
        </div>
        <div>
          {rows.map((row) => {
            const barUserPct = row.scaledAvg > 0 ? Math.min(100, row.userAmt / row.scaledAvg * 100) : 0;
            const statusConfig = {
              ok:   { tone: "sage" as const,    label: "Ok",          barColor: "var(--sage)" },
              over: { tone: "coral" as const,   label: "Au-dessus",   barColor: "var(--coral)" },
              under:{ tone: "primary" as const, label: "En-dessous",  barColor: "var(--primary)" },
              none: { tone: "neutral" as const, label: "À budgéter",  barColor: "var(--line)" },
            }[row.status];

            return (
              <div key={row.cat} className="grid grid-cols-[1fr_80px] md:grid-cols-[2fr_90px_1fr_1fr_140px_80px] gap-3 items-center px-5 py-3.5 border-b border-line last:border-0 hover:bg-hover transition-colors">
                {/* Category */}
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 bg-surface-2 text-text-2">
                    <Icon name={row.icon} size={17} />
                  </span>
                  <div>
                    <div className="font-medium text-[13.5px]">{row.cat}</div>
                    <div className="text-[11.5px] text-text-3">{row.pct} % du budget type</div>
                  </div>
                </div>
                {/* % moyen */}
                <div className="hidden md:flex justify-end">
                  <span className="font-mono text-[13px] text-text-2">{row.pct} %</span>
                </div>
                {/* Avg France */}
                <div className="hidden md:flex justify-end">
                  <span className="font-mono text-[13px] text-text-2">{fmt.eur(row.scaledAvg)}</span>
                </div>
                {/* User amount */}
                <div className="hidden md:flex justify-end">
                  {row.hasMatch
                    ? <span className={`font-mono text-[13.5px] font-semibold ${row.status === "over" ? "text-coral" : row.status === "under" ? "text-primary" : ""}`}>{fmt.eur(row.userAmt)}</span>
                    : <span className="text-text-3 text-[12.5px] italic">Non budgétisé</span>
                  }
                </div>
                {/* Bar */}
                <div className="hidden md:block pl-2">
                  <div className="relative">
                    {/* avg baseline */}
                    <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barUserPct}%`, background: statusConfig.barColor }} />
                    </div>
                    {/* avg marker at 100% */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-line" style={{ left: "100%", marginLeft: "-1px" }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-text-3">0</span>
                    <span className="text-[10px] text-text-3">moy.</span>
                  </div>
                </div>
                {/* Status badge */}
                <div className="flex justify-center md:justify-center">
                  <Badge tone={statusConfig.tone}>{statusConfig.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3 bg-surface-2 text-[11.5px] text-text-3 flex items-center gap-1.5 rounded-b-card">
          <Icon name="info" size={13} className="shrink-0" />
          Source : enquête Mariages.net & INSEE · Moyenne nationale 2024 ≈ {fmt.eur(FR_AVERAGE_TOTAL)} · Les montants « Moy. France » sont adaptés proportionnellement à votre enveloppe.
        </div>
      </Card>

      {/* ── 3. Smart insights ─────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <Card>
          <div className="sec-title mb-4"><Icon name="sparkle" size={17} className="text-text-3" />Recommandations personnalisées</div>
          <div className="flex flex-col gap-3">
            {insights.map((ins, i) => {
              const bg = {
                coral:   "bg-coral-soft border-coral/20",
                sage:    "bg-sage-soft border-sage/20",
                primary: "bg-primary-soft border-primary/20",
                amber:   "bg-amber-soft border-amber/20",
              }[ins.tone];
              const iconColor = {
                coral: "text-coral", sage: "text-sage", primary: "text-primary", amber: "text-[var(--gold-ink)]",
              }[ins.tone];
              return (
                <div key={i} className={`flex items-start gap-3 rounded-[12px] border px-4 py-3 ${bg}`}>
                  <Icon name={ins.icon} size={16} className={`${iconColor} mt-0.5 shrink-0`} />
                  <p className="text-[13.5px] leading-relaxed">{ins.text}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── 4. Budget optimizer ───────────────────────────────────────────── */}
      <BudgetOptimizer totalBudget={totalBudget} />
    </div>
  );
}

function BudgetOptimizer({ totalBudget }: { totalBudget: number }) {
  const [sliders, setSliders] = useState<Record<string, number>>(() =>
    Object.fromEntries(FR_BENCHMARKS.map((b) => [b.cat, b.pct]))
  );
  const total = Object.values(sliders).reduce((s, v) => s + v, 0);
  const setSlider = (cat: string, val: number) => {
    setSliders((prev) => ({ ...prev, [cat]: val }));
  };

  return (
    <Card>
      <div className="sec-title mb-1"><Icon name="wallet" size={17} className="text-text-3" />Simulateur de répartition</div>
      <p className="text-[13px] text-text-2 mb-5">Ajustez les pourcentages pour voir comment répartir votre enveloppe entre les postes.</p>

      {totalBudget === 0 && (
        <div className="text-[13px] text-text-2 bg-surface-2 rounded-[12px] px-4 py-3 mb-4 flex items-center gap-2">
          <Icon name="info" size={14} className="text-primary" />
          Définissez votre budget total dans les réglages pour voir les montants.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {FR_BENCHMARKS.map((bm) => {
          const pct = sliders[bm.cat] ?? bm.pct;
          const amt = Math.round(totalBudget * pct / 100);
          const diff = pct - bm.pct;
          return (
            <div key={bm.cat} className="grid grid-cols-[1fr_60px_80px] md:grid-cols-[2fr_200px_60px_90px] gap-3 items-center">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 bg-surface-2 text-text-2">
                  <Icon name={bm.icon} size={14} />
                </span>
                <span className="text-[13px] font-medium truncate">{bm.cat}</span>
              </div>
              <input
                type="range" min={0} max={50} step={1} value={pct}
                onChange={(e) => setSlider(bm.cat, Number(e.target.value))}
                className="hidden md:block w-full accent-[var(--primary)] h-2"
              />
              <div className="text-right font-mono text-[13px] font-semibold tabular-nums">{pct} %</div>
              <div className="flex items-center gap-1.5 justify-end">
                {totalBudget > 0 && <span className="font-mono text-[12.5px] text-text-2 tabular-nums">{fmt.eur(amt)}</span>}
                {diff !== 0 && (
                  <span className={`text-[11px] font-semibold ${diff > 0 ? "text-coral" : "text-sage"}`}>
                    {diff > 0 ? "+" : ""}{diff} %
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-5 flex items-center justify-between rounded-[12px] px-4 py-3 ${Math.abs(total - 100) <= 1 ? "bg-sage-soft" : "bg-coral-soft"}`}>
        <span className="text-[13px] font-semibold">Total alloué</span>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-[18px] font-bold ${Math.abs(total - 100) <= 1 ? "text-sage" : "text-coral"}`}>{total} %</span>
          {Math.abs(total - 100) > 1 && (
            <Badge tone="coral">{total > 100 ? `+${total - 100}` : total - 100} % à ajuster</Badge>
          )}
          {Math.abs(total - 100) <= 1 && <Badge tone="sage" icon="check">Équilibré</Badge>}
        </div>
      </div>

      <button
        className="mt-3 text-[12.5px] text-primary font-medium hover:underline"
        onClick={() => setSliders(Object.fromEntries(FR_BENCHMARKS.map((b) => [b.cat, b.pct])))}
      >
        Réinitialiser aux moyennes nationales
      </button>
    </Card>
  );
}

/* ─── National Averages data ────────────────────────────────────────────── */
const NATIONAL_AVERAGES: Record<string, { avg: number; min: number; max: number; label: string }> = {
  "Traiteur":           { avg: 8500,  min: 5000,  max: 15000, label: "Traiteur & boissons" },
  "Salle":              { avg: 3200,  min: 1500,  max: 8000,  label: "Salle / lieu de réception" },
  "Photographe":        { avg: 2400,  min: 1500,  max: 4500,  label: "Photographe" },
  "Fleurs":             { avg: 1800,  min: 800,   max: 3500,  label: "Fleurs & décoration" },
  "Musique":            { avg: 1500,  min: 800,   max: 3000,  label: "Musique / DJ / groupe" },
  "Robes & costumes":   { avg: 2200,  min: 800,   max: 5000,  label: "Tenues (robes + costumes)" },
  "Transport":          { avg: 900,   min: 400,   max: 2000,  label: "Transport & voiture" },
  "Gâteau":             { avg: 700,   min: 350,   max: 1500,  label: "Pièce montée / gâteau" },
  "Faire-part":         { avg: 350,   min: 150,   max: 800,   label: "Faire-part & papeterie" },
  "Vidéaste":           { avg: 1800,  min: 1000,  max: 3500,  label: "Vidéaste" },
  "Bijoux":             { avg: 1200,  min: 500,   max: 3000,  label: "Bijoux & alliances" },
};

const NATIONAL_KEYWORDS: Record<string, string[]> = {
  "Traiteur":           ["traiteur", "restaur", "repas", "cocktail", "buffet", "boisson"],
  "Salle":              ["salle", "lieu", "réception", "domaine", "château", "chateau"],
  "Photographe":        ["photo", "photographe"],
  "Fleurs":             ["fleur", "déco", "deco", "bouquet", "floral"],
  "Musique":            ["musique", "dj", "groupe", "animation", "orchestre"],
  "Robes & costumes":   ["robe", "costume", "tenue", "habit", "marié", "marie"],
  "Transport":          ["transport", "voiture", "limousine", "navette", "véhicule"],
  "Gâteau":             ["gâteau", "gateau", "pièce montée", "wedding cake", "croquembouche"],
  "Faire-part":         ["faire-part", "papeterie", "invitation", "menu"],
  "Vidéaste":           ["vidéo", "video", "vidéaste", "film"],
  "Bijoux":             ["bijoux", "alliance", "bague"],
};

const NATIONAL_AVG_TOTAL = Object.values(NATIONAL_AVERAGES).reduce((s, v) => s + v.avg, 0);

/* ─── Comparaison Nationale Tab ─────────────────────────────────────────── */
function ComparaisonNationaleTab() {
  const { state } = useStore();

  // For each category, find the user's planned amount by loose keyword match
  const rows = Object.entries(NATIONAL_AVERAGES).map(([key, data]) => {
    const keywords = NATIONAL_KEYWORDS[key] ?? [key.toLowerCase()];
    const userAmt = state.budget
      .filter((b) => keywords.some((kw) => b.label.toLowerCase().includes(kw)))
      .reduce((s, b) => s + b.planned, 0);

    const hasMatch = userAmt > 0;
    // status relative to avg and max
    const color: "green" | "amber" | "red" | "none" =
      !hasMatch ? "none" :
      userAmt <= data.avg ? "green" :
      userAmt <= data.avg * 1.2 ? "amber" : "red";

    return { key, ...data, userAmt, hasMatch, color };
  });

  const userTotal = state.budget.reduce((s, b) => s + b.planned, 0);

  // Global comparison color
  const globalColor: "green" | "amber" | "red" =
    userTotal <= NATIONAL_AVG_TOTAL ? "green" :
    userTotal <= NATIONAL_AVG_TOTAL * 1.2 ? "amber" : "red";

  const globalColorClass = {
    green: "text-sage",
    amber: "text-[var(--gold-ink)]",
    red: "text-coral",
  }[globalColor];

  const globalBgClass = {
    green: "bg-sage-soft border-sage/20",
    amber: "bg-amber-soft border-amber/20",
    red: "bg-coral-soft border-coral/20",
  }[globalColor];

  const colorClass = {
    green: "text-sage",
    amber: "text-[var(--gold-ink)]",
    red: "text-coral",
    none: "text-text-3",
  };

  const markerBg = {
    green: "bg-sage",
    amber: "bg-[var(--gold)]",
    red: "bg-coral",
    none: "bg-line",
  };

  // Scale: range bar spans 0..max, on a capped display scale of max * 1.15
  const getBarPositions = (min: number, avg: number, max: number, userAmt: number) => {
    const scale = max * 1.15;
    return {
      minPct:  Math.min(100, (min  / scale) * 100),
      maxPct:  Math.min(100, (max  / scale) * 100),
      avgPct:  Math.min(100, (avg  / scale) * 100),
      userPct: Math.min(100, (userAmt / scale) * 100),
    };
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── 1. Header card ──────────────────────────────────────────────── */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-primary-soft flex items-center justify-center shrink-0">
            <Icon name="bars" size={19} className="text-primary-700" />
          </div>
          <div>
            <div className="font-semibold text-[15px]">Mariage en France — Budget moyen</div>
            <div className="text-[13.5px] text-text-2 mt-0.5">
              De <span className="font-semibold text-text-1">15 000 €</span> à <span className="font-semibold text-text-1">20 000 €</span> selon les régions et le nombre d&apos;invités.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
          <div className="rounded-[12px] bg-surface-2 px-4 py-3 flex flex-col gap-0.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Cumul des postes types</div>
            <div className="font-mono text-[22px] font-semibold tracking-[-.02em]">{NATIONAL_AVG_TOTAL.toLocaleString("fr-FR")} €</div>
            <div className="text-[11.5px] text-text-3">moyenne nationale</div>
          </div>
          <div className={`rounded-[12px] px-4 py-3 flex flex-col gap-0.5 border ${globalBgClass}`}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Votre budget prévu</div>
            <div className={`font-mono text-[22px] font-semibold tracking-[-.02em] ${globalColorClass}`}>
              {userTotal > 0 ? userTotal.toLocaleString("fr-FR") + " €" : "—"}
            </div>
            {userTotal > 0 && (
              <div className={`text-[11.5px] font-medium ${globalColorClass}`}>
                {userTotal <= NATIONAL_AVG_TOTAL
                  ? `${Math.round((NATIONAL_AVG_TOTAL - userTotal) / NATIONAL_AVG_TOTAL * 100)} % sous la moyenne`
                  : `+${Math.round((userTotal - NATIONAL_AVG_TOTAL) / NATIONAL_AVG_TOTAL * 100)} % au-dessus de la moyenne`}
              </div>
            )}
          </div>
          <div className="rounded-[12px] bg-surface-2 px-4 py-3 flex flex-col gap-0.5 hidden sm:flex">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Fourchette courante</div>
            <div className="font-mono text-[17px] font-semibold tracking-[-.02em] text-text-2">15 000 – 20 000 €</div>
            <div className="text-[11.5px] text-text-3">régions hors Île-de-France</div>
          </div>
        </div>
      </Card>

      {/* ── 2. Comparison rows ──────────────────────────────────────────── */}
      <Card pad={false}>
        <div className="px-5 pt-5 pb-3">
          <div className="sec-title"><Icon name="pie" size={17} className="text-text-3" />Comparaison poste par poste</div>
          <p className="text-[12.5px] text-text-3 mt-1">
            La barre montre la fourchette nationale (min → max). Le trait vertical est la moyenne nationale, le marqueur coloré est votre budget.
          </p>
        </div>

        {/* Column headers — desktop */}
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_2.5fr] gap-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-3 bg-surface-2">
          <div>Catégorie</div>
          <div className="text-right">Votre budget</div>
          <div className="text-right">Moy. nationale</div>
          <div className="pl-1">Fourchette nationale</div>
        </div>

        <div>
          {rows.map((row) => {
            const { minPct, maxPct, avgPct, userPct } = getBarPositions(row.min, row.avg, row.max, row.userAmt);

            return (
              <div
                key={row.key}
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_2.5fr] gap-x-4 gap-y-2 items-center px-5 py-4 border-b border-line last:border-0 hover:bg-hover transition-colors"
              >
                {/* Category label */}
                <div>
                  <div className="font-medium text-[13.5px]">{row.label}</div>
                  <div className="text-[11.5px] text-text-3">
                    {row.min.toLocaleString("fr-FR")} € – {row.max.toLocaleString("fr-FR")} €
                  </div>
                </div>

                {/* User amount */}
                <div className="text-right">
                  {row.hasMatch ? (
                    <span className={`font-mono text-[13.5px] font-semibold ${colorClass[row.color]}`}>
                      {row.userAmt.toLocaleString("fr-FR")} €
                    </span>
                  ) : (
                    <span className="text-[12.5px] text-text-3 italic">Non renseigné</span>
                  )}
                </div>

                {/* National avg */}
                <div className="hidden md:block text-right">
                  <span className="font-mono text-[13px] text-text-2">{row.avg.toLocaleString("fr-FR")} €</span>
                </div>

                {/* Range bar */}
                <div className="md:pl-1">
                  <div className="relative h-4 flex items-center">
                    {/* Full-width light gray base */}
                    <div className="absolute inset-0 rounded-full bg-surface-2" />

                    {/* Colored range segment: min% to max% */}
                    <div
                      className="absolute h-full rounded-full bg-line/60"
                      style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
                    />

                    {/* Average marker — dark vertical line */}
                    <div
                      className="absolute top-0 bottom-0 w-[2px] rounded-full bg-text-2 z-10"
                      style={{ left: `${avgPct}%`, marginLeft: "-1px" }}
                      title={`Moy. : ${row.avg.toLocaleString("fr-FR")} €`}
                    />

                    {/* User marker — colored dot */}
                    {row.hasMatch && (
                      <div
                        className={`absolute w-3 h-3 rounded-full border-2 border-surface z-20 shadow-sm ${markerBg[row.color]}`}
                        style={{ left: `${userPct}%`, marginLeft: "-6px" }}
                        title={`Votre budget : ${row.userAmt.toLocaleString("fr-FR")} €`}
                      />
                    )}
                  </div>

                  {/* Labels under bar */}
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-text-3">{row.min.toLocaleString("fr-FR")} €</span>
                    <span className="text-[10px] text-text-3">moy. {row.avg.toLocaleString("fr-FR")} €</span>
                    <span className="text-[10px] text-text-3">{row.max.toLocaleString("fr-FR")} €</span>
                  </div>
                </div>

                {/* Mobile: avg + status badge */}
                <div className="flex items-center justify-between md:hidden text-[12px] text-text-3 col-span-1">
                  <span>Moy. nationale : <span className="font-mono font-medium text-text-2">{row.avg.toLocaleString("fr-FR")} €</span></span>
                  {row.hasMatch && (
                    <span className={`text-[11px] font-semibold ${colorClass[row.color]}`}>
                      {row.color === "green" ? "Sous la moy." : row.color === "amber" ? "Dans la moy." : "Au-dessus"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: source note */}
        <div className="px-5 py-3 bg-surface-2 flex items-start gap-1.5 rounded-b-card">
          <Icon name="info" size={13} className="text-text-3 shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-text-3">
            Source : IFOP / études de marché 2023-2024. À titre indicatif.
          </p>
        </div>
      </Card>

      {/* ── 3. Global comparison ────────────────────────────────────────── */}
      <Card className={`border ${globalBgClass}`}>
        <div className="sec-title mb-3"><Icon name="wallet" size={17} className="text-text-3" />Comparaison globale</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="flex flex-col gap-0.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Votre budget total prévu</div>
            <div className={`font-mono text-[28px] font-semibold tracking-[-.02em] ${globalColorClass}`}>
              {userTotal > 0 ? userTotal.toLocaleString("fr-FR") + " €" : "—"}
            </div>
          </div>
          <div className="hidden sm:flex items-center justify-center text-text-3 text-[22px] font-thin">vs</div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3">Cumul des moyennes nationales</div>
            <div className="font-mono text-[28px] font-semibold tracking-[-.02em] text-text-2">
              {NATIONAL_AVG_TOTAL.toLocaleString("fr-FR")} €
            </div>
          </div>
        </div>
        {userTotal > 0 && (
          <div className={`mt-4 rounded-[12px] border px-4 py-3 flex items-start gap-2.5 ${globalBgClass}`}>
            <Icon
              name={globalColor === "green" ? "check" : globalColor === "amber" ? "info" : "alert"}
              size={15}
              className={`${globalColorClass} mt-0.5 shrink-0`}
            />
            <p className={`text-[13px] leading-relaxed ${globalColorClass}`}>
              {globalColor === "green" &&
                `Votre budget (${userTotal.toLocaleString("fr-FR")} €) est inférieur à la somme des moyennes nationales. Vous êtes dans une enveloppe maîtrisée.`}
              {globalColor === "amber" &&
                `Votre budget (${userTotal.toLocaleString("fr-FR")} €) est légèrement supérieur à la somme des moyennes nationales (+${Math.round((userTotal - NATIONAL_AVG_TOTAL) / NATIONAL_AVG_TOTAL * 100)} %). Restez vigilant.`}
              {globalColor === "red" &&
                `Votre budget (${userTotal.toLocaleString("fr-FR")} €) dépasse nettement la somme des moyennes nationales (+${Math.round((userTotal - NATIONAL_AVG_TOTAL) / NATIONAL_AVG_TOTAL * 100)} %). Identifiez les postes à rééquilibrer.`}
            </p>
          </div>
        )}
      </Card>

    </div>
  );
}

/* ─── Charts Tab ───────────────────────────────────────────────────────────── */
const CHART_COLORS = ["#C96E2C", "#7E9A63", "#B07A2C", "#5C8AC9", "#C05050", "#8B7FB5", "#D4956E", "#6DB5A0"];
const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function ChartsTab({ budget, payments, budgetTotal }: { budget: BudgetPost[]; payments: Payment[]; budgetTotal: number }) {
  // ─── Données pie chart : répartition du budget par catégorie ───
  const pieData = budget.reduce<{ name: string; planned: number; spent: number }[]>((acc, b) => {
    const cat = acc.find((x) => x.name === b.cat) ?? (() => { const n = { name: b.cat, planned: 0, spent: 0 }; acc.push(n); return n; })();
    cat.planned += b.planned;
    cat.spent += b.spent;
    return acc;
  }, []).filter((d) => d.planned > 0 || d.spent > 0);

  // ─── Bar chart : paiements mensuels (paid vs upcoming) ─────────
  const payByMonth: Record<string, { month: string; payé: number; àVenir: number }> = {};
  payments.forEach((p) => {
    if (!p.due) return;
    const d = new Date(p.due + "T00:00:00");
    const k = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
    if (!payByMonth[k]) payByMonth[k] = { month: MONTHS_FR[d.getMonth()] + " " + d.getFullYear(), payé: 0, àVenir: 0 };
    if (p.status === "paid") payByMonth[k].payé += p.amount;
    else payByMonth[k].àVenir += p.amount;
  });
  const barData = Object.values(payByMonth).sort((a, b) => a.month.localeCompare(b.month));

  // ─── Area chart : dépenses cumulées vs budget cumulé ──────────
  const sortedPayments = [...payments].filter((p) => p.status === "paid" && p.paidDate).sort((a, b) => (a.paidDate ?? "").localeCompare(b.paidDate ?? ""));
  let cum = 0;
  const areaData = sortedPayments.map((p) => {
    cum += p.amount;
    return {
      date: new Date((p.paidDate ?? p.due) + "T00:00:00").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      dépenses: Math.round(cum),
      budget: budgetTotal,
    };
  });
  if (areaData.length > 0) areaData.unshift({ date: "Début", dépenses: 0, budget: budgetTotal });

  const totalPlanned = budget.reduce((s, b) => s + b.planned, 0);
  const totalSpent = budget.reduce((s, b) => s + b.spent, 0);
  const pctSpent = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;
  const overBudgetCount = budget.filter((b) => b.spent > b.planned).length;

  const fmtEur = (v: number) => v.toLocaleString("fr-FR") + " €";

  if (budget.length === 0 && payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-14 h-14 bg-primary-soft rounded-2xl flex items-center justify-center"><Icon name="wallet" size={26} className="text-primary-700" /></div>
        <div className="text-[15px] font-semibold">Aucune donnée à afficher</div>
        <p className="text-[13.5px] text-text-2 max-w-xs">Ajoutez des postes budgétaires et des paiements pour voir vos graphiques.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Stat pills ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Budget total", value: fmtEur(budgetTotal), color: "text-text", extra: "" },
          { label: "Prévu", value: fmtEur(totalPlanned), color: "text-primary-700", extra: "" },
          { label: "Dépensé", value: fmtEur(totalSpent), color: "text-sage", extra: "" },
          { label: "Avancement", value: `${pctSpent}%`, color: pctSpent > 100 ? "text-coral" : "text-text", extra: "" },
          { label: "Postes dépassés", value: String(overBudgetCount), color: overBudgetCount > 0 ? "text-coral" : "text-sage", extra: overBudgetCount > 0 ? "bg-coral-soft border-coral/20" : "" },
        ].map((s) => (
          <div key={s.label} className={`bg-surface border border-line rounded-xl px-4 py-3.5 ${s.extra}`}>
            <div className={`font-mono text-[18px] font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-[11.5px] text-text-3 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Pie chart ── */}
        {pieData.length > 0 && (
          <Card>
            <div className="sec-title mb-4"><Icon name="wallet" size={15} className="text-primary" />Répartition par catégorie</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="planned" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={42}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <ReTooltip formatter={(v) => fmtEur(v as number)} />
                <Legend iconSize={10} formatter={(v) => <span className="text-[12px]">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* ── Bar chart paiements mensuel ── */}
        {barData.length > 0 && (
          <Card>
            <div className="sec-title mb-4"><Icon name="card" size={15} className="text-primary" />Paiements par mois</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? Math.round(v / 1000) + "k" : v} />
                <ReTooltip formatter={(v) => fmtEur(v as number)} />
                <Bar dataKey="payé" fill="#7E9A63" radius={[3,3,0,0]} name="Payé" />
                <Bar dataKey="àVenir" fill="#C96E2C" radius={[3,3,0,0]} name="À venir" />
                <Legend iconSize={10} formatter={(v) => <span className="text-[12px]">{v}</span>} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* ── Area chart dépenses cumulées ── */}
      {areaData.length > 1 && (
        <Card>
          <div className="sec-title mb-4"><Icon name="chart" size={15} className="text-primary" />Évolution des dépenses cumulées</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gradDep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7E9A63" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7E9A63" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C96E2C" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#C96E2C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? Math.round(v / 1000) + "k€" : v + "€"} />
              <ReTooltip formatter={(v) => fmtEur(v as number)} />
              <Area type="monotone" dataKey="budget" stroke="#C96E2C" strokeDasharray="5 3" strokeWidth={1.5} fill="url(#gradBudget)" name="Budget" />
              <Area type="monotone" dataKey="dépenses" stroke="#7E9A63" strokeWidth={2} fill="url(#gradDep)" name="Dépenses cumulées" />
              <Legend iconSize={10} formatter={(v) => <span className="text-[12px]">{v}</span>} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
export default function BudgetPage() {
  const { state, update, reloadAll } = useStore();
  const toast = useToast();
  const [hover, setHover] = useState<any>(null);
  const [addingPost, setAddingPost] = useState(false);
  const [dragPostId, setDragPostId] = useState<number | null>(null);
  const [dragOverPostId, setDragOverPostId] = useState<number | null>(null);

  const planned = state.budget.reduce((s, b) => s + b.planned, 0);
  const spent = state.budget.reduce((s, b) => s + b.spent, 0);
  const paidAmt = state.payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const remaining = state.budgetTotal - planned;
  const ga = state.guests.filter((g) => g.side === "A" && g.rsvp !== "declined").length;
  const gb = state.guests.filter((g) => g.side === "B" && g.rsvp !== "declined").length;
  const ctx = useMemo(
    () => ({ A: state.wedding.partnerA, B: state.wedding.partnerB, ga, gb }),
    [state.wedding.partnerA, state.wedding.partnerB, ga, gb]
  );

  const donutData = state.budget.map((b, i) => ({ label: b.label, value: b.planned, color: PALETTE[i % PALETTE.length], id: b.id }));
  const payers = useMemo(() => {
    const acc: Record<string, number> = {};
    state.budget.forEach((b) => { const s = splitPost(b, ctx); Object.entries(s).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; }); });
    return acc;
  }, [state.budget, ctx]);

  const [activeTab, setActiveTab] = useState<"overview" | "benchmark" | "nationale" | "charts">("overview");
  const [seeding, setSeeding] = useState(false);
  const setRule = (id: number, rule: any) => update("budget", (l) => l.map((b) => b.id === id ? { ...b, rule, custom: rule === "custom" ? (b.custom || { A: 50, B: 50 }) : b.custom } : b));
  const deletePost = (id: number) => { update("budget", (l) => l.filter((b) => b.id !== id)); toast("Poste supprimé"); };

  /* ── Drag & drop handlers ───────────────────────────────────────────── */
  const handleDragStart = (id: number) => setDragPostId(id);
  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    setDragOverPostId(id);
  };
  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (dragPostId === null || dragPostId === targetId) {
      setDragPostId(null);
      setDragOverPostId(null);
      return;
    }
    const current = [...state.budget];
    const fromIdx = current.findIndex((b) => b.id === dragPostId);
    const toIdx = current.findIndex((b) => b.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = current.splice(fromIdx, 1);
    current.splice(toIdx, 0, moved);
    update("budget", current);
    setDragPostId(null);
    setDragOverPostId(null);
  };
  const handleDragEnd = () => {
    setDragPostId(null);
    setDragOverPostId(null);
  };

  const initBudget = async () => {
    const wId = getWeddingId();
    if (!wId) return;
    setSeeding(true);
    await seedDefaultBudget(createClient(), wId, state.budgetTotal);
    await reloadAll();
    setSeeding(false);
  };
  const dot = (c: string) => <span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: c }} />;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">
      <PageHead title="Budget" sub={`${fmt.eur(spent)} engagés sur ${fmt.eur(state.budgetTotal)} · ${state.budgetTotal ? Math.round(spent / state.budgetTotal * 100) : 0}%`}
        actions={<>
          <Button variant="secondary" icon="download" onClick={() => lazyExportBudgetPDF(state.budget, state.payments, state.budgetTotal, state.wedding.partnerA, state.wedding.partnerB)}>Exporter PDF</Button>
          <Button variant="primary" icon="plus" onClick={() => setAddingPost(true)}>Nouveau poste</Button>
        </>} />

      <PageTutorial pageId="budget" title="Comment gérer votre budget ?"
        steps={[
          { icon: "wallet", title: "Créez vos postes", desc: "Définissez un budget prévisionnel par poste (salle, traiteur, photo…). Initialisez avec les postes standards en un clic." },
          { icon: "pie", title: "Répartissez les dépenses", desc: "Chaque poste peut être partagé 50/50, selon les invités, ou affecté à l'un des partenaires." },
          { icon: "bars", title: "Suivez l'avancement", desc: "Le montant engagé se met à jour automatiquement depuis vos devis signés et paiements effectués." },
        ]} />

      {/* ── Global overspend banner ────────────────────────────────────── */}
      {spent > planned && planned > 0 && (
        <div className="flex items-center gap-3 rounded-[14px] border border-coral/20 bg-coral-soft px-4 py-3 mb-5 mt-2">
          <Icon name="alert" size={17} className="text-coral shrink-0" />
          <p className="text-[13.5px] text-coral font-medium leading-snug">
            <span className="font-semibold">Budget dépassé de {fmt.eur(spent - planned)}</span>
            {" "}— Vous avez dépensé {fmt.eur(spent)} pour un budget prévu de {fmt.eur(planned)}
          </p>
        </div>
      )}

      {/* ── Tab navigation ─────────────────────────────────────────────── */}
      <ScrollReveal>
      <div className="flex gap-1 mb-5 bg-surface-2 p-1 rounded-[14px] w-fit">
        {([
          { id: "overview" as const,  label: "Aperçu",               icon: "pie" },
          { id: "benchmark" as const, label: "Benchmark",            icon: "bars" },
          { id: "nationale" as const, label: "Comparaison nationale", icon: "star" },
          { id: "charts" as const,    label: "Graphiques",            icon: "chart" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13.5px] font-medium transition-all ${
              activeTab === tab.id
                ? "bg-surface shadow-sm text-text-1 font-semibold"
                : "text-text-2 hover:text-text-1"
            }`}
          >
            <Icon name={tab.icon} size={15} className={activeTab === tab.id ? "text-primary" : "text-text-3"} />
            {tab.label}
          </button>
        ))}
      </div>
      </ScrollReveal>

      {/* ── Benchmark tab ──────────────────────────────────────────────── */}
      {activeTab === "benchmark" && <BenchmarkTab />}

      {/* ── Comparaison nationale tab ───────────────────────────────────── */}
      {activeTab === "nationale" && (
        <ScrollReveal delay={0.05}>
          <ComparaisonNationaleTab />
        </ScrollReveal>
      )}

      {/* ── Charts tab ─────────────────────────────────────────────────── */}
      {activeTab === "charts" && (
        <ScrollReveal delay={0.05}>
          <ChartsTab budget={state.budget} payments={state.payments} budgetTotal={state.budgetTotal} />
        </ScrollReveal>
      )}

      {/* ── Overview tab ───────────────────────────────────────────────── */}
      {activeTab === "overview" && state.budget.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sage-soft flex items-center justify-center">
            <Icon name="wallet" size={26} className="text-sage" />
          </div>
          <div>
            <div className="font-semibold text-lg mb-1">Aucun poste de budget</div>
            <p className="text-text-2 text-[14px] max-w-sm">Initialisez votre budget avec les postes types d&apos;un mariage, proportionnels à votre enveloppe de {fmt.eur(state.budgetTotal)}.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" icon="plus" onClick={() => setAddingPost(true)}>Ajouter manuellement</Button>
            <Button variant="primary" icon="sparkle" onClick={initBudget} disabled={seeding}>
              {seeding ? "Initialisation…" : "Initialiser le budget"}
            </Button>
          </div>
        </div>
      )}

      {activeTab === "overview" && <div>

      {/* ── Quick stats pills ──────────────────────────────────────────── */}
      {state.budget.length > 0 && (
        <ScrollReveal delay={0}>
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="flex items-center gap-1.5 rounded-full bg-surface-2 border border-line px-3.5 py-1.5 text-[12.5px] font-medium">
            <span>💰</span>
            <span className="text-text-2">Budget total</span>
            <span className="font-mono font-semibold text-text-1">{fmt.eur(state.budgetTotal)}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-surface-2 border border-line px-3.5 py-1.5 text-[12.5px] font-medium">
            <span>✅</span>
            <span className="text-text-2">Engagé</span>
            <span className="font-mono font-semibold text-text-1">{fmt.eur(planned)}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-surface-2 border border-line px-3.5 py-1.5 text-[12.5px] font-medium">
            <span>💳</span>
            <span className="text-text-2">Payé</span>
            <span className="font-mono font-semibold text-sage">{fmt.eur(paidAmt)}</span>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium ${remaining < 0 ? "bg-coral-soft border-coral/20" : "bg-surface-2 border-line"}`}>
            <span>⚡</span>
            <span className="text-text-2">Restant</span>
            <span className={`font-mono font-semibold ${remaining < 0 ? "text-coral" : "text-text-1"}`}>{fmt.eur(remaining)}</span>
          </div>
        </div>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.05}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 mb-5">
        <Card>
          <div className="sec-title mb-[18px]"><Icon name="pie" size={17} className="text-text-3" />Répartition par poste</div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="relative">
              <Donut data={donutData} size={184} stroke={26} onHover={setHover} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="font-mono text-[22px] font-semibold tracking-[-.02em]">{fmt.eur(hover ? hover.value : planned)}</div>
                <div className="text-[11px] text-text-2">{hover ? hover.label : "Budget prévu"}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 max-h-[200px] overflow-y-auto min-w-[180px]">
              {donutData.map((d) => (
                <div key={d.id} onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)} className={`flex items-center gap-2.5 text-[13px] ${hover?.id === d.id ? "font-semibold" : ""}`}>
                  {dot(d.color)}{d.label}<span className="ml-auto font-mono font-semibold text-text-2 text-[12.5px]">{fmt.eur(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 justify-center">
          {[["Budget total", fmt.eur(state.budgetTotal), "var(--text-3)", ""], ["Engagé", fmt.eur(spent), "var(--gold)", ""], ["Déjà payé", fmt.eur(paidAmt), "var(--sage)", "text-sage"], ["Reste à engager", fmt.eur(remaining), "var(--primary)", ""]].map(([l, v, c, cl]) => (
            <div key={l} className="flex items-baseline justify-between">
              <span className="text-[13.5px] text-text-2 flex items-center gap-2">{dot(c)}{l}</span>
              <span className={`font-mono text-[22px] font-semibold tracking-[-.02em] ${cl}`}>{v}</span>
            </div>
          ))}
          <div className="progress-track h-2 mt-1"><span className="block h-full rounded-full" style={{ width: `${Math.min(100, state.budgetTotal ? spent / state.budgetTotal * 100 : 0)}%`, background: spent > state.budgetTotal ? "var(--coral)" : "var(--primary)" }} /></div>
          <div className="text-text-2 text-[12.5px]">Contributions familles : {fmt.eur(state.contributions.reduce((s, c) => s + c.amount, 0))}</div>
        </Card>
      </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
      <Card pad={false} className="mb-5">
        <div className="flex items-center justify-between px-4 pt-4"><div className="sec-title"><Icon name="bars" size={17} className="text-text-3" />Prévu vs réel par poste</div></div>
        <div className="mt-3">
          <div className="hidden md:grid grid-cols-[32px_1.6fr_1fr_1fr_1.3fr_40px] gap-3.5 px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-text-3 bg-surface-2">
            <div />
            <div>Poste</div><div>Prévu</div><div>Réel</div><div>Répartition</div><div />
          </div>
          {state.budget.map((b) => {
            const over = b.spent > b.planned; const pct = b.planned ? Math.min(100, b.spent / b.planned * 100) : 0;
            const cat = state.vendorCats.find((c) => c.id === b.cat);
            const isDragging = dragPostId === b.id;
            const isDragOver = dragOverPostId === b.id && dragPostId !== b.id;
            return (
              <div
                key={b.id}
                draggable
                onDragStart={() => handleDragStart(b.id)}
                onDragOver={(e) => handleDragOver(e, b.id)}
                onDrop={(e) => handleDrop(e, b.id)}
                onDragEnd={handleDragEnd}
                className={`grid grid-cols-[32px_1.4fr_1fr_44px] md:grid-cols-[32px_1.6fr_1fr_1fr_1.3fr_40px] gap-3.5 items-center px-4 py-3 border-b border-line last:border-0 hover:bg-hover group transition-all ${isDragging ? "opacity-40" : "opacity-100"} ${isDragOver ? "border-t-2 border-t-[#C96E2C]" : ""}`}
              >
                {/* Drag handle */}
                <div
                  className="cursor-grab active:cursor-grabbing flex flex-col items-center justify-center gap-[3px] w-5 h-8 shrink-0 text-text-3 hover:text-text-2 transition-colors"
                  title="Réordonner"
                >
                  <span className="block w-4 h-px bg-current rounded-full" />
                  <span className="block w-4 h-px bg-current rounded-full" />
                  <span className="block w-4 h-px bg-current rounded-full" />
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 bg-primary-soft text-primary-700"><Icon name={cat?.icon || "dots"} size={16} /></span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="font-medium text-[13.5px] truncate">{b.label}</div>
                      {over && <span className="inline-flex items-center rounded-full bg-coral-soft border border-coral/20 px-2 py-0.5 text-[11px] font-semibold text-coral leading-none">Dépassé</span>}
                    </div>
                    {over && (
                      <div className="text-[11.5px] font-semibold text-coral">+{fmt.eur(b.spent - b.planned)} au-delà du prévu</div>
                    )}
                    <div className="progress-track h-1.5 mt-1.5">
                      <span className="block h-full rounded-full" style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? "var(--coral)" : pct >= 70 ? "var(--amber, var(--gold))" : "var(--sage)",
                      }} />
                    </div>
                  </div>
                </div>
                <div className="font-mono text-[13.5px] tabular-nums">{fmt.eur(b.planned)}</div>
                <div className="font-mono text-[13.5px] tabular-nums hidden md:block">{b.spent ? <span className={over ? "text-coral font-semibold" : ""}>{fmt.eur(b.spent)}{over && " ⚠"}</span> : <span className="text-text-3">—</span>}</div>
                <div className="hidden md:block"><Select className="!h-[34px] text-[12.5px] !pr-7" value={b.rule} onChange={(v) => setRule(b.id, v)} options={Object.entries(RULES).map(([k, l]) => ({ value: k, label: l }))} /></div>
                <button onClick={() => deletePost(b.id)} className="icon-btn w-8 h-8 justify-self-end text-text-3 hover:text-coral opacity-0 group-hover:opacity-100 transition"><Icon name="trash" size={16} /></button>
              </div>
            );
          })}
        </div>
      </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
      <div className="flex items-center justify-between mb-4"><div className="sec-title"><Icon name="users" size={17} className="text-text-3" />Qui paie quoi</div></div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {Object.entries(payers).map(([name, amount], i) => {
          const isFamily = name.startsWith("Famille");
          return (
            <Card key={name} className="p-[18px] flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-[13px] font-semibold ${i % 2 ? "bg-gold-soft text-[var(--gold-ink)]" : "bg-primary-soft text-primary-700"}`}>{name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>
                <div className="text-[12.5px] text-text-2">{isFamily ? name : "Doit contribuer"}</div>
              </div>
              <div className="font-mono text-[26px] font-semibold tracking-[-.02em]">{fmt.eur(Math.round(amount))}</div>
              {!isFamily && <div className="text-[12.5px] text-text-2">{name}</div>}
            </Card>
          );
        })}
        {state.contributions.map((c) => (
          <Card key={c.id} className="p-[18px] flex flex-col gap-2" style={{ background: "var(--sage-soft)", borderColor: "transparent" }}>
            <div className="flex items-center gap-2.5"><span className="inline-flex items-center justify-center w-9 h-9 rounded-full" style={{ background: "var(--sage)", color: "#fff" }}><Icon name="gift" size={18} /></span><div className="text-[12.5px] text-text-2">Apport</div></div>
            <div className="font-mono text-[26px] font-semibold tracking-[-.02em] text-sage">+{fmt.eur(c.amount)}</div>
            <div className="text-[12.5px] text-text-2">{c.label}</div>
          </Card>
        ))}
      </div>
      </ScrollReveal>
      </div>}

      {addingPost && (
        <NewPostDrawer
          onClose={() => setAddingPost(false)}
          budgetTotal={state.budgetTotal}
          existingLabels={state.budget.map((b) => b.label)}
        />
      )}
    </div>
  );
}

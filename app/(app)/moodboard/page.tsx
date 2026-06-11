"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PageHead } from "@/components/shell";
import { Button, Badge } from "@/components/ui";
import { Icon } from "@/components/icon";
import { useStore } from "@/components/providers";

/* ─────────────────────────── Types ─────────────────────────── */

type Palette = {
  id: string;
  name: string;
  colors: string[]; // hex strings, max 6
  isPrimary: boolean;
};

type InspirationCard = {
  id: string;
  title: string;
  url?: string;
  note?: string;
  tag: string; // "fleurs" | "tenue" | "decoration" | "photo" | "gateau" | "papeterie" | "autre"
  color?: string;
  pinned?: boolean;
};

type MoodData = {
  palettes: Palette[];
  selectedStyle: string;
  customStyleNote: string;
  cards: InspirationCard[];
};

/* ──────────────────────── Constants ─────────────────────────── */

const LS_KEY = "jj_moodboard";

const DEFAULT_DATA: MoodData = {
  palettes: [
    {
      id: "default",
      name: "Palette principale",
      colors: ["#F4ECDD", "#C96E2C", "#382F23", "#B8C9A3", "#D4A96A"],
      isPrimary: true,
    },
  ],
  selectedStyle: "",
  customStyleNote: "",
  cards: [],
};

const STYLES = [
  {
    id: "boheme",
    emoji: "🌿",
    name: "Bohème",
    desc: "Nature, lin, guirlandes lumineuses",
    colors: ["#B8C9A3", "#F4ECDD", "#8B7355", "#D4C5A9"],
  },
  {
    id: "classique",
    emoji: "🏛",
    name: "Classique",
    desc: "Élégance intemporelle, blanc et or",
    colors: ["#FFFFFF", "#D4A96A", "#1B3A6B", "#F8F4ED"],
  },
  {
    id: "champetre",
    emoji: "🌾",
    name: "Champêtre",
    desc: "Champs de fleurs, matières naturelles",
    colors: ["#E8D5A3", "#B8C9A3", "#C96E2C", "#F4ECDD"],
  },
  {
    id: "romantique",
    emoji: "🌸",
    name: "Romantique",
    desc: "Roses, dentelle, tons pastels",
    colors: ["#F2C4CE", "#E8A0B0", "#FAF0F2", "#C17F8A"],
  },
  {
    id: "tropical",
    emoji: "🏖",
    name: "Tropical",
    desc: "Verdure exotique, couleurs vives",
    colors: ["#2D6A4F", "#FF6B6B", "#FFD93D", "#B8C9A3"],
  },
  {
    id: "moderne",
    emoji: "🖤",
    name: "Moderne",
    desc: "Lignes épurées, contraste noir/blanc",
    colors: ["#1A1A1A", "#FFFFFF", "#D4A96A", "#888888"],
  },
  {
    id: "baroque",
    emoji: "🏰",
    name: "Baroque",
    desc: "Opulence, velours, chandeliers",
    colors: ["#8B1A4A", "#D4A96A", "#F8F4ED", "#4A0E1E"],
  },
  {
    id: "marin",
    emoji: "🌊",
    name: "Marin",
    desc: "Bleu, blanc, bord de mer",
    colors: ["#1B3A6B", "#FFFFFF", "#B8C9D9", "#C4A258"],
  },
];

const PRESET_PALETTES: { name: string; colors: string[] }[] = [
  {
    name: "Terracotta & Sauge",
    colors: ["#C96E2C", "#B8C9A3", "#F4ECDD", "#8B7355", "#E8DDD0"],
  },
  {
    name: "Or & Bordeaux",
    colors: ["#D4A96A", "#8B1A4A", "#F8F4ED", "#2D1B1E", "#C4A882"],
  },
  {
    name: "Bleu Marin & Blanc",
    colors: ["#1B3A6B", "#FFFFFF", "#B8C9D9", "#D4AF37", "#F5F5F5"],
  },
  {
    name: "Rose Poudré",
    colors: ["#F2C4CE", "#E8A0B0", "#FAF0F2", "#C17F8A", "#7D4E57"],
  },
];

const TAGS = [
  { id: "fleurs", label: "Fleurs", color: "#B8C9A3" },
  { id: "tenue", label: "Tenue", color: "#F2C4CE" },
  { id: "decoration", label: "Décoration", color: "#D4A96A" },
  { id: "photo", label: "Photo", color: "#B8C9D9" },
  { id: "gateau", label: "Gâteau", color: "#E8D5A3" },
  { id: "papeterie", label: "Papeterie", color: "#C4A882" },
  { id: "autre", label: "Autre", color: "#CCCCCC" },
];

function tagColor(tag: string): string {
  return TAGS.find((t) => t.id === tag)?.color ?? "#CCCCCC";
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ──────────────────── Swatch component ─────────────────────── */

function Swatch({
  color,
  onChange,
  size = 40,
}: {
  color: string;
  onChange: (hex: string) => void;
  size?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [tooltip, setTooltip] = useState(false);

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      <button
        type="button"
        title={color}
        className="rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1"
        style={{
          width: size,
          height: size,
          background: color,
          borderColor: "var(--line)",
        }}
        onClick={() => ref.current?.click()}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
      />
      <input
        ref={ref}
        type="color"
        value={color}
        className="sr-only"
        onChange={(e) => onChange(e.target.value)}
      />
      {tooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold whitespace-nowrap pointer-events-none z-10"
          style={{
            background: "var(--text)",
            color: "var(--bg)",
          }}
        >
          {color.toUpperCase()}
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Main page ─────────────────────────────── */

export default function MoodboardPage() {
  const { state } = useStore();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<MoodData>(DEFAULT_DATA);

  /* filter state for inspiration board */
  const [activeTag, setActiveTag] = useState<string>("all");

  /* add-card form */
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formTag, setFormTag] = useState("fleurs");
  const [formColor, setFormColor] = useState("#C96E2C");

  /* editing palette name */
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  /* ─── SSR-safe mount + load ───────────────────────────────── */

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MoodData;
        setData(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  /* ─── Auto-save ───────────────────────────────────────────── */

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data, mounted]);

  /* ─── Helpers ────────────────────────────────────────────── */

  const updateData = useCallback((fn: (prev: MoodData) => MoodData) => {
    setData(fn);
  }, []);

  /* ─── Style selection ────────────────────────────────────── */

  function toggleStyle(id: string) {
    updateData((prev) => ({
      ...prev,
      selectedStyle: prev.selectedStyle === id ? "" : id,
    }));
  }

  /* ─── Palette actions ────────────────────────────────────── */

  function addPalette() {
    updateData((prev) => ({
      ...prev,
      palettes: [
        ...prev.palettes,
        {
          id: uid(),
          name: "Nouvelle palette",
          colors: ["#F4ECDD", "#C96E2C", "#B8C9A3"],
          isPrimary: false,
        },
      ],
    }));
  }

  function deletePalette(id: string) {
    if (!window.confirm("Supprimer cette palette ?")) return;
    updateData((prev) => ({
      ...prev,
      palettes: prev.palettes.filter((p) => p.id !== id),
    }));
  }

  function setPrimary(id: string) {
    updateData((prev) => ({
      ...prev,
      palettes: prev.palettes.map((p) => ({ ...p, isPrimary: p.id === id })),
    }));
  }

  function updatePaletteColor(paletteId: string, colorIdx: number, hex: string) {
    updateData((prev) => ({
      ...prev,
      palettes: prev.palettes.map((p) =>
        p.id === paletteId
          ? {
              ...p,
              colors: p.colors.map((c, i) => (i === colorIdx ? hex : c)),
            }
          : p
      ),
    }));
  }

  function addColor(paletteId: string) {
    updateData((prev) => ({
      ...prev,
      palettes: prev.palettes.map((p) =>
        p.id === paletteId && p.colors.length < 6
          ? { ...p, colors: [...p.colors, "#FFFFFF"] }
          : p
      ),
    }));
  }

  function removeColor(paletteId: string, colorIdx: number) {
    updateData((prev) => ({
      ...prev,
      palettes: prev.palettes.map((p) =>
        p.id === paletteId
          ? { ...p, colors: p.colors.filter((_, i) => i !== colorIdx) }
          : p
      ),
    }));
  }

  function renamePalette(id: string, name: string) {
    updateData((prev) => ({
      ...prev,
      palettes: prev.palettes.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  }

  function importPreset(preset: { name: string; colors: string[] }) {
    updateData((prev) => ({
      ...prev,
      palettes: [
        ...prev.palettes,
        { id: uid(), name: preset.name, colors: preset.colors, isPrimary: false },
      ],
    }));
  }

  function copyHex(colors: string[]) {
    navigator.clipboard.writeText(colors.join(", ")).catch(() => {});
  }

  /* ─── Card actions ───────────────────────────────────────── */

  function submitCard() {
    if (!formTitle.trim()) return;
    const card: InspirationCard = {
      id: uid(),
      title: formTitle.trim(),
      url: formUrl.trim() || undefined,
      note: formNote.trim() || undefined,
      tag: formTag,
      color: formColor || undefined,
      pinned: false,
    };
    updateData((prev) => ({ ...prev, cards: [card, ...prev.cards] }));
    setFormTitle("");
    setFormUrl("");
    setFormNote("");
    setFormTag("fleurs");
    setFormColor("#C96E2C");
    setShowAddForm(false);
  }

  function deleteCard(id: string) {
    if (!window.confirm("Supprimer cette inspiration ?")) return;
    updateData((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== id),
    }));
  }

  function togglePin(id: string) {
    updateData((prev) => ({
      ...prev,
      cards: prev.cards.map((c) =>
        c.id === id ? { ...c, pinned: !c.pinned } : c
      ),
    }));
  }

  /* ─── Export ─────────────────────────────────────────────── */

  function downloadCss() {
    const primary = data.palettes.find((p) => p.isPrimary) ?? data.palettes[0];
    if (!primary) return;
    const colorNames = [
      "Crème", "Terracotta", "Brun", "Sauge", "Or",
      "Couleur 6",
    ];
    const lines = primary.colors
      .map(
        (c, i) =>
          `  --jj-color-${i + 1}: ${c}; /* ${colorNames[i] ?? `Couleur ${i + 1}`} */`
      )
      .join("\n");
    const css = `:root {\n${lines}\n}\n`;
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette-mariage.css";
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyShareText() {
    const style = STYLES.find((s) => s.id === data.selectedStyle);
    const primary = data.palettes.find((p) => p.isPrimary) ?? data.palettes[0];
    const parts: string[] = [];
    parts.push(
      `✨ Notre style de mariage : ${style ? style.name : "Non défini"}`
    );
    if (primary)
      parts.push(`🎨 Palette : ${primary.colors.join(", ")}`);
    if (data.cards.length > 0)
      parts.push(
        `💡 Inspirations : ${data.cards.map((c) => c.title).join(" · ")}`
      );
    navigator.clipboard.writeText(parts.join("\n")).catch(() => {});
  }

  /* ─── Derived ────────────────────────────────────────────── */

  const filteredCards =
    activeTag === "all"
      ? [...data.cards].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      : data.cards
          .filter((c) => c.tag === activeTag)
          .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const primaryPalette =
    data.palettes.find((p) => p.isPrimary) ?? data.palettes[0];

  const selectedStyleObj = STYLES.find((s) => s.id === data.selectedStyle);

  /* partner names */
  const partnerA = state.wedding.partnerA;
  const partnerB = state.wedding.partnerB;

  /* ─── SSR guard ──────────────────────────────────────────── */

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">
        <PageHead
          title="Mood Board"
          sub="Chargement de votre tableau d'inspiration…"
        />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*  Render                                                     */
  /* ═══════════════════════════════════════════════════════════ */

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">
      <PageHead
        title={
          partnerA && partnerB
            ? `Mood Board — ${partnerA} & ${partnerB}`
            : "Mood Board"
        }
        sub="Votre tableau d'inspiration : style, couleurs et idées pour votre mariage"
        actions={
          <Button variant="secondary" size="sm" icon="download" onClick={downloadCss}>
            Palette CSS
          </Button>
        }
      />

      {/* ═══════════ Section 1 — Style Aesthetic ════════════ */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="sparkle" size={18} className="text-primary" />
          <h2 className="text-[18px] font-semibold tracking-tight">
            Votre style de mariage
          </h2>
        </div>

        {/* Horizontal scroll row */}
        <div
          className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1"
          style={{ scrollbarWidth: "thin" }}
        >
          {STYLES.map((s) => {
            const isSelected = data.selectedStyle === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStyle(s.id)}
                className="relative flex-shrink-0 w-[168px] rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none"
                style={{
                  borderColor: isSelected ? "var(--primary)" : "var(--line)",
                  background: isSelected ? "var(--primary-softer, #FDF5EE)" : "var(--surface)",
                }}
              >
                {isSelected && (
                  <span
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--primary)" }}
                  >
                    <Icon name="check" size={11} className="text-white" />
                  </span>
                )}
                <div className="text-2xl mb-2">{s.emoji}</div>
                <div className="text-[13.5px] font-semibold mb-1">{s.name}</div>
                <div className="text-[11.5px] leading-snug mb-3" style={{ color: "var(--text-2)" }}>
                  {s.desc}
                </div>
                {/* Accent color dots */}
                <div className="flex gap-1.5">
                  {s.colors.map((c) => (
                    <span
                      key={c}
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ background: c, borderColor: "var(--line)" }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom style note */}
        <div className="mt-5">
          <label className="block text-[13px] font-medium mb-2" style={{ color: "var(--text-2)" }}>
            Décrivez votre vision en quelques mots…
          </label>
          <textarea
            className="input !h-auto py-3 leading-relaxed resize-y w-full"
            rows={3}
            placeholder="Ex: Un mariage intime en plein air, avec des fleurs sauvages, des bougies et une ambiance douce…"
            value={data.customStyleNote}
            onChange={(e) =>
              updateData((prev) => ({ ...prev, customStyleNote: e.target.value }))
            }
          />
        </div>
      </section>

      {/* ═══════════ Section 2 — Color Palettes ════════════ */}
      <section className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Icon name="droplet" size={18} className="text-primary" />
            <h2 className="text-[18px] font-semibold tracking-tight">
              Palettes de couleurs
            </h2>
          </div>
          <Button variant="secondary" size="sm" icon="plus" onClick={addPalette}>
            Nouvelle palette
          </Button>
        </div>

        {/* Palette cards */}
        <div className="flex flex-col gap-4 mb-6">
          {data.palettes.map((palette) => (
            <PaletteCard
              key={palette.id}
              palette={palette}
              editingId={editingPaletteId}
              editingName={editingName}
              onStartEdit={(id, name) => {
                setEditingPaletteId(id);
                setEditingName(name);
              }}
              onSaveEdit={() => {
                if (editingPaletteId) {
                  renamePalette(editingPaletteId, editingName);
                }
                setEditingPaletteId(null);
                setEditingName("");
              }}
              onCancelEdit={() => {
                setEditingPaletteId(null);
                setEditingName("");
              }}
              onEditNameChange={setEditingName}
              onUpdateColor={updatePaletteColor}
              onAddColor={addColor}
              onRemoveColor={removeColor}
              onSetPrimary={setPrimary}
              onDelete={deletePalette}
              onCopyHex={copyHex}
            />
          ))}
        </div>

        {/* Preset palettes */}
        <div>
          <div className="text-[12.5px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>
            Palettes inspiration
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESET_PALETTES.map((preset) => (
              <div
                key={preset.name}
                className="rounded-xl border p-3 flex flex-col gap-2.5 transition hover:shadow-sm"
                style={{ borderColor: "var(--line)", background: "var(--surface)" }}
              >
                <div className="flex gap-1.5">
                  {preset.colors.map((c) => (
                    <span
                      key={c}
                      className="flex-1 h-8 rounded-md shadow-sm"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="text-[12px] font-semibold truncate">{preset.name}</div>
                <button
                  type="button"
                  className="text-[11.5px] font-medium text-primary hover:underline text-left"
                  onClick={() => importPreset(preset)}
                >
                  Importer
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Section 3 — Inspiration Board ═════════ */}
      <section className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Icon name="heart" size={18} className="text-primary" />
            <h2 className="text-[18px] font-semibold tracking-tight">
              Tableau d'inspiration
            </h2>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon="plus"
            onClick={() => setShowAddForm((v) => !v)}
          >
            Ajouter une idée
          </Button>
        </div>

        {/* Inline add form */}
        {showAddForm && (
          <div
            className="rounded-xl border p-5 mb-5 animate-fade"
            style={{
              borderColor: "var(--primary)",
              background: "color-mix(in srgb, var(--primary) 5%, var(--surface))",
            }}
          >
            <div className="text-[14px] font-semibold mb-4">Nouvelle inspiration</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="field-label">Titre *</span>
                <input
                  className="input"
                  placeholder="Ex: Bouquet de fleurs sauvages"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitCard(); }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="field-label">URL (optionnel)</span>
                <input
                  className="input"
                  placeholder="https://pinterest.com/..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="field-label">Note (optionnel)</span>
                <textarea
                  className="input !h-auto py-2.5 resize-none"
                  rows={2}
                  placeholder="Vos notes ou idées…"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="field-label">Catégorie</span>
                <select
                  className="input"
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value)}
                >
                  {TAGS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="field-label">Couleur d'accent (optionnel)</span>
                <div className="flex items-center gap-3">
                  <span
                    className="w-9 h-9 rounded-lg border shadow-sm shrink-0"
                    style={{ background: formColor, borderColor: "var(--line)" }}
                  />
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="input h-9 cursor-pointer p-1"
                  />
                </div>
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="primary" size="sm" onClick={submitCard} disabled={!formTitle.trim()}>
                Enregistrer
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setFormTitle("");
                  setFormUrl("");
                  setFormNote("");
                  setFormTag("fleurs");
                  setFormColor("#C96E2C");
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTag("all")}
            className="px-3 py-1 rounded-full text-[12.5px] font-medium border transition"
            style={{
              borderColor: activeTag === "all" ? "var(--primary)" : "var(--line)",
              background: activeTag === "all" ? "var(--primary-soft, #FDE8D8)" : "var(--surface)",
              color: activeTag === "all" ? "var(--primary)" : "var(--text-2)",
            }}
          >
            Tout ({data.cards.length})
          </button>
          {TAGS.map((t) => {
            const count = data.cards.filter((c) => c.tag === t.id).length;
            if (count === 0) return null;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTag(t.id)}
                className="px-3 py-1 rounded-full text-[12.5px] font-medium border transition"
                style={{
                  borderColor: activeTag === t.id ? t.color : "var(--line)",
                  background:
                    activeTag === t.id
                      ? `color-mix(in srgb, ${t.color} 20%, var(--surface))`
                      : "var(--surface)",
                  color: activeTag === t.id ? "var(--text)" : "var(--text-2)",
                }}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Cards grid or empty state */}
        {filteredCards.length === 0 ? (
          <div
            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-16 px-6 text-center"
            style={{ borderColor: "var(--line)" }}
          >
            {/* CSS-only illustration */}
            <div className="relative w-24 h-24 mb-6">
              <div
                className="absolute inset-0 rounded-2xl rotate-12"
                style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
              />
              <div
                className="absolute inset-2 rounded-xl -rotate-6"
                style={{ background: "color-mix(in srgb, var(--gold) 15%, transparent)" }}
              />
              <div
                className="absolute inset-4 rounded-lg flex items-center justify-center"
                style={{ background: "var(--surface-3)" }}
              >
                <Icon name="heart" size={24} className="text-primary" />
              </div>
            </div>
            <div className="text-[15px] font-semibold mb-2">
              Ajoutez vos premières inspirations
            </div>
            <div className="text-[13px] max-w-xs" style={{ color: "var(--text-2)" }}>
              Créez votre univers en collectant vos idées pour créer votre univers
            </div>
            <div className="mt-4">
              <Button variant="primary" size="sm" icon="plus" onClick={() => setShowAddForm(true)}>
                Ajouter une idée
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="gap-4"
            style={{
              columnCount: 2,
              columnGap: "1rem",
            }}
          >
            {filteredCards.map((card) => (
              <InspirationCardComp
                key={card.id}
                card={card}
                onPin={togglePin}
                onDelete={deleteCard}
              />
            ))}
          </div>
        )}
      </section>

      {/* ═══════════ Export Section ═════════════════════════ */}
      <section>
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
          }}
        >
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--primary-soft, #FDE8D8)" }}
            >
              <Icon name="download" size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-[15px] font-semibold">Résumé de votre style</div>
              <div className="text-[13px] mt-0.5" style={{ color: "var(--text-2)" }}>
                {selectedStyleObj ? (
                  <>
                    {selectedStyleObj.emoji} {selectedStyleObj.name} —{" "}
                    {selectedStyleObj.desc}
                  </>
                ) : (
                  "Aucun style sélectionné"
                )}
              </div>
            </div>
          </div>

          {/* Primary palette swatches */}
          {primaryPalette && (
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[12.5px] font-medium shrink-0" style={{ color: "var(--text-2)" }}>
                {primaryPalette.name} :
              </span>
              <div className="flex gap-2">
                {primaryPalette.colors.map((c) => (
                  <span
                    key={c}
                    title={c}
                    className="w-7 h-7 rounded-full border shadow-sm"
                    style={{ background: c, borderColor: "var(--line)" }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" icon="download" onClick={downloadCss}>
              Télécharger la palette CSS
            </Button>
            <Button variant="secondary" size="sm" icon="copy" onClick={copyShareText}>
              Partager l'inspiration
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  PaletteCard sub-component                                     */
/* ══════════════════════════════════════════════════════════════ */

type PaletteCardProps = {
  palette: Palette;
  editingId: string | null;
  editingName: string;
  onStartEdit: (id: string, name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  onUpdateColor: (paletteId: string, colorIdx: number, hex: string) => void;
  onAddColor: (paletteId: string) => void;
  onRemoveColor: (paletteId: string, colorIdx: number) => void;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyHex: (colors: string[]) => void;
};

function PaletteCard({
  palette,
  editingId,
  editingName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onUpdateColor,
  onAddColor,
  onRemoveColor,
  onSetPrimary,
  onDelete,
  onCopyHex,
}: PaletteCardProps) {
  const isEditing = editingId === palette.id;

  return (
    <div
      className="rounded-xl border p-5 transition hover:shadow-sm"
      style={{
        borderColor: palette.isPrimary ? "var(--primary)" : "var(--line)",
        background: "var(--surface)",
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Name (click to edit) */}
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              className="input text-[14px] font-semibold flex-1"
              value={editingName}
              autoFocus
              onChange={(e) => onEditNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
            />
            <Button variant="primary" size="sm" onClick={onSaveEdit}>
              OK
            </Button>
            <Button variant="secondary" size="sm" onClick={onCancelEdit}>
              ✕
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="text-[15px] font-semibold text-left hover:text-primary transition group flex items-center gap-2"
            onClick={() => onStartEdit(palette.id, palette.name)}
          >
            {palette.name}
            <Icon
              name="edit"
              size={13}
              className="opacity-0 group-hover:opacity-60 transition"
            />
          </button>
        )}

        {/* Badges + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {palette.isPrimary ? (
            <Badge tone="primary">Principale</Badge>
          ) : (
            <button
              type="button"
              className="text-[11.5px] font-medium px-2.5 py-0.5 rounded-full border border-dashed transition hover:border-primary hover:text-primary"
              style={{ borderColor: "var(--line)", color: "var(--text-3)" }}
              onClick={() => onSetPrimary(palette.id)}
            >
              Définir principale
            </button>
          )}
          <button
            type="button"
            title="Copier les hex"
            className="text-[11.5px] font-medium flex items-center gap-1 hover:text-primary transition"
            style={{ color: "var(--text-3)" }}
            onClick={() => onCopyHex(palette.colors)}
          >
            <Icon name="copy" size={13} />
            Hex
          </button>
          <button
            type="button"
            title="Supprimer la palette"
            className="hover:text-red-500 transition"
            style={{ color: "var(--text-3)" }}
            onClick={() => onDelete(palette.id)}
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>

      {/* Swatches */}
      <div className="flex flex-wrap items-center gap-3">
        {palette.colors.map((color, idx) => (
          <div key={idx} className="relative group/swatch">
            <Swatch
              color={color}
              onChange={(hex) => onUpdateColor(palette.id, idx, hex)}
            />
            {/* Remove swatch button */}
            {palette.colors.length > 1 && (
              <button
                type="button"
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center opacity-0 group-hover/swatch:opacity-100 transition"
                style={{ background: "var(--coral)" }}
                onClick={() => onRemoveColor(palette.id, idx)}
              >
                <Icon name="x" size={8} />
              </button>
            )}
          </div>
        ))}

        {/* Add color */}
        {palette.colors.length < 6 && (
          <button
            type="button"
            className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center hover:border-primary hover:text-primary transition text-[11.5px] font-medium"
            style={{ borderColor: "var(--line)", color: "var(--text-3)" }}
            onClick={() => onAddColor(palette.id)}
            title="Ajouter une couleur"
          >
            <Icon name="plus" size={14} />
          </button>
        )}
      </div>

      {/* Hex values preview */}
      <div className="flex flex-wrap gap-2 mt-3">
        {palette.colors.map((c) => (
          <span
            key={c}
            className="text-[10.5px] font-mono px-2 py-0.5 rounded"
            style={{
              background: "var(--surface-3)",
              color: "var(--text-2)",
            }}
          >
            {c.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  InspirationCard sub-component                                 */
/* ══════════════════════════════════════════════════════════════ */

function InspirationCardComp({
  card,
  onPin,
  onDelete,
}: {
  card: InspirationCard;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const accentColor = card.color ?? tagColor(card.tag);
  const tagObj = TAGS.find((t) => t.id === card.tag);

  return (
    <div
      className="break-inside-avoid mb-4 rounded-xl border overflow-hidden group transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: "var(--line)",
        background: "var(--surface)",
      }}
    >
      {/* Accent stripe */}
      <div className="h-1" style={{ background: accentColor }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {/* Tag badge */}
            <span
              className="self-start text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `color-mix(in srgb, ${accentColor} 20%, var(--surface))`,
                color: "var(--text)",
              }}
            >
              {tagObj?.label ?? card.tag}
            </span>
            {/* Title */}
            <div className="text-[14px] font-semibold leading-snug">
              {card.pinned && (
                <Icon
                  name="pin"
                  size={12}
                  className="inline mr-1 -mt-0.5 text-primary"
                />
              )}
              {card.title}
            </div>
          </div>

          {/* Actions (hover) */}
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition shrink-0 pt-0.5">
            <button
              type="button"
              title={card.pinned ? "Désépingler" : "Épingler"}
              onClick={() => onPin(card.id)}
              className="w-7 h-7 rounded-md flex items-center justify-center transition hover:bg-hover"
              style={{ color: card.pinned ? "var(--primary)" : "var(--text-3)" }}
            >
              <Icon name="pin" size={14} strokeWidth={card.pinned ? 2.5 : 1.7} />
            </button>
            <button
              type="button"
              title="Supprimer"
              onClick={() => onDelete(card.id)}
              className="w-7 h-7 rounded-md flex items-center justify-center transition hover:bg-hover hover:text-red-500"
              style={{ color: "var(--text-3)" }}
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        </div>

        {/* URL */}
        {card.url && (
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[12px] font-medium hover:underline truncate mb-2"
            style={{ color: "var(--primary)" }}
          >
            <Icon name="link" size={12} />
            <span className="truncate">{card.url.replace(/^https?:\/\//, "")}</span>
          </a>
        )}

        {/* Note */}
        {card.note && (
          <p
            className="text-[12.5px] leading-relaxed"
            style={{ color: "var(--text-2)" }}
          >
            {card.note}
          </p>
        )}
      </div>
    </div>
  );
}

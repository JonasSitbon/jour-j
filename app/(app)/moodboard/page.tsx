"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PageHead } from "@/components/shell";
import { Button, Badge } from "@/components/ui";
import { Icon } from "@/components/icon";
import { useStore, useToast } from "@/components/providers";
import {
  getWeddingId,
  loadMoodboard,
  saveMoodboardStyle,
  upsertPalette,
  deletePalette as dbDeletePalette,
  upsertMoodCard,
  deleteMoodCard,
} from "@/lib/db";

/* ─────────────────────────── Types ─────────────────────────── */

type Palette = {
  id: number | null; // null = new, not yet saved to DB
  name: string;
  colors: string[]; // hex strings, max 6
  isPrimary: boolean;
};

type InspirationCard = {
  id: number | null; // null = new, not yet saved to DB
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
      id: null,
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
  { id: "decoration", label: "Décoration", color: "#D4A96A" },
  { id: "fleurs", label: "Fleurs", color: "#B8C9A3" },
  { id: "tenue", label: "Tenue", color: "#F2C4CE" },
  { id: "lieu", label: "Lieu", color: "#B8C9D9" },
  { id: "musique", label: "Musique", color: "#C4A0C0" },
  { id: "papeterie", label: "Papeterie", color: "#C4A882" },
  { id: "coiffure", label: "Coiffure/Maquillage", color: "#F0D0A0" },
  { id: "gateau", label: "Gâteau", color: "#E8D5A3" },
  { id: "photo", label: "Photo", color: "#A0C4D4" },
  { id: "autre", label: "Autre", color: "#CCCCCC" },
];

const THEME_PALETTES: { name: string; colors: string[] }[] = [
  { name: "Bohème", colors: ["#C96E2C", "#7E9A63", "#F4ECDD", "#D4A340", "#8B6E3E"] },
  { name: "Romantique", colors: ["#B5586E", "#F2A7B8", "#FFF0F3", "#8E3A5C", "#C9A07A"] },
  { name: "Champêtre", colors: ["#6B8C3E", "#D4B896", "#F3F1E5", "#4A6B2A", "#B8A080"] },
  { name: "Moderne", colors: ["#323232", "#C2A03A", "#F6F6F6", "#1A1A1A", "#8C8C8C"] },
  { name: "Classique", colors: ["#1E3A5F", "#C4961A", "#F5F4F2", "#8C7A5C", "#2C5282"] },
  { name: "Tropical", colors: ["#1F7A5C", "#E4A83A", "#F1F7F4", "#15614A", "#A8D5C2"] },
];

function tagColor(tag: string): string {
  return TAGS.find((t) => t.id === tag)?.color ?? "#CCCCCC";
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

/* ──────────────────── ThemePalettes component ───────────────── */

function ThemePalettes({ onCopy }: { onCopy: (name: string, colors: string[]) => void }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="palette" size={18} className="text-primary" />
        <h2 className="text-[18px] font-semibold tracking-tight">
          Palettes de thèmes populaires
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {THEME_PALETTES.map((theme) => (
          <button
            key={theme.name}
            type="button"
            className="group rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            onClick={() => onCopy(theme.name, theme.colors)}
            title={`Copier la palette ${theme.name}`}
          >
            <div className="flex gap-2 mb-3">
              {theme.colors.map((c) => (
                <span
                  key={c}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0 transition group-hover:scale-105"
                  style={{ background: c, borderColor: "var(--line)" }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold">{theme.name}</span>
              <span
                className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-1"
                style={{ color: "var(--primary)" }}
              >
                <Icon name="copy" size={11} />
                Copier
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {theme.colors.map((c) => (
                <span
                  key={c}
                  className="text-[9.5px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "var(--surface-3)", color: "var(--text-3)" }}
                >
                  {c.toUpperCase()}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── Main page ─────────────────────────────── */

export default function MoodboardPage() {
  const { state } = useStore();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<MoodData>(DEFAULT_DATA);
  const [syncing, setSyncing] = useState(false);

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
  const [editingPaletteId, setEditingPaletteId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  /* ─── SSR-safe mount + load ───────────────────────────────── */

  useEffect(() => {
    const wId = getWeddingId();

    async function load() {
      const lsData = localStorage.getItem(LS_KEY);

      if (wId) {
        const { palettes, cards } = await loadMoodboard(wId);
        setData({
          palettes: palettes.map((p) => ({ id: p.id, name: p.name, colors: p.colors, isPrimary: p.isPrimary })),
          selectedStyle: state.wedding.selectedStyle ?? "",
          customStyleNote: state.wedding.customStyleNote ?? "",
          cards: cards.map((c) => ({ id: c.id, title: c.title, url: c.url ?? undefined, note: c.note ?? undefined, tag: c.tag, color: c.color, pinned: c.pinned })),
        });

        // Migration one-time: if localStorage has data and DB is empty
        if (lsData && palettes.length === 0 && cards.length === 0) {
          try {
            const ls = JSON.parse(lsData) as { palettes: any[]; cards: any[]; selectedStyle?: string; customStyleNote?: string };
            // Migrate palettes
            for (let i = 0; i < ls.palettes.length; i++) {
              const p = ls.palettes[i];
              await upsertPalette(wId, { name: p.name, colors: p.colors, isPrimary: p.isPrimary, orderIdx: i });
            }
            // Migrate cards
            for (let i = 0; i < ls.cards.length; i++) {
              const c = ls.cards[i];
              await upsertMoodCard(wId, { title: c.title, url: c.url ?? null, note: c.note ?? null, tag: c.tag, color: c.color ?? "#C96E2C", pinned: c.pinned ?? false, orderIdx: i });
            }
            // Reload
            const { palettes: p2, cards: c2 } = await loadMoodboard(wId);
            setData((prev) => ({
              ...prev,
              palettes: p2.map((p) => ({ id: p.id, name: p.name, colors: p.colors, isPrimary: p.isPrimary })),
              cards: c2.map((c) => ({ id: c.id, title: c.title, url: c.url ?? undefined, note: c.note ?? undefined, tag: c.tag, color: c.color, pinned: c.pinned })),
              selectedStyle: ls.selectedStyle ?? "",
              customStyleNote: ls.customStyleNote ?? "",
            }));
            localStorage.removeItem(LS_KEY);
          } catch { /* ignore migration errors */ }
        }
      } else if (lsData) {
        // Fallback localStorage if no weddingId
        try { setData(JSON.parse(lsData)); } catch {}
      }
      setMounted(true);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Helpers ────────────────────────────────────────────── */

  const updateData = useCallback((fn: (prev: MoodData) => MoodData) => {
    setData(fn);
  }, []);

  /* ─── Style selection ────────────────────────────────────── */

  async function toggleStyle(id: string) {
    const wId = getWeddingId();
    const newStyle = data.selectedStyle === id ? "" : id;
    if (wId) {
      setSyncing(true);
      await saveMoodboardStyle(wId, newStyle, data.customStyleNote);
      setSyncing(false);
    }
    updateData((prev) => ({ ...prev, selectedStyle: newStyle }));
  }

  async function saveCustomStyleNote(note: string) {
    const wId = getWeddingId();
    if (wId) {
      await saveMoodboardStyle(wId, data.selectedStyle, note);
    }
  }

  /* ─── Palette actions ────────────────────────────────────── */

  async function addPalette() {
    const wId = getWeddingId();
    const newPalette = {
      name: "Nouvelle palette",
      colors: ["#F4ECDD", "#C96E2C", "#B8C9A3"],
      isPrimary: false,
    };
    if (wId) {
      setSyncing(true);
      const { data: row } = await upsertPalette(wId, { ...newPalette, orderIdx: data.palettes.length });
      setSyncing(false);
      const id = (row as { id: number } | null)?.id ?? null;
      setData((d) => ({ ...d, palettes: [...d.palettes, { ...newPalette, id }] }));
    } else {
      setData((d) => ({ ...d, palettes: [...d.palettes, { ...newPalette, id: null }] }));
    }
  }

  async function removePalette(id: number | null) {
    if (!window.confirm("Supprimer cette palette ?")) return;
    if (id) {
      setSyncing(true);
      await dbDeletePalette(id);
      setSyncing(false);
    }
    setData((d) => ({ ...d, palettes: d.palettes.filter((p) => p.id !== id) }));
  }

  async function setPrimary(id: number | null) {
    const wId = getWeddingId();
    const palette = data.palettes.find((p) => p.id === id);
    if (palette && wId && id) {
      setSyncing(true);
      await upsertPalette(wId, { id, name: palette.name, colors: palette.colors, isPrimary: true, orderIdx: data.palettes.findIndex((p) => p.id === id) });
      // Also update the previously primary palette
      const prev = data.palettes.find((p) => p.isPrimary && p.id !== id);
      if (prev && prev.id) {
        await upsertPalette(wId, { id: prev.id, name: prev.name, colors: prev.colors, isPrimary: false, orderIdx: data.palettes.findIndex((p) => p.id === prev.id) });
      }
      setSyncing(false);
    }
    updateData((prev) => ({
      ...prev,
      palettes: prev.palettes.map((p) => ({ ...p, isPrimary: p.id === id })),
    }));
  }

  async function updatePaletteColor(paletteId: number | null, colorIdx: number, hex: string) {
    // Update local state immediately for responsive UX
    let updatedPalette: Palette | undefined;
    setData((prev) => {
      const palettes = prev.palettes.map((p) =>
        p.id === paletteId
          ? { ...p, colors: p.colors.map((c, i) => (i === colorIdx ? hex : c)) }
          : p
      );
      updatedPalette = palettes.find((p) => p.id === paletteId);
      return { ...prev, palettes };
    });

    // Persist to DB
    const wId = getWeddingId();
    if (wId && paletteId && updatedPalette) {
      const p = data.palettes.find((p) => p.id === paletteId);
      if (p) {
        const newColors = p.colors.map((c, i) => (i === colorIdx ? hex : c));
        await upsertPalette(wId, { id: paletteId, name: p.name, colors: newColors, isPrimary: p.isPrimary, orderIdx: data.palettes.findIndex((pp) => pp.id === paletteId) });
      }
    }
  }

  async function addColor(paletteId: number | null) {
    let updatedPalette: Palette | undefined;
    setData((prev) => {
      const palettes = prev.palettes.map((p) =>
        p.id === paletteId && p.colors.length < 6
          ? { ...p, colors: [...p.colors, "#FFFFFF"] }
          : p
      );
      updatedPalette = palettes.find((p) => p.id === paletteId);
      return { ...prev, palettes };
    });

    const wId = getWeddingId();
    if (wId && paletteId) {
      const p = data.palettes.find((p) => p.id === paletteId);
      if (p && p.colors.length < 6) {
        await upsertPalette(wId, { id: paletteId, name: p.name, colors: [...p.colors, "#FFFFFF"], isPrimary: p.isPrimary, orderIdx: data.palettes.findIndex((pp) => pp.id === paletteId) });
      }
    }
  }

  async function removeColor(paletteId: number | null, colorIdx: number) {
    let updatedPalette: Palette | undefined;
    setData((prev) => {
      const palettes = prev.palettes.map((p) =>
        p.id === paletteId
          ? { ...p, colors: p.colors.filter((_, i) => i !== colorIdx) }
          : p
      );
      updatedPalette = palettes.find((p) => p.id === paletteId);
      return { ...prev, palettes };
    });

    const wId = getWeddingId();
    if (wId && paletteId) {
      const p = data.palettes.find((p) => p.id === paletteId);
      if (p) {
        const newColors = p.colors.filter((_, i) => i !== colorIdx);
        await upsertPalette(wId, { id: paletteId, name: p.name, colors: newColors, isPrimary: p.isPrimary, orderIdx: data.palettes.findIndex((pp) => pp.id === paletteId) });
      }
    }
  }

  async function renamePalette(id: number | null, name: string) {
    const wId = getWeddingId();
    if (wId && id) {
      const p = data.palettes.find((p) => p.id === id);
      if (p) {
        await upsertPalette(wId, { id, name, colors: p.colors, isPrimary: p.isPrimary, orderIdx: data.palettes.findIndex((pp) => pp.id === id) });
      }
    }
    updateData((prev) => ({
      ...prev,
      palettes: prev.palettes.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  }

  async function importPreset(preset: { name: string; colors: string[] }) {
    const wId = getWeddingId();
    const newPalette = { name: preset.name, colors: preset.colors, isPrimary: false };
    if (wId) {
      setSyncing(true);
      const { data: row } = await upsertPalette(wId, { ...newPalette, orderIdx: data.palettes.length });
      setSyncing(false);
      const id = (row as { id: number } | null)?.id ?? null;
      setData((d) => ({ ...d, palettes: [...d.palettes, { ...newPalette, id }] }));
    } else {
      setData((d) => ({ ...d, palettes: [...d.palettes, { ...newPalette, id: null }] }));
    }
  }

  function copyHex(colors: string[]) {
    navigator.clipboard.writeText(colors.join(", ")).catch(() => {});
  }

  /* ─── Card actions ───────────────────────────────────────── */

  async function submitCard() {
    if (!formTitle.trim()) return;
    const cardData = {
      title: formTitle.trim(),
      url: formUrl.trim() || undefined,
      note: formNote.trim() || undefined,
      tag: formTag,
      color: formColor || undefined,
      pinned: false,
    };
    const wId = getWeddingId();
    if (wId) {
      setSyncing(true);
      const { data: row } = await upsertMoodCard(wId, {
        title: cardData.title,
        url: cardData.url ?? null,
        note: cardData.note ?? null,
        tag: cardData.tag,
        color: cardData.color ?? "#C96E2C",
        pinned: false,
        orderIdx: data.cards.length,
      });
      setSyncing(false);
      const id = (row as { id: number } | null)?.id ?? null;
      setData((d) => ({ ...d, cards: [{ ...cardData, id }, ...d.cards] }));
    } else {
      setData((d) => ({ ...d, cards: [{ ...cardData, id: null }, ...d.cards] }));
    }
    setFormTitle("");
    setFormUrl("");
    setFormNote("");
    setFormTag("fleurs");
    setFormColor("#C96E2C");
    setShowAddForm(false);
  }

  async function removeCard(id: number | null) {
    if (!window.confirm("Supprimer cette inspiration ?")) return;
    if (id) {
      setSyncing(true);
      await deleteMoodCard(id);
      setSyncing(false);
    }
    setData((d) => ({ ...d, cards: d.cards.filter((c) => c.id !== id) }));
  }

  async function togglePin(id: number | null) {
    const card = data.cards.find((c) => c.id === id);
    if (!card) return;
    const pinned = !card.pinned;
    const wId = getWeddingId();
    if (id && wId) {
      await upsertMoodCard(wId, {
        id,
        title: card.title,
        url: card.url ?? null,
        note: card.note ?? null,
        tag: card.tag,
        color: card.color ?? "#C96E2C",
        pinned,
        orderIdx: data.cards.findIndex((c) => c.id === id),
      });
    }
    setData((d) => ({ ...d, cards: d.cards.map((c) => c.id === id ? { ...c, pinned } : c) }));
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

  function copyThemePalette(name: string, colors: string[]) {
    navigator.clipboard
      .writeText(colors.join(", "))
      .then(() => {
        toast(`Palette ${name} copiée !`);
      })
      .catch(() => {
        toast(`Palette ${name} copiée !`);
      });
  }

  async function exportPdf() {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const terracotta: [number, number, number] = [201, 110, 44];
    const white: [number, number, number] = [255, 255, 255];
    const darkGray: [number, number, number] = [50, 50, 50];
    const lightGray: [number, number, number] = [245, 243, 240];

    // ── Header band ──────────────────────────────────────────────
    doc.setFillColor(...terracotta);
    doc.rect(0, 0, pageW, 36, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const title =
      partnerA && partnerB
        ? `Mood Board — ${partnerA} & ${partnerB}`
        : "Mood Board";
    doc.text(title, pageW / 2, 16, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Tableau d'inspiration — The Cockpit", pageW / 2, 24, { align: "center" });
    const exportDate = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    doc.text(`Exporté le ${exportDate}`, pageW / 2, 30, { align: "center" });

    let y = 44;

    // ── Style sélectionné ────────────────────────────────────────
    const styleObj = STYLES.find((s) => s.id === data.selectedStyle);
    doc.setTextColor(...darkGray);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Style de mariage", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setFillColor(...lightGray);
    doc.roundedRect(14, y, pageW - 28, 12, 2, 2, "F");
    doc.text(
      styleObj ? `${styleObj.name} — ${styleObj.desc}` : "Non défini",
      18,
      y + 8
    );
    y += 20;

    // ── Palettes ─────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Palettes de couleurs", 14, y);
    y += 6;

    if (data.palettes.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Palette", "Couleurs (hex)", "Principale"]],
        body: data.palettes.map((p) => [
          p.name,
          p.colors.join("  ·  "),
          p.isPrimary ? "Oui" : "—",
        ]),
        headStyles: { fillColor: terracotta, textColor: white, fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: darkGray },
        alternateRowStyles: { fillColor: lightGray },
        margin: { left: 14, right: 14 },
        tableWidth: pageW - 28,
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Aucune palette enregistrée.", 14, y + 5);
      y += 14;
    }

    // ── Inspirations ─────────────────────────────────────────────
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...darkGray);
    doc.text(`Inspirations (${data.cards.length})`, 14, y);
    y += 6;

    if (data.cards.length > 0) {
      const tagLabel = (tag: string) => TAGS.find((t) => t.id === tag)?.label ?? tag;
      autoTable(doc, {
        startY: y,
        head: [["Titre", "Catégorie", "URL", "Note"]],
        body: data.cards.map((c) => [
          (c.pinned ? "[épinglé] " : "") + c.title,
          tagLabel(c.tag),
          c.url ? c.url.replace(/^https?:\/\//, "") : "—",
          c.note ?? "—",
        ]),
        headStyles: { fillColor: terracotta, textColor: white, fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: darkGray },
        alternateRowStyles: { fillColor: lightGray },
        columnStyles: {
          0: { cellWidth: 42 },
          1: { cellWidth: 28 },
          2: { cellWidth: 55 },
          3: { cellWidth: "auto" as any },
        },
        margin: { left: 14, right: 14 },
        tableWidth: pageW - 28,
        didParseCell: (hookData) => {
          // Wrap long URLs
          if (hookData.column.index === 2 && typeof hookData.cell.raw === "string") {
            hookData.cell.styles.overflow = "linebreak";
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Aucune inspiration enregistrée.", 14, y + 5);
    }

    // ── Footer ───────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(160, 140, 120);
      doc.text(
        `The Cockpit — Mood Board  •  Page ${i}/${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    }

    doc.save(`mood-board${partnerA ? `-${partnerA.toLowerCase()}` : ""}.pdf`);
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
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon="download" onClick={downloadCss}>
              Palette CSS
            </Button>
            <Button variant="primary" size="sm" icon="file-text" onClick={exportPdf}>
              Exporter PDF
            </Button>
          </div>
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
            onBlur={(e) => saveCustomStyleNote(e.target.value)}
          />
        </div>
      </section>

      {/* ═══════════ Theme Palettes ════════════════════════ */}
      <ThemePalettes onCopy={copyThemePalette} />

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
              key={palette.id ?? "new"}
              palette={palette}
              editingId={editingPaletteId}
              editingName={editingName}
              onStartEdit={(id, name) => {
                setEditingPaletteId(id);
                setEditingName(name);
              }}
              onSaveEdit={() => {
                if (editingPaletteId !== null) {
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
              onDelete={removePalette}
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
                key={card.id ?? "new"}
                card={card}
                onPin={togglePin}
                onDelete={removeCard}
                onCopyLink={(url) => {
                  navigator.clipboard.writeText(url).then(() => {
                    toast("Lien copié !");
                  }).catch(() => {
                    toast("Lien copié !");
                  });
                }}
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
  editingId: number | null;
  editingName: string;
  onStartEdit: (id: number | null, name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  onUpdateColor: (paletteId: number | null, colorIdx: number, hex: string) => void;
  onAddColor: (paletteId: number | null) => void;
  onRemoveColor: (paletteId: number | null, colorIdx: number) => void;
  onSetPrimary: (id: number | null) => void;
  onDelete: (id: number | null) => void;
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
  onCopyLink,
}: {
  card: InspirationCard;
  onPin: (id: number | null) => void;
  onDelete: (id: number | null) => void;
  onCopyLink: (url: string) => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const accentColor = card.color ?? tagColor(card.tag);
  const tagObj = TAGS.find((t) => t.id === card.tag);

  // Close share menu on outside click
  useEffect(() => {
    if (!shareOpen) return;
    function handleClick(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [shareOpen]);

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

            {/* Share / more menu */}
            <div className="relative" ref={shareRef}>
              <button
                type="button"
                title="Plus d'options"
                onClick={() => setShareOpen((v) => !v)}
                className="w-7 h-7 rounded-md flex items-center justify-center transition hover:bg-hover"
                style={{ color: "var(--text-3)" }}
              >
                <Icon name="more-horizontal" size={14} />
              </button>
              {shareOpen && (
                <div
                  className="absolute right-0 top-8 z-20 min-w-[148px] rounded-xl border shadow-lg py-1 animate-fade"
                  style={{ background: "var(--surface)", borderColor: "var(--line)" }}
                >
                  {card.url && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-left hover:bg-hover transition"
                      style={{ color: "var(--text)" }}
                      onClick={() => {
                        onCopyLink(card.url!);
                        setShareOpen(false);
                      }}
                    >
                      <Icon name="link" size={13} />
                      Copier le lien
                    </button>
                  )}
                  {!card.url && (
                    <div
                      className="px-3 py-2 text-[11.5px] italic"
                      style={{ color: "var(--text-3)" }}
                    >
                      Aucune URL
                    </div>
                  )}
                  <div
                    className="my-1 border-t"
                    style={{ borderColor: "var(--line)" }}
                  />
                  <button
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-left hover:bg-hover transition text-red-500"
                    onClick={() => {
                      setShareOpen(false);
                      onDelete(card.id);
                    }}
                  >
                    <Icon name="trash" size={13} />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
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

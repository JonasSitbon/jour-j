"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/components/providers";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Empty, Field, Input, Textarea, Select, Modal } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { exportDayJPDF } from "@/lib/pdf-dayj";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface DayEvent {
  id: string;
  hour: number;
  minute: number;
  duration: number;
  title: string;
  description?: string;
  category: "preparations" | "transport" | "ceremonie" | "photos" | "cocktail" | "diner" | "soiree" | "technique" | "autre";
  who: string;
  important: boolean;
}

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */

const CATEGORIES: Record<DayEvent["category"], { label: string; icon: string; color: string; bg: string; text: string }> = {
  preparations: { label: "Préparatifs", icon: "sparkle", color: "var(--primary)", bg: "bg-primary-soft", text: "text-primary-700" },
  transport: { label: "Transport", icon: "car", color: "var(--amber)", bg: "bg-amber-soft", text: "text-amber" },
  ceremonie: { label: "Cérémonie", icon: "rings", color: "var(--gold)", bg: "bg-gold-soft", text: "text-[var(--gold-ink)]" },
  photos: { label: "Photos & Vidéo", icon: "camera", color: "var(--sage)", bg: "bg-sage-soft", text: "text-sage" },
  cocktail: { label: "Cocktail", icon: "flower", color: "var(--coral)", bg: "bg-coral-soft", text: "text-coral" },
  diner: { label: "Dîner & Repas", icon: "star", color: "var(--primary)", bg: "bg-primary-soft", text: "text-primary-700" },
  soiree: { label: "Soirée & Danse", icon: "music", color: "var(--primary)", bg: "bg-primary-softer", text: "text-primary" },
  technique: { label: "Technique & Logistique", icon: "flag", color: "var(--text-2)", bg: "bg-surface-3", text: "text-text-2" },
  autre: { label: "Autre", icon: "dots", color: "var(--line-strong)", bg: "bg-surface-2", text: "text-text-2" },
};

const WHO_CHIPS = [
  "Mariés", "Mariée", "Marié", "Témoins", "Famille",
  "Tous les invités", "Photographe", "DJ", "Traiteur", "Wedding planner", "Autre",
];

const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1h" },
  { value: "90", label: "1h30" },
  { value: "120", label: "2h" },
  { value: "150", label: "2h30" },
  { value: "180", label: "3h" },
  { value: "240", label: "4h" },
];

const MINUTE_OPTIONS = [
  { value: "0", label: "00" },
  { value: "15", label: "15" },
  { value: "30", label: "30" },
  { value: "45", label: "45" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: String(i).padStart(2, "0") + "h",
}));

const DEFAULT_EVENTS: Omit<DayEvent, "id">[] = [
  { hour: 9, minute: 0, duration: 120, title: "Coiffure et maquillage — Côté A", category: "preparations", who: "Mariée", important: false, description: "À domicile ou chez le prestataire" },
  { hour: 10, minute: 30, duration: 90, title: "Coiffure et maquillage — Côté B", category: "preparations", who: "Marié", important: false, description: "" },
  { hour: 12, minute: 0, duration: 60, title: "Habillage et derniers préparatifs", category: "preparations", who: "Mariés", important: true, description: "Photos de préparatifs avec les témoins" },
  { hour: 13, minute: 30, duration: 30, title: "Départ vers la mairie / cérémonie civile", category: "transport", who: "Tous les invités", important: true, description: "" },
  { hour: 14, minute: 0, duration: 60, title: "Cérémonie civile", category: "ceremonie", who: "Tous les invités", important: true, description: "Mairie — durée estimée 45 min" },
  { hour: 15, minute: 30, duration: 90, title: "Séance photos couple", category: "photos", who: "Mariés", important: false, description: "En extérieur avec le photographe" },
  { hour: 16, minute: 0, duration: 30, title: "Arrivée des invités au domaine", category: "transport", who: "Tous les invités", important: false, description: "" },
  { hour: 17, minute: 0, duration: 150, title: "Cocktail & Vin d'honneur", category: "cocktail", who: "Tous les invités", important: true, description: "Réception en extérieur, musique d'ambiance" },
  { hour: 19, minute: 30, duration: 30, title: "Entrée en salle de réception", category: "diner", who: "Tous les invités", important: true, description: "Entrée des mariés + discours d'accueil" },
  { hour: 20, minute: 0, duration: 180, title: "Dîner de gala", category: "diner", who: "Tous les invités", important: true, description: "Repas assis, discours, animations" },
  { hour: 22, minute: 30, duration: 30, title: "Pièce montée & ouverture du bal", category: "soiree", who: "Tous les invités", important: true, description: "Première danse des mariés" },
  { hour: 23, minute: 0, duration: 60, title: "Soirée dansante", category: "soiree", who: "Tous les invités", important: false, description: "" },
];

/* ------------------------------------------------------------------ */
/* Smart template presets                                               */
/* ------------------------------------------------------------------ */

interface TemplatePreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  events: Omit<DayEvent, "id">[];
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "civil-laique",
    label: "Mariage civil + laïque",
    emoji: "🏛",
    description: "Cérémonie à la mairie puis cérémonie laïque l'après-midi",
    events: [
      { hour: 9, minute: 0, duration: 60, title: "Réveil & petit-déjeuner des mariés", category: "preparations", who: "Mariés", important: false, description: "Moment de calme avant la grande journée" },
      { hour: 10, minute: 0, duration: 90, title: "Coiffure & maquillage (côté mariée)", category: "preparations", who: "Mariée", important: false, description: "À domicile ou chez le prestataire" },
      { hour: 11, minute: 30, duration: 45, title: "Habillage de la mariée", category: "preparations", who: "Mariée", important: true, description: "Avec les témoins et proches" },
      { hour: 12, minute: 0, duration: 30, title: "Habillage du marié", category: "preparations", who: "Marié", important: false, description: "" },
      { hour: 12, minute: 30, duration: 60, title: "Photos des préparatifs", category: "photos", who: "Mariés", important: false, description: "Avec le photographe avant le départ" },
      { hour: 14, minute: 0, duration: 60, title: "Cérémonie civile (mairie)", category: "ceremonie", who: "Tous les invités", important: true, description: "Durée estimée 45 min" },
      { hour: 15, minute: 0, duration: 60, title: "Cocktail des photos", category: "cocktail", who: "Tous les invités", important: false, description: "Accueil des invités, photos de famille" },
      { hour: 16, minute: 0, duration: 60, title: "Cérémonie laïque", category: "ceremonie", who: "Tous les invités", important: true, description: "Au domaine ou en extérieur" },
      { hour: 17, minute: 0, duration: 120, title: "Vin d'honneur", category: "cocktail", who: "Tous les invités", important: true, description: "Réception en extérieur, musique d'ambiance" },
      { hour: 19, minute: 0, duration: 30, title: "Entrée en salle — discours", category: "diner", who: "Tous les invités", important: true, description: "Entrée des mariés + discours d'accueil" },
      { hour: 19, minute: 30, duration: 150, title: "Dîner assis", category: "diner", who: "Tous les invités", important: true, description: "Repas de mariage, discours, animations" },
      { hour: 22, minute: 0, duration: 30, title: "Pièce montée & première danse", category: "soiree", who: "Tous les invités", important: true, description: "Ouverture du bal des mariés" },
      { hour: 23, minute: 0, duration: 180, title: "Ouverture de la piste de danse", category: "soiree", who: "Tous les invités", important: false, description: "Animation DJ, soirée dansante" },
      { hour: 2, minute: 0, duration: 60, title: "Fin de soirée / navettes", category: "transport", who: "Tous les invités", important: false, description: "Départ des navettes pour les hôtels" },
    ],
  },
  {
    id: "religieux",
    label: "Mariage religieux",
    emoji: "⛪",
    description: "Cérémonie à l'église en fin d'après-midi, grande réception",
    events: [
      { hour: 9, minute: 0, duration: 60, title: "Réveil & petit-déjeuner des mariés", category: "preparations", who: "Mariés", important: false, description: "" },
      { hour: 10, minute: 0, duration: 120, title: "Coiffure & maquillage de la mariée", category: "preparations", who: "Mariée", important: false, description: "À domicile ou en salon" },
      { hour: 11, minute: 0, duration: 60, title: "Habillage de la mariée", category: "preparations", who: "Mariée", important: true, description: "Avec les demoiselles d'honneur" },
      { hour: 12, minute: 0, duration: 30, title: "Habillage du marié", category: "preparations", who: "Marié", important: false, description: "" },
      { hour: 13, minute: 0, duration: 90, title: "Déjeuner léger en famille", category: "preparations", who: "Famille", important: false, description: "" },
      { hour: 14, minute: 0, duration: 30, title: "Arrivée des invités à l'église", category: "ceremonie", who: "Tous les invités", important: false, description: "Musique d'orgue, accueil par les témoins" },
      { hour: 14, minute: 30, duration: 30, title: "Cortège et entrée de la mariée", category: "ceremonie", who: "Mariée", important: true, description: "" },
      { hour: 15, minute: 0, duration: 90, title: "Cérémonie religieuse", category: "ceremonie", who: "Tous les invités", important: true, description: "Office religieux à l'église" },
      { hour: 16, minute: 30, duration: 30, title: "Sortie de l'église & haie d'honneur", category: "ceremonie", who: "Tous les invités", important: true, description: "Photos de groupe, lancé de pétales" },
      { hour: 17, minute: 0, duration: 30, title: "Séance photos couple", category: "photos", who: "Mariés", important: false, description: "Photos en extérieur" },
      { hour: 17, minute: 30, duration: 120, title: "Vin d'honneur", category: "cocktail", who: "Tous les invités", important: true, description: "Au domaine de réception" },
      { hour: 19, minute: 30, duration: 30, title: "Entrée en salle des mariés", category: "diner", who: "Tous les invités", important: true, description: "Discours d'accueil" },
      { hour: 20, minute: 0, duration: 180, title: "Dîner de mariage", category: "diner", who: "Tous les invités", important: true, description: "Repas assis, discours, animations" },
      { hour: 23, minute: 0, duration: 30, title: "Pièce montée & ouverture du bal", category: "soiree", who: "Tous les invités", important: true, description: "Première danse des mariés" },
      { hour: 23, minute: 30, duration: 150, title: "Soirée dansante", category: "soiree", who: "Tous les invités", important: false, description: "Animation DJ" },
    ],
  },
  {
    id: "intimiste",
    label: "Mariage intimiste",
    emoji: "🌿",
    description: "30–50 invités, ambiance décontractée, cocktail dînatoire",
    events: [
      { hour: 10, minute: 0, duration: 60, title: "Réveil & brunch des mariés", category: "preparations", who: "Mariés", important: false, description: "Moment de calme, derniers préparatifs" },
      { hour: 11, minute: 0, duration: 90, title: "Coiffure & maquillage", category: "preparations", who: "Mariée", important: false, description: "" },
      { hour: 12, minute: 30, duration: 60, title: "Habillage & photos préparatifs", category: "preparations", who: "Mariés", important: false, description: "" },
      { hour: 14, minute: 0, duration: 30, title: "Accueil des proches", category: "ceremonie", who: "Tous les invités", important: false, description: "Arrivée progressive des invités" },
      { hour: 14, minute: 30, duration: 45, title: "Cérémonie intime", category: "ceremonie", who: "Tous les invités", important: true, description: "Ceremony laïque ou symbolique" },
      { hour: 15, minute: 15, duration: 45, title: "Photos de groupe & couple", category: "photos", who: "Tous les invités", important: false, description: "" },
      { hour: 16, minute: 0, duration: 120, title: "Cocktail en plein air", category: "cocktail", who: "Tous les invités", important: true, description: "Apéritif, jeux, musique douce" },
      { hour: 18, minute: 0, duration: 30, title: "Promenade des mariés & photos golden hour", category: "photos", who: "Mariés", important: false, description: "" },
      { hour: 18, minute: 30, duration: 30, title: "Discours des proches", category: "diner", who: "Tous les invités", important: false, description: "" },
      { hour: 19, minute: 0, duration: 150, title: "Dîner dînatoire / buffet", category: "diner", who: "Tous les invités", important: true, description: "Repas convivial, tables rondes" },
      { hour: 21, minute: 30, duration: 30, title: "Gâteau de mariage & pièce montée", category: "soiree", who: "Tous les invités", important: true, description: "Moment festif" },
      { hour: 22, minute: 0, duration: 120, title: "Soirée dansante ou musicale", category: "soiree", who: "Tous les invités", important: false, description: "" },
      { hour: 0, minute: 0, duration: 60, title: "Fin de soirée", category: "transport", who: "Tous les invités", important: false, description: "Raccompagnement des invités" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Library suggestions                                                  */
/* ------------------------------------------------------------------ */

interface LibrarySuggestion {
  title: string;
  hour: number;
  duration: number;
  cat: DayEvent["category"];
}

interface LibraryTab {
  id: string;
  label: string;
  emoji: string;
  suggestions: LibrarySuggestion[];
}

const LIBRARY_TABS: LibraryTab[] = [
  {
    id: "preparatifs",
    label: "Préparatifs",
    emoji: "🌅",
    suggestions: [
      { title: "Réveil et petit-déjeuner", hour: 7, duration: 60, cat: "preparations" },
      { title: "Coiffure de la mariée", hour: 8, duration: 120, cat: "preparations" },
      { title: "Maquillage de la mariée", hour: 9, duration: 90, cat: "preparations" },
      { title: "Coiffure et maquillage des témoins", hour: 9, duration: 60, cat: "preparations" },
      { title: "Habillage de la mariée", hour: 10, duration: 45, cat: "preparations" },
      { title: "Habillage du marié", hour: 10, duration: 30, cat: "preparations" },
      { title: "Séance photo préparatifs", hour: 10, duration: 45, cat: "photos" },
      { title: "Arrivée du photographe", hour: 8, duration: 30, cat: "technique" },
      { title: "Déjeuner léger", hour: 11, duration: 30, cat: "preparations" },
    ],
  },
  {
    id: "ceremonie",
    label: "Cérémonie",
    emoji: "💍",
    suggestions: [
      { title: "Départ de la mariée vers le lieu", hour: 13, duration: 30, cat: "transport" },
      { title: "Départ du marié vers le lieu", hour: 13, duration: 30, cat: "transport" },
      { title: "Accueil des invités", hour: 14, duration: 30, cat: "ceremonie" },
      { title: "Cérémonie civile (mairie)", hour: 11, duration: 60, cat: "ceremonie" },
      { title: "Cérémonie religieuse", hour: 15, duration: 90, cat: "ceremonie" },
      { title: "Cérémonie laïque", hour: 15, duration: 60, cat: "ceremonie" },
      { title: "Sortie des mariés / haie d'honneur", hour: 16, duration: 30, cat: "ceremonie" },
      { title: "Lancé du bouquet", hour: 16, duration: 15, cat: "ceremonie" },
      { title: "Photos de famille", hour: 16, duration: 60, cat: "photos" },
    ],
  },
  {
    id: "cocktail",
    label: "Cocktail & Photos",
    emoji: "🥂",
    suggestions: [
      { title: "Cocktail d'accueil", hour: 17, duration: 120, cat: "cocktail" },
      { title: "Séance photo en couple (trash the dress)", hour: 17, duration: 60, cat: "photos" },
      { title: "Photos de groupe", hour: 17, duration: 30, cat: "photos" },
      { title: "Animation cocktail (vin d'honneur)", hour: 17, duration: 90, cat: "cocktail" },
      { title: "Discours des témoins (cocktail)", hour: 18, duration: 20, cat: "cocktail" },
    ],
  },
  {
    id: "diner",
    label: "Dîner",
    emoji: "🍽",
    suggestions: [
      { title: "Installation des invités en salle", hour: 19, duration: 30, cat: "diner" },
      { title: "Entrée des mariés en salle", hour: 19, duration: 15, cat: "diner" },
      { title: "Discours de bienvenue", hour: 19, duration: 15, cat: "diner" },
      { title: "Dîner / Repas de mariage", hour: 19, duration: 150, cat: "diner" },
      { title: "Pièce montée / Gâteau", hour: 22, duration: 30, cat: "diner" },
      { title: "Discours des parents", hour: 21, duration: 20, cat: "diner" },
      { title: "Projection de diaporama", hour: 21, duration: 15, cat: "diner" },
    ],
  },
  {
    id: "soiree",
    label: "Soirée",
    emoji: "🎉",
    suggestions: [
      { title: "Ouverture de bal", hour: 22, duration: 30, cat: "soiree" },
      { title: "Animation DJ", hour: 22, duration: 300, cat: "soiree" },
      { title: "Concert / Groupe live", hour: 22, duration: 120, cat: "soiree" },
      { title: "Feu d'artifice", hour: 23, duration: 20, cat: "soiree" },
      { title: "Bouquet final / Sparklers", hour: 0, duration: 15, cat: "soiree" },
      { title: "Buffet nocturne", hour: 1, duration: 60, cat: "soiree" },
      { title: "Fin de soirée", hour: 3, duration: 30, cat: "soiree" },
    ],
  },
  {
    id: "technique",
    label: "Technique & Logistique",
    emoji: "⚙️",
    suggestions: [
      { title: "Installation fleurs et décoration", hour: 8, duration: 180, cat: "technique" },
      { title: "Arrivée du traiteur", hour: 10, duration: 60, cat: "technique" },
      { title: "Installation du DJ/musiciens", hour: 14, duration: 90, cat: "technique" },
      { title: "Installation du plan de table", hour: 16, duration: 30, cat: "technique" },
      { title: "Remise des clés du lieu", hour: 7, duration: 30, cat: "technique" },
      { title: "Check sécurité / accès", hour: 13, duration: 30, cat: "technique" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMinutes(h: number, m: number, mins: number) {
  const total = h * 60 + m + mins;
  return { h: Math.floor(total / 60) % 24, m: total % 60 };
}

function subMinutes(h: number, m: number, mins: number) {
  let total = h * 60 + m - mins;
  if (total < 0) total = 0;
  return { h: Math.floor(total / 60), m: total % 60 };
}

function fmtDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function toTotalMinutes(h: number, m: number) {
  return h * 60 + m;
}

function loadEvents(): DayEvent[] {
  try {
    const raw = localStorage.getItem("jj_dayj_v2");
    if (raw) return JSON.parse(raw);
    const defaults = DEFAULT_EVENTS.map((e, i) => ({ ...e, id: String(Date.now() + i) }));
    localStorage.setItem("jj_dayj_v2", JSON.stringify(defaults));
    return defaults;
  } catch { return []; }
}

function saveEvents(events: DayEvent[]) {
  try { localStorage.setItem("jj_dayj_v2", JSON.stringify(events)); } catch {}
}

function loadChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem("jj_dayj_checked");
    if (raw) return JSON.parse(raw);
    return {};
  } catch { return {}; }
}

function saveChecked(checked: Record<string, boolean>) {
  try { localStorage.setItem("jj_dayj_checked", JSON.stringify(checked)); } catch {}
}

const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/* Event Modal                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_EVENT: Omit<DayEvent, "id"> = {
  hour: 10, minute: 0, duration: 60,
  title: "", description: "",
  category: "autre", who: "Tous les invités", important: false,
};

function WhoChipPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value
    ? value.split(" + ").map((s) => s.trim()).filter(Boolean)
    : [];
  const hasAutre = selected.includes("Autre");
  const [autreText, setAutreText] = useState("");

  const toggle = (chip: string) => {
    const next = selected.includes(chip)
      ? selected.filter((s) => s !== chip)
      : [...selected, chip];
    if (chip === "Autre" && selected.includes("Autre")) {
      setAutreText("");
      onChange(next.filter((s) => s !== "Autre").join(" + "));
      return;
    }
    onChange(next.join(" + "));
  };

  const handleAutreText = (txt: string) => {
    setAutreText(txt);
    const withoutAutre = selected.filter((s) => s !== "Autre");
    const autreLabel = txt.trim() ? `Autre (${txt.trim()})` : "Autre";
    onChange([...withoutAutre, autreLabel].join(" + "));
  };

  return (
    <div className="flex flex-col gap-2 pt-0.5">
      <div className="flex flex-wrap gap-2">
        {WHO_CHIPS.map((chip) => {
          const isSelected = selected.includes(chip) || (chip === "Autre" && selected.some((s) => s.startsWith("Autre")));
          return (
            <button
              key={chip}
              type="button"
              onClick={() => toggle(chip)}
              className={cx(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                isSelected
                  ? "bg-text text-bg border-transparent"
                  : "bg-surface-2 text-text-2 border-line hover:border-line-strong"
              )}
            >
              {chip}
            </button>
          );
        })}
      </div>
      {hasAutre && (
        <Input
          value={autreText}
          onChange={(e) => handleAutreText(e.target.value)}
          placeholder="Préciser…"
          className="text-sm"
        />
      )}
    </div>
  );
}

function EventModal({ event, onClose, onSave, onDelete }: {
  event: Partial<DayEvent> | null;
  onClose: () => void;
  onSave: (e: Omit<DayEvent, "id"> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}) {
  const isNew = !event?.id;
  const [form, setForm] = useState<Omit<DayEvent, "id"> & { id?: string }>(
    event ? { ...EMPTY_EVENT, ...event } : { ...EMPTY_EVENT }
  );

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const valid = form.title.trim().length > 0;

  return (
    <Modal
      title={isNew ? "Nouvel événement" : "Modifier l'événement"}
      onClose={onClose}
      lg
      footer={
        <>
          {!isNew && onDelete && (
            <Button variant="danger" icon="trash" onClick={() => { onDelete(form.id!); onClose(); }}>
              Supprimer
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" icon="check" disabled={!valid} onClick={() => { if (valid) { onSave(form); onClose(); } }}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Titre *">
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ex : Cérémonie civile"
            autoFocus
          />
        </Field>

        <div className="flex gap-3">
          <Field label="Heure de début">
            <div className="flex gap-2">
              <Select
                value={String(form.hour)}
                onChange={(v) => set("hour", Number(v))}
                options={HOUR_OPTIONS}
                className="flex-1"
              />
              <Select
                value={String(form.minute)}
                onChange={(v) => set("minute", Number(v))}
                options={MINUTE_OPTIONS}
                className="w-24"
              />
            </div>
          </Field>
          <Field label="Durée">
            <Select
              value={String(form.duration)}
              onChange={(v) => set("duration", Number(v))}
              options={DURATION_OPTIONS}
            />
          </Field>
        </div>

        <Field label="Catégorie">
          <div className="flex flex-wrap gap-2 pt-0.5">
            {(Object.entries(CATEGORIES) as [DayEvent["category"], typeof CATEGORIES[DayEvent["category"]]][]).map(([k, cat]) => (
              <button
                key={k}
                type="button"
                onClick={() => set("category", k)}
                className={cx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition",
                  form.category === k
                    ? `${cat.bg} ${cat.text} border-transparent ring-2 ring-offset-1`
                    : "bg-surface-2 text-text-2 border-line hover:border-line-strong"
                )}
                style={form.category === k ? { "--tw-ring-color": cat.color } as React.CSSProperties : undefined}
              >
                <Icon name={cat.icon} size={13} />
                {cat.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Qui est concerné ?">
          <WhoChipPicker value={form.who} onChange={(v) => set("who", v)} />
        </Field>

        <Field label="Description (optionnelle)">
          <Textarea
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Détails, notes, adresse…"
            rows={3}
          />
        </Field>

        <label className="flex items-center gap-3 cursor-pointer select-none group">
          <div
            onClick={() => set("important", !form.important)}
            className={cx(
              "w-5 h-5 rounded flex items-center justify-center border-2 transition flex-shrink-0",
              form.important
                ? "bg-amber-400 border-amber-400 text-white"
                : "border-line group-hover:border-line-strong"
            )}
          >
            {form.important && <Icon name="star" size={12} strokeWidth={2.5} />}
          </div>
          <span className="text-sm font-medium">Marquer comme événement important</span>
        </label>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Library Modal                                                        */
/* ------------------------------------------------------------------ */

function LibraryModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (s: LibrarySuggestion) => void;
}) {
  const [activeTab, setActiveTab] = useState(LIBRARY_TABS[0].id);
  const [search, setSearch] = useState("");
  const [toasted, setToasted] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdd = (s: LibrarySuggestion) => {
    onAdd(s);
    setToasted(s.title);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToasted(null), 2000);
  };

  const allSuggestions = LIBRARY_TABS.flatMap((t) => t.suggestions);
  const isSearching = search.trim().length > 0;
  const searchResults = isSearching
    ? allSuggestions.filter((s) => s.title.toLowerCase().includes(search.trim().toLowerCase()))
    : [];

  const currentTab = LIBRARY_TABS.find((t) => t.id === activeTab) ?? LIBRARY_TABS[0];
  const displayedSuggestions = isSearching ? searchResults : currentTab.suggestions;

  return (
    <Modal
      title="Bibliothèque d'événements"
      onClose={onClose}
      lg
      footer={
        <Button variant="ghost" onClick={onClose}>Fermer</Button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Search */}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un événement…"
        />

        {/* Tabs */}
        {!isSearching && (
          <div className="flex gap-1.5 flex-wrap">
            {LIBRARY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cx(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                  activeTab === tab.id
                    ? "bg-text text-bg border-transparent"
                    : "bg-surface-2 text-text-2 border-line hover:border-line-strong"
                )}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Toast */}
        {toasted && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
            <span className="text-green-500">✓</span>
            Ajouté : {toasted}
          </div>
        )}

        {/* Suggestions grid */}
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
          {displayedSuggestions.length === 0 && (
            <p className="text-sm text-text-2 text-center py-8">Aucun résultat pour &quot;{search}&quot;</p>
          )}
          {displayedSuggestions.map((s, i) => {
            const cat = CATEGORIES[s.cat];
            return (
              <div
                key={`${s.title}-${i}`}
                className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-line bg-surface hover:border-line-strong hover:shadow-sm transition cursor-pointer group"
                onClick={() => handleAdd(s)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: cat.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] leading-snug">{s.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-text-3">{String(s.hour).padStart(2, "0")}h00 par défaut</span>
                    <span className={cx("px-1.5 py-0.5 rounded text-[10px] font-medium", cat.bg, cat.text)}>
                      {fmtDuration(s.duration)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleAdd(s); }}
                  className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium bg-primary-soft text-primary-700 hover:bg-primary hover:text-white transition opacity-0 group-hover:opacity-100"
                >
                  + Ajouter
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Template picker (empty state)                                        */
/* ------------------------------------------------------------------ */

function TemplatePicker({ onSelect, onManual }: {
  onSelect: (events: Omit<DayEvent, "id">[]) => void;
  onManual: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="flex flex-col items-center gap-2 text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center text-2xl mb-1">
          📅
        </div>
        <h3 className="font-semibold text-lg">Construisez votre programme</h3>
        <p className="text-sm text-text-2 leading-relaxed">
          Commencez avec un modèle prêt à l&apos;emploi ou créez votre déroulé depuis zéro.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
        {TEMPLATE_PRESETS.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl.events)}
            className="group flex flex-col gap-2 p-4 rounded-xl border border-line bg-surface hover:border-primary hover:shadow-md transition text-left"
          >
            <div className="text-2xl">{tpl.emoji}</div>
            <div className="font-semibold text-[13.5px] leading-snug group-hover:text-primary transition">
              {tpl.label}
            </div>
            <div className="text-[12px] text-text-2 leading-relaxed">{tpl.description}</div>
            <div className="mt-auto pt-1 text-[11px] text-text-3 font-medium">
              {tpl.events.length} étapes · Modifiable
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 text-sm text-text-2">
        <div className="w-16 h-px bg-line" />
        ou
        <div className="w-16 h-px bg-line" />
      </div>

      <Button variant="secondary" icon="plus" onClick={onManual}>
        Créer depuis zéro
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress tracker                                                     */
/* ------------------------------------------------------------------ */

function ProgressTracker({ events, checked, onToggle }: {
  events: DayEvent[];
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  if (events.length === 0) return null;

  const done = events.filter((e) => checked[e.id]).length;
  const total = events.length;
  const pct = Math.round((done / total) * 100);
  const complete = done === total;

  return (
    <div className={cx(
      "rounded-card border p-4 flex flex-col gap-3 transition-all",
      complete
        ? "border-green-200 bg-green-50"
        : "border-line bg-surface"
    )}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {complete ? (
            <span className="text-xl">🎉</span>
          ) : (
            <Icon name="clock" size={16} className="text-text-2" />
          )}
          <span className={cx(
            "text-sm font-semibold",
            complete ? "text-green-700" : "text-text"
          )}>
            {complete
              ? "Mariage accompli !"
              : `${done} / ${total} étapes complétées`}
          </span>
        </div>
        <span className={cx(
          "text-xs font-mono font-medium tabular-nums px-2 py-0.5 rounded-full",
          complete
            ? "bg-green-100 text-green-700"
            : "bg-surface-3 text-text-2"
        )}>
          {pct}% de la journée
        </span>
      </div>

      <div className="relative h-2 rounded-full bg-line overflow-hidden">
        <div
          className={cx(
            "absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ease-out",
            complete ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {complete && (
        <p className="text-xs text-green-600 text-center font-medium">
          Toutes les étapes de votre journée sont validées. Félicitations ! 🎊
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Current time indicator utils                                         */
/* ------------------------------------------------------------------ */

function getNowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/* ------------------------------------------------------------------ */
/* Event Card with drag handle                                          */
/* ------------------------------------------------------------------ */

function EventCard({
  event, onEdit, onDelete, onAdjustTime,
  dragHandleProps, isDragging, isDragOver,
  isChecked, onToggleChecked,
  isCurrentBlock, isPastBlock,
}: {
  event: DayEvent;
  onEdit: () => void;
  onDelete: () => void;
  onAdjustTime: (deltaMinutes: number) => void;
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>;
  isDragging: boolean;
  isDragOver: boolean;
  isChecked: boolean;
  onToggleChecked: () => void;
  isCurrentBlock: boolean;
  isPastBlock: boolean;
}) {
  const cat = CATEGORIES[event.category];
  const end = addMinutes(event.hour, event.minute, event.duration);

  return (
    <div
      className={cx(
        "group relative flex items-stretch gap-0 rounded-[10px] border bg-surface shadow-sm hover:shadow-md transition overflow-hidden",
        isDragging ? "opacity-40 border-line" : "",
        isDragOver ? "border-t-2" : "",
        isCurrentBlock && !isDragging
          ? "border-red-400 shadow-[0_0_0_2px_rgba(239,68,68,0.15)]"
          : !isDragging ? "border-line hover:border-line-strong" : "",
        isPastBlock && isChecked ? "opacity-60" : ""
      )}
      style={isDragOver ? { borderTopColor: "var(--coral)" } : undefined}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="w-7 flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-text-3 hover:text-text-2 hover:bg-surface-2 transition select-none"
        title="Réorganiser"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="opacity-60">
          <circle cx="3.5" cy="3" r="1.5" fill="currentColor" />
          <circle cx="8.5" cy="3" r="1.5" fill="currentColor" />
          <circle cx="3.5" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8.5" cy="8" r="1.5" fill="currentColor" />
          <circle cx="3.5" cy="13" r="1.5" fill="currentColor" />
          <circle cx="8.5" cy="13" r="1.5" fill="currentColor" />
        </svg>
      </div>

      <div className="w-1 flex-shrink-0" style={{ background: isCurrentBlock ? "rgb(239,68,68)" : cat.color }} />

      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Live indicator for current block */}
              {isCurrentBlock && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                  En cours
                </span>
              )}
              <span className={cx(
                "text-[12px] font-mono text-text-2 tabular-nums",
                isCurrentBlock ? "text-red-600 font-semibold" : ""
              )}>
                {fmtTime(event.hour, event.minute)} → {fmtTime(end.h, end.m)}
              </span>
              <span className="text-[11px] text-text-3">·</span>
              <span className="text-[11px] text-text-3">{fmtDuration(event.duration)}</span>
              {event.important && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-500">
                  <Icon name="star" size={11} strokeWidth={2} />
                </span>
              )}
            </div>
            <div className={cx(
              "font-semibold text-[14px] leading-snug truncate pr-2",
              isChecked ? "line-through text-text-3" : ""
            )}>
              {event.title}
            </div>
            {event.description && (
              <div className="text-[12.5px] text-text-2 mt-0.5 truncate">{event.description}</div>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cx("flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", cat.bg, cat.text)}>
                <Icon name={cat.icon} size={11} />
                {cat.label}
              </span>
              {event.who && (
                <span className="px-2 py-0.5 rounded-full bg-surface-3 text-text-2 text-[11px] font-medium">
                  {event.who}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
            {/* Check off button */}
            <button
              onClick={onToggleChecked}
              title={isChecked ? "Marquer comme non fait" : "Marquer comme fait"}
              className={cx(
                "w-7 h-7 rounded-md flex items-center justify-center transition",
                isChecked
                  ? "text-green-600 bg-green-50 hover:bg-green-100"
                  : "text-text-3 hover:text-green-600 hover:bg-green-50"
              )}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth={isChecked ? 0 : 1.5} fill={isChecked ? "currentColor" : "none"} />
                {isChecked && <path d="M4.5 7l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            </button>

            {/* Quick time adjust buttons — visible on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => onAdjustTime(-15)}
                title="−15 min"
                className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-text-2 hover:bg-surface-3 hover:text-text transition select-none"
              >
                −15
              </button>
              <button
                onClick={() => onAdjustTime(+15)}
                title="+15 min"
                className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-text-2 hover:bg-surface-3 hover:text-text transition select-none"
              >
                +15
              </button>
            </div>

            {/* Edit / delete — visible on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={onEdit}
                className="w-7 h-7 rounded-md flex items-center justify-center text-text-2 hover:bg-surface-3 hover:text-text transition"
                title="Modifier"
              >
                <Icon name="edit" size={14} />
              </button>
              <button
                onClick={onDelete}
                className="w-7 h-7 rounded-md flex items-center justify-center text-text-2 hover:bg-coral-soft hover:text-coral transition"
                title="Supprimer"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                            */
/* ------------------------------------------------------------------ */

export default function DayJPage() {
  const { state } = useStore();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<DayEvent[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [filterCat, setFilterCat] = useState<DayEvent["category"] | "all">("all");
  const [editingEvent, setEditingEvent] = useState<Partial<DayEvent> | null | false>(false);
  const [showLibrary, setShowLibrary] = useState(false);

  // Current time tracking for Jour J mode
  const [nowMinutes, setNowMinutes] = useState<number>(0);
  const currentTimeRef = useRef<HTMLDivElement | null>(null);
  const scrolledRef = useRef(false);

  // Drag state
  const [dragIdx, setDragIdx] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    setEvents(loadEvents());
    setChecked(loadChecked());
    setNowMinutes(getNowMinutes());
    setMounted(true);
  }, []);

  // Tick current time every minute
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => setNowMinutes(getNowMinutes()), 60_000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Auto-scroll to current time block on wedding day, once
  const isWeddingDay = (() => {
    if (!state.wedding?.date) return false;
    const today = new Date().toISOString().slice(0, 10);
    const wDate = state.wedding.date.slice(0, 10);
    return today === wDate;
  })();

  useEffect(() => {
    if (!mounted || !isWeddingDay || scrolledRef.current) return;
    if (currentTimeRef.current) {
      currentTimeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      scrolledRef.current = true;
    }
  }, [mounted, isWeddingDay, events]);

  const persistedSetEvents = useCallback((updater: DayEvent[] | ((prev: DayEvent[]) => DayEvent[])) => {
    setEvents((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveEvents(next);
      return next;
    });
  }, []);

  const handleSave = useCallback((form: Omit<DayEvent, "id"> & { id?: string }) => {
    if (form.id) {
      persistedSetEvents((prev) => prev.map((e) => (e.id === form.id ? (form as DayEvent) : e)));
    } else {
      persistedSetEvents((prev) => [...prev, { ...form, id: String(Date.now()) }]);
    }
  }, [persistedSetEvents]);

  const handleDelete = useCallback((id: string) => {
    persistedSetEvents((prev) => prev.filter((e) => e.id !== id));
    setChecked((prev) => {
      const next = { ...prev };
      delete next[id];
      saveChecked(next);
      return next;
    });
  }, [persistedSetEvents]);

  const handleReset = useCallback(() => {
    if (!window.confirm("Réinitialiser le déroulé avec le modèle par défaut ?")) return;
    const defaults = DEFAULT_EVENTS.map((e, i) => ({ ...e, id: String(Date.now() + i) }));
    persistedSetEvents(defaults);
    setChecked({});
    saveChecked({});
  }, [persistedSetEvents]);

  // Load template
  const handleLoadTemplate = useCallback((templateEvents: Omit<DayEvent, "id">[]) => {
    const ts = Date.now();
    const withIds = templateEvents.map((e, i) => ({
      ...e,
      id: `${ts}_${i}`,
    }));
    persistedSetEvents(withIds);
    setChecked({});
    saveChecked({});
  }, [persistedSetEvents]);

  // Toggle checked state
  const handleToggleChecked = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveChecked(next);
      return next;
    });
  }, []);

  // Quick time adjust (+/- 15 min)
  const handleAdjustTime = useCallback((id: string, deltaMinutes: number) => {
    persistedSetEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== id) return ev;
        if (deltaMinutes > 0) {
          const result = addMinutes(ev.hour, ev.minute, deltaMinutes);
          return { ...ev, hour: result.h, minute: result.m };
        } else {
          const result = subMinutes(ev.hour, ev.minute, Math.abs(deltaMinutes));
          return { ...ev, hour: result.h, minute: result.m };
        }
      })
    );
  }, [persistedSetEvents]);

  // Library: add suggestion to timeline
  const handleAddFromLibrary = useCallback((s: LibrarySuggestion) => {
    setEvents((prev) => {
      const atHour = prev.filter((e) => e.hour === s.hour);
      let minute = 0;
      if (atHour.length > 0) {
        const last = atHour.reduce((a, b) =>
          a.hour * 60 + a.minute > b.hour * 60 + b.minute ? a : b
        );
        const end = addMinutes(last.hour, last.minute, last.duration + 30);
        if (end.h === s.hour) {
          minute = end.m;
        } else {
          minute = 0;
        }
      }
      const newEvent: DayEvent = {
        id: String(Date.now() + Math.random()),
        hour: s.hour,
        minute,
        duration: s.duration,
        title: s.title,
        category: s.cat,
        who: "Tous les invités",
        important: false,
        description: "",
      };
      const next = [...prev, newEvent];
      saveEvents(next);
      return next;
    });
  }, []);

  // Drag & drop handlers
  const handleDragStart = useCallback((id: string) => {
    setDragIdx(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOver(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragIdx || dragIdx === targetId) {
      setDragIdx(null);
      setDragOver(null);
      return;
    }
    persistedSetEvents((prev) => {
      const from = prev.findIndex((ev) => ev.id === dragIdx);
      const to = prev.findIndex((ev) => ev.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragIdx(null);
    setDragOver(null);
  }, [dragIdx, persistedSetEvents]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOver(null);
  }, []);

  const sorted = [...events].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  const filtered = filterCat === "all" ? sorted : sorted.filter((e) => e.category === filterCat);

  const totalDuration = events.reduce((s, e) => s + e.duration, 0);
  const usedCats = new Set(events.map((e) => e.category));

  const weddingDate = state.wedding?.date
    ? new Date(state.wedding.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  const minHour = sorted.length > 0 ? Math.max(7, sorted[0].hour - 1) : 7;
  const maxHour = sorted.length > 0 ? Math.min(25, Math.max(...sorted.map((e) => {
    const end = addMinutes(e.hour, e.minute, e.duration);
    return end.h + (end.m > 0 ? 1 : 0);
  })) + 1) : 24;

  const timeSlots = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  // Determine current time block (event that is currently happening)
  const currentBlockId: string | null = isWeddingDay
    ? sorted.find((ev) => {
        const start = toTotalMinutes(ev.hour, ev.minute);
        const end = start + ev.duration;
        return nowMinutes >= start && nowMinutes < end;
      })?.id ?? null
    : null;

  // ID of the first upcoming event (first event whose start > nowMinutes)
  const nextBlockId: string | null = isWeddingDay
    ? sorted.find((ev) => toTotalMinutes(ev.hour, ev.minute) > nowMinutes)?.id ?? null
    : null;

  // Past event: start + duration <= nowMinutes
  const isPastEvent = (ev: DayEvent) =>
    isWeddingDay && toTotalMinutes(ev.hour, ev.minute) + ev.duration <= nowMinutes;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <>
      <PageHead
        title="Déroulé du Jour J"
        sub={weddingDate ? `Programme heure par heure · ${weddingDate}` : "Programme heure par heure de votre mariage"}
        actions={
          <>
            {/* EN DIRECT badge on wedding day */}
            {isWeddingDay && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                En direct
              </span>
            )}
            <Button variant="ghost" icon="download" onClick={() => window.print()}>
              Imprimer
            </Button>
            <Button variant="secondary" icon="download" onClick={() => exportDayJPDF(events, state.wedding.partnerA, state.wedding.partnerB, state.wedding.date)}>
              Export PDF
            </Button>
          </>
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-6">

        {/* Show template picker when no events at all */}
        {events.length === 0 ? (
          <TemplatePicker
            onSelect={handleLoadTemplate}
            onManual={() => setEditingEvent({})}
          />
        ) : (
          <>
            {/* Progress tracker */}
            <ProgressTracker
              events={sorted}
              checked={checked}
              onToggle={handleToggleChecked}
            />

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-card overflow-hidden">
              {[
                { value: events.length, label: "Événements", icon: "calendar" },
                { value: `${Math.floor(totalDuration / 60)}h${totalDuration % 60 > 0 ? String(totalDuration % 60).padStart(2, "0") : ""}`, label: "Durée totale", icon: "clock" },
                { value: usedCats.size, label: "Catégories", icon: "sparkle" },
              ].map((s, i) => (
                <div key={i} className="bg-surface px-5 py-4 flex flex-col gap-0.5">
                  <span className="font-mono text-2xl font-semibold tracking-tight">{s.value}</span>
                  <span className="text-[12px] text-text-2 flex items-center gap-1.5">
                    <Icon name={s.icon} size={12} />
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Button variant="ghost" size="sm" icon="refresh" onClick={handleReset}>
                Réinitialiser le modèle
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowLibrary(true)}>
                  📚 Bibliothèque
                </Button>
                <Button variant="primary" icon="plus" onClick={() => setEditingEvent({})}>
                  Ajouter un événement
                </Button>
              </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterCat("all")}
                className={cx(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                  filterCat === "all"
                    ? "bg-text text-bg border-transparent"
                    : "bg-surface-2 text-text-2 border-line hover:border-line-strong"
                )}
              >
                Tous
              </button>
              {(Object.entries(CATEGORIES) as [DayEvent["category"], typeof CATEGORIES[DayEvent["category"]]][]).filter(
                ([k]) => usedCats.has(k)
              ).map(([k, cat]) => (
                <button
                  key={k}
                  onClick={() => setFilterCat(k)}
                  className={cx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition",
                    filterCat === k
                      ? `${cat.bg} ${cat.text} border-transparent`
                      : "bg-surface-2 text-text-2 border-line hover:border-line-strong"
                  )}
                >
                  <Icon name={cat.icon} size={12} />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Timeline */}
            {filtered.length === 0 && filterCat === "all" ? (
              <Empty
                icon="clock"
                title="Aucun événement planifié"
                action={
                  <Button variant="primary" icon="plus" onClick={() => setEditingEvent({})}>
                    Ajouter le premier événement
                  </Button>
                }
              >
                Construisez le programme de votre journée heure par heure.
              </Empty>
            ) : (
              <div className="relative">
                <div className="flex flex-col gap-0">
                  {timeSlots.map((hour) => {
                    const slotEvents = filtered.filter((e) => e.hour === hour);
                    const hasEvents = slotEvents.length > 0;

                    // Find the sorted index of the last event in this slot (for gap detection)
                    // and the first event of the next slot
                    return (
                      <div key={hour} className="flex gap-4 min-h-[4rem] relative">
                        <div className="w-12 flex-shrink-0 pt-3 text-right">
                          <span className={cx(
                            "text-[12px] font-mono tabular-nums font-medium",
                            hasEvents ? "text-text" : "text-text-3"
                          )}>
                            {String(hour).padStart(2, "0")}h
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 flex-1 pb-2 pt-2 relative">
                          <div
                            className={cx(
                              "absolute left-0 top-0 bottom-0 w-px",
                              hasEvents ? "bg-line-strong" : "border-l border-dashed border-line"
                            )}
                          />
                          <div className="absolute left-[-3px] top-[14px] w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: hasEvents ? "var(--line-strong)" : "var(--line)" }}
                          />

                          {hasEvents ? (
                            <div className="ml-4 flex flex-col gap-2">
                              {slotEvents.map((ev, evIdx) => {
                                // Time gap warning: check against the *next* event in the overall sorted list
                                const sortedIdx = sorted.findIndex((s) => s.id === ev.id);
                                const nextEv = sorted[sortedIdx + 1];
                                const showGapWarning = nextEv
                                  ? toTotalMinutes(nextEv.hour, nextEv.minute) -
                                    (toTotalMinutes(ev.hour, ev.minute) + ev.duration) > 120
                                  : false;

                                // Red "now" divider line: show before the first upcoming event
                                const showNowLine = isWeddingDay && nextBlockId === ev.id;

                                return (
                                  <div key={ev.id}>
                                    {/* Current time divider line */}
                                    {showNowLine && (
                                      <div
                                        ref={currentTimeRef}
                                        className="flex items-center gap-2 mb-2 -ml-1"
                                      >
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-wide whitespace-nowrap">
                                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                                          Maintenant
                                        </span>
                                        <div className="flex-1 h-px bg-red-400" />
                                        <span className="text-[10px] font-mono text-red-500 whitespace-nowrap">
                                          {String(Math.floor(nowMinutes / 60)).padStart(2, "0")}:{String(nowMinutes % 60).padStart(2, "0")}
                                        </span>
                                      </div>
                                    )}

                                    <div
                                      draggable
                                      onDragStart={() => handleDragStart(ev.id)}
                                      onDragOver={(e) => handleDragOver(e, ev.id)}
                                      onDrop={(e) => handleDrop(e, ev.id)}
                                      onDragEnd={handleDragEnd}
                                    >
                                      <EventCard
                                        event={ev}
                                        onEdit={() => setEditingEvent(ev)}
                                        onDelete={() => handleDelete(ev.id)}
                                        onAdjustTime={(delta) => handleAdjustTime(ev.id, delta)}
                                        isDragging={dragIdx === ev.id}
                                        isDragOver={dragOver === ev.id && dragIdx !== ev.id}
                                        isChecked={!!checked[ev.id]}
                                        onToggleChecked={() => handleToggleChecked(ev.id)}
                                        isCurrentBlock={currentBlockId === ev.id}
                                        isPastBlock={isPastEvent(ev)}
                                        dragHandleProps={{
                                          onMouseDown: (e) => e.stopPropagation(),
                                        }}
                                      />
                                    </div>

                                    {/* Time gap warning */}
                                    {showGapWarning && (
                                      <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-medium">
                                        <span>⚠</span>
                                        <span>Pause longue : vérifiez ce créneau</span>
                                        {nextEv && (
                                          <span className="ml-auto text-[11px] text-amber-500 font-mono">
                                            +{Math.round((toTotalMinutes(nextEv.hour, nextEv.minute) - (toTotalMinutes(ev.hour, ev.minute) + ev.duration)) / 60)}h de blanc
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="ml-4 h-8 flex items-center">
                              <span className="text-[11.5px] text-text-3 italic select-none">—</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filtered.length === 0 && filterCat !== "all" && (
              <div className="text-center py-8 text-sm text-text-2">
                Aucun événement dans cette catégorie.{" "}
                <button className="text-primary underline underline-offset-2" onClick={() => setFilterCat("all")}>
                  Voir tout
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editingEvent !== false && (
        <EventModal
          event={editingEvent}
          onClose={() => setEditingEvent(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {showLibrary && (
        <LibraryModal
          onClose={() => setShowLibrary(false)}
          onAdd={handleAddFromLibrary}
        />
      )}
    </>
  );
}

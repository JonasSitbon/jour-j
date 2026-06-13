"use client";

// Composants modaux et cartes du déroulé du Jour J (props uniquement, sans store).

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/icon";
import { Button, Field, Input, Textarea, Select, Modal } from "@/components/ui";
import type { DayEvent, WeddingDay, TemplateDay, LibrarySuggestion } from "./_data";
import { CATEGORIES, WHO_CHIPS, DURATION_OPTIONS, MINUTE_OPTIONS, HOUR_OPTIONS, TEMPLATE_PRESETS, LIBRARY_TABS } from "./_data";
import { fmtTime, addMinutes, fmtDuration, fmtShortDate, cx, EMPTY_EVENT, getNowMinutes } from "./_helpers";

export function WhoChipPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

export function EventModal({ event, onClose, onSave, onDelete }: {
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

export function LibraryModal({ onClose, onAdd }: {
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
/* AddDayModal                                                          */
/* ------------------------------------------------------------------ */

export const SUGGESTED_LABELS = ["J-2", "J-1 · Hénné", "J-1 · Préparatifs", "Jour J", "J+1 · Brunch", "J+2"];

export function AddDayModal({ onClose, onAdd, editDay }: {
  onClose: () => void;
  onAdd: (label: string, date: string) => void;
  editDay?: WeddingDay;
}) {
  const [label, setLabel] = useState(editDay?.label ?? "");
  const [date, setDate] = useState(editDay?.date ?? "");
  const [customLabel, setCustomLabel] = useState("");

  const isCustom = label !== "" && !SUGGESTED_LABELS.includes(label);
  const effectiveLabel = isCustom ? customLabel : label;
  const valid = effectiveLabel.trim().length > 0;

  const handleChipClick = (l: string) => {
    setLabel(l);
    setCustomLabel("");
  };

  const handleCustomInput = (v: string) => {
    setLabel("__custom__");
    setCustomLabel(v);
  };

  return (
    <Modal
      title={editDay ? "Modifier le jour" : "Ajouter un jour"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            variant="primary"
            icon="plus"
            disabled={!valid}
            onClick={() => { if (valid) { onAdd(isCustom ? customLabel.trim() : label, date); onClose(); } }}
          >
            {editDay ? "Enregistrer" : "Ajouter"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Nom du jour">
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_LABELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => handleChipClick(l)}
                className={cx(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                  label === l
                    ? "bg-text text-bg border-transparent"
                    : "bg-surface-2 text-text-2 border-line hover:border-line-strong"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <Input
            value={label === "__custom__" ? customLabel : (SUGGESTED_LABELS.includes(label) ? "" : label)}
            onChange={(e) => handleCustomInput(e.target.value)}
            placeholder="Nom personnalisé (optionnel)…"
          />
        </Field>

        <Field label="Date (optionnelle)">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* DayTabBar                                                            */
/* ------------------------------------------------------------------ */

export function DayTabBar({
  days,
  activeDayId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  today,
}: {
  days: WeddingDay[];
  activeDayId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (day: WeddingDay) => void;
  onDelete: (id: string) => void;
  today: string;
}) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    }
    if (openPopover) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openPopover]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {days.map((day) => {
        const isActive = day.id === activeDayId;
        const isToday = day.date === today;
        const shortDate = fmtShortDate(day.date);

        return (
          <div key={day.id} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => onSelect(day.id)}
              className={cx(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition whitespace-nowrap",
                isActive
                  ? "bg-primary text-white border-transparent shadow-sm"
                  : "border-line text-text-2 hover:border-primary/40 bg-surface"
              )}
            >
              {isToday && (
                <span className={cx(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  isActive ? "bg-white animate-pulse" : "bg-red-500 animate-pulse"
                )} />
              )}
              <span>{day.label}</span>
              {shortDate && (
                <span className={cx("text-[11px]", isActive ? "opacity-80" : "text-text-3")}>
                  · {shortDate}
                </span>
              )}
            </button>

            {/* Dots menu */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpenPopover(openPopover === day.id ? null : day.id); }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-surface-3 border border-line text-text-3 flex items-center justify-center hover:bg-surface-2 transition text-[8px] font-bold"
              title="Options"
            >
              ···
            </button>

            {openPopover === day.id && (
              <div
                ref={popoverRef}
                className="absolute top-full mt-1 left-0 z-50 bg-surface border border-line rounded-xl shadow-lg py-1 min-w-[140px]"
              >
                <button
                  type="button"
                  onClick={() => { setOpenPopover(null); onEdit(day); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-surface-2 transition"
                >
                  <Icon name="edit" size={14} /> Modifier
                </button>
                {days.length > 1 && (
                  <button
                    type="button"
                    onClick={() => { setOpenPopover(null); onDelete(day.id); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-coral hover:bg-coral-soft transition"
                  >
                    <Icon name="trash" size={14} /> Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add day button */}
      <button
        type="button"
        onClick={onAdd}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium border border-dashed border-line text-text-3 hover:border-primary hover:text-primary transition"
      >
        <Icon name="plus" size={14} />
        Ajouter
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Template picker (empty state)                                        */
/* ------------------------------------------------------------------ */

export function TemplatePicker({ onSelect, onManual }: {
  onSelect: (days: TemplateDay[]) => void;
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
        {TEMPLATE_PRESETS.map((tpl) => {
          const totalEvents = tpl.days.reduce((s, d) => s + d.events.length, 0);
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.days)}
              className="group flex flex-col gap-2 p-4 rounded-xl border border-line bg-surface hover:border-primary hover:shadow-md transition text-left"
            >
              <div className="text-2xl">{tpl.emoji}</div>
              <div className="font-semibold text-[13.5px] leading-snug group-hover:text-primary transition">
                {tpl.label}
              </div>
              <div className="text-[12px] text-text-2 leading-relaxed">{tpl.description}</div>
              <div className="mt-auto pt-1 text-[11px] text-text-3 font-medium">
                {tpl.days.length > 1 ? `${tpl.days.length} jours · ` : ""}{totalEvents} étapes · Modifiable
              </div>
            </button>
          );
        })}
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

export function ProgressTracker({ events, checked, activeDayId }: {
  events: DayEvent[];
  checked: Record<string, boolean>;
  activeDayId: string;
}) {
  if (events.length === 0) return null;

  const done = events.filter((e) => checked[`${activeDayId}:${e.id}`]).length;
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


/* ------------------------------------------------------------------ */
/* Event Card with drag handle                                          */
/* ------------------------------------------------------------------ */

export function EventCard({
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

"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon } from "@/components/icon";
import { Card, Button, Badge, Empty, Drawer, Field, Select, Modal } from "@/components/ui";
import { PageHead } from "@/components/shell";
import type { CeremonyEvent, CeremonyCategory } from "@/lib/types";
import {
  getWeddingId,
  loadCeremonyEvents,
  addCeremonyEvent,
  updateCeremonyEvent,
  deleteCeremonyEvent,
  reorderCeremonyEvents,
} from "@/lib/db";

// ── Category config ────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  CeremonyCategory,
  { label: string; icon: string; color: string }
> = {
  ouverture:        { label: "Ouverture",             icon: "clock",        color: "#C96E2C" },
  procession:       { label: "Procession",            icon: "users",        color: "#B07A2C" },
  lecture:          { label: "Lecture / Discours",    icon: "edit",         color: "#7E9A63" },
  musique:          { label: "Musique",               icon: "sparkle",      color: "#6B8FB5" },
  vceux:            { label: "Vœux",                  icon: "rings",        color: "#C96E2C" },
  "echange-anneaux":{ label: "Échange des anneaux",   icon: "rings",        color: "#C96E2C" },
  signature:        { label: "Signature",             icon: "check-circle", color: "#7E9A63" },
  sortie:           { label: "Sortie",                icon: "home",         color: "#B07A2C" },
  autre:            { label: "Autre",                 icon: "list",         color: "#9C9C9C" },
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}));

// ── Templates ──────────────────────────────────────────────────────────────

type TemplateEvent = Omit<CeremonyEvent, "id" | "weddingId" | "createdAt">;

const TEMPLATES: {
  id: string;
  label: string;
  description: string;
  events: TemplateEvent[];
}[] = [
  {
    id: "civil",
    label: "Cérémonie civile",
    description: "8–10 étapes typiques d'une cérémonie à la mairie",
    events: [
      { orderIdx: 0, category: "ouverture",   title: "Accueil des invités",          durationMin: 10, who: "Officier d'état civil", music: "", note: "" },
      { orderIdx: 1, category: "procession",  title: "Entrée du cortège",            durationMin: 5,  who: "Famille & témoins",     music: "Marche nuptiale", note: "" },
      { orderIdx: 2, category: "ouverture",   title: "Discours d'ouverture",         durationMin: 5,  who: "Officier d'état civil", music: "", note: "" },
      { orderIdx: 3, category: "lecture",     title: "Lecture des articles du Code civil", durationMin: 5, who: "Officier d'état civil", music: "", note: "Articles 212, 213, 214, 215" },
      { orderIdx: 4, category: "lecture",     title: "Lecture personnelle",          durationMin: 5,  who: "Témoin(s)",             music: "", note: "" },
      { orderIdx: 5, category: "vceux",       title: "Échange des consentements",    durationMin: 5,  who: "Les mariés",           music: "", note: "" },
      { orderIdx: 6, category: "echange-anneaux", title: "Remise des alliances",     durationMin: 3,  who: "Les témoins",          music: "", note: "" },
      { orderIdx: 7, category: "signature",   title: "Signature du registre",        durationMin: 5,  who: "Les mariés & témoins", music: "", note: "" },
      { orderIdx: 8, category: "sortie",      title: "Sortie des mariés",            durationMin: 5,  who: "Les mariés",           music: "La vie en rose", note: "" },
    ],
  },
  {
    id: "laique",
    label: "Cérémonie laïque",
    description: "10–12 étapes pour une cérémonie personnalisée en plein air ou en salle",
    events: [
      { orderIdx: 0,  category: "ouverture",   title: "Accueil des invités",         durationMin: 15, who: "Officiant",             music: "Playlist ambiance", note: "" },
      { orderIdx: 1,  category: "procession",  title: "Entrée des témoins",          durationMin: 3,  who: "Témoins",              music: "", note: "" },
      { orderIdx: 2,  category: "procession",  title: "Entrée des mariés",           durationMin: 5,  who: "Les mariés",           music: "Canon in D", note: "" },
      { orderIdx: 3,  category: "ouverture",   title: "Mot d'accueil de l'officiant",durationMin: 5,  who: "Officiant",            music: "", note: "" },
      { orderIdx: 4,  category: "lecture",     title: "Lecture 1",                   durationMin: 5,  who: "Ami(e) proche",        music: "", note: "" },
      { orderIdx: 5,  category: "musique",     title: "Interlude musical",           durationMin: 4,  who: "",                     music: "A Thousand Years", note: "" },
      { orderIdx: 6,  category: "lecture",     title: "Lecture 2",                   durationMin: 5,  who: "Membre de la famille", music: "", note: "" },
      { orderIdx: 7,  category: "vceux",       title: "Vœux personnels",             durationMin: 10, who: "Les mariés",           music: "", note: "" },
      { orderIdx: 8,  category: "echange-anneaux", title: "Échange des alliances",   durationMin: 5,  who: "Les mariés & témoins", music: "", note: "" },
      { orderIdx: 9,  category: "musique",     title: "Chanson surprise",            durationMin: 4,  who: "",                     music: "", note: "Chanson choisie par les témoins" },
      { orderIdx: 10, category: "signature",   title: "Signature symbolique",        durationMin: 3,  who: "Les mariés",           music: "", note: "" },
      { orderIdx: 11, category: "sortie",      title: "Sortie des mariés",           durationMin: 5,  who: "Les mariés",           music: "Happy", note: "Lancer de confettis" },
    ],
  },
  {
    id: "religieux",
    label: "Cérémonie religieuse",
    description: "12–14 étapes pour une célébration à l'église ou lieu de culte",
    events: [
      { orderIdx: 0,  category: "ouverture",   title: "Accueil à l'entrée",          durationMin: 10, who: "Célébrant",            music: "Prélude à l'orgue", note: "" },
      { orderIdx: 1,  category: "procession",  title: "Entrée de la famille",        durationMin: 5,  who: "Famille",              music: "", note: "" },
      { orderIdx: 2,  category: "procession",  title: "Procession nuptiale",         durationMin: 5,  who: "Les mariés",           music: "Marche nuptiale de Mendelssohn", note: "" },
      { orderIdx: 3,  category: "ouverture",   title: "Chant d'entrée",              durationMin: 4,  who: "Assemblée",            music: "", note: "" },
      { orderIdx: 4,  category: "ouverture",   title: "Mot d'accueil",               durationMin: 5,  who: "Célébrant",            music: "", note: "" },
      { orderIdx: 5,  category: "lecture",     title: "Première lecture",            durationMin: 5,  who: "Lecteur(trice)",       music: "", note: "" },
      { orderIdx: 6,  category: "musique",     title: "Psaume / Chant",              durationMin: 4,  who: "Chœur / Assemblée",   music: "", note: "" },
      { orderIdx: 7,  category: "lecture",     title: "Évangile et homélie",         durationMin: 10, who: "Célébrant",            music: "", note: "" },
      { orderIdx: 8,  category: "vceux",       title: "Échange des consentements",   durationMin: 5,  who: "Les mariés",           music: "", note: "" },
      { orderIdx: 9,  category: "echange-anneaux", title: "Bénédiction et remise des alliances", durationMin: 5, who: "Les mariés & célébrant", music: "", note: "" },
      { orderIdx: 10, category: "musique",     title: "Chant de l'assemblée",        durationMin: 5,  who: "Assemblée",            music: "", note: "" },
      { orderIdx: 11, category: "signature",   title: "Signature du registre",       durationMin: 5,  who: "Les mariés & témoins", music: "", note: "" },
      { orderIdx: 12, category: "musique",     title: "Chant de sortie",             durationMin: 4,  who: "Assemblée",            music: "", note: "" },
      { orderIdx: 13, category: "sortie",      title: "Sortie des mariés",           durationMin: 5,  who: "Les mariés",           music: "Ode à la joie", note: "Haie d'honneur" },
    ],
  },
];

// ── Empty form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  category: "autre" as CeremonyCategory,
  title: "",
  durationMin: "5",
  who: "",
  music: "",
  note: "",
};

// ── Duration formatter ─────────────────────────────────────────────────────

function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

// ── PDF Export ─────────────────────────────────────────────────────────────

async function exportCeremonyPDF(events: CeremonyEvent[]) {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header band
  doc.setFillColor(201, 110, 44);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Programme de cérémonie", 14, 16);

  const totalDuration = events.reduce((s, e) => s + e.durationMin, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${events.length} étapes · Durée totale : ${fmtDuration(totalDuration)}`,
    14,
    25
  );

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.text(`Édité le ${today}`, 196, 25, { align: "right" });

  // Table
  autoTable(doc, {
    startY: 40,
    head: [["#", "Catégorie", "Étape", "Durée", "Qui", "Musique", "Note"]],
    body: events.map((e, i) => [
      String(i + 1),
      CATEGORY_CONFIG[e.category]?.label ?? e.category,
      e.title,
      fmtDuration(e.durationMin),
      e.who || "—",
      e.music || "—",
      e.note || "—",
    ]),
    headStyles: {
      fillColor: [201, 110, 44],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [253, 249, 245] },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: 30 },
      2: { cellWidth: 42 },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 28 },
      5: { cellWidth: 28 },
      6: { cellWidth: "auto" },
    },
    margin: { left: 10, right: 10 },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY ?? 40;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(201, 110, 44);
  doc.text(
    `Durée totale : ${fmtDuration(totalDuration)}  ·  ${events.length} étape${events.length > 1 ? "s" : ""}`,
    196,
    finalY + 8,
    { align: "right" }
  );

  doc.save("programme-ceremonie.pdf");
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CeremonyPage() {
  const [events, setEvents] = useState<CeremonyEvent[]>([]);
  const [weddingId, setWeddingId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CeremonyEvent | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Template modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const wId = getWeddingId();
    if (!wId) { setMounted(true); return; }
    setWeddingId(wId);
    setSyncing(true);
    loadCeremonyEvents(wId)
      .then(setEvents)
      .finally(() => { setSyncing(false); setMounted(true); });
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const sorted = useMemo(
    () => [...events].sort((a, b) => a.orderIdx - b.orderIdx),
    [events]
  );

  const totalDuration = useMemo(
    () => events.reduce((s, e) => s + e.durationMin, 0),
    [events]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingEvent(null);
    setForm({ ...EMPTY_FORM });
    setDrawerOpen(true);
  }

  function openEdit(e: CeremonyEvent) {
    setEditingEvent(e);
    setForm({
      category: e.category,
      title: e.title,
      durationMin: String(e.durationMin),
      who: e.who,
      music: e.music,
      note: e.note,
    });
    setDrawerOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !weddingId) return;
    setSyncing(true);
    try {
      const payload = {
        category: form.category,
        title: form.title.trim(),
        durationMin: Math.max(1, parseInt(form.durationMin) || 5),
        who: form.who.trim(),
        music: form.music.trim(),
        note: form.note.trim(),
      };
      if (editingEvent) {
        await updateCeremonyEvent(editingEvent.id, payload);
        setEvents((prev) =>
          prev.map((e) => (e.id === editingEvent.id ? { ...e, ...payload } : e))
        );
      } else {
        const nextIdx = sorted.length > 0 ? sorted[sorted.length - 1].orderIdx + 1 : 0;
        const created = await addCeremonyEvent(weddingId, { ...payload, orderIdx: nextIdx });
        setEvents((prev) => [...prev, created]);
      }
      setDrawerOpen(false);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: number) {
    setSyncing(true);
    try {
      await deleteCeremonyEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setSyncing(false);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const newSorted = [...sorted];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSorted.length) return;

    // Swap orderIdx
    const tmp = newSorted[index];
    newSorted[index] = { ...newSorted[targetIndex], orderIdx: tmp.orderIdx };
    newSorted[targetIndex] = { ...tmp, orderIdx: newSorted[targetIndex].orderIdx };

    setEvents(newSorted);
    setSyncing(true);
    try {
      await reorderCeremonyEvents(
        newSorted.map((e) => ({ id: e.id, orderIdx: e.orderIdx }))
      );
    } finally {
      setSyncing(false);
    }
  }

  async function applyTemplate(templateId: string) {
    if (!weddingId) return;
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setTemplateModalOpen(false);
    setSyncing(true);
    try {
      const created = await Promise.all(
        tpl.events.map((e) => addCeremonyEvent(weddingId, e))
      );
      setEvents((prev) => [...prev, ...created]);
    } finally {
      setSyncing(false);
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!mounted) return null;

  if (!weddingId) {
    return (
      <div className="p-6 max-w-5xl mx-auto pb-24">
        <PageHead title="Programme de cérémonie" sub="Organisez le déroulé de votre cérémonie" />
        <Card className="!p-0 mt-6">
          <Empty icon="list" title="Aucun mariage sélectionné">
            Sélectionnez un mariage pour gérer le programme de cérémonie.
          </Empty>
        </Card>
      </div>
    );
  }

  // ── Sub line ──────────────────────────────────────────────────────────────

  const subLine = (
    <span className="flex items-center gap-2">
      {sorted.length > 0
        ? `${sorted.length} étape${sorted.length > 1 ? "s" : ""} · ${fmtDuration(totalDuration)}`
        : "Aucune étape encore"}
      {syncing && (
        <span className="flex items-center gap-1.5 text-[12px] text-text-3">
          <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Synchronisation…
        </span>
      )}
    </span>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      <PageHead
        title="Programme de cérémonie"
        sub={subLine}
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            {sorted.length > 0 && (
              <Button
                variant="secondary"
                icon="download"
                size="sm"
                onClick={() => exportCeremonyPDF(sorted)}
              >
                Export PDF
              </Button>
            )}
            {sorted.length === 0 && (
              <Button
                variant="secondary"
                icon="sparkle"
                size="sm"
                onClick={() => setTemplateModalOpen(true)}
              >
                Initialiser avec un template
              </Button>
            )}
            <Button variant="primary" icon="plus" onClick={openAdd}>
              Ajouter une étape
            </Button>
          </div>
        }
      />

      {/* Empty state */}
      {sorted.length === 0 ? (
        <Card className="!p-0">
          <Empty
            icon="list"
            title="Programme vide"
            action={
              <div className="flex gap-2 flex-wrap justify-center">
                <Button
                  variant="secondary"
                  icon="sparkle"
                  onClick={() => setTemplateModalOpen(true)}
                >
                  Choisir un template
                </Button>
                <Button variant="primary" icon="plus" onClick={openAdd}>
                  Ajouter une étape
                </Button>
              </div>
            }
          >
            Commencez par choisir un template ou ajoutez vos étapes manuellement.
          </Empty>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline */}
          <div className="flex flex-col gap-0">
            {sorted.map((ev, idx) => {
              const cfg = CATEGORY_CONFIG[ev.category] ?? CATEGORY_CONFIG.autre;
              const isLast = idx === sorted.length - 1;
              return (
                <div key={ev.id} className="flex gap-4 group">
                  {/* Left: dot + line */}
                  <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center mt-3 shrink-0 z-[1]"
                      style={{ backgroundColor: cfg.color }}
                    >
                      <Icon name={cfg.icon} size={11} className="text-white" strokeWidth={2} />
                    </div>
                    {!isLast && (
                      <div
                        className="w-0.5 flex-1 mt-1"
                        style={{ backgroundColor: cfg.color + "40", minHeight: 24 }}
                      />
                    )}
                  </div>

                  {/* Right: card */}
                  <div
                    className={`flex-1 min-w-0 mb-${isLast ? "0" : "2"}`}
                    style={{ paddingBottom: isLast ? 0 : 8 }}
                  >
                    <Card className="!p-4 group/card">
                      <div className="flex items-start gap-3">
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge tone="neutral">
                              <span
                                className="inline-flex items-center gap-1"
                                style={{ color: cfg.color }}
                              >
                                <Icon name={cfg.icon} size={11} strokeWidth={2} />
                                {cfg.label}
                              </span>
                            </Badge>
                            <span className="text-[12px] text-text-3">#{idx + 1}</span>
                          </div>

                          <div className="text-[15px] font-semibold text-text mb-1.5">
                            {ev.title}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[12.5px] text-text-2">
                            <span className="flex items-center gap-1">
                              <Icon name="clock" size={12} />
                              {fmtDuration(ev.durationMin)}
                            </span>
                            {ev.who && (
                              <span className="flex items-center gap-1">
                                <Icon name="user" size={12} />
                                {ev.who}
                              </span>
                            )}
                            {ev.music && (
                              <span className="flex items-center gap-1">
                                <Icon name="music" size={12} />
                                {ev.music}
                              </span>
                            )}
                          </div>

                          {ev.note && (
                            <p className="mt-1.5 text-[12px] text-text-3 italic leading-relaxed">
                              {ev.note}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
                          <button
                            title="Monter"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, -1)}
                            className="icon-btn w-7 h-7 text-text-3 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Icon name="chevronU" size={15} />
                          </button>
                          <button
                            title="Descendre"
                            disabled={idx === sorted.length - 1}
                            onClick={() => handleMove(idx, 1)}
                            className="icon-btn w-7 h-7 text-text-3 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Icon name="chevronD" size={15} />
                          </button>
                          <button
                            title="Modifier"
                            onClick={() => openEdit(ev)}
                            className="icon-btn w-7 h-7 text-text-3 hover:text-primary"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            title="Supprimer"
                            onClick={() => handleDelete(ev.id)}
                            className="icon-btn w-7 h-7 text-text-3 hover:text-coral"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total footer */}
          <div className="mt-4 flex justify-end">
            <div className="bg-surface-2 border border-line rounded-card px-5 py-3 flex items-center gap-3">
              <Icon name="clock" size={16} className="text-primary" />
              <span className="text-[14px] font-semibold text-text">
                Durée totale : {fmtDuration(totalDuration)}
              </span>
              <span className="text-[12px] text-text-3">
                ({sorted.length} étape{sorted.length > 1 ? "s" : ""})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Drawer */}
      {drawerOpen && (
        <Drawer
          title={editingEvent ? "Modifier l'étape" : "Ajouter une étape"}
          onClose={() => setDrawerOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                icon="save"
                onClick={handleSave}
                disabled={!form.title.trim() || syncing}
              >
                {editingEvent ? "Enregistrer" : "Ajouter"}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Catégorie">
              <Select
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v as CeremonyCategory }))}
                options={CATEGORY_OPTIONS}
              />
            </Field>

            <Field label="Titre *">
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex : Entrée des mariés"
                autoFocus
              />
            </Field>

            <Field label="Durée (minutes)">
              <input
                className="input"
                type="number"
                min="1"
                max="180"
                value={form.durationMin}
                onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
                placeholder="5"
              />
            </Field>

            <Field label="Qui" hint='Ex : "Les témoins", "Famille", "Officiant"'>
              <input
                className="input"
                value={form.who}
                onChange={(e) => setForm((f) => ({ ...f, who: e.target.value }))}
                placeholder="Ex : Les témoins"
              />
            </Field>

            <Field label="Musique" hint="Titre ou description de la musique jouée">
              <input
                className="input"
                value={form.music}
                onChange={(e) => setForm((f) => ({ ...f, music: e.target.value }))}
                placeholder="Ex : Clair de lune – Debussy"
              />
            </Field>

            <Field label="Note">
              <textarea
                className="input !h-auto py-3 leading-relaxed resize-y"
                rows={3}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Instructions ou remarques pour les participants…"
              />
            </Field>
          </div>
        </Drawer>
      )}

      {/* Template Modal */}
      {templateModalOpen && (
        <Modal
          title="Initialiser avec un template"
          onClose={() => setTemplateModalOpen(false)}
          footer={
            <Button variant="secondary" onClick={() => setTemplateModalOpen(false)}>
              Annuler
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-text-2 mb-2">
              Choisissez un modèle pour démarrer rapidement. Vous pourrez ensuite personnaliser chaque étape.
            </p>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl.id)}
                className="text-left border border-line rounded-card p-4 hover:border-primary/50 hover:bg-primary-soft transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[15px] font-semibold group-hover:text-primary transition-colors">
                    {tpl.label}
                  </span>
                  <Badge tone="neutral">{tpl.events.length} étapes</Badge>
                </div>
                <p className="text-[13px] text-text-2">{tpl.description}</p>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

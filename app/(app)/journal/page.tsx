"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Empty, Search, Field, Textarea } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { useStore } from "@/components/providers";
import type { JournalEntry } from "@/lib/types";
import { getWeddingId, loadJournal, addJournalEntry, updateJournalEntry, deleteJournalEntry } from "@/lib/db";
import { lazyExportJournalPDF } from "@/lib/pdf-lazy";

type Category = JournalEntry["category"] | "all";

const CATEGORIES: { id: JournalEntry["category"]; label: string; tone: "neutral" | "primary" | "sage" | "amber" | "coral" }[] = [
  { id: "general", label: "Général", tone: "neutral" },
  { id: "invites", label: "Invités", tone: "primary" },
  { id: "budget", label: "Budget", tone: "sage" },
  { id: "prestataires", label: "Prestataires", tone: "amber" },
  { id: "logistique", label: "Logistique", tone: "neutral" },
  { id: "idees", label: "Idées", tone: "coral" },
];

const CAT_ICONS: Record<JournalEntry["category"], string> = {
  general: "list",
  invites: "users",
  budget: "wallet",
  prestataires: "star",
  logistique: "filter",
  idees: "sparkle",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const EMPTY_FORM = { title: "", text: "", category: "general" as JournalEntry["category"] };

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export default function JournalPage() {
  const { state } = useStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [weddingId, setWeddingId] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Category>("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const id = getWeddingId();
    setWeddingId(id);
    if (!id) {
      setMounted(true);
      return;
    }
    setSyncing(true);
    loadJournal(id)
      .then((data) => setEntries(data))
      .finally(() => {
        setSyncing(false);
        setMounted(true);
      });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && search) {
        setSearch("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [search]);

  const addEntry = async () => {
    if (!form.text.trim() || !weddingId) return;
    setSyncing(true);
    try {
      const created = await addJournalEntry(weddingId, {
        title: form.title.trim() || null,
        text: form.text.trim(),
        category: form.category,
        pinned: false,
      });
      if (created) {
        setEntries((prev) => [created, ...prev]);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
    } finally {
      setSyncing(false);
    }
  };

  const deleteEntry = async (id: number) => {
    setSyncing(true);
    try {
      await deleteJournalEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setSyncing(false);
    }
  };

  const togglePin = async (id: number) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const newPinned = !entry.pinned;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, pinned: newPinned } : e)));
    await updateJournalEntry(id, { pinned: newPinned });
  };

  const startEdit = (e: JournalEntry) => {
    setEditingId(e.id);
    setEditForm({ title: e.title ?? "", text: e.text, category: e.category });
    setExpandedId(null);
  };

  const saveEdit = async () => {
    if (!editForm.text.trim() || editingId === null) return;
    setSyncing(true);
    try {
      const patch = {
        title: editForm.title.trim() || null,
        text: editForm.text.trim(),
        category: editForm.category,
      };
      await updateJournalEntry(editingId, patch);
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? { ...e, ...patch, updatedAt: new Date().toISOString() }
            : e
        )
      );
      setEditingId(null);
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    const q = normalize(search);
    return entries
      .filter((e) => (activeFilter === "all" ? true : e.category === activeFilter))
      .filter((e) =>
        q
          ? normalize(e.title ?? "").includes(q) || normalize(e.text).includes(q)
          : true
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [entries, search, activeFilter]);

  const pinned = entries.filter((e) => e.pinned).length;
  const lastUpdated = entries.length
    ? relativeTime(entries.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt)
    : null;

  if (!mounted) return null;

  if (!weddingId) {
    return (
      <div className="p-6 max-w-6xl mx-auto pb-24">
        <PageHead title="Journal de bord" sub="Notes et décisions" />
        <Card className="!p-0 mt-6">
          <Empty icon="edit" title="Aucun mariage sélectionné">
            Sélectionnez un mariage pour accéder au journal de bord.
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <PageHead
        title="Journal de bord"
        sub="Notes et décisions"
        actions={
          entries.length > 0 && (
            <Button
              variant="secondary"
              icon="download"
              onClick={() =>
                lazyExportJournalPDF(
                  entries,
                  state.wedding.partnerA || "Partenaire A",
                  state.wedding.partnerB || "Partenaire B"
                )
              }
            >
              Export PDF
            </Button>
          )
        }
      />

      <div className="flex flex-col lg:flex-row gap-6 mt-2">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0 flex flex-col gap-4">
          <Card className="!p-4">
            <div className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-3">Catégories</div>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => setActiveFilter("all")}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-[13px] font-medium transition w-full text-left ${
                  activeFilter === "all" ? "bg-primary-soft text-primary-700" : "text-text-2 hover:bg-hover hover:text-text"
                }`}
              >
                <Icon name="list" size={16} />
                Tout
                <span className="ml-auto text-[11px] tabular-nums font-normal text-text-3">{entries.length}</span>
              </button>
              {CATEGORIES.map((cat) => {
                const count = entries.filter((e) => e.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilter(cat.id)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-[13px] font-medium transition w-full text-left ${
                      activeFilter === cat.id ? "bg-primary-soft text-primary-700" : "text-text-2 hover:bg-hover hover:text-text"
                    }`}
                  >
                    <Icon name={CAT_ICONS[cat.id]} size={16} />
                    {cat.label}
                    {count > 0 && (
                      <span className="ml-auto text-[11px] tabular-nums font-normal text-text-3">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="!p-4">
            <div className="text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-3">Statistiques</div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-2">Total notes</span>
                <span className="text-[13px] font-semibold tabular-nums">{entries.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-2">Épinglées</span>
                <span className="text-[13px] font-semibold tabular-nums text-primary">{pinned}</span>
              </div>
              {lastUpdated && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-text-2">Dernière note</span>
                  <span className="text-[13px] text-text-3">{lastUpdated}</span>
                </div>
              )}
              {syncing && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-[11px] text-text-3">Synchronisation…</span>
                </div>
              )}
            </div>
          </Card>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Stats compact */}
          {entries.length > 0 && (
            <div className="flex items-center gap-1.5 text-[12.5px] text-text-3 px-0.5">
              <Icon name="list" size={13} className="shrink-0" />
              <span className="font-medium text-text-2">{entries.length}</span>
              <span>entrée{entries.length !== 1 ? "s" : ""}</span>
              {pinned > 0 && (
                <>
                  <span className="text-line">·</span>
                  <Icon name="flag" size={13} className="text-primary shrink-0" />
                  <span className="font-medium text-primary">{pinned}</span>
                  <span>épinglée{pinned !== 1 ? "s" : ""}</span>
                </>
              )}
              {lastUpdated && (
                <>
                  <span className="text-line">·</span>
                  <span>Dernière&nbsp;: {lastUpdated}</span>
                </>
              )}
            </div>
          )}
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <Search value={search} onChange={setSearch} placeholder="Rechercher dans les notes…" className="flex-1 min-w-48" />
            <Button variant="primary" icon="plus" onClick={() => { setShowForm((v) => !v); setEditingId(null); }}>
              Nouvelle note
            </Button>
          </div>

          {/* Add form */}
          {showForm && (
            <Card className="!p-5 border-primary/30">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon name="edit" size={16} className="text-primary" />
                  <span className="text-[13px] font-semibold text-text">Nouvelle note</span>
                  <button
                    onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                    className="ml-auto icon-btn w-7 h-7"
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
                <Field label="Titre (optionnel)">
                  <input
                    className="input"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Ex : Décision lieu de réception"
                  />
                </Field>
                <Field label="Note *">
                  <Textarea
                    rows={4}
                    value={form.text}
                    onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                    placeholder="Écrivez votre note ici…"
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addEntry(); }}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium border transition ${
                        form.category === cat.id
                          ? "bg-primary text-white border-primary"
                          : "bg-surface-2 border-line text-text-2 hover:border-primary/40 hover:text-text"
                      }`}
                    >
                      <Icon name={CAT_ICONS[cat.id]} size={13} />
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="secondary" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                    Annuler
                  </Button>
                  <Button variant="primary" size="sm" icon="save" onClick={addEntry} disabled={!form.text.trim() || syncing}>
                    Enregistrer
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Notes list */}
          {filtered.length === 0 ? (
            entries.length === 0 ? (
              <Card className="!p-0">
                <Empty
                  icon="edit"
                  title="Votre journal est vide"
                  action={
                    <Button variant="primary" icon="plus" onClick={() => setShowForm(true)}>
                      Ajouter une note
                    </Button>
                  }
                >
                  Commencez à noter vos idées et décisions pour ne rien oublier.
                </Empty>
              </Card>
            ) : (
              <Card className="!p-0">
                <Empty icon="search" title="Aucun résultat">
                  Aucune note ne correspond à votre recherche.
                </Empty>
              </Card>
            )
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((entry) => {
                const cat = CATEGORIES.find((c) => c.id === entry.category)!;
                const isExpanded = expandedId === entry.id;
                const isEditing = editingId === entry.id;

                return (
                  <Card
                    key={entry.id}
                    className={`!p-0 group transition ${entry.pinned ? "border-primary/30" : ""}`}
                  >
                    {isEditing ? (
                      <div className="p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Icon name="edit" size={15} className="text-primary" />
                          <span className="text-[13px] font-semibold">Modifier la note</span>
                          <button onClick={() => setEditingId(null)} className="ml-auto icon-btn w-7 h-7">
                            <Icon name="x" size={16} />
                          </button>
                        </div>
                        <Field label="Titre (optionnel)">
                          <input
                            className="input"
                            value={editForm.title}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Titre optionnel"
                          />
                        </Field>
                        <Field label="Note *">
                          <Textarea
                            rows={4}
                            value={editForm.text}
                            onChange={(e) => setEditForm((f) => ({ ...f, text: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit(); }}
                          />
                        </Field>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORIES.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setEditForm((f) => ({ ...f, category: c.id }))}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium border transition ${
                                editForm.category === c.id
                                  ? "bg-primary text-white border-primary"
                                  : "bg-surface-2 border-line text-text-2 hover:border-primary/40 hover:text-text"
                              }`}
                            >
                              <Icon name={CAT_ICONS[c.id]} size={13} />
                              {c.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Annuler</Button>
                          <Button variant="primary" size="sm" icon="save" onClick={saveEdit} disabled={!editForm.text.trim() || syncing}>
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <Badge tone={cat.tone} icon={CAT_ICONS[cat.id]}>{cat.label}</Badge>
                              {entry.pinned && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                                  <Icon name="flag" size={12} />
                                  épinglé
                                </span>
                              )}
                              <span className="ml-auto text-[11.5px] text-text-3 shrink-0">{relativeTime(entry.createdAt)}</span>
                            </div>
                            {entry.title && (
                              <div className="text-[14px] font-semibold text-text mb-1">{entry.title}</div>
                            )}
                            <p className={`text-[13.5px] text-text-2 leading-relaxed whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-2"}`}>
                              {entry.text}
                            </p>
                            {!isExpanded && entry.text.split("\n").length > 2 && (
                              <button className="text-[12px] text-primary font-medium mt-1 hover:underline">
                                Voir plus
                              </button>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div
                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              title={entry.pinned ? "Désépingler" : "Épingler"}
                              onClick={() => togglePin(entry.id)}
                              className={`icon-btn w-8 h-8 ${entry.pinned ? "text-primary" : ""}`}
                            >
                              <Icon name="flag" size={16} />
                            </button>
                            <button
                              title="Modifier"
                              onClick={() => startEdit(entry)}
                              className="icon-btn w-8 h-8"
                            >
                              <Icon name="edit" size={16} />
                            </button>
                            <button
                              title="Supprimer"
                              onClick={() => deleteEntry(entry.id)}
                              className="icon-btn w-8 h-8 text-coral hover:bg-coral-soft"
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

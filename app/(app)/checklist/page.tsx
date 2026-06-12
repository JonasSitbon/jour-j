"use client";

import { useState, useEffect, useRef } from "react";
import { useStore, useToast } from "@/components/providers";
import { fmt } from "@/lib/format";
import { Icon } from "@/components/icon";
import { Card, Button, Progress, Avatar, Empty, Drawer, Field, Input, Select } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { PageTutorial } from "@/components/tutorial";
import { createClient } from "@/lib/supabase";
import { getWeddingId } from "@/lib/db";
import { seedDefaultTasks, seedDefaultDayJ } from "@/lib/seed";
import type { Task, SubTask } from "@/lib/types";
import { ScrollReveal } from "@/components/scroll-reveal";
import { exportChecklistPDF } from "@/lib/pdf-checklist";

// ─── Assignee types ───────────────────────────────────────────────────────────
type Assignee = "all" | "a" | "b" | "both" | "vendor";
type ViewFilter = "all" | "todo" | "done" | "week";

const ASSIGNEE_STORAGE_KEY = "jj_checklist_assignees";

// ─── Smart task suggestions ───────────────────────────────────────────────────
const TASK_SUGGESTIONS: Record<string, string[]> = {
  "lieu": ["Visiter la salle", "Signer le contrat de location", "Vérifier le plan d'accès", "Confirmer les horaires d'installation", "Obtenir le plan de salle"],
  "traiteur": ["Organiser la dégustation", "Choisir le menu", "Confirmer le nombre de couverts", "Valider le plan de table avec le traiteur", "Confirmer les allergies et régimes"],
  "photo": ["Envoyer la liste des photos indispensables", "Confirmer les heures d'arrivée", "Partager le planning du jour J", "Valider la livraison de l'album"],
  "invit": ["Envoyer les save-the-dates", "Commander les invitations", "Envoyer les invitations", "Relancer les non-répondants", "Confirmer les derniers RSVP"],
  "tenue": ["Premier essayage robe", "Deuxième essayage robe", "Achat des chaussures", "Essai coiffure", "Essai maquillage", "Retrait robe chez le couturier"],
  "voyage": ["Choisir la destination", "Réserver les billets", "Réserver l'hôtel", "Préparer les bagages", "Valider le passeport"],
  "budget": ["Établir le budget prévisionnel", "Collecter tous les devis", "Confirmer les versements d'acompte", "Préparer les enveloppes pour le jour J"],
  "default": ["Confirmer avec le prestataire", "Envoyer un email de suivi", "Ajouter au calendrier", "Valider avec les témoins", "Préparer les documents"],
};

function getSuggestions(catLabel: string): string[] {
  const lower = catLabel.toLowerCase();
  const key = Object.keys(TASK_SUGGESTIONS).find(
    (k) => k !== "default" && lower.includes(k)
  );
  return TASK_SUGGESTIONS[key ?? "default"] ?? TASK_SUGGESTIONS["default"];
}

// ─── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const r = 9;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color =
    pct === 100 ? "var(--gold)" : pct >= 50 ? "var(--sage)" : "var(--primary)";

  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-label={`${pct}%`}>
      <circle cx={12} cy={12} r={r} fill="none" stroke="var(--line)" strokeWidth={2.5} />
      <circle
        cx={12}
        cy={12}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={`${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text
        x={12}
        y={13}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 6, fontWeight: 700, fill: color, fontFamily: "inherit" }}
      >
        {pct}
      </text>
    </svg>
  );
}

// ─── Assignee badge ───────────────────────────────────────────────────────────
function AssigneeBadge({
  assignee,
  partnerA,
  partnerB,
  onClick,
}: {
  assignee: Assignee;
  partnerA: string;
  partnerB: string;
  onClick: () => void;
}) {
  const label =
    assignee === "all"
      ? "Non assigné"
      : assignee === "a"
      ? partnerA
      : assignee === "b"
      ? partnerB
      : assignee === "both"
      ? "Ensemble"
      : "Prestataire";

  const initials =
    assignee === "all"
      ? "–"
      : assignee === "a"
      ? (partnerA[0] ?? "A").toUpperCase()
      : assignee === "b"
      ? (partnerB[0] ?? "B").toUpperCase()
      : assignee === "both"
      ? "AB"
      : "P";

  const style: React.CSSProperties =
    assignee === "all"
      ? { background: "var(--surface-2)", color: "var(--text-3)", border: "1.5px dashed var(--line-strong)" }
      : assignee === "a"
      ? { background: "var(--primary-soft)", color: "var(--primary)" }
      : assignee === "b"
      ? { background: "var(--sage-soft, #e8f0ec)", color: "var(--sage)" }
      : assignee === "both"
      ? { background: "linear-gradient(135deg, var(--primary-soft) 50%, var(--sage-soft, #e8f0ec) 50%)", color: "var(--text-2)" }
      : { background: "var(--surface-3, #e5e5e5)", color: "var(--text-3)" };

  return (
    <button
      type="button"
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="shrink-0 flex items-center justify-center rounded-full text-[9px] font-bold transition hover:scale-110 focus:outline-none"
      style={{ width: 20, height: 20, ...style }}
    >
      {initials}
    </button>
  );
}

// ─── TaskDrawer ───────────────────────────────────────────────────────────────
function TaskDrawer({ onClose }: { onClose: () => void }) {
  const { state, update } = useStore();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const A = state.wedding.partnerA, B = state.wedding.partnerB;
  const [form, setForm] = useState({ title: "", cat: state.checklistCats[0]?.id ?? "admin", due: "", who: "A" as "A" | "B" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.title.trim()) { toast("Le titre est obligatoire", "err"); return; }
    if (!form.due) { toast("La date d'échéance est obligatoire", "err"); return; }
    setSaving(true);
    const wId = getWeddingId();
    const newTask = { id: Date.now(), cat: form.cat, title: form.title.trim(), due: form.due, who: form.who, done: false, subs: [], link: "", note: "", wedding_id: wId };
    if (wId) await createClient().from("tasks").insert({ ...newTask, subs: JSON.stringify([]) });
    update("tasks", (l) => [...l, newTask]);
    toast("Tâche ajoutée");
    setSaving(false);
    onClose();
  };

  return (
    <Drawer title="Nouvelle tâche" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><div className="flex-1" /><Button variant="primary" icon="check" onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Ajouter"}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Titre *"><Input value={form.title} onChange={set("title")} placeholder="Ex : Réserver la salle" /></Field>
        <div className="flex gap-3">
          <Field label="Catégorie">
            <Select value={form.cat} onChange={(v) => setForm((f) => ({ ...f, cat: v }))} options={state.checklistCats.map((c) => ({ value: c.id, label: c.label }))} />
          </Field>
          <Field label="Responsable">
            <Select value={form.who} onChange={(v) => setForm((f) => ({ ...f, who: v as "A" | "B" }))} options={[{ value: "A", label: A }, { value: "B", label: B }]} />
          </Field>
        </div>
        <Field label="Date d'échéance *"><Input type="date" value={form.due} onChange={set("due")} /></Field>
      </div>
    </Drawer>
  );
}

// ─── EditTaskDrawer ───────────────────────────────────────────────────────────
function EditTaskDrawer({ task, onClose }: { task: Task; onClose: () => void }) {
  const { state, update } = useStore();
  const toast = useToast();
  const A = state.wedding.partnerA, B = state.wedding.partnerB;

  const [form, setForm] = useState({ title: task.title, cat: task.cat, due: task.due, who: task.who });
  const [subs, setSubs] = useState<SubTask[]>([...task.subs]);
  const [newSub, setNewSub] = useState("");

  const postpone = (days: number) => {
    const d = new Date(form.due + "T00:00:00");
    d.setDate(d.getDate() + days);
    setForm((f) => ({ ...f, due: d.toISOString().split("T")[0] }));
  };

  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    setSubs((s) => [...s, { t, d: 0 }]);
    setNewSub("");
  };

  const removeSub = (i: number) => setSubs((s) => s.filter((_, idx) => idx !== i));

  const save = () => {
    if (!form.title.trim()) { toast("Le titre est obligatoire", "err"); return; }
    update("tasks", (l) => l.map((t) => t.id === task.id ? { ...t, ...form, subs } : t));
    toast("Tâche mise à jour");
    onClose();
  };

  return (
    <Drawer title="Modifier la tâche" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><div className="flex-1" /><Button variant="primary" icon="check" onClick={save}>Enregistrer</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Titre *">
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>

        <div className="flex gap-3">
          <Field label="Catégorie">
            <Select value={form.cat} onChange={(v) => setForm((f) => ({ ...f, cat: v }))} options={state.checklistCats.map((c) => ({ value: c.id, label: c.label }))} />
          </Field>
          <Field label="Responsable">
            <Select value={form.who} onChange={(v) => setForm((f) => ({ ...f, who: v as "A" | "B" }))} options={[{ value: "A", label: A }, { value: "B", label: B }]} />
          </Field>
        </div>

        <Field label="Date d'échéance">
          <Input type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} />
          {/* Quick postpone buttons */}
          <div className="flex gap-2 mt-2">
            {([["7", "+7 jours"], ["30", "+1 mois"], ["90", "+3 mois"]] as [string, string][]).map(([d, l]) => (
              <button key={d} onClick={() => postpone(parseInt(d))}
                className="text-[12px] px-2.5 py-1 rounded-md border border-line hover:bg-hover hover:border-line-strong text-text-2 transition">
                {l}
              </button>
            ))}
          </div>
        </Field>

        {/* Subtasks */}
        <div>
          <div className="text-[13px] font-medium mb-2.5">Sous-tâches <span className="text-text-3 font-normal">({subs.length})</span></div>
          {subs.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-3">
              {subs.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-surface-2 border border-line">
                  <div className={`w-[16px] h-[16px] rounded-[4px] border-[1.6px] flex items-center justify-center shrink-0 ${s.d ? "bg-primary border-primary text-white" : "border-line-strong"}`}>
                    {s.d ? <Icon name="check" size={10} /> : null}
                  </div>
                  <span className={`flex-1 text-[13px] ${s.d ? "line-through text-text-3" : ""}`}>{s.t}</span>
                  <button onClick={() => removeSub(i)} className="icon-btn w-6 h-6 text-text-3 hover:text-coral">
                    <Icon name="x" size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input value={newSub} onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSub()}
              placeholder="Nouvelle sous-tâche…" />
            <Button variant="secondary" icon="plus" onClick={addSub}>Ajouter</Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isoToday(): string {
  return new Date().toISOString().split("T")[0];
}

function isoIn7Days(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

/** French day-label for a given ISO date relative to today */
function dayLabel(iso: string): string {
  const days = fmt.daysUntil(iso);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Inline add-task row (with suggestions) ───────────────────────────────────
function InlineAddTask({
  catId,
  catLabel,
  existingTitles,
  onAdd,
  onCancel,
}: {
  catId: string;
  catLabel: string;
  existingTitles: string[];
  onAdd: (title: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = getSuggestions(catLabel).filter(
    (s) => !existingTitles.map((t) => t.toLowerCase()).includes(s.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && title.trim()) { onAdd(title.trim()); }
    if (e.key === "Escape") { onCancel(); }
  };

  return (
    <div className="border border-primary rounded-md mb-2.5 overflow-hidden bg-surface">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Nom de la tâche… (Entrée pour confirmer, Échap pour annuler)"
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-text-3"
        />
        <button
          onClick={() => title.trim() && onAdd(title.trim())}
          className="text-[12px] px-3 py-1.5 rounded-md bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-40"
          disabled={!title.trim()}
        >
          Ajouter
        </button>
        <button onClick={onCancel} className="icon-btn w-7 h-7 text-text-3 hover:text-coral">
          <Icon name="x" size={14} />
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
          <span className="text-[11px] text-text-3 font-medium uppercase tracking-wide self-center mr-1">Suggestions :</span>
          {suggestions.slice(0, 7).map((s) => (
            <button
              key={s}
              onClick={() => setTitle(s)}
              className="text-[12px] px-2.5 py-1 rounded-full border border-line bg-surface-2 text-text-2 hover:bg-primary-soft hover:border-primary hover:text-primary transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ChecklistPage() {
  const { state, update, reloadAll } = useStore();
  const toast = useToast();
  const [cat, setCat] = useState("all");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [addingTask, setAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const cats = state.checklistCats;
  const A = state.wedding.partnerA, B = state.wedding.partnerB;

  const [seeding, setSeeding] = useState(false);

  // ── New state ────────────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [assignees, setAssignees] = useState<Record<number, Assignee>>({});
  const [assigneeFilter, setAssigneeFilter] = useState<Assignee>("all");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");

  // ── Drag & drop: tasks ───────────────────────────────────────────────────────
  const [dragTask, setDragTask] = useState<{ id: number; catId: string } | null>(null);
  const [dragOverTask, setDragOverTask] = useState<{ id: number; catId: string } | null>(null);

  // ── Drag & drop: categories ──────────────────────────────────────────────────
  const [dragCat, setDragCat] = useState<string | null>(null);
  const [dragOverCat, setDragOverCat] = useState<string | null>(null);

  // ── Inline add task state: keyed by category id ──────────────────────────────
  const [inlineAdding, setInlineAdding] = useState<string | null>(null);

  // ── Load assignees from localStorage (SSR-safe) ───────────────────────────
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(ASSIGNEE_STORAGE_KEY);
      if (raw) setAssignees(JSON.parse(raw) as Record<number, Assignee>);
    } catch {
      // ignore
    }
  }, []);

  // ── Persist assignees to localStorage ─────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(ASSIGNEE_STORAGE_KEY, JSON.stringify(assignees));
  }, [assignees, mounted]);

  // ── Cycle assignee for a task ─────────────────────────────────────────────
  const CYCLE: Assignee[] = ["all", "a", "b", "both", "vendor"];
  const cycleAssignee = (id: number) => {
    setAssignees((prev) => {
      const current: Assignee = prev[id] ?? "all";
      const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
      return { ...prev, [id]: next };
    });
  };

  // ── Existing helpers ──────────────────────────────────────────────────────
  const toggleTask = (id: number) => update("tasks", (l) => l.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const toggleSub = (tid: number, si: number) => update("tasks", (l) => l.map((t) => t.id === tid ? { ...t, subs: t.subs.map((s, i) => i === si ? { ...s, d: s.d ? 0 : 1 } : s) } : t));
  const toggleDayJ = (id: string) => update("dayJ", (l) => l.map((d) => d.id === id ? { ...d, done: d.done ? 0 : 1 } : d));
  const deleteTask = (id: number) => { update("tasks", (l) => l.filter((t) => t.id !== id)); toast("Tâche supprimée"); };

  const initTasks = async () => {
    const wId = getWeddingId();
    if (!wId) return;
    setSeeding(true);
    await seedDefaultTasks(createClient(), wId, state.wedding.date);
    await reloadAll();
    setSeeding(false);
  };

  const initDayJ = async () => {
    const wId = getWeddingId();
    if (!wId) return;
    setSeeding(true);
    await seedDefaultDayJ(createClient(), wId);
    await reloadAll();
    setSeeding(false);
  };

  // ── Drag & drop handlers: tasks ───────────────────────────────────────────
  const handleTaskDragStart = (taskId: number, catId: string) => {
    setDragTask({ id: taskId, catId });
  };

  const handleTaskDragOver = (e: React.DragEvent, taskId: number, catId: string) => {
    e.preventDefault();
    if (dragTask && dragTask.catId === catId) {
      setDragOverTask({ id: taskId, catId });
    }
  };

  const handleTaskDrop = (e: React.DragEvent, targetTaskId: number, targetCatId: string) => {
    e.preventDefault();
    if (!dragTask || dragTask.catId !== targetCatId || dragTask.id === targetTaskId) {
      setDragTask(null);
      setDragOverTask(null);
      return;
    }

    const allTasks = [...state.tasks];
    const catTasks = allTasks.filter((t) => t.cat === targetCatId);
    const otherTasks = allTasks.filter((t) => t.cat !== targetCatId);

    const fromIndex = catTasks.findIndex((t) => t.id === dragTask.id);
    const toIndex = catTasks.findIndex((t) => t.id === targetTaskId);

    if (fromIndex === -1 || toIndex === -1) {
      setDragTask(null);
      setDragOverTask(null);
      return;
    }

    const reordered = [...catTasks];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // Rebuild full task list preserving original order of other cats
    const finalTasks: Task[] = [];
    let catInserted = false;
    for (const t of allTasks) {
      if (t.cat === targetCatId) {
        if (!catInserted) {
          finalTasks.push(...reordered);
          catInserted = true;
        }
      } else {
        finalTasks.push(t);
      }
    }
    // If cat tasks were all at the end
    if (!catInserted) finalTasks.push(...reordered);

    update("tasks", finalTasks);
    setDragTask(null);
    setDragOverTask(null);
  };

  const handleTaskDragEnd = () => {
    setDragTask(null);
    setDragOverTask(null);
  };

  // ── Drag & drop handlers: categories ─────────────────────────────────────
  const handleCatDragStart = (catId: string) => {
    setDragCat(catId);
  };

  const handleCatDragOver = (e: React.DragEvent, catId: string) => {
    e.preventDefault();
    if (dragCat && dragCat !== catId) {
      setDragOverCat(catId);
    }
  };

  const handleCatDrop = (e: React.DragEvent, targetCatId: string) => {
    e.preventDefault();
    if (!dragCat || dragCat === targetCatId) {
      setDragCat(null);
      setDragOverCat(null);
      return;
    }

    const catList = [...state.checklistCats];
    const fromIndex = catList.findIndex((c) => c.id === dragCat);
    const toIndex = catList.findIndex((c) => c.id === targetCatId);

    if (fromIndex === -1 || toIndex === -1) {
      setDragCat(null);
      setDragOverCat(null);
      return;
    }

    const reordered = [...catList];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    update("checklistCats", reordered);
    setDragCat(null);
    setDragOverCat(null);
  };

  const handleCatDragEnd = () => {
    setDragCat(null);
    setDragOverCat(null);
  };

  // ── Mark all tasks in current category as done ───────────────────────────
  const markAllCatDone = (catId: string) => {
    update("tasks", (l) => l.map((t) => t.cat === catId ? { ...t, done: true } : t));
    toast("Toutes les tâches marquées comme terminées");
  };

  // ── Delete all done tasks ─────────────────────────────────────────────────
  const clearDoneTasks = async () => {
    const doneTasks = state.tasks.filter((t) => t.done);
    if (doneTasks.length === 0) { toast("Aucune tâche terminée à supprimer"); return; }
    if (!confirm(`Supprimer les ${doneTasks.length} tâches terminées ?`)) return;
    const doneIds = doneTasks.map((t) => t.id);
    const wId = getWeddingId();
    if (wId) await createClient().from("tasks").delete().in("id", doneIds);
    update("tasks", (l) => l.filter((t) => !t.done));
    toast(`${doneTasks.length} tâche${doneTasks.length > 1 ? "s" : ""} supprimée${doneTasks.length > 1 ? "s" : ""}`);
  };

  // ── Inline add task ───────────────────────────────────────────────────────
  const handleInlineAdd = (catId: string, title: string) => {
    const today = isoToday();
    const newTask: Task = {
      id: Date.now(),
      cat: catId,
      title,
      due: today,
      who: "A",
      done: false,
      subs: [],
      link: "",
      note: "",
    };
    update("tasks", (l) => [...l, newTask]);
    toast("Tâche ajoutée");
    setInlineAdding(null);
  };

  // ── Bulk suggest top 3 for a category ────────────────────────────────────
  const bulkSuggest = (catId: string, catLabel: string) => {
    const existingTitles = state.tasks
      .filter((t) => t.cat === catId)
      .map((t) => t.title.toLowerCase());
    const suggestions = getSuggestions(catLabel).filter(
      (s) => !existingTitles.includes(s.toLowerCase())
    );
    const top3 = suggestions.slice(0, 3);
    if (top3.length === 0) { toast("Toutes les suggestions existent déjà"); return; }
    const today = isoToday();
    const newTasks: Task[] = top3.map((title) => ({
      id: Date.now() + Math.random(),
      cat: catId,
      title,
      due: today,
      who: "A" as const,
      done: false,
      subs: [],
      link: "",
      note: "",
    }));
    update("tasks", (l) => [...l, ...newTasks]);
    toast(`${top3.length} tâche${top3.length > 1 ? "s" : ""} ajoutée${top3.length > 1 ? "s" : ""}`);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const today = isoToday();
  const done = state.tasks.filter((t) => t.done).length;
  const remaining = state.tasks.length - done;
  const overdue = state.tasks.filter((t) => !t.done && t.due && t.due < today).length;
  const globalPct = state.tasks.length ? Math.round(done / state.tasks.length * 100) : 0;
  const catPct = (cid: string) => {
    const ts = state.tasks.filter((t) => t.cat === cid);
    return ts.length ? Math.round(ts.filter((t) => t.done).length / ts.length * 100) : 0;
  };
  const catDone = (cid: string) => state.tasks.filter((t) => t.cat === cid && t.done).length;
  const catTotal = (cid: string) => state.tasks.filter((t) => t.cat === cid).length;

  // ── Filter pipeline ───────────────────────────────────────────────────────
  const in7Days = isoIn7Days();

  const applyFilters = (tasks: typeof state.tasks) => {
    let result = tasks;

    // Assignee filter
    if (assigneeFilter !== "all") {
      result = result.filter((t) => {
        const a: Assignee = assignees[t.id] ?? "all";
        return a === assigneeFilter;
      });
    }

    // View filter
    if (viewFilter === "todo") {
      result = result.filter((t) => !t.done);
    } else if (viewFilter === "done") {
      result = result.filter((t) => t.done);
    } else if (viewFilter === "week") {
      result = result.filter((t) => !t.done && t.due >= today && t.due <= in7Days);
    }

    return result;
  };

  const visible = cat === "all"
    ? applyFilters(state.tasks)
    : cat === "jourj"
    ? []
    : applyFilters(state.tasks.filter((t) => t.cat === cat));

  const groups: Record<string, typeof state.tasks> = {};
  visible.forEach((t) => { (groups[t.cat] = groups[t.cat] || []).push(t); });

  // ── "Cette semaine" grouped by day ────────────────────────────────────────
  const weekTasks = applyFilters(
    state.tasks.filter((t) => !t.done && t.due >= today && t.due <= in7Days)
  );
  const weekByDay: Record<string, typeof state.tasks> = {};
  weekTasks.forEach((t) => { (weekByDay[t.due] = weekByDay[t.due] || []).push(t); });
  const weekDays = Object.keys(weekByDay).sort();

  // ── Assignee filter labels ────────────────────────────────────────────────
  const assigneeOptions: { value: Assignee; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "a", label: A || "Partenaire A" },
    { value: "b", label: B || "Partenaire B" },
    { value: "both", label: "Ensemble" },
    { value: "vendor", label: "Prestataire" },
  ];

  const viewOptions: { value: ViewFilter; label: string }[] = [
    { value: "all", label: "Toutes" },
    { value: "todo", label: "À faire" },
    { value: "done", label: "Terminées" },
    { value: "week", label: "Cette semaine" },
  ];

  const pillBase = "px-3 py-1.5 rounded-full text-[12.5px] font-medium transition border";
  const pillActive = "bg-primary text-white border-primary";
  const pillInactive = "bg-surface border-line text-text-2 hover:bg-hover hover:border-line-strong";

  const viewPillActive = "bg-surface-2 text-text border-line-strong";
  const viewPillInactive = "bg-surface border-line text-text-2 hover:bg-hover";

  // ── Task row renderer (shared) ────────────────────────────────────────────
  const renderTask = (t: Task, catId?: string) => {
    const late = !t.done && fmt.daysUntil(t.due) < 0;
    const soon = !t.done && fmt.daysUntil(t.due) >= 0 && fmt.daysUntil(t.due) < 30;
    const hasSubs = t.subs.length > 0;
    const isOpen = expanded[t.id];
    const assignee: Assignee = assignees[t.id] ?? "all";

    const isDragging = dragTask?.id === t.id;
    const isDropTarget = dragOverTask?.id === t.id && dragTask?.catId === (catId ?? t.cat);

    return (
      <div
        key={t.id}
        className="border border-line rounded-md mb-2.5 overflow-hidden hover:border-line-strong transition group"
        style={{
          opacity: isDragging ? 0.4 : 1,
          border: isDragging
            ? "1.5px dashed var(--line-strong)"
            : isDropTarget
            ? "2px solid var(--primary)"
            : undefined,
          borderTop: isDropTarget ? "2px solid var(--primary)" : undefined,
        }}
        draggable={false}
        onDragOver={(e) => catId && handleTaskDragOver(e, t.id, catId)}
        onDrop={(e) => catId && handleTaskDrop(e, t.id, catId)}
      >
        <div className="flex items-center gap-3.5 px-4 py-3.5">
          {/* Drag handle — only this element is draggable */}
          {catId && (
            <div
              draggable
              onDragStart={() => handleTaskDragStart(t.id, catId)}
              onDragEnd={handleTaskDragEnd}
              className="shrink-0 cursor-grab text-text-3 hover:text-text-2 transition select-none"
              title="Réordonner"
              style={{ lineHeight: 1, fontSize: 16 }}
            >
              &#8942;&#8942;
            </div>
          )}

          <div onClick={() => toggleTask(t.id)} className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center shrink-0 cursor-pointer transition ${t.done ? "bg-sage border-sage text-white" : "border-line-strong text-transparent"}`}><Icon name="check" size={14} /></div>

          {/* Assignee badge */}
          {mounted && (
            <AssigneeBadge
              assignee={assignee}
              partnerA={A}
              partnerB={B}
              onClick={() => cycleAssignee(t.id)}
            />
          )}

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => hasSubs && setExpanded((e) => ({ ...e, [t.id]: !e[t.id] }))}>
            <div className={`text-sm font-medium ${t.done ? "text-text-3 line-through" : ""}`}>{t.title}</div>
            <div className="flex items-center gap-3 text-xs text-text-2 mt-0.5 flex-wrap">
              <span className={late ? "text-coral font-semibold" : ""}><Icon name="clock" size={13} className="inline align-[-2px] mr-1" />{late ? fmt.dateShort(t.due) : `Échéance ${fmt.dateShort(t.due)}`}</span>
              {late && <span className="badge text-white font-semibold" style={{ background: "var(--coral, #e87059)" }}>En retard</span>}
              <span className="flex items-center gap-1.5"><Avatar name={t.who === "A" ? A : B} side={t.who} size="sm" />{t.who === "A" ? A : B}</span>
              {soon && !late && <span className="badge bg-amber-soft text-[var(--gold-ink)]"><span className="w-1.5 h-1.5 rounded-full bg-current" />Bientôt</span>}
              {hasSubs && <span className="text-text-3">{t.subs.filter((s) => s.d).length}/{t.subs.length} sous-tâches</span>}
            </div>
          </div>
          {/* Edit button */}
          <button onClick={() => setEditingTask(t)}
            className="icon-btn w-8 h-8 opacity-0 group-hover:opacity-100 text-text-3 hover:text-primary transition"
            title="Modifier">
            <Icon name="edit" size={15} />
          </button>
          <button onClick={() => deleteTask(t.id)} className="icon-btn w-8 h-8 opacity-0 group-hover:opacity-100 text-text-3 hover:text-coral transition"><Icon name="trash" size={15} /></button>
          {hasSubs && <button className="icon-btn w-8 h-8" onClick={() => setExpanded((e) => ({ ...e, [t.id]: !e[t.id] }))}><Icon name={isOpen ? "chevronU" : "chevronD"} size={18} /></button>}
        </div>
        {hasSubs && isOpen && (
          <div className="px-4 pb-3.5 pl-[51px] flex flex-col gap-2">
            {t.subs.map((s, si) => (
              <div key={si} onClick={() => toggleSub(t.id, si)} className={`flex items-center gap-2.5 text-[13px] cursor-pointer ${s.d ? "line-through text-text-3" : "text-text-2"}`}>
                <div className={`w-[17px] h-[17px] rounded-[5px] border-[1.6px] flex items-center justify-center shrink-0 ${s.d ? "bg-primary border-primary text-white" : "border-line-strong text-transparent"}`}><Icon name="check" size={11} /></div>{s.t}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Category section renderer ─────────────────────────────────────────────
  const renderCategorySection = (cid: string, ts: Task[]) => {
    const catObj = cats.find((c) => c.id === cid);
    if (!catObj) return null;
    const cDone = catDone(cid);
    const cTotal = catTotal(cid);
    const isCatDragging = dragCat === cid;
    const isCatDropTarget = dragOverCat === cid && dragCat !== cid;
    const existingTitles = state.tasks.filter((t) => t.cat === cid).map((t) => t.title);

    return (
      <div
        key={cid}
        className="mb-6"
        style={{
          opacity: isCatDragging ? 0.5 : 1,
          borderTop: isCatDropTarget ? "2px solid var(--primary)" : "2px solid transparent",
          transition: "border-color 0.15s",
        }}
        onDragOver={(e) => handleCatDragOver(e, cid)}
        onDrop={(e) => handleCatDrop(e, cid)}
      >
        {cat === "all" && (
          <div className="flex items-center justify-between mb-3">
            <div
              className="sec-title flex items-center gap-2 flex-1 min-w-0"
              draggable
              onDragStart={() => handleCatDragStart(cid)}
              onDragEnd={handleCatDragEnd}
              style={{ cursor: "grab" }}
              title="Réordonner la catégorie"
            >
              <span className="text-text-3 mr-1 select-none" style={{ fontSize: 14 }}>&#8942;&#8942;</span>
              <Icon name={catObj.icon} size={16} className="text-text-3" />
              {catObj.label}
              <ProgressRing done={cDone} total={cTotal} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => bulkSuggest(cid, catObj.label)}
                className="text-[11.5px] px-2.5 py-1 rounded-full border border-line text-text-2 bg-surface-2 hover:bg-primary-soft hover:text-primary hover:border-primary transition flex items-center gap-1"
                title="Ajouter les 3 premières suggestions"
              >
                &#10024; Suggérer
              </button>
              <span className="font-mono text-text-2 text-[12.5px]">{catPct(cid)}%</span>
            </div>
          </div>
        )}
        {cat !== "all" && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1">
              <ProgressRing done={cDone} total={cTotal} />
              <span className="font-mono text-text-2 text-[12.5px]">{cDone}/{cTotal} terminées</span>
            </div>
            {cDone < cTotal && (
              <button
                onClick={() => markAllCatDone(cid)}
                className="text-[11.5px] px-2.5 py-1 rounded-full border border-sage text-sage bg-surface-2 hover:bg-sage hover:text-white transition flex items-center gap-1"
                title="Marquer toutes les tâches comme terminées"
              >
                <Icon name="check" size={12} /> Tout cocher
              </button>
            )}
            <button
              onClick={() => bulkSuggest(cid, catObj.label)}
              className="text-[11.5px] px-2.5 py-1 rounded-full border border-line text-text-2 bg-surface-2 hover:bg-primary-soft hover:text-primary hover:border-primary transition flex items-center gap-1"
              title="Ajouter les 3 premières suggestions"
            >
              &#10024; Suggérer
            </button>
          </div>
        )}

        {/* Empty state */}
        {ts.length === 0 && inlineAdding !== cid && (
          <div
            className="border border-dashed border-line rounded-md py-4 px-5 mb-2.5 text-center text-[12.5px] text-text-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragTask) {
                // Drop into empty category — append task at end
                const allTasks = [...state.tasks];
                const taskToMove = allTasks.find((t) => t.id === dragTask.id);
                if (taskToMove && taskToMove.cat !== cid) {
                  const updated = allTasks.map((t) =>
                    t.id === dragTask.id ? { ...t, cat: cid } : t
                  );
                  update("tasks", updated);
                }
                setDragTask(null);
                setDragOverTask(null);
              }
            }}
          >
            Aucune tâche — glissez-en une ici ou cliquez +
          </div>
        )}

        {ts.map((t) => renderTask(t, cid))}

        {/* Inline add */}
        {inlineAdding === cid ? (
          <InlineAddTask
            catId={cid}
            catLabel={catObj.label}
            existingTitles={existingTitles}
            onAdd={(title) => handleInlineAdd(cid, title)}
            onCancel={() => setInlineAdding(null)}
          />
        ) : (
          <button
            onClick={() => setInlineAdding(cid)}
            className="flex items-center gap-2 text-[12.5px] text-text-3 hover:text-primary transition mt-1 px-1 py-1"
          >
            <Icon name="plus" size={14} />
            Ajouter une tâche
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">
      <PageHead title="Checklist" sub={`${done} / ${state.tasks.length} tâches complétées · ${globalPct}%`}
        actions={<>
          <Button variant="ghost" icon="download" onClick={() => exportChecklistPDF(state.tasks, cats, A || "Partenaire A", B || "Partenaire B")}>Export PDF</Button>
          {state.tasks.some((t) => t.done) && (
            <Button variant="ghost" icon="trash" onClick={clearDoneTasks}>Nettoyer les terminées</Button>
          )}
          <Button variant="secondary" icon="sparkle" onClick={() => setCat("jourj")}>Mode Jour J</Button>
          <Button variant="primary" icon="plus" onClick={() => setAddingTask(true)}>Ajouter une tâche</Button>
        </>} />

      <PageTutorial pageId="checklist" title="Comment utiliser la checklist ?"
        steps={[
          { icon: "check-circle", title: "Cochez au fur et à mesure", desc: "Cliquez sur la case pour marquer une tâche comme terminée. La progression se met à jour en temps réel." },
          { icon: "edit", title: "Modifiez et reportez", desc: "Cliquez sur l'icône crayon pour changer la date, ajouter des sous-tâches ou réassigner la tâche." },
          { icon: "rings", title: "Mode Jour J", desc: "Le matin du mariage, activez le mode Jour J pour une checklist simplifiée des derniers préparatifs." },
        ]} />

      {/* ── Filter bars ──────────────────────────────────────────────────────── */}
      {cat !== "jourj" && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {/* Assignee pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {assigneeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAssigneeFilter(opt.value)}
                className={`${pillBase} ${assigneeFilter === opt.value ? pillActive : pillInactive}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-line shrink-0" />

          {/* View pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {viewOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setViewFilter(opt.value)}
                className={`${pillBase} ${viewFilter === opt.value ? viewPillActive : viewPillInactive}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick stats bar ───────────────────────────────────────────────────── */}
      {cat !== "jourj" && state.tasks.length > 0 && (
        <ScrollReveal delay={0}>
        <div className="flex items-center gap-2 text-[12.5px] text-text-2 mb-4 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sage inline-block" />
            <strong className="text-text font-semibold">{done}</strong> complétée{done !== 1 ? "s" : ""}
          </span>
          <span className="text-line-strong">·</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            <strong className="text-text font-semibold">{remaining}</strong> restante{remaining !== 1 ? "s" : ""}
          </span>
          {overdue > 0 && (
            <>
              <span className="text-line-strong">·</span>
              <span className="flex items-center gap-1 text-coral font-semibold">
                <span className="w-2 h-2 rounded-full bg-coral inline-block" />
                {overdue} en retard
              </span>
            </>
          )}
        </div>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.05}>
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5 items-start">
        <div>
          <Card className="mb-3 !p-4">
            <div className="flex items-center justify-between mb-2"><span className="font-semibold text-sm">Progression</span><span className="font-mono font-semibold">{globalPct}%</span></div>
            <Progress value={globalPct} />
          </Card>
          <div className="flex md:flex-col gap-1 flex-wrap md:sticky md:top-20">
            <button onClick={() => setCat("all")} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-[13.5px] font-medium transition ${cat === "all" ? "bg-primary-soft text-primary-700" : "text-text-2 hover:bg-hover hover:text-text"}`}><Icon name="list" size={17} />Toutes<span className="ml-auto font-mono text-xs text-text-3">{state.tasks.length}</span></button>
            {cats.map((c) => {
              const pct = catPct(c.id);
              const barColor = pct > 80 ? "var(--sage)" : pct >= 50 ? "var(--gold)" : "var(--coral, #e87059)";
              return (
                <button key={c.id} onClick={() => setCat(c.id)} className={`flex flex-col gap-1 px-3 py-2.5 rounded-sm text-[13.5px] font-medium transition w-full text-left ${cat === c.id ? "bg-primary-soft text-primary-700" : "text-text-2 hover:bg-hover hover:text-text"}`}>
                  <span className="flex items-center gap-3 w-full">
                    <Icon name={c.icon} size={17} />{c.label}
                    <span className="ml-auto font-mono text-xs text-text-3">{pct}%</span>
                  </span>
                  <span className="block h-[3px] rounded-full w-full overflow-hidden" style={{ background: "var(--line)" }}>
                    <span className="block h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
                  </span>
                </button>
              );
            })}
            <button onClick={() => setCat("jourj")} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-[13.5px] font-medium mt-2 text-gold ${cat === "jourj" ? "bg-primary-soft" : "hover:bg-hover"}`}><Icon name="rings" size={17} />Mode Jour J</button>
          </div>
        </div>

        <div>
          {cat === "jourj" ? (
            <Card className="border-line" style={{ background: "linear-gradient(135deg, var(--primary-softer), var(--gold-soft))" }}>
              <div className="sec-title mb-1.5"><Icon name="rings" size={18} />Le matin du jour J</div>
              <div className="text-text-2 text-[13.5px] mb-2.5">Une checklist simplifiée pour ne rien oublier le grand jour.</div>
              {state.dayJ.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <p className="text-text-2 text-[13.5px]">Aucun item pour le moment.</p>
                  <Button variant="primary" icon="sparkle" onClick={initDayJ} disabled={seeding}>
                    {seeding ? "Initialisation…" : "Initialiser le Jour J"}
                  </Button>
                </div>
              ) : state.dayJ.map((d) => (
                <div key={d.id} onClick={() => toggleDayJ(d.id)} className="flex items-center gap-3.5 py-3.5 border-b border-line last:border-0 cursor-pointer">
                  <div className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center shrink-0 transition ${d.done ? "bg-sage border-sage text-white" : "border-line-strong text-transparent"}`}><Icon name="check" size={14} /></div>
                  <span className={`text-[15px] ${d.done ? "text-text-3 line-through" : ""}`}>{d.t}</span>
                </div>
              ))}
            </Card>

          ) : viewFilter === "week" ? (
            /* ── "Cette semaine" focus view ─────────────────────────────────── */
            <div>
              <Card className="mb-4 border-primary-soft" style={{ background: "linear-gradient(135deg, var(--primary-softer, #fdf4f0), var(--gold-soft, #fffbf0))" }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">&#9889;</span>
                  <div>
                    <div className="font-semibold text-[15px]">Focus cette semaine</div>
                    <div className="text-text-2 text-[13px] mt-0.5">{weekTasks.length} tâche{weekTasks.length !== 1 ? "s" : ""} à faire dans les 7 prochains jours</div>
                  </div>
                </div>
              </Card>

              {weekDays.length === 0 ? (
                <Card>
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <div className="text-2xl">&#10003;</div>
                    <p className="text-text-2 text-[14px]">Rien d&apos;urgent cette semaine — vous êtes à jour !</p>
                  </div>
                </Card>
              ) : weekDays.map((day) => (
                <div key={day} className="mb-5">
                  <div className="text-[13px] font-semibold text-text-2 uppercase tracking-wider mb-2 pl-1 capitalize">
                    {dayLabel(day)}
                  </div>
                  {weekByDay[day].map((t) => renderTask(t))}
                </div>
              ))}
            </div>

          ) : Object.keys(groups).length === 0 ? (
            <Card>
              {cat === "all" && state.tasks.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center">
                    <Icon name="check-circle" size={22} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Aucune tâche pour le moment</div>
                    <p className="text-text-2 text-[13.5px]">Initialisez votre checklist avec les étapes clés d&apos;une organisation de mariage.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" icon="plus" onClick={() => setAddingTask(true)}>Ajouter manuellement</Button>
                    <Button variant="primary" icon="sparkle" onClick={initTasks} disabled={seeding}>
                      {seeding ? "Initialisation…" : "Initialiser la checklist"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Empty icon="check-circle" title="Aucune tâche ici">Ajoutez une tâche pour cette catégorie.</Empty>
              )}
            </Card>

          ) : (
            /* ── Category sections with drag & drop ─────────────────────────── */
            <>
              {cat === "all"
                ? cats
                    .filter((c) => groups[c.id] !== undefined || inlineAdding === c.id)
                    .map((c) => renderCategorySection(c.id, groups[c.id] ?? []))
                : Object.entries(groups).map(([cid, ts]) =>
                    renderCategorySection(cid, ts)
                  )}
            </>
          )}

          {/* Inline add in single-category view when no tasks exist */}
          {cat !== "all" && cat !== "jourj" && viewFilter !== "week" && Object.keys(groups).length === 0 && state.tasks.filter((t) => t.cat === cat).length === 0 && (
            <div className="mt-2">
              {inlineAdding === cat ? (
                <InlineAddTask
                  catId={cat}
                  catLabel={cats.find((c) => c.id === cat)?.label ?? ""}
                  existingTitles={[]}
                  onAdd={(title) => handleInlineAdd(cat, title)}
                  onCancel={() => setInlineAdding(null)}
                />
              ) : (
                <button
                  onClick={() => setInlineAdding(cat)}
                  className="flex items-center gap-2 text-[12.5px] text-text-3 hover:text-primary transition px-1 py-1"
                >
                  <Icon name="plus" size={14} />
                  Ajouter une tâche
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </ScrollReveal>

      {addingTask && <TaskDrawer onClose={() => setAddingTask(false)} />}
      {editingTask && <EditTaskDrawer task={editingTask} onClose={() => setEditingTask(null)} />}
    </div>
  );
}

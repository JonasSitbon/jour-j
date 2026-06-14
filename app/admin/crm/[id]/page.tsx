"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  account_type: string;
  is_subscribed: boolean;
  plan: string | null;
  trial_ends_at: string | null;
  subscribed_at: string | null;
  created_at: string;
  crm_tags: string[] | null;
  crm_notes: string | null;
  pipeline_stage: string | null;
}

interface CrmEvent {
  id: string;
  user_id: string;
  event_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  performed_by: string | null;
  created_at: string;
}

interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_name: string;
  path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface WeddingRow {
  id: number;
  user_id: string;
  name: string | null;
  partner_a: string | null;
  partner_b: string | null;
  date: string | null;
  city: string | null;
  created_at: string;
  role: string;
}

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
  source: "crm" | "analytics";
}

interface CrmTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  due_date: string | null;
  priority: string;
  completed: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "hier";
  if (d < 7) return `il y a ${d}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatMonthGroup(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function trialDaysLeft(iso: string | null): string {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (d < 0) return "Expiré";
  if (d === 0) return "Expire aujourd'hui";
  return `J-${d}`;
}

function getInitials(first: string | null, last: string | null): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  return ((f[0] ?? "") + (l[0] ?? "")).toUpperCase() || "?";
}

function avatarColor(id: string): string {
  const colors = ["#C96E2C", "#1e6fa8", "#16a34a", "#7c3aed", "#b45309"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

function analyticsToTimeline(ev: AnalyticsEvent): TimelineItem {
  const map: Record<string, { title: string; type: string }> = {
    signup_complete:    { title: "Inscription terminée", type: "signup" },
    login:              { title: "Connexion", type: "login" },
    email_opened:       { title: "Email ouvert", type: "email_sent" },
    email_link_clicked: { title: "Lien email cliqué", type: "email_sent" },
  };
  const m = map[ev.event_name] ?? { title: ev.event_name, type: "login" };
  return {
    id: `analytics-${ev.id}`,
    type: m.type,
    title: m.title,
    description: ev.path ?? null,
    created_at: ev.created_at,
    source: "analytics",
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCOUNT_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  couple:      { label: "Couple",          bg: "#1e3a5f33", color: "#60a5fa" },
  planner:     { label: "Wedding Planner", bg: "#16562233", color: "#4ade80" },
  super_admin: { label: "Super Admin",     bg: "#c96e2c33", color: "#fb923c" },
};

const STATUS_BADGE = {
  subscribed: { label: "Abonné",   bg: "#16562233", color: "#4ade80" },
  trial:      { label: "Essai",    bg: "#1e3a5f33", color: "#60a5fa" },
  free:       { label: "Gratuit",  bg: "#33333344", color: "#9ca3af" },
};

const ROLE_LABEL: Record<string, string> = {
  owner:   "Propriétaire",
  admin:   "Admin",
  editor:  "Éditeur",
  viewer:  "Visiteur",
};

const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
  owner:  { bg: "#C96E2C33", color: "#fb923c" },
  admin:  { bg: "#1e3a5f33", color: "#60a5fa" },
  editor: { bg: "#16562233", color: "#4ade80" },
  viewer: { bg: "#33333344", color: "#9ca3af" },
};

const EVENT_ICON: Record<string, { icon: string; color: string }> = {
  signup:             { icon: "users",        color: "#4ade80" },
  trial_start:        { icon: "play",         color: "#60a5fa" },
  trial_expired:      { icon: "alert",        color: "#f87171" },
  subscription:       { icon: "check-circle", color: "#4ade80" },
  plan_change:        { icon: "refresh",      color: "#fbbf24" },
  email_sent:         { icon: "mail",         color: "#60a5fa" },
  admin_note:         { icon: "edit",         color: "#C96E2C" },
  wedding_created:    { icon: "rings",        color: "#fbbf24" },
  profile_updated:    { icon: "user",         color: "#9ca3af" },
  role_change:        { icon: "key",          color: "#a78bfa" },
  account_type_change:{ icon: "settings",     color: "#a78bfa" },
  login:              { icon: "key",          color: "#6b7280" },
  password_reset:     { icon: "refresh",      color: "#fbbf24" },
  error:              { icon: "alert",        color: "#f87171" },
};

const TIMELINE_FILTERS = [
  { id: "all",      label: "Tout" },
  { id: "admin",    label: "Admin & notes" },
  { id: "emails",   label: "Emails" },
  { id: "weddings", label: "Mariages" },
  { id: "logins",   label: "Connexions" },
] as const;
type TimelineFilter = typeof TIMELINE_FILTERS[number]["id"];

function matchesFilter(item: TimelineItem, filter: TimelineFilter): boolean {
  if (filter === "all") return true;
  if (filter === "admin") return ["admin_note", "profile_updated", "role_change", "account_type_change"].includes(item.type);
  if (filter === "emails") return ["email_sent"].includes(item.type);
  if (filter === "weddings") return ["wedding_created"].includes(item.type);
  if (filter === "logins") return ["login", "signup", "trial_start", "password_reset"].includes(item.type);
  return true;
}

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const PIPELINE_STAGES: Array<{ value: string; label: string; color: string }> = [
  { value: "prospect",    label: "Prospect",     color: "#6b7280" },
  { value: "trial",       label: "Essai",        color: "#60a5fa" },
  { value: "qualified",   label: "Qualifié",     color: "#fbbf24" },
  { value: "offer_sent",  label: "Offre envoyée",color: "#f97316" },
  { value: "negotiation", label: "Négociation",  color: "#a78bfa" },
  { value: "won",         label: "Gagné",        color: "#4ade80" },
  { value: "churned",     label: "Churné",       color: "#ef4444" },
  { value: "lost",        label: "Perdu",        color: "#4b5563" },
];

// ─── Task type icons & priority colors ───────────────────────────────────────

const TASK_TYPE_ICON: Record<string, string> = {
  call:       "phone",
  email:      "mail",
  meeting:    "users",
  task:       "check-circle",
  follow_up:  "refresh",
};

const PRIORITY_COLOR: Record<string, string> = {
  low:    "#6b7280",
  medium: "#fbbf24",
  high:   "#f97316",
  urgent: "#ef4444",
};

// ─── Email templates ──────────────────────────────────────────────────────────

function getEmailTemplates(firstName: string | null) {
  const name = firstName ?? "vous";
  return [
    { value: "vide", label: "Vide", subject: "", body: "" },
    {
      value: "bienvenue",
      label: "Bienvenue",
      subject: "Bienvenue sur Jour J 🎉",
      body: `<p>Bonjour ${name},</p>
<p>Bienvenue sur <strong>Jour J</strong> ! Nous sommes ravis de vous accueillir.</p>
<p>Jour J est votre assistant de mariage tout-en-un : planning, budget, prestataires, invités… tout est centralisé pour que vous puissiez profiter de la préparation de votre mariage l'esprit tranquille.</p>
<p>N'hésitez pas à explorer l'application et à nous contacter si vous avez la moindre question.</p>
<p>À très bientôt,<br/>L'équipe Jour J</p>`,
    },
    {
      value: "relance_essai",
      label: "Relance essai",
      subject: "Votre essai Jour J expire bientôt",
      body: `<p>Bonjour ${name},</p>
<p>Votre période d'essai sur <strong>Jour J</strong> arrive à expiration très prochainement.</p>
<p>Pour continuer à accéder à toutes les fonctionnalités et ne rien perdre de votre travail, passez à l'abonnement dès maintenant :</p>
<p><a href="https://jour-j.app/tarifs">Voir les offres</a></p>
<p>En cas de question, nous sommes là pour vous aider.</p>
<p>L'équipe Jour J</p>`,
    },
    {
      value: "essai_expire",
      label: "Essai expiré",
      subject: "Votre accès Jour J a expiré",
      body: `<p>Bonjour ${name},</p>
<p>Votre période d'essai sur <strong>Jour J</strong> est terminée. Votre accès aux fonctionnalités premium est maintenant limité.</p>
<p>Reprenez votre préparation là où vous l'avez laissée en souscrivant à un abonnement :</p>
<p><a href="https://jour-j.app/tarifs">Voir les offres</a></p>
<p>Toutes vos données sont conservées et vous retrouverez votre avancement intact.</p>
<p>L'équipe Jour J</p>`,
    },
    {
      value: "confirmation_abo",
      label: "Confirmation abonnement",
      subject: "Votre abonnement Jour J est actif",
      body: `<p>Bonjour ${name},</p>
<p>Merci pour votre confiance ! Votre abonnement <strong>Jour J</strong> est maintenant actif.</p>
<p>Vous avez accès à toutes les fonctionnalités sans limite pour préparer votre mariage sereinement.</p>
<p>Si vous avez besoin d'aide ou avez des questions, notre équipe est disponible pour vous.</p>
<p>Avec tout notre soutien pour ce grand jour,<br/>L'équipe Jour J</p>`,
    },
    {
      value: "renouvellement",
      label: "Renouvellement",
      subject: "Renouvellement de votre abonnement",
      body: `<p>Bonjour ${name},</p>
<p>Votre abonnement <strong>Jour J</strong> vient d'être renouvelé avec succès.</p>
<p>Vous continuez à bénéficier de toutes les fonctionnalités de l'application.</p>
<p>Merci de votre fidélité,<br/>L'équipe Jour J</p>`,
    },
  ];
}

// ─── Inline editable field ────────────────────────────────────────────────────

function InlineField({
  label,
  value,
  field,
  onSave,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  field: string;
  onSave: (field: string, value: string) => Promise<void>;
  placeholder?: string;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  async function save() {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(field, draft);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="mb-3">
        <div className="text-[11px] mb-1 font-medium" style={{ color: "#4b5563" }}>{label}</div>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          disabled={saving}
          className="w-full px-2.5 py-1.5 rounded-lg border text-[13px] outline-none"
          style={{ background: "#0d0d1a", borderColor: "#C96E2C66", color: "#f0ead8" }}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div
      className="group flex items-center justify-between mb-3 cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-white/5 transition-colors"
      onClick={() => setEditing(true)}
    >
      <div>
        <div className="text-[11px] font-medium" style={{ color: "#4b5563" }}>{label}</div>
        <div className="text-[13px]" style={{ color: value ? "#e8e4dc" : "#4b5563" }}>
          {value || placeholder || "—"}
        </div>
      </div>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Icon name="edit" size={12} style={{ color: "#6b7280" }} />
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CrmDetailPage({ params }: { params: { id: string } }) {
  const userId = params.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [weddings, setWeddings] = useState<WeddingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNoteType, setNewNoteType] = useState("admin_note");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteDesc, setNewNoteDesc] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Email modal state ──────────────────────────────────────────────────────
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("vide");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // ── Tasks state ────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState("task");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // ── Load all data ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const sb = createClient();

      // Profile
      const { data: profileData } = await sb
        .from("profiles")
        .select("id, first_name, last_name, email, phone, company, account_type, is_subscribed, plan, trial_ends_at, subscribed_at, created_at, crm_tags, crm_notes, pipeline_stage")
        .eq("id", userId)
        .maybeSingle();
      if (profileData) {
        setProfile(profileData as Profile);
        setNotesValue(profileData.crm_notes ?? "");
      }

      // CRM events
      const { data: crmData } = await sb
        .from("crm_events")
        .select("id, user_id, event_type, title, description, metadata, performed_by, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200);
      const crmItems: TimelineItem[] = (crmData ?? []).map((e: CrmEvent) => ({
        id: e.id,
        type: e.event_type,
        title: e.title,
        description: e.description ?? null,
        created_at: e.created_at,
        source: "crm" as const,
      }));

      // Analytics events
      const { data: analyticsData } = await sb
        .from("analytics_events")
        .select("id, user_id, event_name, path, metadata, created_at")
        .eq("user_id", userId)
        .in("event_name", ["signup_complete", "login", "email_opened", "email_link_clicked"])
        .order("created_at", { ascending: false })
        .limit(100);
      const analyticsItems: TimelineItem[] = (analyticsData ?? []).map((e: AnalyticsEvent) => analyticsToTimeline(e));

      // Merge and sort
      const merged = [...crmItems, ...analyticsItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTimeline(merged);

      // Weddings owned by user
      const { data: ownedWeddings } = await sb
        .from("wedding")
        .select("id, user_id, name, partner_a, partner_b, date, city, created_at")
        .eq("user_id", userId);

      const owned: WeddingRow[] = (ownedWeddings ?? []).map((w) => ({ ...(w as Omit<WeddingRow, "role">), role: "owner" }));

      // Weddings via access
      const ownedIds = owned.map((w) => w.id);
      const { data: accessData } = await sb
        .from("wedding_access")
        .select("wedding_id, role, accepted_at, wedding:wedding_id(id, user_id, name, partner_a, partner_b, date, city, created_at)")
        .eq("user_id", userId);

      const accessWeddings: WeddingRow[] = [];
      for (const row of accessData ?? []) {
        const acc = row as unknown as { wedding_id: number; role: string; wedding: Record<string, unknown> | null };
        if (!acc.wedding) continue;
        if (ownedIds.includes(acc.wedding_id)) continue;
        accessWeddings.push({
          id: acc.wedding_id,
          user_id: (acc.wedding.user_id as string) ?? "",
          name: (acc.wedding.name as string) ?? null,
          partner_a: (acc.wedding.partner_a as string) ?? null,
          partner_b: (acc.wedding.partner_b as string) ?? null,
          date: (acc.wedding.date as string) ?? null,
          city: (acc.wedding.city as string) ?? null,
          created_at: (acc.wedding.created_at as string) ?? "",
          role: acc.role,
        });
      }

      setWeddings([...owned, ...accessWeddings]);

      // Tasks
      const { data: tasksData } = await sb
        .from("crm_tasks")
        .select("id, title, description, task_type, due_date, priority, completed, created_at")
        .eq("user_id", userId)
        .order("completed")
        .order("due_date", { ascending: true });
      setTasks((tasksData ?? []) as CrmTask[]);

      setLoading(false);
    }
    load();
  }, [userId]);

  // ── Update profile field ───────────────────────────────────────────────────

  const updateProfile = useCallback(async (field: string, value: string) => {
    await createClient().from("profiles").update({ [field]: value }).eq("id", userId);
    setProfile((prev) => prev ? { ...prev, [field]: value } : prev);
  }, [userId]);

  // ── Update pipeline stage ──────────────────────────────────────────────────

  async function updatePipelineStage(stage: string) {
    await createClient().from("profiles").update({ pipeline_stage: stage }).eq("id", userId);
    setProfile((prev) => prev ? { ...prev, pipeline_stage: stage } : prev);
  }

  // ── Notes auto-save with debounce ─────────────────────────────────────────

  function handleNotesChange(val: string) {
    setNotesValue(val);
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(async () => {
      await createClient().from("profiles").update({ crm_notes: val }).eq("id", userId);
    }, 1000);
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  async function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || !profile) return;
    const current = profile.crm_tags ?? [];
    if (current.includes(trimmed)) return;
    const next = [...current, trimmed];
    await createClient().from("profiles").update({ crm_tags: next }).eq("id", userId);
    setProfile((prev) => prev ? { ...prev, crm_tags: next } : prev);
    setTagInput("");
    setShowTagInput(false);
  }

  async function removeTag(tag: string) {
    if (!profile) return;
    const next = (profile.crm_tags ?? []).filter((t) => t !== tag);
    await createClient().from("profiles").update({ crm_tags: next }).eq("id", userId);
    setProfile((prev) => prev ? { ...prev, crm_tags: next } : prev);
  }

  // ── Toggle subscription ───────────────────────────────────────────────────

  async function toggleSubscription() {
    if (!profile) return;
    const next = !profile.is_subscribed;
    await createClient().from("profiles").update({ is_subscribed: next }).eq("id", userId);
    setProfile((prev) => prev ? { ...prev, is_subscribed: next } : prev);
  }

  // ── Add timeline note ─────────────────────────────────────────────────────

  async function submitNote() {
    if (!newNoteTitle.trim()) return;
    setSavingNote(true);
    const { data: { user } } = await createClient().auth.getUser();
    const { data } = await createClient()
      .from("crm_events")
      .insert({
        user_id: userId,
        event_type: newNoteType,
        title: newNoteTitle.trim(),
        description: newNoteDesc.trim() || null,
        performed_by: user?.id ?? null,
      })
      .select("id, user_id, event_type, title, description, metadata, performed_by, created_at")
      .single();
    if (data) {
      const newItem: TimelineItem = {
        id: (data as CrmEvent).id,
        type: (data as CrmEvent).event_type,
        title: (data as CrmEvent).title,
        description: (data as CrmEvent).description ?? null,
        created_at: (data as CrmEvent).created_at,
        source: "crm",
      };
      setTimeline((prev) => [newItem, ...prev]);
    }
    setNewNoteTitle("");
    setNewNoteDesc("");
    setNewNoteType("admin_note");
    setShowNoteForm(false);
    setSavingNote(false);
  }

  // ── Send email ─────────────────────────────────────────────────────────────

  function handleTemplateChange(templateValue: string) {
    setEmailTemplate(templateValue);
    if (!profile) return;
    const templates = getEmailTemplates(profile.first_name);
    const tpl = templates.find((t) => t.value === templateValue);
    if (tpl) {
      setEmailSubject(tpl.subject);
      setEmailBody(tpl.body);
    }
  }

  async function sendEmail() {
    if (!emailSubject.trim() || !emailBody.trim() || !profile?.email) return;
    setSendingEmail(true);
    try {
      const res = await fetch("/api/admin/send-crm-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_email: profile.email,
          to_name: fullName,
          to_user_id: userId,
          subject: emailSubject,
          body_html: emailBody,
        }),
      });
      if (res.ok) {
        setEmailSent(true);
        // Add event to timeline
        const newEvent: TimelineItem = {
          id: `email-${Date.now()}`,
          type: "email_sent",
          title: `Email envoyé : ${emailSubject}`,
          description: null,
          created_at: new Date().toISOString(),
          source: "crm",
        };
        setTimeline((prev) => [newEvent, ...prev]);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSent(false);
          setEmailSubject("");
          setEmailBody("");
          setEmailTemplate("vide");
        }, 2000);
      }
    } finally {
      setSendingEmail(false);
    }
  }

  function openEmailModal() {
    setEmailSubject("");
    setEmailBody("");
    setEmailTemplate("vide");
    setEmailSent(false);
    setShowEmailModal(true);
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────

  async function toggleTask(task: CrmTask) {
    const next = !task.completed;
    await createClient()
      .from("crm_tasks")
      .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
      .eq("id", task.id);
    setTasks((prev) =>
      prev.map((t) => t.id === task.id ? { ...t, completed: next } : t)
    );
  }

  async function deleteTask(taskId: string) {
    await createClient().from("crm_tasks").delete().eq("id", taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function createTask() {
    if (!newTaskTitle.trim()) return;
    const { data } = await createClient()
      .from("crm_tasks")
      .insert({
        user_id: userId,
        title: newTaskTitle.trim(),
        task_type: newTaskType,
        due_date: newTaskDue || null,
        priority: newTaskPriority,
      })
      .select("id, title, description, task_type, due_date, priority, completed, created_at")
      .single();
    if (data) {
      setTasks((prev) => [data as CrmTask, ...prev]);
    }
    setNewTaskTitle("");
    setNewTaskType("task");
    setNewTaskDue("");
    setNewTaskPriority("medium");
    setShowAddTask(false);
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const accountBadge = ACCOUNT_BADGE[profile?.account_type ?? "couple"] ?? { label: profile?.account_type ?? "", bg: "#33333344", color: "#9ca3af" };

  const statusBadge = profile?.is_subscribed
    ? STATUS_BADGE.subscribed
    : profile?.trial_ends_at && new Date(profile.trial_ends_at).getTime() > Date.now()
      ? STATUS_BADGE.trial
      : STATUS_BADGE.free;

  const filteredTimeline = timeline.filter((item) => matchesFilter(item, timelineFilter));

  // Group by month
  const grouped: Array<{ month: string; items: TimelineItem[] }> = [];
  for (const item of filteredTimeline) {
    const month = formatMonthGroup(item.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.month === month) {
      last.items.push(item);
    } else {
      grouped.push({ month, items: [item] });
    }
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Utilisateur";
  const phone = profile?.phone ?? "";
  const hasPhone = phone.trim().length > 0;

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const visibleCompletedTasks = showCompletedTasks ? completedTasks : completedTasks.slice(0, 5);

  const currentPipelineStage = PIPELINE_STAGES.find((s) => s.value === profile?.pipeline_stage);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d1a" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: "#6b7280" }}>Chargement du profil…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d1a" }}>
        <div className="text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: "#f0ead8" }}>Utilisateur introuvable</p>
          <Link href="/admin/users" className="text-sm" style={{ color: "#C96E2C" }}>← Retour à la liste</Link>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "#0d0d1a", color: "#f0ead8" }}>

      {/* ── Email compose modal ──────────────────────────────────────── */}
      {showEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#0d0d1acc" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEmailModal(false); }}
        >
          <div
            className="w-full rounded-2xl border overflow-hidden flex flex-col"
            style={{ maxWidth: 700, background: "#1a1a2e", borderColor: "#2a2a3e", maxHeight: "90vh" }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: "#2a2a3e" }}
            >
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: "#f0ead8" }}>
                  Envoyer un email à {fullName}
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: "#6b7280" }}>
                  {profile.email ?? "Aucun email"}
                </p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                style={{ background: "#2a2a3e", color: "#9ca3af" }}
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {emailSent ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "#16562233" }}
                  >
                    <Icon name="check-circle" size={28} style={{ color: "#4ade80" }} />
                  </div>
                  <p className="text-[15px] font-semibold" style={{ color: "#4ade80" }}>Email envoyé !</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Template picker */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#4b5563" }}>
                      Modèle
                    </label>
                    <select
                      value={emailTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none appearance-none"
                      style={{ background: "#0d0d1a", borderColor: "#2a2a3e", color: "#e8e4dc" }}
                    >
                      {getEmailTemplates(profile.first_name).map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#4b5563" }}>
                      Objet
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Objet de l'email…"
                      className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                      style={{ background: "#0d0d1a", borderColor: "#2a2a3e", color: "#e8e4dc" }}
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#4b5563" }}>
                      Corps du message (HTML autorisé)
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={10}
                      placeholder="<p>Bonjour,</p><p>…</p>"
                      className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none resize-none leading-relaxed font-mono"
                      style={{ background: "#0d0d1a", borderColor: "#2a2a3e", color: "#e8e4dc" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            {!emailSent && (
              <div
                className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0"
                style={{ borderColor: "#2a2a3e" }}
              >
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium border transition-colors hover:opacity-80"
                  style={{ background: "transparent", borderColor: "#2a2a3e", color: "#9ca3af" }}
                >
                  Annuler
                </button>
                <button
                  onClick={sendEmail}
                  disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim() || !profile.email}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
                  style={{ background: "#C96E2C", color: "#fffaf2" }}
                >
                  {sendingEmail ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    <>
                      <Icon name="mail" size={14} />
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Top header bar ────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4 px-6 py-4 border-b sticky top-0 z-20"
        style={{ background: "#0d0d1a", borderColor: "#2a2a3e" }}
      >
        <Link
          href="/admin/users"
          className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
          style={{ color: "#9ca3af" }}
        >
          <Icon name="chevronL" size={15} />
          CRM
        </Link>
        <span style={{ color: "#2a2a3e" }}>/</span>
        <span className="font-semibold text-[15px]" style={{ color: "#f0ead8" }}>{fullName}</span>
        <span
          className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: accountBadge.bg, color: accountBadge.color }}
        >
          {accountBadge.label}
        </span>
        <span
          className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: statusBadge.bg, color: statusBadge.color }}
        >
          {statusBadge.label}
        </span>
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Email button */}
          <button
            onClick={openEmailModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors hover:opacity-80"
            style={{ background: "#C96E2C22", border: "1px solid #C96E2C44", color: "#e2945a" }}
          >
            <Icon name="mail" size={14} />
            Envoyer un email
          </button>

          {/* WhatsApp button */}
          {hasPhone ? (
            <a
              href={`https://wa.me/${phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors hover:opacity-80"
              style={{ background: "#16562222", border: "1px solid #4ade8033", color: "#4ade80" }}
            >
              <Icon name="message" size={14} />
              WhatsApp
            </a>
          ) : (
            <button
              disabled
              title="Aucun téléphone"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium opacity-40 cursor-not-allowed"
              style={{ background: "#16562222", border: "1px solid #4ade8033", color: "#4ade80" }}
            >
              <Icon name="message" size={14} />
              WhatsApp
            </button>
          )}

          {/* SMS button */}
          {hasPhone ? (
            <a
              href={`sms:${phone}`}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors hover:opacity-80"
              style={{ background: "#1e3a5f33", border: "1px solid #60a5fa33", color: "#60a5fa" }}
            >
              <Icon name="phone" size={14} />
              SMS
            </a>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium opacity-40 cursor-not-allowed"
              style={{ background: "#1e3a5f33", border: "1px solid #60a5fa33", color: "#60a5fa" }}
            >
              <Icon name="phone" size={14} />
              SMS
            </button>
          )}
        </div>
      </div>

      {/* ── 3-column layout ───────────────────────────────────────────── */}
      <div className="flex gap-0 h-[calc(100vh-61px)] overflow-hidden">

        {/* ══ LEFT — Fiche client (24%) ══════════════════════════════════ */}
        <aside
          className="w-[24%] flex-shrink-0 border-r overflow-y-auto"
          style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
        >
          <div className="p-5">

            {/* Avatar */}
            <div className="flex flex-col items-center mb-5 pt-2">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-3"
                style={{ background: avatarColor(profile.id) + "33", color: avatarColor(profile.id), border: `2px solid ${avatarColor(profile.id)}66` }}
              >
                {getInitials(profile.first_name, profile.last_name)}
              </div>
              <div className="text-base font-bold text-center" style={{ color: "#f0ead8" }}>{fullName}</div>
              <div className="text-[12px] mt-0.5" style={{ color: "#6b7280" }}>{profile.email ?? "—"}</div>
            </div>

            {/* Editable fields */}
            <div className="mb-4">
              <InlineField label="Prénom" value={profile.first_name ?? ""} field="first_name" onSave={updateProfile} placeholder="Prénom" />
              <InlineField label="Nom" value={profile.last_name ?? ""} field="last_name" onSave={updateProfile} placeholder="Nom" />
              <InlineField label="Email" value={profile.email ?? ""} field="email" onSave={updateProfile} placeholder="email@exemple.com" type="email" />
              <InlineField label="Téléphone" value={profile.phone ?? ""} field="phone" onSave={updateProfile} placeholder="+33 6 00 00 00 00" type="tel" />
              <InlineField label="Société" value={profile.company ?? ""} field="company" onSave={updateProfile} placeholder="Nom de la société" />
            </div>

            {/* ── Pipeline ── */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#4b5563" }}>
                Pipeline
              </div>
              <div className="relative">
                <select
                  value={profile.pipeline_stage ?? ""}
                  onChange={(e) => updatePipelineStage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none appearance-none font-semibold pr-8"
                  style={{
                    background: "#0d0d1a",
                    borderColor: currentPipelineStage ? currentPipelineStage.color + "55" : "#2a2a3e",
                    color: currentPipelineStage ? currentPipelineStage.color : "#6b7280",
                  }}
                >
                  <option value="" style={{ color: "#6b7280" }}>— Choisir un stade —</option>
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.value} value={s.value} style={{ color: s.color }}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Icon name="chevronD" size={12} style={{ color: currentPipelineStage?.color ?? "#6b7280" }} />
                </div>
                {currentPipelineStage && (
                  <div
                    className="mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold inline-block"
                    style={{ background: currentPipelineStage.color + "22", color: currentPipelineStage.color }}
                  >
                    {currentPipelineStage.label}
                  </div>
                )}
              </div>
            </div>

            {/* ── Abonnement ── */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#4b5563" }}>
                Abonnement
              </div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[13px]" style={{ color: "#9ca3af" }}>Statut</span>
                <button
                  onClick={toggleSubscription}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors"
                  style={{
                    background: profile.is_subscribed ? "#16562233" : "#33333344",
                    color: profile.is_subscribed ? "#4ade80" : "#9ca3af",
                    border: `1px solid ${profile.is_subscribed ? "#4ade8033" : "#2a2a3e"}`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: profile.is_subscribed ? "#4ade80" : "#6b7280" }} />
                  {profile.is_subscribed ? "Abonné" : "Non abonné"}
                </button>
              </div>
              {profile.plan && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px]" style={{ color: "#9ca3af" }}>Plan</span>
                  <span className="text-[12px] font-medium capitalize" style={{ color: "#e8e4dc" }}>{profile.plan}</span>
                </div>
              )}
              {profile.trial_ends_at && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px]" style={{ color: "#9ca3af" }}>Essai</span>
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: trialDaysLeft(profile.trial_ends_at) === "Expiré" ? "#f87171" : "#60a5fa" }}
                  >
                    {trialDaysLeft(profile.trial_ends_at)}
                  </span>
                </div>
              )}
            </div>

            {/* ── Infos ── */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#4b5563" }}>
                Infos
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]" style={{ color: "#9ca3af" }}>Inscrit le</span>
                <span className="text-[12px]" style={{ color: "#e8e4dc" }}>{formatDate(profile.created_at)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]" style={{ color: "#9ca3af" }}>Abonné le</span>
                <span className="text-[12px]" style={{ color: "#e8e4dc" }}>
                  {profile.subscribed_at ? formatDate(profile.subscribed_at) : "—"}
                </span>
              </div>
            </div>

            {/* ── Tags ── */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#4b5563" }}>
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(profile.crm_tags ?? []).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="group flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors hover:opacity-70"
                    style={{ background: "#C96E2C22", color: "#e2945a", border: "1px solid #C96E2C33" }}
                    title="Cliquer pour supprimer"
                  >
                    {tag}
                    <Icon name="x" size={10} className="opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
                {showTagInput ? (
                  <input
                    ref={tagInputRef}
                    autoFocus
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTag(tagInput);
                      if (e.key === "Escape") { setShowTagInput(false); setTagInput(""); }
                    }}
                    onBlur={() => { if (tagInput.trim()) addTag(tagInput); else { setShowTagInput(false); setTagInput(""); } }}
                    placeholder="Nouveau tag…"
                    className="px-2 py-0.5 rounded-full text-[11px] border outline-none w-24"
                    style={{ background: "#0d0d1a", borderColor: "#C96E2C66", color: "#f0ead8" }}
                  />
                ) : (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] transition-colors hover:opacity-80"
                    style={{ background: "#22223a", color: "#6b7280", border: "1px solid #2a2a3e" }}
                  >
                    <Icon name="plus" size={10} />
                    ajouter
                  </button>
                )}
              </div>
            </div>

            {/* ── Notes ── */}
            <div className="mb-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#4b5563" }}>
                Notes internes
              </div>
              <textarea
                value={notesValue}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={5}
                placeholder="Notes internes (sauvegarde automatique…)"
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] resize-none outline-none leading-relaxed transition-colors"
                style={{
                  background: "#0d0d1a",
                  borderColor: "#2a2a3e",
                  color: "#e8e4dc",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#C96E2C66"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2a3e"; }}
              />
              <p className="text-[10px] mt-1" style={{ color: "#4b5563" }}>Sauvegarde automatique après 1 s</p>
            </div>

          </div>
        </aside>

        {/* ══ CENTER — Timeline (46%) ══════════════════════════════════════ */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "#0d0d1a" }}
        >
          <div className="px-6 py-5">

            {/* Section title */}
            <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: "#4b5563" }}>
              Timeline
            </h2>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {TIMELINE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTimelineFilter(f.id)}
                  className="px-3 py-1 rounded-full text-[12px] font-medium transition-colors"
                  style={{
                    background: timelineFilter === f.id ? "#C96E2C22" : "#1a1a2e",
                    color: timelineFilter === f.id ? "#e2945a" : "#6b7280",
                    border: timelineFilter === f.id ? "1px solid #C96E2C44" : "1px solid #2a2a3e",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Add note button */}
            <div className="mb-5">
              <button
                onClick={() => setShowNoteForm((p) => !p)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium border transition-colors hover:opacity-80"
                style={{
                  background: showNoteForm ? "#C96E2C22" : "#1a1a2e",
                  borderColor: showNoteForm ? "#C96E2C44" : "#2a2a3e",
                  color: showNoteForm ? "#e2945a" : "#9ca3af",
                }}
              >
                <Icon name="plus" size={14} />
                Ajouter une note
                <Icon name={showNoteForm ? "chevronU" : "chevronD"} size={13} />
              </button>

              {showNoteForm && (
                <div
                  className="mt-2 p-4 rounded-xl border"
                  style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
                >
                  <div className="mb-3">
                    <label className="text-[11px] font-medium mb-1 block" style={{ color: "#6b7280" }}>Type</label>
                    <select
                      value={newNoteType}
                      onChange={(e) => setNewNoteType(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border text-[13px] outline-none appearance-none"
                      style={{ background: "#0d0d1a", borderColor: "#2a2a3e", color: "#e8e4dc" }}
                    >
                      <option value="admin_note">Note admin</option>
                      <option value="email_sent">Email envoyé</option>
                      <option value="profile_updated">Profil mis à jour</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="text-[11px] font-medium mb-1 block" style={{ color: "#6b7280" }}>Titre</label>
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder="Titre de l'événement…"
                      className="w-full px-3 py-1.5 rounded-lg border text-[13px] outline-none"
                      style={{ background: "#0d0d1a", borderColor: "#2a2a3e", color: "#e8e4dc" }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="text-[11px] font-medium mb-1 block" style={{ color: "#6b7280" }}>Description</label>
                    <textarea
                      value={newNoteDesc}
                      onChange={(e) => setNewNoteDesc(e.target.value)}
                      rows={3}
                      placeholder="Description optionnelle…"
                      className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none resize-none"
                      style={{ background: "#0d0d1a", borderColor: "#2a2a3e", color: "#e8e4dc" }}
                    />
                  </div>
                  <button
                    onClick={submitNote}
                    disabled={savingNote || !newNoteTitle.trim()}
                    className="px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
                    style={{ background: "#C96E2C", color: "#fffaf2" }}
                  >
                    {savingNote ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              )}
            </div>

            {/* Timeline entries */}
            {filteredTimeline.length === 0 ? (
              <div className="text-center py-16 text-[13px]" style={{ color: "#4b5563" }}>
                Aucun événement pour ce filtre
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div
                  className="absolute left-[11px] top-0 bottom-0 w-px"
                  style={{ background: "#2a2a3e" }}
                />

                {grouped.map(({ month, items }) => (
                  <div key={month} className="mb-6">
                    {/* Month separator */}
                    <div className="flex items-center gap-3 mb-4 ml-8">
                      <div
                        className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                        style={{ background: "#1a1a2e", color: "#6b7280", border: "1px solid #2a2a3e" }}
                      >
                        {month}
                      </div>
                    </div>

                    {items.map((item) => {
                      const meta = EVENT_ICON[item.type] ?? EVENT_ICON.login;
                      return (
                        <div key={item.id} className="flex gap-4 mb-4 relative">
                          {/* Icon dot */}
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                            style={{ background: meta.color + "22", border: `1.5px solid ${meta.color}55` }}
                          >
                            <Icon name={meta.icon} size={11} style={{ color: meta.color }} />
                          </div>

                          {/* Content */}
                          <div
                            className="flex-1 rounded-xl px-4 py-3 border mb-1"
                            style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[13px] font-semibold leading-snug" style={{ color: "#f0ead8" }}>
                                {item.title}
                              </span>
                              <span className="text-[11px] shrink-0 mt-0.5" style={{ color: "#4b5563" }}>
                                {relativeTime(item.created_at)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "#9ca3af" }}>
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                style={{ background: meta.color + "18", color: meta.color }}
                              >
                                {item.type.replace(/_/g, " ")}
                              </span>
                              {item.source === "analytics" && (
                                <span className="text-[10px]" style={{ color: "#4b5563" }}>analytics</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ══ RIGHT — Tasks + Mariages (30%) ════════════════════════════════ */}
        <aside
          className="w-[30%] flex-shrink-0 border-l overflow-y-auto"
          style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
        >
          <div className="p-5">

            {/* ── Tâches ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "#4b5563" }}>
                  Tâches
                  <span
                    className="ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full normal-case tracking-normal"
                    style={{ background: "#C96E2C22", color: "#e2945a" }}
                  >
                    {incompleteTasks.length}
                  </span>
                </h2>
                <button
                  onClick={() => setShowAddTask((p) => !p)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium border transition-colors hover:opacity-80"
                  style={{
                    background: showAddTask ? "#C96E2C22" : "transparent",
                    borderColor: showAddTask ? "#C96E2C44" : "#2a2a3e",
                    color: showAddTask ? "#e2945a" : "#6b7280",
                  }}
                >
                  <Icon name="plus" size={12} />
                  Nouvelle
                </button>
              </div>

              {/* Add task form */}
              {showAddTask && (
                <div
                  className="mb-3 p-3 rounded-xl border"
                  style={{ background: "#0d0d1a", borderColor: "#2a2a3e" }}
                >
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createTask(); if (e.key === "Escape") setShowAddTask(false); }}
                    placeholder="Titre de la tâche…"
                    className="w-full px-3 py-1.5 rounded-lg border text-[13px] outline-none mb-2"
                    style={{ background: "#1a1a2e", borderColor: "#2a2a3e", color: "#e8e4dc" }}
                    autoFocus
                  />
                  <div className="flex gap-2 mb-2">
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border text-[12px] outline-none appearance-none"
                      style={{ background: "#1a1a2e", borderColor: "#2a2a3e", color: "#e8e4dc" }}
                    >
                      <option value="task">Tâche</option>
                      <option value="call">Appel</option>
                      <option value="email">Email</option>
                      <option value="meeting">Réunion</option>
                      <option value="follow_up">Suivi</option>
                    </select>
                    <input
                      type="date"
                      value={newTaskDue}
                      onChange={(e) => setNewTaskDue(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border text-[12px] outline-none"
                      style={{ background: "#1a1a2e", borderColor: "#2a2a3e", color: "#e8e4dc" }}
                    />
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border text-[12px] outline-none appearance-none"
                      style={{ background: "#1a1a2e", borderColor: "#2a2a3e", color: "#e8e4dc" }}
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createTask}
                      disabled={!newTaskTitle.trim()}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50"
                      style={{ background: "#C96E2C", color: "#fffaf2" }}
                    >
                      Créer
                    </button>
                    <button
                      onClick={() => setShowAddTask(false)}
                      className="px-3 py-1.5 rounded-lg text-[12px] border transition-colors hover:opacity-80"
                      style={{ background: "transparent", borderColor: "#2a2a3e", color: "#6b7280" }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Incomplete tasks */}
              {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
                <div
                  className="rounded-xl border px-4 py-8 text-center"
                  style={{ borderColor: "#2a2a3e", borderStyle: "dashed" }}
                >
                  <Icon name="check-circle" size={24} style={{ color: "#2a2a3e", margin: "0 auto 8px" }} />
                  <p className="text-[12px]" style={{ color: "#4b5563" }}>Aucune tâche</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {incompleteTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors hover:border-opacity-60"
                      style={{ background: "#0d0d1a", borderColor: "#2a2a3e" }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTask(task)}
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors hover:opacity-80"
                        style={{ borderColor: PRIORITY_COLOR[task.priority] ?? "#6b7280", background: "transparent" }}
                      />
                      {/* Icon */}
                      <Icon
                        name={TASK_TYPE_ICON[task.task_type] ?? "check-circle"}
                        size={12}
                        style={{ color: PRIORITY_COLOR[task.priority] ?? "#6b7280", flexShrink: 0 }}
                      />
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium truncate" style={{ color: "#e8e4dc" }}>
                          {task.title}
                        </div>
                        {task.due_date && (
                          <div className="text-[10px]" style={{ color: "#6b7280" }}>
                            {formatDate(task.due_date)}
                          </div>
                        )}
                      </div>
                      {/* Delete on hover */}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{ color: "#ef4444" }}
                      >
                        <Icon name="x" size={11} />
                      </button>
                    </div>
                  ))}

                  {/* Completed tasks */}
                  {completedTasks.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowCompletedTasks((p) => !p)}
                        className="flex items-center gap-1.5 text-[11px] mb-1.5 transition-colors hover:opacity-80"
                        style={{ color: "#4b5563" }}
                      >
                        <Icon name={showCompletedTasks ? "chevronU" : "chevronD"} size={10} />
                        {completedTasks.length} terminée{completedTasks.length > 1 ? "s" : ""}
                      </button>
                      <div className="flex flex-col gap-1">
                        {visibleCompletedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border opacity-50 transition-opacity hover:opacity-70"
                            style={{ background: "#0d0d1a", borderColor: "#2a2a3e" }}
                          >
                            {/* Checkbox (filled) */}
                            <button
                              onClick={() => toggleTask(task)}
                              className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-colors"
                              style={{ background: "#4b5563", border: "2px solid #4b5563" }}
                            >
                              <Icon name="check-circle" size={8} style={{ color: "#0d0d1a" }} />
                            </button>
                            <Icon
                              name={TASK_TYPE_ICON[task.task_type] ?? "check-circle"}
                              size={12}
                              style={{ color: "#4b5563", flexShrink: 0 }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] line-through truncate" style={{ color: "#6b7280" }}>
                                {task.title}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                              style={{ color: "#ef4444" }}
                            >
                              <Icon name="x" size={11} />
                            </button>
                          </div>
                        ))}
                        {!showCompletedTasks && completedTasks.length > 5 && (
                          <button
                            onClick={() => setShowCompletedTasks(true)}
                            className="text-[11px] text-center py-1 transition-colors hover:opacity-80"
                            style={{ color: "#4b5563" }}
                          >
                            Voir {completedTasks.length - 5} de plus…
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Mariages liés ── */}
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: "#4b5563" }}>
                Mariages liés
                <span
                  className="ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full normal-case tracking-normal"
                  style={{ background: "#C96E2C22", color: "#e2945a" }}
                >
                  {weddings.length}
                </span>
              </h2>

              {weddings.length === 0 ? (
                <div
                  className="rounded-xl border px-5 py-10 text-center"
                  style={{ borderColor: "#2a2a3e", borderStyle: "dashed" }}
                >
                  <Icon name="rings" size={28} style={{ color: "#2a2a3e", margin: "0 auto 10px" }} />
                  <p className="text-[13px]" style={{ color: "#4b5563" }}>Aucun mariage associé</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {weddings.map((w) => {
                    const pNames = [w.partner_a, w.partner_b].filter(Boolean).join(" & ") || w.name || "Sans nom";
                    const roleStyle = ROLE_COLOR[w.role] ?? { bg: "#33333344", color: "#9ca3af" };
                    const roleLabel = ROLE_LABEL[w.role] ?? w.role;

                    return (
                      <div
                        key={w.id}
                        className="rounded-xl border p-4 transition-colors"
                        style={{ background: "#0d0d1a", borderColor: "#2a2a3e" }}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="text-[14px] font-semibold leading-snug" style={{ color: "#f0ead8" }}>
                              {pNames}
                            </div>
                            {w.name && w.name !== pNames && (
                              <div className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>{w.name}</div>
                            )}
                          </div>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: roleStyle.bg, color: roleStyle.color }}
                          >
                            {roleLabel}
                          </span>
                        </div>

                        {/* Date + city */}
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          {w.date && (
                            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#9ca3af" }}>
                              <Icon name="calendar" size={12} />
                              {formatDate(w.date)}
                            </div>
                          )}
                          {w.city && (
                            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#9ca3af" }}>
                              <Icon name="pin" size={12} />
                              {w.city}
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px]" style={{ color: "#4b5563" }}>
                            #{w.id}
                          </span>
                          <Link
                            href={`/dashboard`}
                            className="flex items-center gap-1 text-[12px] font-medium transition-colors hover:opacity-80"
                            style={{ color: "#C96E2C" }}
                          >
                            Voir
                            <Icon name="chevronR" size={12} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
}

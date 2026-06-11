import { createClient } from "./supabase";
import type { AppState, Guest, Vendor, Payment, DateCandidate, Profile, WeddingSummary, WeddingRole, AccountType, JournalEntry } from "./types";

// ID du mariage actif (persisté en localStorage côté client)
let currentWeddingId: number | null = null;
export const getWeddingId = () => currentWeddingId;

export function setActiveWedding(id: number) {
  currentWeddingId = id;
  if (typeof window !== "undefined") localStorage.setItem("jj_active_wedding", String(id));
}

// ── Mappers Guest ────────────────────────────────────────────
function guestToDb(g: Guest) {
  return { id: g.id, name: g.name, side: g.side, rsvp: g.rsvp, diet: g.diet, table_id: g.table, lodging: g.lodging, child: g.child, transport: g.transport, gift: g.gift, group_name: g.group, note: g.note };
}
function guestFromDb(r: Record<string, any>): Guest {
  return { id: r.id, name: r.name, side: r.side, rsvp: r.rsvp, diet: r.diet, table: r.table_id, lodging: r.lodging, child: r.child, transport: r.transport, gift: r.gift, group: r.group_name, note: r.note, rsvpToken: r.rsvp_token ?? undefined };
}

// ── Mappers Vendor ───────────────────────────────────────────
function vendorToDb(v: Vendor) {
  return { id: v.id, cat: v.cat, name: v.name, total: v.total, status: v.status, score: v.score, scores: v.scores, included: v.included, contact: v.contact, phone: v.phone, email: v.email, last_contact: v.lastContact, docs: v.docs };
}
function vendorFromDb(r: Record<string, any>): Vendor {
  return { id: r.id, cat: r.cat, name: r.name, total: r.total, status: r.status, score: r.score, scores: r.scores, included: r.included, contact: r.contact, phone: r.phone, email: r.email, lastContact: r.last_contact, docs: r.docs };
}

// ── Mappers Payment ──────────────────────────────────────────
function paymentToDb(p: Payment) {
  return { id: p.id, vendor: p.vendor, label: p.label, amount: p.amount, due: p.due, paid_date: p.paidDate, who: p.who, method: p.method, status: p.status, receipt: p.receipt };
}
function paymentFromDb(r: Record<string, any>): Payment {
  return { id: r.id, vendor: r.vendor, label: r.label, amount: r.amount, due: r.due, paidDate: r.paid_date, who: r.who, method: r.method, status: r.status, receipt: r.receipt };
}

// ── Mappers DateCandidate ────────────────────────────────────
function dateCandidateToDb(d: DateCandidate) {
  return { id: d.id, date: d.date, weather: d.weather, sun: d.sun, rain: d.rain, temp: d.temp, holidays: d.holidays, long_weekend: d.longWeekend, availability: d.availability, best: d.best, city: d.city, lat: d.lat, lon: d.lon };
}
function dateCandidateFromDb(r: Record<string, any>): DateCandidate {
  return { id: r.id, date: r.date, weather: r.weather, sun: r.sun, rain: r.rain, temp: r.temp, holidays: r.holidays, longWeekend: r.long_weekend, availability: r.availability, best: r.best, city: r.city ?? "", lat: r.lat ?? null, lon: r.lon ?? null };
}

// ── Sync helper ──────────────────────────────────────────────
async function syncArray<T extends { id: string | number }>(
  table: string,
  newItems: T[],
  prevItems: T[],
  toDb: (x: T) => Record<string, unknown>
) {
  const c = createClient();
  const wId = currentWeddingId;
  const prevIds = new Set(prevItems.map((x) => x.id));
  const newIds  = new Set(newItems.map((x) => x.id));
  const removed = [...prevIds].filter((id) => !newIds.has(id));
  if (removed.length) await c.from(table).delete().in("id", removed);
  if (newItems.length) {
    await c.from(table).upsert(
      newItems.map((x) => ({ ...toDb(x), wedding_id: wId })) as any
    );
  }
}

// ── Chargement du profil utilisateur ────────────────────────
export async function loadProfile(): Promise<Profile | null> {
  const c = createClient();
  const { data: { user } } = await c.auth.getUser();
  if (!user) return null;

  const { data } = await c.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data) {
    // Profil pas encore créé (ancien compte) — on le crée à la volée
    const meta = user.user_metadata ?? {};
    const full = meta.full_name ?? "";
    const firstName = meta.first_name ?? (full.split(" ")[0] || "");
    const lastName  = meta.last_name  ?? (full.split(" ").slice(1).join(" ") || "");
    await c.from("profiles").insert({ id: user.id, first_name: firstName, last_name: lastName, avatar_url: meta.avatar_url ?? null, account_type: "couple" });
    return { id: user.id, firstName, lastName, avatarUrl: meta.avatar_url ?? null, accountType: "couple" };
  }
  return {
    id: data.id,
    firstName:   data.first_name   ?? "",
    lastName:    data.last_name    ?? "",
    avatarUrl:   data.avatar_url   ?? null,
    accountType: data.account_type as AccountType,
  };
}

// ── Chargement de tous les mariages accessibles ──────────────
export async function loadMyWeddings(): Promise<WeddingSummary[]> {
  const c = createClient();
  const { data: { user } } = await c.auth.getUser();
  if (!user) return [];

  const COLS = "id, name, partner_a, partner_b, date, city, cover_color";

  const [{ data: owned }, { data: sharedRaw }] = await Promise.all([
    c.from("wedding").select(COLS).eq("user_id", user.id).order("id"),
    c.from("wedding_access")
      .select(`role, wedding:wedding_id(${COLS})`)
      .eq("user_id", user.id)
      .not("accepted_at", "is", null),
  ]);

  const toSummary = (w: Record<string, any>, role: WeddingRole): WeddingSummary => ({
    id:          w.id,
    name:        w.name ?? null,
    partnerA:    w.partner_a,
    partnerB:    w.partner_b,
    date:        w.date,
    city:        w.city,
    role,
    coverColor:  w.cover_color ?? "#C96E2C",
  });

  const ownedList = (owned ?? []).map((w) => toSummary(w, "owner"));
  const sharedList = (sharedRaw ?? [])
    .filter((s) => s.wedding)
    .map((s) => toSummary(s.wedding as Record<string, any>, s.role as WeddingRole));

  return [...ownedList, ...sharedList];
}

// ── Chargement initial depuis Supabase ───────────────────────
export async function loadAll(weddingId?: number): Promise<Partial<AppState> | null> {
  const c = createClient();
  const { data: { user } } = await c.auth.getUser();
  if (!user) return null;

  // Résolution du mariage actif
  let targetId = weddingId ?? currentWeddingId;
  if (!targetId && typeof window !== "undefined") {
    const stored = localStorage.getItem("jj_active_wedding");
    if (stored) targetId = parseInt(stored, 10);
  }

  let w: Record<string, any> | null = null;
  if (targetId) {
    const { data } = await c.from("wedding").select("*").eq("id", targetId).maybeSingle();
    w = data;
  }
  if (!w) {
    // Repli sur le premier mariage de l'utilisateur
    const { data } = await c.from("wedding").select("*").eq("user_id", user.id).order("id").limit(1).maybeSingle();
    w = data;
  }
  if (!w) return null; // aucun mariage → onboarding

  currentWeddingId = w.id;
  if (typeof window !== "undefined") localStorage.setItem("jj_active_wedding", String(w.id));

  const wId = w.id;
  const [
    { data: guests },
    { data: tables },
    { data: vendors },
    { data: vendorCats },
    { data: budget },
    { data: contributions },
    { data: payments },
    { data: tasks },
    { data: checklistCats },
    { data: dayJ },
    { data: dateCandidates },
    { data: holidays },
    { data: weatherByMonth },
    { data: members },
    { data: notifications },
  ] = await Promise.all([
    c.from("guests").select("*").eq("wedding_id", wId),
    c.from("seating_tables").select("*").eq("wedding_id", wId),
    c.from("vendors").select("*").eq("wedding_id", wId),
    c.from("vendor_cats").select("*"),
    c.from("budget_posts").select("*").eq("wedding_id", wId),
    c.from("contributions").select("*").eq("wedding_id", wId),
    c.from("payments").select("*").eq("wedding_id", wId),
    c.from("tasks").select("*").eq("wedding_id", wId),
    c.from("checklist_cats").select("*"),
    c.from("day_j").select("*").eq("wedding_id", wId),
    c.from("date_candidates").select("*").eq("wedding_id", wId),
    c.from("holidays").select("*"),
    c.from("weather_by_month").select("*"),
    c.from("members").select("*").eq("wedding_id", wId),
    c.from("notifications").select("*").eq("wedding_id", wId),
  ]);

  const [myWeddings, profile] = await Promise.all([loadMyWeddings(), loadProfile()]);

  return {
    wedding:      { partnerA: w.partner_a, partnerB: w.partner_b, date: w.date, venue: w.venue, city: w.city, theme: w.theme, guestTarget: w.guest_target },
    guests:       (guests ?? []).map(guestFromDb),
    tables:       tables ?? [],
    vendors:      (vendors ?? []).map(vendorFromDb),
    vendorCats:   vendorCats ?? [],
    budget:       budget ?? [],
    budgetTotal:  w.budget_total,
    contributions: contributions ?? [],
    payments:     (payments ?? []).map(paymentFromDb),
    tasks:        (tasks ?? []).map((t) => ({ ...t, subs: typeof t.subs === "string" ? JSON.parse(t.subs) : (t.subs ?? []) })),
    checklistCats: checklistCats ?? [],
    dayJ:         dayJ ?? [],
    dateCandidates: (dateCandidates ?? []).map(dateCandidateFromDb),
    holidays:     holidays ?? [],
    weatherByMonth: Array.isArray(w.weather_json) ? w.weather_json : (weatherByMonth ?? []),
    weatherCity:  (w.weather_city as string) || (w.city as string) || "",
    members:      members ?? [],
    notifications: notifications ?? [],
    selectedDate:  w.selected_date,
    activeWeddingId: w.id,
    myWeddings,
    profile,
  };
}

// ── Sync d'une clé de l'état vers Supabase ───────────────────
export async function syncKey(key: keyof AppState, newVal: any, prevVal: any) {
  const c = createClient();
  const wId = currentWeddingId;
  switch (key) {
    case "guests":          return syncArray("guests", newVal, prevVal, guestToDb);
    case "tables":          return syncArray("seating_tables", newVal, prevVal, (x) => x);
    case "vendors":         return syncArray("vendors", newVal, prevVal, vendorToDb);
    case "budget":          return syncArray("budget_posts", newVal, prevVal, (x) => x);
    case "contributions":   return syncArray("contributions", newVal, prevVal, (x) => x);
    case "payments":        return syncArray("payments", newVal, prevVal, paymentToDb);
    case "tasks":           return syncArray("tasks", newVal, prevVal, (x) => ({ ...(x as any), subs: typeof (x as any).subs === "string" ? (x as any).subs : JSON.stringify((x as any).subs) }));
    case "dayJ":            return syncArray("day_j", newVal, prevVal, (x) => x);
    case "members":         return syncArray("members", newVal, prevVal, (x) => x);
    case "notifications":   return syncArray("notifications", newVal, prevVal, (x) => x);
    case "dateCandidates":  return syncArray("date_candidates", newVal, prevVal, dateCandidateToDb);
    case "wedding":
      return c.from("wedding").update({ partner_a: newVal.partnerA, partner_b: newVal.partnerB, date: newVal.date, venue: newVal.venue, city: newVal.city, theme: newVal.theme, guest_target: newVal.guestTarget }).eq("id", wId);
    case "budgetTotal":
      return c.from("wedding").update({ budget_total: newVal }).eq("id", wId);
    case "selectedDate":
      return c.from("wedding").update({ selected_date: newVal }).eq("id", wId);
    case "weatherByMonth":
      return c.from("wedding").update({ weather_json: newVal }).eq("id", wId);
    case "weatherCity":
      return c.from("wedding").update({ weather_city: newVal }).eq("id", wId);
    // Ces clés sont read-only (rechargées, pas syncées)
    case "activeWeddingId":
    case "myWeddings":
    case "profile":
      return;
  }
}

// ── Mise à jour du profil ────────────────────────────────────
export async function updateProfile(data: { firstName?: string; lastName?: string; avatarUrl?: string; accountType?: AccountType }) {
  const c = createClient();
  const { data: { user } } = await c.auth.getUser();
  if (!user) return;
  await c.from("profiles").update({
    first_name:   data.firstName,
    last_name:    data.lastName,
    avatar_url:   data.avatarUrl,
    account_type: data.accountType,
    updated_at:   new Date().toISOString(),
  }).eq("id", user.id);
}

// ── Gestion des accès partagés ───────────────────────────────
export async function inviteToWedding(weddingId: number, email: string, role: WeddingRole) {
  const c = createClient();
  const { data: { user } } = await c.auth.getUser();
  if (!user) return { error: "Non connecté" };

  // Chercher l'utilisateur cible
  const { data: target } = await c.from("profiles").select("id").eq("id", email).maybeSingle();

  // On insère une entrée d'accès (l'utilisateur peut s'inscrire plus tard)
  const { error } = await c.from("wedding_access").upsert({
    wedding_id:  weddingId,
    user_id:     target?.id ?? email, // sera résolu à l'acceptation si nécessaire
    role,
    invited_by:  user.id,
    invited_at:  new Date().toISOString(),
  });

  return { error: error?.message ?? null };
}

export async function revokeWeddingAccess(accessId: number) {
  const c = createClient();
  await c.from("wedding_access").delete().eq("id", accessId);
}

export async function updateWeddingAccessRole(accessId: number, role: WeddingRole) {
  const c = createClient();
  await c.from("wedding_access").update({ role }).eq("id", accessId);
}

// ── Admin : charger tous les profils ────────────────────────
export async function adminLoadAllProfiles() {
  const c = createClient();
  const { data } = await c.from("profiles").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminUpdateAccountType(userId: string, accountType: AccountType) {
  const c = createClient();
  await c.from("profiles").update({ account_type: accountType, updated_at: new Date().toISOString() }).eq("id", userId);
}

// ── Journal ──────────────────────────────────────────────────
export async function loadJournal(weddingId: number): Promise<JournalEntry[]> {
  const sb = createClient();
  const { data } = await sb
    .from("journal_entries")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(journalFromDb);
}

export async function addJournalEntry(weddingId: number, entry: Omit<JournalEntry, "id" | "weddingId" | "createdAt" | "updatedAt">): Promise<JournalEntry | null> {
  const sb = createClient();
  const { data } = await sb
    .from("journal_entries")
    .insert({ wedding_id: weddingId, title: entry.title || null, text: entry.text, category: entry.category, pinned: entry.pinned })
    .select("*")
    .single();
  return data ? journalFromDb(data) : null;
}

export async function updateJournalEntry(id: number, patch: Partial<Pick<JournalEntry, "title" | "text" | "category" | "pinned">>): Promise<void> {
  const sb = createClient();
  await sb.from("journal_entries").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
}

export async function deleteJournalEntry(id: number): Promise<void> {
  const sb = createClient();
  await sb.from("journal_entries").delete().eq("id", id);
}

function journalFromDb(r: Record<string, any>): JournalEntry {
  return {
    id: r.id,
    weddingId: r.wedding_id,
    title: r.title ?? null,
    text: r.text,
    category: r.category,
    pinned: r.pinned,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

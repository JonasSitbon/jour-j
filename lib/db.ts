import { createClient } from "./supabase";
import type { AppState, Guest, Vendor, Payment, DateCandidate, Profile, WeddingSummary, WeddingRole, AccountType, JournalEntry, Gift, CeremonyEvent, Song, KeyContact } from "./types";

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
    wedding:      { partnerA: w.partner_a, partnerB: w.partner_b, date: w.date, venue: w.venue, city: w.city, theme: w.theme, guestTarget: w.guest_target, selectedStyle: w.selected_style ?? undefined, customStyleNote: w.custom_style_note ?? undefined, shareToken: w.share_token ?? undefined },
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
      return c.from("wedding").update({ partner_a: newVal.partnerA, partner_b: newVal.partnerB, date: newVal.date, venue: newVal.venue, city: newVal.city, theme: newVal.theme, guest_target: newVal.guestTarget, selected_style: newVal.selectedStyle ?? null, custom_style_note: newVal.customStyleNote ?? null }).eq("id", wId);
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

// ── Moodboard ────────────────────────────────────────────────
export interface MoodboardPalette {
  id: number;
  name: string;
  colors: string[];
  isPrimary: boolean;
  orderIdx: number;
}

export interface MoodboardCard {
  id: number;
  title: string;
  url: string | null;
  note: string | null;
  tag: string;
  color: string;
  pinned: boolean;
  orderIdx: number;
}

export async function loadMoodboard(weddingId: number) {
  const sb = createClient();
  const [{ data: palettes }, { data: cards }] = await Promise.all([
    sb.from("moodboard_palettes").select("*").eq("wedding_id", weddingId).order("order_idx"),
    sb.from("moodboard_cards").select("*").eq("wedding_id", weddingId).order("order_idx"),
  ]);
  return {
    palettes: (palettes ?? []).map((p: any) => ({
      id: p.id, name: p.name, colors: p.colors as string[], isPrimary: p.is_primary, orderIdx: p.order_idx,
    })) as MoodboardPalette[],
    cards: (cards ?? []).map((c: any) => ({
      id: c.id, title: c.title, url: c.url, note: c.note, tag: c.tag, color: c.color, pinned: c.pinned, orderIdx: c.order_idx,
    })) as MoodboardCard[],
  };
}

export async function saveMoodboardStyle(weddingId: number, style: string, note: string) {
  return createClient().from("wedding").update({ selected_style: style, custom_style_note: note }).eq("id", weddingId);
}

export async function upsertPalette(weddingId: number, palette: MoodboardPalette | Omit<MoodboardPalette, "id">) {
  const sb = createClient();
  const payload = { wedding_id: weddingId, name: palette.name, colors: palette.colors, is_primary: palette.isPrimary, order_idx: palette.orderIdx };
  if ("id" in palette && palette.id) {
    return sb.from("moodboard_palettes").update(payload).eq("id", palette.id).select("id").single();
  }
  return sb.from("moodboard_palettes").insert(payload).select("id").single();
}

export async function deletePalette(id: number) {
  return createClient().from("moodboard_palettes").delete().eq("id", id);
}

export async function upsertMoodCard(weddingId: number, card: MoodboardCard | Omit<MoodboardCard, "id">) {
  const sb = createClient();
  const payload = { wedding_id: weddingId, title: card.title, url: card.url || null, note: card.note || null, tag: card.tag, color: card.color, pinned: card.pinned, order_idx: card.orderIdx };
  if ("id" in card && card.id) {
    return sb.from("moodboard_cards").update(payload).eq("id", card.id).select("id").single();
  }
  return sb.from("moodboard_cards").insert(payload).select("id").single();
}

export async function deleteMoodCard(id: number) {
  return createClient().from("moodboard_cards").delete().eq("id", id);
}

// ── Gifts ────────────────────────────────────────────────────

export function giftFromDb(row: Record<string, unknown>): Gift {
  return {
    id: row.id as number,
    weddingId: row.wedding_id as number,
    giverName: row.giver_name as string,
    item: (row.item as string) || "",
    amount: row.amount != null ? Number(row.amount) : null,
    note: (row.note as string) || "",
    received: Boolean(row.received),
    thankYouSent: Boolean(row.thank_you_sent),
    createdAt: row.created_at as string,
  };
}

export async function loadGifts(weddingId: number): Promise<Gift[]> {
  const { data } = await createClient()
    .from("gifts")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });
  return (data ?? []).map(giftFromDb);
}

export async function addGift(weddingId: number, g: Omit<Gift, "id" | "weddingId" | "createdAt">): Promise<Gift> {
  const { data, error } = await createClient()
    .from("gifts")
    .insert({ wedding_id: weddingId, giver_name: g.giverName, item: g.item, amount: g.amount, note: g.note, received: g.received, thank_you_sent: g.thankYouSent })
    .select()
    .single();
  if (error) throw error;
  return giftFromDb(data);
}

export async function updateGift(id: number, patch: Partial<Omit<Gift, "id" | "weddingId" | "createdAt">>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.giverName !== undefined) row.giver_name = patch.giverName;
  if (patch.item !== undefined) row.item = patch.item;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.note !== undefined) row.note = patch.note;
  if (patch.received !== undefined) row.received = patch.received;
  if (patch.thankYouSent !== undefined) row.thank_you_sent = patch.thankYouSent;
  await createClient().from("gifts").update(row).eq("id", id);
}

export async function deleteGift(id: number): Promise<void> {
  await createClient().from("gifts").delete().eq("id", id);
}

// ── Ceremony Events ──────────────────────────────────────────

export function ceremonyEventFromDb(row: Record<string, unknown>): CeremonyEvent {
  return {
    id: row.id as number,
    weddingId: row.wedding_id as number,
    orderIdx: (row.order_idx as number) ?? 0,
    category: (row.category as CeremonyEvent["category"]) ?? "autre",
    title: (row.title as string) || "",
    durationMin: (row.duration_min as number) ?? 5,
    who: (row.who as string) || "",
    music: (row.music as string) || "",
    note: (row.note as string) || "",
    createdAt: row.created_at as string,
  };
}

export async function loadCeremonyEvents(weddingId: number): Promise<CeremonyEvent[]> {
  const { data } = await createClient()
    .from("ceremony_events")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("order_idx", { ascending: true });
  return (data ?? []).map(ceremonyEventFromDb);
}

export async function addCeremonyEvent(
  weddingId: number,
  e: Omit<CeremonyEvent, "id" | "weddingId" | "createdAt">
): Promise<CeremonyEvent> {
  const { data, error } = await createClient()
    .from("ceremony_events")
    .insert({
      wedding_id: weddingId,
      order_idx: e.orderIdx,
      category: e.category,
      title: e.title,
      duration_min: e.durationMin,
      who: e.who,
      music: e.music,
      note: e.note,
    })
    .select()
    .single();
  if (error) throw error;
  return ceremonyEventFromDb(data);
}

export async function updateCeremonyEvent(
  id: number,
  patch: Partial<Omit<CeremonyEvent, "id" | "weddingId" | "createdAt">>
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.orderIdx !== undefined) row.order_idx = patch.orderIdx;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.durationMin !== undefined) row.duration_min = patch.durationMin;
  if (patch.who !== undefined) row.who = patch.who;
  if (patch.music !== undefined) row.music = patch.music;
  if (patch.note !== undefined) row.note = patch.note;
  await createClient().from("ceremony_events").update(row).eq("id", id);
}

export async function deleteCeremonyEvent(id: number): Promise<void> {
  await createClient().from("ceremony_events").delete().eq("id", id);
}

export async function reorderCeremonyEvents(
  events: { id: number; orderIdx: number }[]
): Promise<void> {
  await Promise.all(
    events.map(({ id, orderIdx }) =>
      createClient().from("ceremony_events").update({ order_idx: orderIdx }).eq("id", id)
    )
  );
}

// ── Songs ────────────────────────────────────────────────────

function songFromDb(row: Record<string, unknown>): Song {
  return {
    id: row.id as number,
    weddingId: row.wedding_id as number,
    moment: (row.moment as Song["moment"]) ?? "autre",
    title: (row.title as string) || "",
    artist: (row.artist as string) || "",
    duration: (row.duration as string) || "",
    link: (row.link as string) || "",
    note: (row.note as string) || "",
    approved: Boolean(row.approved),
    createdAt: row.created_at as string,
  };
}

export async function loadSongs(weddingId: number): Promise<Song[]> {
  const { data } = await createClient()
    .from("songs")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });
  return (data ?? []).map(songFromDb);
}

export async function addSong(weddingId: number, s: Omit<Song, "id" | "weddingId" | "createdAt">): Promise<Song> {
  const { data, error } = await createClient()
    .from("songs")
    .insert({ wedding_id: weddingId, moment: s.moment, title: s.title, artist: s.artist, duration: s.duration, link: s.link, note: s.note, approved: s.approved })
    .select()
    .single();
  if (error) throw error;
  return songFromDb(data);
}

export async function updateSong(id: number, patch: Partial<Omit<Song, "id" | "weddingId" | "createdAt">>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.moment !== undefined) row.moment = patch.moment;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.artist !== undefined) row.artist = patch.artist;
  if (patch.duration !== undefined) row.duration = patch.duration;
  if (patch.link !== undefined) row.link = patch.link;
  if (patch.note !== undefined) row.note = patch.note;
  if (patch.approved !== undefined) row.approved = patch.approved;
  await createClient().from("songs").update(row).eq("id", id);
}

export async function deleteSong(id: number): Promise<void> {
  await createClient().from("songs").delete().eq("id", id);
}

// ── Key Contacts ─────────────────────────────────────────────

function contactFromDb(row: Record<string, unknown>): KeyContact {
  return {
    id: row.id as number,
    weddingId: row.wedding_id as number,
    name: (row.name as string) || "",
    role: (row.role as KeyContact["role"]) ?? "autre",
    phone: (row.phone as string) || "",
    email: (row.email as string) || "",
    note: (row.note as string) || "",
    isBridalParty: Boolean(row.is_bridal_party),
    createdAt: row.created_at as string,
  };
}

export async function loadContacts(weddingId: number): Promise<KeyContact[]> {
  const { data } = await createClient()
    .from("key_contacts")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });
  return (data ?? []).map(contactFromDb);
}

export async function addContact(weddingId: number, c: Omit<KeyContact, "id" | "weddingId" | "createdAt">): Promise<KeyContact> {
  const { data, error } = await createClient()
    .from("key_contacts")
    .insert({ wedding_id: weddingId, name: c.name, role: c.role, phone: c.phone, email: c.email, note: c.note, is_bridal_party: c.isBridalParty })
    .select()
    .single();
  if (error) throw error;
  return contactFromDb(data);
}

export async function updateContact(id: number, patch: Partial<Omit<KeyContact, "id" | "weddingId" | "createdAt">>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.note !== undefined) row.note = patch.note;
  if (patch.isBridalParty !== undefined) row.is_bridal_party = patch.isBridalParty;
  await createClient().from("key_contacts").update(row).eq("id", id);
}

export async function deleteContact(id: number): Promise<void> {
  await createClient().from("key_contacts").delete().eq("id", id);
}

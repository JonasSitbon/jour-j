import { createClient } from "./supabase";
import type { AppState, Guest, Vendor, Payment, DateCandidate } from "./types";

// ID du mariage de l'utilisateur courant (chargé une fois au mount)
let currentWeddingId: number | null = null;
export const getWeddingId = () => currentWeddingId;

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

// ── Sync helper pour les tableaux ────────────────────────────
async function syncArray<T extends { id: string | number }>(
  table: string,
  newItems: T[],
  prevItems: T[],
  toDb: (x: T) => Record<string, unknown>
) {
  const c = createClient();
  const wId = currentWeddingId;
  const prevIds = new Set(prevItems.map((x) => x.id));
  const newIds = new Set(newItems.map((x) => x.id));
  const removed = [...prevIds].filter((id) => !newIds.has(id));
  if (removed.length) await c.from(table).delete().in("id", removed);
  if (newItems.length) {
    await c.from(table).upsert(
      newItems.map((x) => ({ ...toDb(x), wedding_id: wId })) as any
    );
  }
}

// ── Chargement initial depuis Supabase ───────────────────────
export async function loadAll(): Promise<Partial<AppState> | null> {
  const c = createClient();

  const { data: { user } } = await c.auth.getUser();
  if (!user) return null;

  const { data: w } = await c.from("wedding").select("*").eq("user_id", user.id).single();
  if (!w) return null; // pas encore de mariage → onboarding

  currentWeddingId = w.id;

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

  return {
    wedding: { partnerA: w.partner_a, partnerB: w.partner_b, date: w.date, venue: w.venue, city: w.city, theme: w.theme, guestTarget: w.guest_target },
    guests: (guests ?? []).map(guestFromDb),
    tables: tables ?? [],
    vendors: (vendors ?? []).map(vendorFromDb),
    vendorCats: vendorCats ?? [],
    budget: budget ?? [],
    budgetTotal: w.budget_total,
    contributions: contributions ?? [],
    payments: (payments ?? []).map(paymentFromDb),
    tasks: (tasks ?? []).map((t) => ({ ...t, subs: typeof t.subs === "string" ? JSON.parse(t.subs) : (t.subs ?? []) })),
    checklistCats: checklistCats ?? [],
    dayJ: dayJ ?? [],
    dateCandidates: (dateCandidates ?? []).map(dateCandidateFromDb),
    holidays: holidays ?? [],
    weatherByMonth: Array.isArray(w.weather_json) ? w.weather_json : (weatherByMonth ?? []),
    weatherCity: (w.weather_city as string) || (w.city as string) || "",
    members: members ?? [],
    notifications: notifications ?? [],
    selectedDate: w.selected_date,
  };
}

// ── Sync d'une clé de l'état vers Supabase ───────────────────
export async function syncKey(key: keyof AppState, newVal: any, prevVal: any) {
  const c = createClient();
  const wId = currentWeddingId;
  switch (key) {
    case "guests":         return syncArray("guests", newVal, prevVal, guestToDb);
    case "tables":         return syncArray("seating_tables", newVal, prevVal, (x) => x);
    case "vendors":        return syncArray("vendors", newVal, prevVal, vendorToDb);
    case "budget":         return syncArray("budget_posts", newVal, prevVal, (x) => x);
    case "contributions":  return syncArray("contributions", newVal, prevVal, (x) => x);
    case "payments":       return syncArray("payments", newVal, prevVal, paymentToDb);
    case "tasks":          return syncArray("tasks", newVal, prevVal, (x) => ({ ...(x as any), subs: typeof (x as any).subs === "string" ? (x as any).subs : JSON.stringify((x as any).subs) }));
    case "dayJ":           return syncArray("day_j", newVal, prevVal, (x) => x);
    case "members":        return syncArray("members", newVal, prevVal, (x) => x);
    case "notifications":  return syncArray("notifications", newVal, prevVal, (x) => x);
    case "dateCandidates": return syncArray("date_candidates", newVal, prevVal, dateCandidateToDb);
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
  }
}

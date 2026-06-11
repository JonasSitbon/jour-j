export type Side = "A" | "B";
export type RsvpStatus = "yes" | "pending" | "declined";
export type Diet =
  | "none"
  | "standard"
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "halal"
  | "kosher"
  | "no-pork"
  | "no-seafood"
  | "lactose-free"
  | "nut-allergy"
  | "other"
  | "vegetarien"
  | "sans gluten"
  | "sans lactose";


export interface Guest {
  id: number;
  name: string;
  side: Side;
  rsvp: RsvpStatus;
  diet: Diet;
  table: number | null;
  lodging: string;
  child: boolean;
  transport: boolean;
  gift: boolean;
  group: string;
  note: string;
  rsvpToken?: string;
}

export interface TableSeat { id: number; name: string; capacity: number; }

export type VendorStatus = "signed" | "pending" | "declined";
export interface VendorScores { prix: number; qualite: number; reactivite: number; references: number; flexibilite: number; }
export interface Vendor {
  id: number; cat: string; name: string; total: number; status: VendorStatus;
  score: "A" | "B" | "C"; scores: VendorScores; included: string;
  contact: string; phone: string; email: string; lastContact: string; docs: number;
}
export interface VendorCat { id: string; label: string; icon: string; }

export type BudgetRule = "split50" | "byGuests" | "onlyA" | "onlyB" | "family" | "custom";
export interface BudgetPost {
  id: number; label: string; cat: string; planned: number; spent: number;
  rule: BudgetRule; custom: { A: number; B: number } | null;
}
export interface Contribution { id: string; label: string; amount: number; }

export type PaymentStatus = "paid" | "upcoming" | "late" | "partial";
export type PaymentMethod = "virement" | "cheque" | "cash" | "carte";
export interface Payment {
  id: number; vendor: string; label: string; amount: number;
  due: string; paidDate: string | null; who: Side | string; method: PaymentMethod;
  status: PaymentStatus; receipt: number;
}

export interface SubTask { t: string; d: number; }
export interface Task {
  id: number; cat: string; title: string; due: string; who: Side;
  done: boolean; subs: SubTask[]; link: string; note: string;
}
export interface ChecklistCat { id: string; label: string; icon: string; }
export interface DayJItem { id: string; t: string; done: number; }

export interface DateCandidate {
  id: number; date: string; weather: number; sun: number; rain: number; temp: number;
  holidays: number; longWeekend: number; availability: number; best: number;
  city: string; lat: number | null; lon: number | null;
}
export interface Holiday { date: string; label: string; }
export interface WeatherMonth { m: string; sun: number; rain: number; temp: number; }

export type NotifType = "alert" | "warning" | "info" | "success";
export interface Notification { id: number; type: NotifType; title: string; body: string; time: string; read: number; }

export type AccessLevel = "owner" | "edit" | "read";
export interface Member { id: number; name: string; role: string; email: string; access: AccessLevel; }

export interface JournalEntry {
  id: number;
  weddingId: number;
  title: string | null;
  text: string;
  category: "general" | "invites" | "budget" | "prestataires" | "logistique" | "idees";
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wedding {
  partnerA: string; partnerB: string; date: string;
  venue: string; city: string; theme: string; guestTarget: number;
}

// ── Multi-mariage & profils ─────────────────────────────────────────────────

export type AccountType = "couple" | "planner" | "super_admin";
export type WeddingRole = "owner" | "admin" | "editor" | "viewer";

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  accountType: AccountType;
}

export interface WeddingSummary {
  id: number;
  name: string | null;
  partnerA: string;
  partnerB: string;
  date: string;
  city: string;
  role: WeddingRole;
  coverColor: string;
}

export interface WeddingAccess {
  id: number;
  weddingId: number;
  userId: string;
  role: WeddingRole;
  invitedAt: string;
  acceptedAt: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface AppState {
  wedding: Wedding;
  guests: Guest[];
  tables: TableSeat[];
  vendors: Vendor[];
  vendorCats: VendorCat[];
  budget: BudgetPost[];
  budgetTotal: number;
  contributions: Contribution[];
  payments: Payment[];
  tasks: Task[];
  dayJ: DayJItem[];
  checklistCats: ChecklistCat[];
  dateCandidates: DateCandidate[];
  holidays: Holiday[];
  weatherByMonth: WeatherMonth[];
  weatherCity: string;
  members: Member[];
  notifications: Notification[];
  selectedDate: number;
  // Multi-mariage
  activeWeddingId: number | null;
  myWeddings: WeddingSummary[];
  profile: Profile | null;
}

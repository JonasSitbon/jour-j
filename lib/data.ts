import type { AppState } from "./types";

// ── Référentiels statiques (fallback si les tables globales sont vides) ──────

const vendorCats = [
  { id: "salle", label: "Salle", icon: "home" },
  { id: "traiteur", label: "Traiteur", icon: "cake" },
  { id: "photo", label: "Photographe", icon: "camera" },
  { id: "video", label: "Vidéaste", icon: "eye" },
  { id: "dj", label: "DJ / Groupe", icon: "music" },
  { id: "fleurs", label: "Fleuriste", icon: "flower" },
  { id: "voiture", label: "Voiture", icon: "car" },
  { id: "fairepart", label: "Faire-part", icon: "mail" },
  { id: "gateau", label: "Gâteau", icon: "cake" },
  { id: "beaute", label: "Coiffure / Maquillage", icon: "sparkle" },
  { id: "officiant", label: "Officiant", icon: "heart" },
  { id: "honeymoon", label: "Voyage de noces", icon: "pin" },
  { id: "divers", label: "Divers", icon: "dots" },
];

const checklistCats = [
  { id: "admin", label: "Administratif", icon: "file" },
  { id: "lieu", label: "Lieu & logistique", icon: "home" },
  { id: "presta", label: "Prestataires", icon: "star" },
  { id: "tenues", label: "Tenues", icon: "sparkle" },
  { id: "invites", label: "Invités", icon: "users" },
  { id: "deco", label: "Décoration", icon: "flower" },
  { id: "ceremonie", label: "Cérémonie", icon: "heart" },
  { id: "jourj", label: "Jour J", icon: "rings" },
  { id: "apres", label: "Après mariage", icon: "gift" },
];

// ── État initial vide : les données réelles arrivent de Supabase
//    (loadAll), l'écran de chargement couvre l'attente ────────────

export const initialState: AppState = {
  wedding: { partnerA: "", partnerB: "", date: "", venue: "", city: "", theme: "", guestTarget: 0 },
  guests: [],
  tables: [],
  vendors: [],
  vendorCats,
  budget: [],
  budgetTotal: 0,
  contributions: [],
  payments: [],
  tasks: [],
  dayJ: [],
  checklistCats,
  dateCandidates: [],
  holidays: [],
  weatherByMonth: [],
  weatherCity: "",
  members: [],
  notifications: [],
  selectedDate: 0,
  activeWeddingId: null,
  myWeddings: [],
  profile: null,
};

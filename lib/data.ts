import type { AppState, Guest, Vendor, BudgetPost, Payment, Task } from "./types";

const WEDDING = {
  partnerA: "Camille",
  partnerB: "Alex",
  date: "2027-06-12",
  venue: "Domaine des Tilleuls",
  city: "Aix-en-Provence",
  theme: "Champêtre élégant",
  guestTarget: 120,
};

let gid = 0;
const G = (name: string, side: any, rsvp: any, diet: any, table: number | null, lodging: string, child: number, transport: number, gift: number, group: string, note = ""): Guest =>
  ({ id: ++gid, name, side, rsvp, diet, table, lodging, child: !!child, transport: !!transport, gift: !!gift, group, note });

const guests: Guest[] = [
  G("Sophie Laurent", "A", "yes", "none", 1, "sur place", 0, 0, 1, "Famille Laurent", "Tante de Camille"),
  G("Marc Laurent", "A", "yes", "none", 1, "sur place", 0, 0, 1, "Famille Laurent"),
  G("Léa Laurent", "A", "yes", "vegetarien", 1, "sur place", 1, 0, 0, "Famille Laurent"),
  G("Thomas Mercier", "A", "yes", "none", 2, "hôtel", 0, 1, 1, "Amis Camille"),
  G("Julie Mercier", "A", "pending", "vegan", 2, "", 0, 1, 0, "Amis Camille", "Relancer"),
  G("Antoine Dubois", "A", "yes", "sans gluten", 2, "hôtel", 0, 0, 0, "Amis Camille"),
  G("Clara Petit", "A", "declined", "none", null, "", 0, 0, 0, "Amis Camille", "Indisponible"),
  G("Nicolas Roy", "A", "pending", "none", null, "", 0, 0, 0, "Collègues Camille"),
  G("Émilie Roy", "A", "pending", "none", null, "", 0, 0, 0, "Collègues Camille"),
  G("Pierre Garnier", "B", "yes", "none", 3, "sur place", 0, 0, 1, "Famille Garnier", "Oncle d'Alex"),
  G("Hélène Garnier", "B", "yes", "none", 3, "sur place", 0, 0, 1, "Famille Garnier"),
  G("Lucas Garnier", "B", "yes", "none", 3, "sur place", 1, 0, 0, "Famille Garnier"),
  G("Manon Girard", "B", "yes", "vegetarien", 4, "hôtel", 0, 1, 0, "Amis Alex"),
  G("Hugo Girard", "B", "yes", "none", 4, "hôtel", 0, 1, 1, "Amis Alex"),
  G("Sarah Bonnet", "B", "pending", "none", null, "", 0, 0, 0, "Amis Alex", "A confirmé verbalement"),
  G("Raphaël Fontaine", "B", "yes", "sans lactose", 4, "", 0, 0, 0, "Amis Alex"),
  G("Inès Chevalier", "B", "yes", "none", 3, "sur place", 0, 0, 0, "Collègues Alex"),
  G("Maxime Lefevre", "B", "declined", "none", null, "", 0, 0, 0, "Collègues Alex"),
  G("Camille Noël", "A", "yes", "none", 1, "sur place", 0, 0, 1, "Famille Laurent"),
  G("Élodie Bertrand", "B", "pending", "vegetarien", null, "", 0, 0, 0, "Amis Alex"),
];

const tables = [
  { id: 1, name: "Table d'honneur", capacity: 8 },
  { id: 2, name: "Table 2", capacity: 8 },
  { id: 3, name: "Table 3", capacity: 10 },
  { id: 4, name: "Table 4", capacity: 10 },
  { id: 5, name: "Table 5", capacity: 10 },
];

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

let vid = 0;
const V = (cat: string, name: string, total: number, status: any, score: any, scores: any, included: string, contact: string, lastContact: string): Vendor =>
  ({ id: ++vid, cat, name, total, status, score, scores, included, contact, phone: "06 12 34 56 78", email: "contact@" + name.toLowerCase().replace(/[^a-z]/g, "") + ".fr", lastContact, docs: status === "signed" ? 1 : 0 });

const vendors: Vendor[] = [
  V("salle", "Domaine des Tilleuls", 7800, "signed", "A", { prix: 4, qualite: 5, reactivite: 5, references: 5, flexibilite: 4 }, "Location week-end complet, mobilier, parking", "Mme Rousseau", "2026-05-28"),
  V("salle", "Château de la Brède", 9200, "declined", "B", { prix: 2, qualite: 5, reactivite: 3, references: 4, flexibilite: 2 }, "Location samedi, hébergement 12 pers.", "M. Albert", "2026-04-10"),
  V("traiteur", "Saveurs & Co", 9600, "pending", "A", { prix: 4, qualite: 5, reactivite: 4, references: 4, flexibilite: 4 }, "Cocktail + dîner 3 plats, 120 couverts", "Chef Morel", "2026-05-30"),
  V("traiteur", "Table Provençale", 8400, "pending", "B", { prix: 5, qualite: 3, reactivite: 2, references: 3, flexibilite: 4 }, "Buffet + dîner, 120 couverts", "M. Pons", "2026-05-02"),
  V("photo", "Studio Lumière", 2600, "signed", "A", { prix: 4, qualite: 5, reactivite: 5, references: 5, flexibilite: 5 }, "Journée complète, album, galerie en ligne", "Léa Martin", "2026-05-20"),
  V("dj", "Sono Events", 1400, "pending", "B", { prix: 4, qualite: 4, reactivite: 5, references: 3, flexibilite: 4 }, "DJ soirée, matériel, jeux de lumière", "DJ Kévin", "2026-05-18"),
  V("fleurs", "Atelier Floral", 1800, "pending", "B", { prix: 3, qualite: 5, reactivite: 2, references: 4, flexibilite: 3 }, "Bouquet, centres de table, arche", "Mme Vidal", "2026-04-22"),
  V("video", "Ciné Moments", 2200, "pending", "B", { prix: 3, qualite: 4, reactivite: 3, references: 4, flexibilite: 3 }, "Film 5 min + cérémonie intégrale", "M. Faure", "2026-05-12"),
];

let bid = 0;
const B = (label: string, cat: string, planned: number, spent: number, rule: any, custom: any = null): BudgetPost =>
  ({ id: ++bid, label, cat, planned, spent, rule, custom });

const budget: BudgetPost[] = [
  B("Salle & réception", "salle", 8000, 7800, "split50"),
  B("Traiteur & boissons", "traiteur", 10000, 9600, "byGuests"),
  B("Photographe", "photo", 2800, 2600, "split50"),
  B("Vidéaste", "video", 2200, 0, "split50"),
  B("DJ / Animation", "dj", 1500, 1400, "onlyB"),
  B("Fleurs & décoration", "fleurs", 2000, 1800, "onlyA"),
  B("Tenues & beauté", "beaute", 3500, 1200, "custom", { A: 70, B: 30 }),
  B("Faire-part & papeterie", "fairepart", 800, 650, "split50"),
  B("Gâteau", "gateau", 600, 0, "split50"),
  B("Voiture", "voiture", 700, 0, "onlyB"),
  B("Voyage de noces", "honeymoon", 4000, 1000, "split50"),
  B("Divers & imprévus", "divers", 1500, 320, "split50"),
];

let pid = 0;
const PMT = (vendor: string, label: string, amount: number, due: string, paid: string | null, who: any, method: any, status: any): Payment =>
  ({ id: ++pid, vendor, label, amount, due, paidDate: paid, who, method, status, receipt: status === "paid" ? 1 : 0 });

const payments: Payment[] = [
  PMT("Domaine des Tilleuls", "Acompte salle (30%)", 2340, "2026-03-15", "2026-03-12", "A", "virement", "paid"),
  PMT("Studio Lumière", "Acompte photo", 800, "2026-04-01", "2026-04-01", "B", "virement", "paid"),
  PMT("Atelier Floral", "Arrhes fleurs", 500, "2026-05-10", "2026-05-09", "A", "cheque", "paid"),
  PMT("Domaine des Tilleuls", "Solde salle", 5460, "2026-09-15", null, "A", "virement", "upcoming"),
  PMT("Saveurs & Co", "Acompte traiteur", 2880, "2026-06-01", null, "B", "virement", "late"),
  PMT("Sono Events", "Acompte DJ", 420, "2026-06-20", null, "B", "cash", "upcoming"),
  PMT("Studio Lumière", "Solde photo", 1800, "2027-05-15", null, "B", "virement", "upcoming"),
  PMT("Saveurs & Co", "Solde traiteur", 6720, "2027-05-20", null, "A", "virement", "upcoming"),
  PMT("Ciné Moments", "Acompte vidéo", 660, "2026-06-30", null, "B", "cheque", "upcoming"),
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

let tid = 0;
const T = (cat: string, title: string, due: string, who: any, done: number, subs: any[] = []): Task =>
  ({ id: ++tid, cat, title, due, who, done: !!done, subs, link: "", note: "" });

const tasks: Task[] = [
  T("admin", "Réserver la date en mairie", "2026-09-12", "A", 0, [{ t: "Prendre rendez-vous", d: 1 }, { t: "Constituer le dossier", d: 0 }]),
  T("admin", "Dossier de mariage complet", "2026-12-12", "B", 0, [{ t: "Actes de naissance", d: 1 }, { t: "Justificatifs de domicile", d: 0 }, { t: "Liste des témoins", d: 0 }]),
  T("lieu", "Signer le contrat de la salle", "2026-05-30", "A", 1),
  T("lieu", "Visiter et choisir l'hébergement invités", "2026-08-01", "A", 0, [{ t: "Hôtel à proximité", d: 0 }, { t: "Négocier tarif groupe", d: 0 }]),
  T("presta", "Choisir le traiteur", "2026-07-15", "B", 0, [{ t: "Dégustation Saveurs & Co", d: 1 }, { t: "Dégustation Table Provençale", d: 0 }, { t: "Comparer les devis", d: 0 }]),
  T("presta", "Confirmer le photographe", "2026-06-15", "A", 1),
  T("presta", "Réserver le DJ", "2026-07-30", "B", 0),
  T("tenues", "Choisir la tenue de Camille", "2026-11-01", "A", 0, [{ t: "Essayages", d: 0 }, { t: "Retouches", d: 0 }]),
  T("tenues", "Costume d'Alex", "2026-12-01", "B", 0),
  T("invites", "Finaliser la liste des invités", "2026-08-30", "A", 0),
  T("invites", "Envoyer les faire-part", "2026-12-12", "A", 0, [{ t: "Valider la maquette", d: 0 }, { t: "Impression", d: 0 }, { t: "Envoi", d: 0 }]),
  T("invites", "Relancer les RSVP en attente", "2027-03-01", "B", 0),
  T("deco", "Définir la palette de décoration", "2026-10-01", "A", 0),
  T("deco", "Commander la papeterie de table", "2027-02-01", "A", 0),
  T("ceremonie", "Écrire les vœux", "2027-05-01", "B", 0),
  T("ceremonie", "Choisir les musiques de cérémonie", "2027-04-15", "B", 0),
  T("jourj", "Préparer le timing du jour J", "2027-06-05", "A", 0),
  T("jourj", "Kit de secours mariée/marié", "2027-06-11", "A", 0),
  T("apres", "Envoyer les remerciements", "2027-07-15", "B", 0),
];

const dayJ = [
  { id: "d1", t: "Petit-déjeuner copieux", done: 0 },
  { id: "d2", t: "Coiffure & maquillage", done: 0 },
  { id: "d3", t: "Vérifier les alliances", done: 0 },
  { id: "d4", t: "Kit de secours prêt", done: 0 },
  { id: "d5", t: "Confier les paiements cash aux témoins", done: 0 },
  { id: "d6", t: "Bouquet récupéré", done: 0 },
  { id: "d7", t: "Voiture confirmée", done: 0 },
  { id: "d8", t: "Habillage", done: 0 },
  { id: "d9", t: "Photos préparatifs", done: 0 },
  { id: "d10", t: "Respirer, profiter ✨", done: 0 },
];

const dateCandidates = [
  { id: 1, date: "2027-06-12", weather: 88, sun: 9, rain: 12, temp: 26, holidays: 0, longWeekend: 0, availability: 92, best: 1, city: "", lat: null, lon: null },
  { id: 2, date: "2027-05-29", weather: 79, sun: 8, rain: 18, temp: 22, holidays: 0, longWeekend: 1, availability: 74, best: 0, city: "", lat: null, lon: null },
  { id: 3, date: "2027-09-04", weather: 82, sun: 8, rain: 15, temp: 24, holidays: 0, longWeekend: 0, availability: 81, best: 0, city: "", lat: null, lon: null },
  { id: 4, date: "2027-07-10", weather: 90, sun: 10, rain: 8, temp: 29, holidays: 0, longWeekend: 0, availability: 58, best: 0, city: "", lat: null, lon: null },
];

const holidays = [
  { date: "2027-05-01", label: "Fête du Travail" },
  { date: "2027-05-08", label: "Victoire 1945" },
  { date: "2027-05-06", label: "Ascension" },
  { date: "2027-05-16", label: "Pentecôte" },
  { date: "2027-07-14", label: "Fête nationale" },
  { date: "2027-08-15", label: "Assomption" },
];

const weatherByMonth = [
  { m: "Jan", sun: 58, rain: 6, temp: 9 }, { m: "Fév", sun: 62, rain: 5, temp: 10 },
  { m: "Mar", sun: 68, rain: 6, temp: 13 }, { m: "Avr", sun: 72, rain: 7, temp: 16 },
  { m: "Mai", sun: 79, rain: 6, temp: 20 }, { m: "Juin", sun: 88, rain: 4, temp: 25 },
  { m: "Juil", sun: 92, rain: 2, temp: 28 }, { m: "Août", sun: 90, rain: 3, temp: 28 },
  { m: "Sep", sun: 82, rain: 5, temp: 24 }, { m: "Oct", sun: 72, rain: 7, temp: 18 },
  { m: "Nov", sun: 62, rain: 7, temp: 13 }, { m: "Déc", sun: 57, rain: 6, temp: 10 },
];

const notifications = [
  { id: 1, type: "alert" as const, title: "Paiement en retard", body: "Acompte traiteur — Saveurs & Co (échéance dépassée)", time: "il y a 2 j", read: 0 },
  { id: 2, type: "warning" as const, title: "Échéance proche", body: "Solde salle à régler avant le 15 septembre", time: "il y a 1 j", read: 0 },
  { id: 3, type: "info" as const, title: "3 RSVP en attente", body: "Pensez à relancer les invités non confirmés", time: "il y a 3 h", read: 0 },
  { id: 4, type: "success" as const, title: "Devis signé", body: "Studio Lumière — contrat photo confirmé", time: "hier", read: 1 },
];

const members = [
  { id: 1, name: "Camille Laurent", role: "Propriétaire", email: "camille@email.fr", access: "owner" as const },
  { id: 2, name: "Alex Garnier", role: "Co-organisateur", email: "alex@email.fr", access: "edit" as const },
  { id: 3, name: "Sophie Laurent", role: "Témoin", email: "sophie@email.fr", access: "edit" as const },
  { id: 4, name: "Pierre Garnier", role: "Famille", email: "pierre@email.fr", access: "read" as const },
];

export const initialState: AppState = {
  wedding: WEDDING,
  guests, tables, vendors, vendorCats,
  budget, budgetTotal: 42000,
  contributions: [
    { id: "famA", label: "Famille de Camille", amount: 6000 },
    { id: "famB", label: "Famille de Alex", amount: 4000 },
  ],
  payments, tasks, dayJ, checklistCats,
  dateCandidates, holidays, weatherByMonth, weatherCity: WEDDING.city,
  members, notifications,
  selectedDate: 1,
  activeWeddingId: null,
  myWeddings: [],
  profile: null,
};

export const SIDES = { A: WEDDING.partnerA, B: WEDDING.partnerB };

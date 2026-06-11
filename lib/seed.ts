import type { SupabaseClient } from "@supabase/supabase-js";

function addMonths(date: string, months: number) {
  const d = new Date(date + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function mo(weddingDate: string, months: number) {
  const d = new Date(weddingDate + "T00:00:00");
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}
function dy(weddingDate: string, days: number) {
  const d = new Date(weddingDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export async function seedDefaultTasks(sb: SupabaseClient, wId: number, wDate: string) {
  const base = Date.now();
  const tasks = [
    { id: base + 1,  cat: "admin",     title: "Réserver la date en mairie",           due: mo(wDate, 18), who: "A", done: false, subs: JSON.stringify([{t:"Prendre rendez-vous",d:false},{t:"Constituer le dossier",d:false}]),                                      link: "", note: "" },
    { id: base + 2,  cat: "admin",     title: "Dossier de mariage complet",            due: mo(wDate, 12), who: "B", done: false, subs: JSON.stringify([{t:"Actes de naissance",d:false},{t:"Justificatifs de domicile",d:false},{t:"Liste des témoins",d:false}]), link: "", note: "" },
    { id: base + 3,  cat: "lieu",      title: "Signer le contrat de la salle",         due: mo(wDate, 14), who: "A", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 4,  cat: "lieu",      title: "Visiter et choisir l'hébergement invités", due: mo(wDate, 10), who: "A", done: false, subs: JSON.stringify([{t:"Hôtel à proximité",d:false},{t:"Négocier tarif groupe",d:false}]),                                    link: "", note: "" },
    { id: base + 5,  cat: "presta",    title: "Choisir le traiteur",                   due: mo(wDate, 10), who: "B", done: false, subs: JSON.stringify([{t:"Dégustation prestataire A",d:false},{t:"Dégustation prestataire B",d:false},{t:"Comparer les devis",d:false}]), link: "", note: "" },
    { id: base + 6,  cat: "presta",    title: "Confirmer le photographe",              due: mo(wDate, 11), who: "A", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 7,  cat: "presta",    title: "Réserver le DJ / animation",            due: mo(wDate, 9),  who: "B", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 8,  cat: "tenues",    title: "Choisir la tenue du marié(e) A",        due: mo(wDate, 8),  who: "A", done: false, subs: JSON.stringify([{t:"Essayages",d:false},{t:"Retouches",d:false}]),                                                           link: "", note: "" },
    { id: base + 9,  cat: "tenues",    title: "Choisir la tenue du marié(e) B",        due: mo(wDate, 7),  who: "B", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 10, cat: "invites",   title: "Finaliser la liste des invités",        due: mo(wDate, 6),  who: "A", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 11, cat: "invites",   title: "Envoyer les faire-part",                due: mo(wDate, 6),  who: "A", done: false, subs: JSON.stringify([{t:"Valider la maquette",d:false},{t:"Impression",d:false},{t:"Envoi",d:false}]),                            link: "", note: "" },
    { id: base + 12, cat: "invites",   title: "Relancer les RSVP en attente",          due: mo(wDate, 3),  who: "B", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 13, cat: "deco",      title: "Définir la palette de décoration",      due: mo(wDate, 8),  who: "A", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 14, cat: "deco",      title: "Commander la papeterie de table",       due: mo(wDate, 3),  who: "A", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 15, cat: "ceremonie", title: "Écrire les vœux",                       due: mo(wDate, 1),  who: "B", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 16, cat: "ceremonie", title: "Choisir les musiques de cérémonie",     due: mo(wDate, 2),  who: "B", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 17, cat: "jourj",     title: "Préparer le timing du jour J",          due: dy(wDate, -7), who: "A", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 18, cat: "jourj",     title: "Kit de secours mariée / marié",         due: dy(wDate, -1), who: "A", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
    { id: base + 19, cat: "apres",     title: "Envoyer les remerciements",             due: dy(wDate, 30), who: "B", done: false, subs: JSON.stringify([]),                                                                                                          link: "", note: "" },
  ].map((t) => ({ ...t, wedding_id: wId }));

  return sb.from("tasks").insert(tasks);
}

export async function seedDefaultDayJ(sb: SupabaseClient, wId: number) {
  const items = [
    "Petit-déjeuner copieux",
    "Coiffure & maquillage",
    "Vérifier les alliances",
    "Kit de secours prêt",
    "Confier les paiements cash aux témoins",
    "Bouquet récupéré",
    "Voiture confirmée",
    "Habillage",
    "Photos préparatifs",
    "Respirer, profiter ✨",
  ].map((t, i) => ({ id: `${wId}-d${i + 1}`, t, done: 0, wedding_id: wId }));

  return sb.from("day_j").insert(items);
}

export async function seedDefaultBudget(sb: SupabaseClient, wId: number, total: number) {
  const base = Date.now();
  const posts = [
    { pct: 0.22, label: "Salle & réception",       cat: "salle",      rule: "split50", custom: null },
    { pct: 0.28, label: "Traiteur & boissons",      cat: "traiteur",   rule: "byGuests", custom: null },
    { pct: 0.08, label: "Photographe",              cat: "photo",      rule: "split50", custom: null },
    { pct: 0.06, label: "Vidéaste",                 cat: "video",      rule: "split50", custom: null },
    { pct: 0.05, label: "DJ / Animation",           cat: "dj",         rule: "onlyB",  custom: null },
    { pct: 0.07, label: "Fleurs & décoration",      cat: "fleurs",     rule: "onlyA",  custom: null },
    { pct: 0.08, label: "Tenues & beauté",          cat: "beaute",     rule: "custom", custom: { A: 70, B: 30 } },
    { pct: 0.02, label: "Faire-part & papeterie",   cat: "fairepart",  rule: "split50", custom: null },
    { pct: 0.02, label: "Gâteau",                   cat: "gateau",     rule: "split50", custom: null },
    { pct: 0.10, label: "Voyage de noces",          cat: "honeymoon",  rule: "split50", custom: null },
    { pct: 0.02, label: "Divers & imprévus",        cat: "divers",     rule: "split50", custom: null },
  ].map((p, i) => ({
    id: base + i,
    label: p.label,
    cat: p.cat,
    planned: Math.round((total * p.pct) / 100) * 100,
    spent: 0,
    rule: p.rule,
    custom: p.custom,
    wedding_id: wId,
  }));
  return sb.from("budget_posts").insert(posts);
}

export async function seedDefaultDateCandidates(sb: SupabaseClient, wId: number, wDate: string) {
  // IDs : wId * 10 + offset — reste dans la plage int PostgreSQL pour des wId raisonnables
  const id1 = wId * 10 + 1;
  const id2 = wId * 10 + 2;
  const id3 = wId * 10 + 3;
  const candidates = [
    { id: id1, date: wDate,              weather: 85, sun: 9, rain: 12, temp: 24, holidays: 0, long_weekend: 0, availability: 88, best: 1, wedding_id: wId },
    { id: id2, date: addMonths(wDate,-1),weather: 76, sun: 8, rain: 18, temp: 21, holidays: 0, long_weekend: 0, availability: 72, best: 0, wedding_id: wId },
    { id: id3, date: addMonths(wDate, 1),weather: 81, sun: 9, rain: 14, temp: 26, holidays: 0, long_weekend: 0, availability: 78, best: 0, wedding_id: wId },
  ];
  await sb.from("date_candidates").upsert(candidates, { onConflict: "id" });
  await sb.from("wedding").update({ selected_date: id1 }).eq("id", wId);
}

export async function seedDefaultTables(sb: SupabaseClient, wId: number) {
  const base = wId * 10 + 1;
  const tables = [
    { id: base,   name: "Table d'honneur", capacity: 8,  wedding_id: wId },
    { id: base+1, name: "Table 2",         capacity: 10, wedding_id: wId },
    { id: base+2, name: "Table 3",         capacity: 10, wedding_id: wId },
    { id: base+3, name: "Table 4",         capacity: 10, wedding_id: wId },
    { id: base+4, name: "Table 5",         capacity: 10, wedding_id: wId },
  ];
  return sb.from("seating_tables").insert(tables);
}

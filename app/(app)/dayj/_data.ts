// Types, catégories, templates et bibliothèque du déroulé du Jour J.

export interface DayEvent {
  id: string;
  hour: number;
  minute: number;
  duration: number;
  title: string;
  description?: string;
  category: "preparations" | "transport" | "ceremonie" | "photos" | "cocktail" | "diner" | "soiree" | "technique" | "autre" | "henne" | "traditionnel";
  who: string;
  important: boolean;
}

export interface WeddingDay {
  id: string;
  label: string;
  date: string;
  events: DayEvent[];
}

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */

export const CATEGORIES: Record<DayEvent["category"], { label: string; icon: string; color: string; bg: string; text: string }> = {
  preparations: { label: "Préparatifs", icon: "sparkle", color: "var(--primary)", bg: "bg-primary-soft", text: "text-primary-700" },
  transport: { label: "Transport", icon: "car", color: "var(--amber)", bg: "bg-amber-soft", text: "text-amber" },
  ceremonie: { label: "Cérémonie", icon: "rings", color: "var(--gold)", bg: "bg-gold-soft", text: "text-[var(--gold-ink)]" },
  photos: { label: "Photos & Vidéo", icon: "camera", color: "var(--sage)", bg: "bg-sage-soft", text: "text-sage" },
  cocktail: { label: "Cocktail", icon: "flower", color: "var(--coral)", bg: "bg-coral-soft", text: "text-coral" },
  diner: { label: "Dîner & Repas", icon: "star", color: "var(--primary)", bg: "bg-primary-soft", text: "text-primary-700" },
  soiree: { label: "Soirée & Danse", icon: "music", color: "var(--primary)", bg: "bg-primary-softer", text: "text-primary" },
  technique: { label: "Technique & Logistique", icon: "flag", color: "var(--text-2)", bg: "bg-surface-3", text: "text-text-2" },
  autre: { label: "Autre", icon: "dots", color: "var(--line-strong)", bg: "bg-surface-2", text: "text-text-2" },
  henne: { label: "Hénné & Mehndi", icon: "flower", color: "#D97706", bg: "bg-orange-50", text: "text-orange-700" },
  traditionnel: { label: "Tradition & Rituels", icon: "sparkle", color: "#7C3AED", bg: "bg-violet-50", text: "text-violet-700" },
};

export const WHO_CHIPS = [
  "Mariés", "Mariée", "Marié", "Témoins", "Famille",
  "Tous les invités", "Photographe", "DJ", "Traiteur", "Wedding planner", "Autre",
];

export const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1h" },
  { value: "90", label: "1h30" },
  { value: "120", label: "2h" },
  { value: "150", label: "2h30" },
  { value: "180", label: "3h" },
  { value: "240", label: "4h" },
];

export const MINUTE_OPTIONS = [
  { value: "0", label: "00" },
  { value: "15", label: "15" },
  { value: "30", label: "30" },
  { value: "45", label: "45" },
];

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: String(i).padStart(2, "0") + "h",
}));

export const DEFAULT_EVENTS: Omit<DayEvent, "id">[] = [
  { hour: 9, minute: 0, duration: 120, title: "Coiffure et maquillage — Côté A", category: "preparations", who: "Mariée", important: false, description: "À domicile ou chez le prestataire" },
  { hour: 10, minute: 30, duration: 90, title: "Coiffure et maquillage — Côté B", category: "preparations", who: "Marié", important: false, description: "" },
  { hour: 12, minute: 0, duration: 60, title: "Habillage et derniers préparatifs", category: "preparations", who: "Mariés", important: true, description: "Photos de préparatifs avec les témoins" },
  { hour: 13, minute: 30, duration: 30, title: "Départ vers la mairie / cérémonie civile", category: "transport", who: "Tous les invités", important: true, description: "" },
  { hour: 14, minute: 0, duration: 60, title: "Cérémonie civile", category: "ceremonie", who: "Tous les invités", important: true, description: "Mairie — durée estimée 45 min" },
  { hour: 15, minute: 30, duration: 90, title: "Séance photos couple", category: "photos", who: "Mariés", important: false, description: "En extérieur avec le photographe" },
  { hour: 16, minute: 0, duration: 30, title: "Arrivée des invités au domaine", category: "transport", who: "Tous les invités", important: false, description: "" },
  { hour: 17, minute: 0, duration: 150, title: "Cocktail & Vin d'honneur", category: "cocktail", who: "Tous les invités", important: true, description: "Réception en extérieur, musique d'ambiance" },
  { hour: 19, minute: 30, duration: 30, title: "Entrée en salle de réception", category: "diner", who: "Tous les invités", important: true, description: "Entrée des mariés + discours d'accueil" },
  { hour: 20, minute: 0, duration: 180, title: "Dîner de gala", category: "diner", who: "Tous les invités", important: true, description: "Repas assis, discours, animations" },
  { hour: 22, minute: 30, duration: 30, title: "Pièce montée & ouverture du bal", category: "soiree", who: "Tous les invités", important: true, description: "Première danse des mariés" },
  { hour: 23, minute: 0, duration: 60, title: "Soirée dansante", category: "soiree", who: "Tous les invités", important: false, description: "" },
];

/* ------------------------------------------------------------------ */
/* Smart template presets (multi-day)                                   */
/* ------------------------------------------------------------------ */

export interface TemplateDay {
  label: string;
  offsetDays: number;
  events: Omit<DayEvent, "id">[];
}

export interface TemplatePreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  days: TemplateDay[];
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "civil-laique",
    label: "Mariage civil + laïque",
    emoji: "🏛",
    description: "Cérémonie à la mairie puis cérémonie laïque l'après-midi",
    days: [{
      label: "Jour J",
      offsetDays: 0,
      events: [
        { hour: 9, minute: 0, duration: 60, title: "Réveil & petit-déjeuner des mariés", category: "preparations", who: "Mariés", important: false, description: "Moment de calme avant la grande journée" },
        { hour: 10, minute: 0, duration: 90, title: "Coiffure & maquillage (côté mariée)", category: "preparations", who: "Mariée", important: false, description: "À domicile ou chez le prestataire" },
        { hour: 11, minute: 30, duration: 45, title: "Habillage de la mariée", category: "preparations", who: "Mariée", important: true, description: "Avec les témoins et proches" },
        { hour: 12, minute: 0, duration: 30, title: "Habillage du marié", category: "preparations", who: "Marié", important: false, description: "" },
        { hour: 12, minute: 30, duration: 60, title: "Photos des préparatifs", category: "photos", who: "Mariés", important: false, description: "Avec le photographe avant le départ" },
        { hour: 14, minute: 0, duration: 60, title: "Cérémonie civile (mairie)", category: "ceremonie", who: "Tous les invités", important: true, description: "Durée estimée 45 min" },
        { hour: 15, minute: 0, duration: 60, title: "Cocktail des photos", category: "cocktail", who: "Tous les invités", important: false, description: "Accueil des invités, photos de famille" },
        { hour: 16, minute: 0, duration: 60, title: "Cérémonie laïque", category: "ceremonie", who: "Tous les invités", important: true, description: "Au domaine ou en extérieur" },
        { hour: 17, minute: 0, duration: 120, title: "Vin d'honneur", category: "cocktail", who: "Tous les invités", important: true, description: "Réception en extérieur, musique d'ambiance" },
        { hour: 19, minute: 0, duration: 30, title: "Entrée en salle — discours", category: "diner", who: "Tous les invités", important: true, description: "Entrée des mariés + discours d'accueil" },
        { hour: 19, minute: 30, duration: 150, title: "Dîner assis", category: "diner", who: "Tous les invités", important: true, description: "Repas de mariage, discours, animations" },
        { hour: 22, minute: 0, duration: 30, title: "Pièce montée & première danse", category: "soiree", who: "Tous les invités", important: true, description: "Ouverture du bal des mariés" },
        { hour: 23, minute: 0, duration: 180, title: "Ouverture de la piste de danse", category: "soiree", who: "Tous les invités", important: false, description: "Animation DJ, soirée dansante" },
        { hour: 2, minute: 0, duration: 60, title: "Fin de soirée / navettes", category: "transport", who: "Tous les invités", important: false, description: "Départ des navettes pour les hôtels" },
      ],
    }],
  },
  {
    id: "religieux",
    label: "Mariage religieux",
    emoji: "⛪",
    description: "Cérémonie à l'église en fin d'après-midi, grande réception",
    days: [{
      label: "Jour J",
      offsetDays: 0,
      events: [
        { hour: 9, minute: 0, duration: 60, title: "Réveil & petit-déjeuner des mariés", category: "preparations", who: "Mariés", important: false, description: "" },
        { hour: 10, minute: 0, duration: 120, title: "Coiffure & maquillage de la mariée", category: "preparations", who: "Mariée", important: false, description: "À domicile ou en salon" },
        { hour: 11, minute: 0, duration: 60, title: "Habillage de la mariée", category: "preparations", who: "Mariée", important: true, description: "Avec les demoiselles d'honneur" },
        { hour: 12, minute: 0, duration: 30, title: "Habillage du marié", category: "preparations", who: "Marié", important: false, description: "" },
        { hour: 13, minute: 0, duration: 90, title: "Déjeuner léger en famille", category: "preparations", who: "Famille", important: false, description: "" },
        { hour: 14, minute: 0, duration: 30, title: "Arrivée des invités à l'église", category: "ceremonie", who: "Tous les invités", important: false, description: "Musique d'orgue, accueil par les témoins" },
        { hour: 14, minute: 30, duration: 30, title: "Cortège et entrée de la mariée", category: "ceremonie", who: "Mariée", important: true, description: "" },
        { hour: 15, minute: 0, duration: 90, title: "Cérémonie religieuse", category: "ceremonie", who: "Tous les invités", important: true, description: "Office religieux à l'église" },
        { hour: 16, minute: 30, duration: 30, title: "Sortie de l'église & haie d'honneur", category: "ceremonie", who: "Tous les invités", important: true, description: "Photos de groupe, lancé de pétales" },
        { hour: 17, minute: 0, duration: 30, title: "Séance photos couple", category: "photos", who: "Mariés", important: false, description: "Photos en extérieur" },
        { hour: 17, minute: 30, duration: 120, title: "Vin d'honneur", category: "cocktail", who: "Tous les invités", important: true, description: "Au domaine de réception" },
        { hour: 19, minute: 30, duration: 30, title: "Entrée en salle des mariés", category: "diner", who: "Tous les invités", important: true, description: "Discours d'accueil" },
        { hour: 20, minute: 0, duration: 180, title: "Dîner de mariage", category: "diner", who: "Tous les invités", important: true, description: "Repas assis, discours, animations" },
        { hour: 23, minute: 0, duration: 30, title: "Pièce montée & ouverture du bal", category: "soiree", who: "Tous les invités", important: true, description: "Première danse des mariés" },
        { hour: 23, minute: 30, duration: 150, title: "Soirée dansante", category: "soiree", who: "Tous les invités", important: false, description: "Animation DJ" },
      ],
    }],
  },
  {
    id: "intimiste",
    label: "Mariage intimiste",
    emoji: "🌿",
    description: "30–50 invités, ambiance décontractée, cocktail dînatoire",
    days: [{
      label: "Jour J",
      offsetDays: 0,
      events: [
        { hour: 10, minute: 0, duration: 60, title: "Réveil & brunch des mariés", category: "preparations", who: "Mariés", important: false, description: "Moment de calme, derniers préparatifs" },
        { hour: 11, minute: 0, duration: 90, title: "Coiffure & maquillage", category: "preparations", who: "Mariée", important: false, description: "" },
        { hour: 12, minute: 30, duration: 60, title: "Habillage & photos préparatifs", category: "preparations", who: "Mariés", important: false, description: "" },
        { hour: 14, minute: 0, duration: 30, title: "Accueil des proches", category: "ceremonie", who: "Tous les invités", important: false, description: "Arrivée progressive des invités" },
        { hour: 14, minute: 30, duration: 45, title: "Cérémonie intime", category: "ceremonie", who: "Tous les invités", important: true, description: "Ceremony laïque ou symbolique" },
        { hour: 15, minute: 15, duration: 45, title: "Photos de groupe & couple", category: "photos", who: "Tous les invités", important: false, description: "" },
        { hour: 16, minute: 0, duration: 120, title: "Cocktail en plein air", category: "cocktail", who: "Tous les invités", important: true, description: "Apéritif, jeux, musique douce" },
        { hour: 18, minute: 0, duration: 30, title: "Promenade des mariés & photos golden hour", category: "photos", who: "Mariés", important: false, description: "" },
        { hour: 18, minute: 30, duration: 30, title: "Discours des proches", category: "diner", who: "Tous les invités", important: false, description: "" },
        { hour: 19, minute: 0, duration: 150, title: "Dîner dînatoire / buffet", category: "diner", who: "Tous les invités", important: true, description: "Repas convivial, tables rondes" },
        { hour: 21, minute: 30, duration: 30, title: "Gâteau de mariage & pièce montée", category: "soiree", who: "Tous les invités", important: true, description: "Moment festif" },
        { hour: 22, minute: 0, duration: 120, title: "Soirée dansante ou musicale", category: "soiree", who: "Tous les invités", important: false, description: "" },
        { hour: 0, minute: 0, duration: 60, title: "Fin de soirée", category: "transport", who: "Tous les invités", important: false, description: "Raccompagnement des invités" },
      ],
    }],
  },
  {
    id: "oriental-2jours",
    label: "Mariage oriental 2 jours",
    emoji: "🌙",
    description: "Soirée Hénné la veille + Grande fête le Jour J",
    days: [
      {
        label: "J-1 · Hénné",
        offsetDays: -1,
        events: [
          { hour: 15, minute: 0, duration: 60, title: "Préparatifs & coiffure", category: "preparations", who: "Mariée", important: false, description: "Mise en beauté pour la soirée hénné" },
          { hour: 16, minute: 0, duration: 60, title: "Habillage de la mariée (caftan)", category: "preparations", who: "Mariée", important: true, description: "Tenue traditionnelle pour la soirée" },
          { hour: 17, minute: 0, duration: 60, title: "Accueil des invités", category: "ceremonie", who: "Tous les invités", important: false, description: "" },
          { hour: 18, minute: 0, duration: 30, title: "Cortège de la mariée", category: "henne", who: "Mariée", important: true, description: "Entrée de la mariée accompagnée de la famille" },
          { hour: 18, minute: 30, duration: 120, title: "Application du Mehndi de la mariée", category: "henne", who: "Mariée", important: true, description: "Artiste hénné — motifs traditionnels" },
          { hour: 19, minute: 0, duration: 180, title: "Soirée Hénné", category: "henne", who: "Tous les invités", important: true, description: "Musique, youyous, animations traditionnelles" },
          { hour: 20, minute: 0, duration: 30, title: "Youyous & musique orientale", category: "traditionnel", who: "Tous les invités", important: false, description: "" },
          { hour: 20, minute: 30, duration: 90, title: "Chants & danses traditionnels", category: "traditionnel", who: "Tous les invités", important: false, description: "" },
          { hour: 22, minute: 0, duration: 60, title: "Buffet de la soirée hénné", category: "diner", who: "Tous les invités", important: false, description: "" },
          { hour: 23, minute: 0, duration: 60, title: "Fin de soirée hénné", category: "transport", who: "Tous les invités", important: false, description: "" },
        ],
      },
      {
        label: "Jour J",
        offsetDays: 0,
        events: [
          { hour: 9, minute: 0, duration: 120, title: "Coiffure & maquillage de la mariée", category: "preparations", who: "Mariée", important: false, description: "" },
          { hour: 10, minute: 0, duration: 60, title: "Habillage du marié", category: "preparations", who: "Marié", important: false, description: "" },
          { hour: 12, minute: 0, duration: 60, title: "Habillage de la mariée (robe)", category: "preparations", who: "Mariée", important: true, description: "" },
          { hour: 14, minute: 0, duration: 60, title: "Cérémonie civile (mairie)", category: "ceremonie", who: "Tous les invités", important: true, description: "" },
          { hour: 15, minute: 0, duration: 90, title: "Cérémonie du Nikah", category: "traditionnel", who: "Famille", important: true, description: "Officié par l'imam en famille" },
          { hour: 16, minute: 0, duration: 30, title: "Lecture de la Fatiha", category: "traditionnel", who: "Famille", important: true, description: "" },
          { hour: 17, minute: 0, duration: 120, title: "Vin d'honneur & cocktail", category: "cocktail", who: "Tous les invités", important: true, description: "" },
          { hour: 18, minute: 0, duration: 45, title: "Zaffa — cortège musical", category: "traditionnel", who: "Tous les invités", important: true, description: "Entrée des mariés en musique" },
          { hour: 19, minute: 0, duration: 30, title: "Entrée en salle", category: "diner", who: "Tous les invités", important: true, description: "" },
          { hour: 19, minute: 30, duration: 180, title: "Dîner oriental", category: "diner", who: "Tous les invités", important: true, description: "" },
          { hour: 22, minute: 0, duration: 30, title: "Pièce montée & première danse", category: "soiree", who: "Tous les invités", important: true, description: "" },
          { hour: 22, minute: 30, duration: 180, title: "Soirée dansante — musique orientale & moderne", category: "soiree", who: "Tous les invités", important: false, description: "" },
        ],
      },
    ],
  },
  {
    id: "mariage-3jours",
    label: "Mariage sur 3 jours",
    emoji: "🗓",
    description: "Préparatifs & Hénné la veille · Grande fête · Brunch le lendemain",
    days: [
      {
        label: "J-1 · Préparatifs & Hénné",
        offsetDays: -1,
        events: [
          { hour: 10, minute: 0, duration: 120, title: "Essayage tenue de la mariée", category: "preparations", who: "Mariée", important: false, description: "" },
          { hour: 12, minute: 0, duration: 60, title: "Déjeuner en famille", category: "preparations", who: "Famille", important: false, description: "" },
          { hour: 14, minute: 0, duration: 60, title: "Rendez-vous coiffeur / esthéticienne", category: "preparations", who: "Mariée", important: false, description: "" },
          { hour: 15, minute: 0, duration: 120, title: "Application du Mehndi de la mariée", category: "henne", who: "Mariée", important: true, description: "Artiste hénné — motifs traditionnels" },
          { hour: 17, minute: 0, duration: 60, title: "Accueil des invités proches", category: "ceremonie", who: "Famille", important: false, description: "" },
          { hour: 18, minute: 0, duration: 30, title: "Cortège de la mariée", category: "henne", who: "Mariée", important: true, description: "" },
          { hour: 18, minute: 30, duration: 30, title: "Bénédiction familiale (Fatiha)", category: "traditionnel", who: "Famille", important: true, description: "" },
          { hour: 19, minute: 0, duration: 180, title: "Soirée Hénné", category: "henne", who: "Tous les invités", important: true, description: "Musique, animations, youyous" },
          { hour: 21, minute: 0, duration: 90, title: "Chants & danses traditionnels", category: "traditionnel", who: "Tous les invités", important: false, description: "" },
          { hour: 22, minute: 30, duration: 30, title: "Fin de soirée hénné", category: "transport", who: "Tous les invités", important: false, description: "" },
        ],
      },
      {
        label: "Jour J",
        offsetDays: 0,
        events: [
          { hour: 8, minute: 0, duration: 120, title: "Coiffure & maquillage de la mariée", category: "preparations", who: "Mariée", important: false, description: "" },
          { hour: 10, minute: 0, duration: 60, title: "Habillage du marié", category: "preparations", who: "Marié", important: false, description: "" },
          { hour: 11, minute: 0, duration: 60, title: "Habillage de la mariée", category: "preparations", who: "Mariée", important: true, description: "" },
          { hour: 12, minute: 0, duration: 60, title: "Photos des préparatifs", category: "photos", who: "Mariés", important: false, description: "" },
          { hour: 14, minute: 0, duration: 60, title: "Cérémonie civile", category: "ceremonie", who: "Tous les invités", important: true, description: "" },
          { hour: 15, minute: 0, duration: 90, title: "Cérémonie religieuse / laïque", category: "ceremonie", who: "Tous les invités", important: true, description: "" },
          { hour: 17, minute: 0, duration: 30, title: "Remise des cadeaux traditionnels", category: "traditionnel", who: "Famille", important: false, description: "" },
          { hour: 17, minute: 30, duration: 120, title: "Vin d'honneur", category: "cocktail", who: "Tous les invités", important: true, description: "" },
          { hour: 19, minute: 0, duration: 30, title: "Cérémonie du thé", category: "traditionnel", who: "Famille", important: false, description: "" },
          { hour: 20, minute: 0, duration: 30, title: "Entrée en salle des mariés", category: "diner", who: "Tous les invités", important: true, description: "" },
          { hour: 20, minute: 30, duration: 180, title: "Dîner de mariage", category: "diner", who: "Tous les invités", important: true, description: "" },
          { hour: 23, minute: 0, duration: 30, title: "Pièce montée & ouverture du bal", category: "soiree", who: "Tous les invités", important: true, description: "" },
          { hour: 23, minute: 30, duration: 180, title: "Soirée dansante", category: "soiree", who: "Tous les invités", important: false, description: "" },
        ],
      },
      {
        label: "J+1 · Brunch",
        offsetDays: 1,
        events: [
          { hour: 10, minute: 0, duration: 30, title: "Accueil des invités", category: "ceremonie", who: "Tous les invités", important: false, description: "" },
          { hour: 10, minute: 30, duration: 120, title: "Brunch du lendemain", category: "diner", who: "Tous les invités", important: true, description: "Buffet convivial, ambiance détendue" },
          { hour: 12, minute: 30, duration: 30, title: "Discours & remerciements", category: "ceremonie", who: "Tous les invités", important: false, description: "" },
          { hour: 13, minute: 0, duration: 30, title: "Photos souvenir du brunch", category: "photos", who: "Tous les invités", important: false, description: "" },
          { hour: 13, minute: 30, duration: 30, title: "Au revoir & départ des invités", category: "transport", who: "Tous les invités", important: false, description: "" },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Library suggestions                                                  */
/* ------------------------------------------------------------------ */

export interface LibrarySuggestion {
  title: string;
  hour: number;
  duration: number;
  cat: DayEvent["category"];
}

export interface LibraryTab {
  id: string;
  label: string;
  emoji: string;
  suggestions: LibrarySuggestion[];
}

export const LIBRARY_TABS: LibraryTab[] = [
  {
    id: "preparatifs",
    label: "Préparatifs",
    emoji: "🌅",
    suggestions: [
      { title: "Réveil et petit-déjeuner", hour: 7, duration: 60, cat: "preparations" },
      { title: "Coiffure de la mariée", hour: 8, duration: 120, cat: "preparations" },
      { title: "Maquillage de la mariée", hour: 9, duration: 90, cat: "preparations" },
      { title: "Coiffure et maquillage des témoins", hour: 9, duration: 60, cat: "preparations" },
      { title: "Habillage de la mariée", hour: 10, duration: 45, cat: "preparations" },
      { title: "Habillage du marié", hour: 10, duration: 30, cat: "preparations" },
      { title: "Séance photo préparatifs", hour: 10, duration: 45, cat: "photos" },
      { title: "Arrivée du photographe", hour: 8, duration: 30, cat: "technique" },
      { title: "Déjeuner léger", hour: 11, duration: 30, cat: "preparations" },
    ],
  },
  {
    id: "ceremonie",
    label: "Cérémonie",
    emoji: "💍",
    suggestions: [
      { title: "Départ de la mariée vers le lieu", hour: 13, duration: 30, cat: "transport" },
      { title: "Départ du marié vers le lieu", hour: 13, duration: 30, cat: "transport" },
      { title: "Accueil des invités", hour: 14, duration: 30, cat: "ceremonie" },
      { title: "Cérémonie civile (mairie)", hour: 11, duration: 60, cat: "ceremonie" },
      { title: "Cérémonie religieuse", hour: 15, duration: 90, cat: "ceremonie" },
      { title: "Cérémonie laïque", hour: 15, duration: 60, cat: "ceremonie" },
      { title: "Sortie des mariés / haie d'honneur", hour: 16, duration: 30, cat: "ceremonie" },
      { title: "Lancé du bouquet", hour: 16, duration: 15, cat: "ceremonie" },
      { title: "Photos de famille", hour: 16, duration: 60, cat: "photos" },
    ],
  },
  {
    id: "cocktail",
    label: "Cocktail & Photos",
    emoji: "🥂",
    suggestions: [
      { title: "Cocktail d'accueil", hour: 17, duration: 120, cat: "cocktail" },
      { title: "Séance photo en couple (trash the dress)", hour: 17, duration: 60, cat: "photos" },
      { title: "Photos de groupe", hour: 17, duration: 30, cat: "photos" },
      { title: "Animation cocktail (vin d'honneur)", hour: 17, duration: 90, cat: "cocktail" },
      { title: "Discours des témoins (cocktail)", hour: 18, duration: 20, cat: "cocktail" },
    ],
  },
  {
    id: "diner",
    label: "Dîner",
    emoji: "🍽",
    suggestions: [
      { title: "Installation des invités en salle", hour: 19, duration: 30, cat: "diner" },
      { title: "Entrée des mariés en salle", hour: 19, duration: 15, cat: "diner" },
      { title: "Discours de bienvenue", hour: 19, duration: 15, cat: "diner" },
      { title: "Dîner / Repas de mariage", hour: 19, duration: 150, cat: "diner" },
      { title: "Pièce montée / Gâteau", hour: 22, duration: 30, cat: "diner" },
      { title: "Discours des parents", hour: 21, duration: 20, cat: "diner" },
      { title: "Projection de diaporama", hour: 21, duration: 15, cat: "diner" },
    ],
  },
  {
    id: "soiree",
    label: "Soirée",
    emoji: "🎉",
    suggestions: [
      { title: "Ouverture de bal", hour: 22, duration: 30, cat: "soiree" },
      { title: "Animation DJ", hour: 22, duration: 300, cat: "soiree" },
      { title: "Concert / Groupe live", hour: 22, duration: 120, cat: "soiree" },
      { title: "Feu d'artifice", hour: 23, duration: 20, cat: "soiree" },
      { title: "Bouquet final / Sparklers", hour: 0, duration: 15, cat: "soiree" },
      { title: "Buffet nocturne", hour: 1, duration: 60, cat: "soiree" },
      { title: "Fin de soirée", hour: 3, duration: 30, cat: "soiree" },
    ],
  },
  {
    id: "technique",
    label: "Technique & Logistique",
    emoji: "⚙️",
    suggestions: [
      { title: "Installation fleurs et décoration", hour: 8, duration: 180, cat: "technique" },
      { title: "Arrivée du traiteur", hour: 10, duration: 60, cat: "technique" },
      { title: "Installation du DJ/musiciens", hour: 14, duration: 90, cat: "technique" },
      { title: "Installation du plan de table", hour: 16, duration: 30, cat: "technique" },
      { title: "Remise des clés du lieu", hour: 7, duration: 30, cat: "technique" },
      { title: "Check sécurité / accès", hour: 13, duration: 30, cat: "technique" },
    ],
  },
  {
    id: "culturel",
    label: "Culturel & Traditionnel",
    emoji: "🌍",
    suggestions: [
      { title: "Soirée Hénné", hour: 19, duration: 180, cat: "henne" },
      { title: "Application du Mehndi de la mariée", hour: 15, duration: 120, cat: "henne" },
      { title: "Zaffa — cortège musical", hour: 18, duration: 45, cat: "traditionnel" },
      { title: "Cérémonie du Nikah", hour: 15, duration: 90, cat: "traditionnel" },
      { title: "Lecture de la Fatiha", hour: 16, duration: 20, cat: "traditionnel" },
      { title: "Houppa — cérémonie juive", hour: 18, duration: 90, cat: "traditionnel" },
      { title: "Bris du verre", hour: 19, duration: 15, cat: "traditionnel" },
      { title: "Danse Hora", hour: 20, duration: 30, cat: "traditionnel" },
      { title: "Remise des cadeaux traditionnels", hour: 17, duration: 45, cat: "traditionnel" },
      { title: "Youyous & musique orientale", hour: 20, duration: 30, cat: "traditionnel" },
      { title: "Bénédiction familiale (Fatiha)", hour: 10, duration: 30, cat: "traditionnel" },
      { title: "Cérémonie du thé", hour: 16, duration: 60, cat: "traditionnel" },
      { title: "Cortège de la mariée", hour: 19, duration: 30, cat: "henne" },
      { title: "Chants & danses traditionnels", hour: 21, duration: 90, cat: "traditionnel" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

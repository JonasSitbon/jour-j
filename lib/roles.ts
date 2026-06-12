// ─── Collaborator role system ─────────────────────────────────────────────────

export type CollaboratorRoleName =
  | "owner"
  | "admin"
  | "coordinateur"
  | "dj"
  | "traiteur"
  | "photographe"
  | "lecteur";

// ─── All page IDs (matches NAV_GROUPS in shell.tsx) ──────────────────────────

export const ALL_PAGE_IDS = [
  "dashboard",
  "dates",
  "checklist",
  "timeline",
  "dayj",
  "ceremony",
  "music",
  "guests",
  "vendors",
  "gifts",
  "contacts",
  "budget",
  "payments",
  "journal",
  "moodboard",
  "settings",
] as const;

export type PageId = (typeof ALL_PAGE_IDS)[number];

// ─── Role metadata ────────────────────────────────────────────────────────────

export const COLLABORATOR_ROLES: Record<
  CollaboratorRoleName,
  { label: string; emoji: string; description: string; defaultPages: string[]; canEdit: boolean }
> = {
  owner: {
    label: "Propriétaire",
    emoji: "👑",
    description: "Accès complet à toutes les fonctionnalités",
    defaultPages: [...ALL_PAGE_IDS],
    canEdit: true,
  },
  admin: {
    label: "Administrateur",
    emoji: "🛡",
    description: "Peut tout modifier sauf les paramètres du compte",
    defaultPages: ALL_PAGE_IDS.filter((p) => p !== "settings"),
    canEdit: true,
  },
  coordinateur: {
    label: "Coordinateur",
    emoji: "📋",
    description: "Gère la logistique du jour J et les invités",
    defaultPages: ["dashboard", "dayj", "guests", "vendors", "checklist", "timeline", "ceremony"],
    canEdit: true,
  },
  dj: {
    label: "DJ / Musicien",
    emoji: "🎵",
    description: "Accès aux playlists, déroulé et programme cérémonie",
    defaultPages: ["music", "dayj", "ceremony"],
    canEdit: true,
  },
  traiteur: {
    label: "Traiteur",
    emoji: "🍽",
    description: "Consulte les invités, le budget et le déroulé",
    defaultPages: ["guests", "budget", "dayj"],
    canEdit: false,
  },
  photographe: {
    label: "Photographe",
    emoji: "📷",
    description: "Accès au déroulé, cérémonie, musique et timeline",
    defaultPages: ["dayj", "ceremony", "music", "timeline"],
    canEdit: false,
  },
  lecteur: {
    label: "Lecteur",
    emoji: "👁",
    description: "Lecture seule sur le tableau de bord et le déroulé",
    defaultPages: ["dashboard", "dayj"],
    canEdit: false,
  },
};

// ─── Default permissions per role ─────────────────────────────────────────────

export const DEFAULT_ROLE_PERMISSIONS: Record<CollaboratorRoleName, string[]> = Object.fromEntries(
  (Object.entries(COLLABORATOR_ROLES) as [CollaboratorRoleName, (typeof COLLABORATOR_ROLES)[CollaboratorRoleName]][]).map(
    ([role, meta]) => [role, meta.defaultPages]
  )
) as Record<CollaboratorRoleName, string[]>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the given role can access the given page.
 * customPermissions overrides the role defaults if provided.
 */
export function canAccessPage(
  role: CollaboratorRoleName,
  pageId: string,
  customPermissions?: string[]
): boolean {
  // owner and admin always have full access
  if (role === "owner" || role === "admin") return true;
  const allowed = customPermissions ?? DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  return allowed.includes(pageId);
}

// ─── NAV_GROUPS definition (mirrors shell.tsx) ────────────────────────────────

const NAV_GROUPS_DEFINITION = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    items: [
      { id: "dashboard", label: "Tableau de bord",    icon: "grid"     },
      { id: "dates",     label: "Sélecteur de dates", icon: "calendar" },
    ],
  },
  {
    id: "planning",
    label: "Planification",
    items: [
      { id: "checklist",  label: "Checklist",           icon: "check-circle" },
      { id: "timeline",   label: "Timeline",             icon: "list"         },
      { id: "dayj",       label: "Déroulé du Jour J",   icon: "clock"        },
      { id: "ceremony",   label: "Programme cérémonie",  icon: "rings"        },
      { id: "music",      label: "Musique & playlist",   icon: "music"        },
    ],
  },
  {
    id: "people",
    label: "Personnes",
    items: [
      { id: "guests",     label: "Invités",              icon: "users"        },
      { id: "vendors",    label: "Prestataires",         icon: "file"         },
      { id: "gifts",      label: "Cadeaux",              icon: "sparkle"      },
      { id: "contacts",   label: "Personnes clés",       icon: "key"          },
    ],
  },
  {
    id: "finance",
    label: "Finances",
    items: [
      { id: "budget",     label: "Budget",               icon: "wallet"       },
      { id: "payments",   label: "Paiements",            icon: "card"         },
    ],
  },
  {
    id: "creative",
    label: "Espace créatif",
    items: [
      { id: "journal",    label: "Journal de bord",      icon: "edit"         },
      { id: "moodboard",  label: "Mood Board",           icon: "sparkle"      },
    ],
  },
];

/**
 * Returns the filtered NAV_GROUPS for the given role.
 * Groups with no accessible items are omitted entirely.
 * customPermissions overrides the defaults if provided.
 */
export function getFilteredNavGroups(
  role: CollaboratorRoleName,
  customPermissions?: string[]
) {
  // owner and admin always see everything
  if (role === "owner" || role === "admin") return NAV_GROUPS_DEFINITION;

  return NAV_GROUPS_DEFINITION
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessPage(role, item.id, customPermissions)),
    }))
    .filter((group) => group.items.length > 0);
}

// ─── WeddingRole → CollaboratorRoleName mapping ───────────────────────────────

import type { WeddingRole } from "./types";

export function weddingRoleToCollaboratorRole(role: WeddingRole): CollaboratorRoleName {
  switch (role) {
    case "owner":  return "owner";
    case "admin":  return "admin";
    case "editor": return "coordinateur";
    case "viewer": return "lecteur";
  }
}

"use client";

import { useState, useEffect } from "react";
import {
  COLLABORATOR_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_PAGE_IDS,
  type CollaboratorRoleName,
} from "@/lib/roles";

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "jj_admin_role_permissions";

function loadPermissions(): Record<CollaboratorRoleName, string[]> {
  if (typeof window === "undefined") return { ...DEFAULT_ROLE_PERMISSIONS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_ROLE_PERMISSIONS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_ROLE_PERMISSIONS };
}

// ─── Page labels ──────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  dashboard:  "Tableau de bord",
  dates:      "Dates",
  checklist:  "Checklist",
  timeline:   "Timeline",
  dayj:       "Jour J",
  ceremony:   "Cérémonie",
  music:      "Musique",
  guests:     "Invités",
  vendors:    "Prestataires",
  gifts:      "Cadeaux",
  contacts:   "Contacts",
  budget:     "Budget",
  payments:   "Paiements",
  journal:    "Journal",
  moodboard:  "Moodboard",
  settings:   "Paramètres",
};

// ─── Page groups for the column headers ───────────────────────────────────────

const PAGE_GROUPS = [
  { label: "Vue d'ensemble", pages: ["dashboard", "dates"] },
  { label: "Planification",  pages: ["checklist", "timeline", "dayj", "ceremony", "music"] },
  { label: "Personnes",      pages: ["guests", "vendors", "gifts", "contacts"] },
  { label: "Finances",       pages: ["budget", "payments"] },
  { label: "Créatif",        pages: ["journal", "moodboard"] },
  { label: "Compte",         pages: ["settings"] },
];

const PAGES_IN_ORDER = PAGE_GROUPS.flatMap((g) => g.pages);

// ─── Roles to display (owner and admin are fixed — we skip them) ──────────────

const EDITABLE_ROLES: CollaboratorRoleName[] = [
  "coordinateur",
  "dj",
  "traiteur",
  "photographe",
  "lecteur",
];

// ─── Checkbox cell ────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-5 h-5 rounded flex items-center justify-center border transition-colors"
      style={{
        background: checked ? "#C96E2C" : "transparent",
        borderColor: checked ? "#C96E2C" : "#2a2a3e",
      }}
    >
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminRolesPage() {
  const [permissions, setPermissions] = useState<Record<CollaboratorRoleName, string[]>>(
    () => DEFAULT_ROLE_PERMISSIONS
  );
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setPermissions(loadPermissions());
  }, []);

  const toggle = (role: CollaboratorRoleName, pageId: string) => {
    setPermissions((prev) => {
      const current = prev[role] ?? [];
      const next = current.includes(pageId)
        ? current.filter((p) => p !== pageId)
        : [...current, pageId];
      return { ...prev, [role]: next };
    });
    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
  };

  const handleReset = () => {
    setPermissions({ ...DEFAULT_ROLE_PERMISSIONS });
    setSaved(false);
  };

  return (
    <div style={{ background: "#0f1117", minHeight: "100vh", padding: "32px 24px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: "#f0ead8", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Gestion des permissions par rôle
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 13.5, lineHeight: 1.6, maxWidth: 580 }}>
            Ces permissions sont les <strong style={{ color: "#f0ead8" }}>défauts appliqués lors d'une invitation</strong>.
            Le couple peut les personnaliser individuellement pour chaque collaborateur.
          </p>
        </div>

        {/* Fixed roles info */}
        <div
          style={{
            background: "#1a1a2e",
            border: "1px solid #2a2a3e",
            borderRadius: 10,
            padding: "14px 18px",
            marginBottom: 24,
            display: "flex",
            gap: 24,
          }}
        >
          {(["owner", "admin"] as CollaboratorRoleName[]).map((role) => {
            const meta = COLLABORATOR_ROLES[role];
            return (
              <div key={role} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                <div>
                  <div style={{ color: "#f0ead8", fontSize: 13, fontWeight: 600 }}>{meta.label}</div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>Accès complet — non configurable</div>
                </div>
                <div
                  style={{
                    marginLeft: 8,
                    padding: "2px 8px",
                    background: "#C96E2C22",
                    border: "1px solid #C96E2C55",
                    borderRadius: 4,
                    color: "#C96E2C",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Tout
                </div>
              </div>
            );
          })}
        </div>

        {/* Main table */}
        <div
          style={{
            background: "#1a1a2e",
            border: "1px solid #2a2a3e",
            borderRadius: 12,
            overflow: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              {/* Group row */}
              <tr style={{ borderBottom: "1px solid #2a2a3e" }}>
                <th
                  style={{
                    width: 180,
                    padding: "16px 20px",
                    textAlign: "left",
                    color: "#9ca3af",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#1a1a2e",
                  }}
                >
                  Rôle
                </th>
                {PAGE_GROUPS.map((group) => (
                  <th
                    key={group.label}
                    colSpan={group.pages.length}
                    style={{
                      padding: "10px 8px",
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: 10.5,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      borderLeft: "1px solid #2a2a3e",
                    }}
                  >
                    {group.label}
                  </th>
                ))}
              </tr>

              {/* Page name row */}
              <tr style={{ borderBottom: "2px solid #2a2a3e" }}>
                <th style={{ padding: "8px 20px", background: "#1a1a2e" }} />
                {PAGES_IN_ORDER.map((pageId, i) => {
                  const isFirstInGroup = PAGE_GROUPS.some((g) => g.pages[0] === pageId);
                  return (
                    <th
                      key={pageId}
                      style={{
                        padding: "6px 4px",
                        textAlign: "center",
                        color: "#f0ead8",
                        fontSize: 11,
                        fontWeight: 500,
                        borderLeft: isFirstInGroup ? "1px solid #2a2a3e" : undefined,
                        minWidth: 54,
                        maxWidth: 68,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          fontSize: 11,
                          whiteSpace: "nowrap",
                          paddingBottom: 4,
                        }}
                      >
                        {PAGE_LABELS[pageId] ?? pageId}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {EDITABLE_ROLES.map((role, rowIdx) => {
                const meta = COLLABORATOR_ROLES[role];
                const allowed = permissions[role] ?? [];
                return (
                  <tr
                    key={role}
                    style={{
                      borderBottom: rowIdx < EDITABLE_ROLES.length - 1 ? "1px solid #2a2a3e" : undefined,
                      background: rowIdx % 2 === 1 ? "#15152800" : "transparent",
                    }}
                  >
                    {/* Role cell */}
                    <td style={{ padding: "14px 20px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                        <div>
                          <div style={{ color: "#f0ead8", fontSize: 13.5, fontWeight: 600 }}>
                            {meta.label}
                          </div>
                          <div style={{ color: "#9ca3af", fontSize: 11.5, marginTop: 1 }}>
                            {meta.canEdit ? "Peut modifier" : "Lecture seule"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Permission checkboxes */}
                    {PAGES_IN_ORDER.map((pageId) => {
                      const isFirstInGroup = PAGE_GROUPS.some((g) => g.pages[0] === pageId);
                      return (
                        <td
                          key={pageId}
                          style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                            padding: "14px 4px",
                            borderLeft: isFirstInGroup ? "1px solid #2a2a3e" : undefined,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <Checkbox
                              checked={allowed.includes(pageId)}
                              onChange={() => toggle(role, pageId)}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#1a1a2e",
              border: "1px solid #2a2a3e",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12.5,
              color: "#9ca3af",
              maxWidth: 500,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6.5" stroke="#9ca3af" strokeWidth="1.2" />
              <rect x="7" y="6.5" width="1" height="5" rx=".5" fill="#9ca3af" />
              <rect x="7" y="4" width="1" height="1.5" rx=".5" fill="#9ca3af" />
            </svg>
            Ces permissions sont stockées localement et appliquées par défaut lors des nouvelles invitations.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleReset}
              style={{
                padding: "9px 18px",
                background: "transparent",
                border: "1px solid #2a2a3e",
                borderRadius: 7,
                color: "#9ca3af",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "border-color .15s, color .15s",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#9ca3af";
                (e.currentTarget as HTMLButtonElement).style.color = "#f0ead8";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a3e";
                (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
              }}
            >
              Réinitialiser
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "9px 22px",
                background: saved ? "#3a7a3a" : "#C96E2C",
                border: "none",
                borderRadius: 7,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background .2s",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              {saved ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sauvegardé
                </>
              ) : (
                "Sauvegarder"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

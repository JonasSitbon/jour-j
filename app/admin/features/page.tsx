"use client";

import { useEffect, useState } from "react";

interface Feature {
  id: string;
  label: string;
  description: string;
  section: string;
  default: boolean;
}

const FEATURES: Feature[] = [
  {
    id: "music_search",
    label: "Recherche musicale iTunes",
    description: "Permet aux couples de rechercher des morceaux via iTunes",
    section: "Planning",
    default: true,
  },
  {
    id: "weather_dates",
    label: "Météo sur les dates candidates",
    description:
      "Affiche la météo prévue sur la page de sélection de dates",
    section: "Planning",
    default: true,
  },
  {
    id: "country_holidays",
    label: "Jours fériés pays étrangers",
    description:
      "Affichage des jours fériés d'autres pays sur la page Dates",
    section: "Planning",
    default: true,
  },
  {
    id: "moodboard",
    label: "Mood Board",
    description: "Section créative avec épingle d'images",
    section: "Créatif",
    default: true,
  },
  {
    id: "journal",
    label: "Journal de bord",
    description: "Journal privé du couple",
    section: "Créatif",
    default: true,
  },
  {
    id: "pdf_export",
    label: "Export PDF",
    description: "Génération de PDFs pour toutes les sections",
    section: "Export",
    default: true,
  },
  {
    id: "realtime_sync",
    label: "Synchronisation temps réel",
    description: "Sync live entre appareils via Supabase Realtime",
    section: "Technique",
    default: true,
  },
  {
    id: "notifications",
    label: "Notifications push",
    description: "Alertes et rappels pour les échéances",
    section: "Technique",
    default: true,
  },
  {
    id: "multi_wedding",
    label: "Multi-mariage",
    description: "Gestion de plusieurs mariages par compte",
    section: "Compte",
    default: true,
  },
  {
    id: "rsvp_portal",
    label: "Portail RSVP",
    description: "Lien unique pour la réponse des invités",
    section: "Invités",
    default: true,
  },
];

const STORAGE_KEY = "jj_admin_features";

const SECTION_COLORS: Record<string, string> = {
  Planning: "#60a5fa",
  Créatif: "#c084fc",
  Export: "#fb923c",
  Technique: "#4ade80",
  Compte: "#f472b6",
  Invités: "#fbbf24",
};

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-checked={enabled}
      role="switch"
      className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#1a1a2e]"
      style={{
        background: enabled ? "#4ade80" : "#374151",
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function FeaturesPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    FEATURES.forEach((f) => {
      defaults[f.id] = f.default;
    });
    return defaults;
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        setEnabled((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage on change
  function save(next: Record<string, boolean>) {
    setEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function toggle(id: string) {
    save({ ...enabled, [id]: !enabled[id] });
  }

  function enableAll() {
    const next: Record<string, boolean> = {};
    FEATURES.forEach((f) => (next[f.id] = true));
    save(next);
  }

  function disableAll() {
    const next: Record<string, boolean> = {};
    FEATURES.forEach((f) => (next[f.id] = false));
    save(next);
  }

  const allEnabled = FEATURES.every((f) => enabled[f.id]);
  const allDisabled = FEATURES.every((f) => !enabled[f.id]);
  const enabledCount = FEATURES.filter((f) => enabled[f.id]).length;

  // Group by section preserving order
  const sections: string[] = [];
  FEATURES.forEach((f) => {
    if (!sections.includes(f.section)) sections.push(f.section);
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#f0ead8" }}>
            Fonctionnalités
          </h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Activez ou désactivez les fonctionnalités de la plateforme
          </p>
        </div>

        {/* Global controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm mr-1" style={{ color: "#6b7280" }}>
            {enabledCount}/{FEATURES.length} actives
          </span>
          <button
            onClick={enableAll}
            disabled={allEnabled}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-opacity disabled:opacity-40"
            style={{
              background: "#4ade8022",
              color: "#4ade80",
              borderColor: "#4ade8044",
            }}
          >
            Tout activer
          </button>
          <button
            onClick={disableAll}
            disabled={allDisabled}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-opacity disabled:opacity-40"
            style={{
              background: "#37415122",
              color: "#9ca3af",
              borderColor: "#37415144",
            }}
          >
            Tout désactiver
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-8">
        {sections.map((section) => {
          const features = FEATURES.filter((f) => f.section === section);
          const sectionColor = SECTION_COLORS[section] ?? "#9ca3af";
          const sectionEnabled = features.filter((f) => enabled[f.id]).length;

          return (
            <div key={section}>
              {/* Section header */}
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: `${sectionColor}22`,
                    color: sectionColor,
                    border: `1px solid ${sectionColor}44`,
                  }}
                >
                  {section}
                </span>
                <span className="text-xs" style={{ color: "#4b5563" }}>
                  {sectionEnabled}/{features.length} actives
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "#2a2a3e" }}
                />
              </div>

              {/* Feature cards */}
              <div className="flex flex-col gap-2">
                {features.map((feature) => {
                  const isEnabled = enabled[feature.id] ?? feature.default;
                  return (
                    <div
                      key={feature.id}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-colors"
                      style={{
                        background: "#1a1a2e",
                        borderColor: isEnabled ? `${sectionColor}33` : "#2a2a3e",
                      }}
                    >
                      {/* Status dot */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: isEnabled ? sectionColor : "#374151",
                        }}
                      />

                      {/* Label & description */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium"
                          style={{ color: isEnabled ? "#f0ead8" : "#6b7280" }}
                        >
                          {feature.label}
                        </div>
                        <div
                          className="text-xs mt-0.5 truncate"
                          style={{ color: "#4b5563" }}
                        >
                          {feature.description}
                        </div>
                      </div>

                      {/* Section badge (small) */}
                      <span
                        className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: `${sectionColor}18`,
                          color: sectionColor,
                        }}
                      >
                        {feature.section}
                      </span>

                      {/* Toggle */}
                      <Toggle
                        enabled={isEnabled}
                        onToggle={() => toggle(feature.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div
        className="mt-8 rounded-xl px-5 py-4 border flex items-start gap-3"
        style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
      >
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold"
          style={{ background: "#60a5fa22", color: "#60a5fa" }}
        >
          i
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
          Ces paramètres sont stockés localement (
          <code
            className="text-[11px] px-1 py-0.5 rounded"
            style={{ background: "#0f1117", color: "#9ca3af" }}
          >
            localStorage
          </code>
          ). Une intégration Supabase permettra de les propager à tous les
          utilisateurs.
        </p>
      </div>
    </div>
  );
}

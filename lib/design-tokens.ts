/**
 * Jour J — Design Tokens
 * Source of truth for the premium design system.
 * CSS variables in globals.css mirror these values.
 *
 * Typography hierarchy:
 *   h1  → 28px / bold / tracking -0.02em
 *   h2  → 20px / semibold / tracking -0.015em
 *   h3  → 16px / medium
 *   body → 14px / regular
 *   label → 12px / medium / uppercase / tracking 0.06em
 *   small → 11px / regular
 *
 * Layout:
 *   sidebar 220px → 52px collapsed
 *   content max-width 960px
 *   page padding 40px
 *   section gap 40px+
 */

export const tokens = {
  colors: {
    // Backgrounds
    bg:        "#FAFAF8",
    bg2:       "#F3F3F0",
    surface:   "#FFFFFF",
    surface2:  "#F7F7F5",
    surface3:  "#EDEDEA",
    hover:     "#F5F5F2",

    // Accent — Terracotta
    primary:       "#B5622E",
    primaryHover:  "#A0551F",
    primaryDeep:   "#8A3D18",
    primarySoft:   "#FBF0E8",
    primarySofter: "#FEF7F2",
    onPrimary:     "#FFFFFF",

    // Semantic
    sage:      "#4A7C59",
    sageSoft:  "#EDF5F0",
    coral:     "#C94A3F",
    coralSoft: "#FBEAEA",
    gold:      "#B08A2E",
    goldSoft:  "#F6EDD3",
    goldInk:   "#7A5C14",

    // Text
    text:  "#0F0F0F",
    text2: "#6B6B6B",
    text3: "#9B9B9B",

    // Borders
    border:       "#E8E8E4",
    borderStrong: "#D4D4CE",
  },

  shadows: {
    xs:      "0 1px 2px rgba(0,0,0,.04)",
    sm:      "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
    md:      "0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.05)",
    lg:      "0 12px 32px rgba(0,0,0,.10), 0 4px 10px rgba(0,0,0,.06)",
    primary: "0 4px 14px rgba(181,98,46,.25)",
    sidebar: "1px 0 0 0 #E8E8E4, 4px 0 16px rgba(0,0,0,.04)",
  },

  radius: {
    sm:   "6px",
    md:   "8px",
    card: "8px",
    lg:   "10px",
    full: "9999px",
  },

  typography: {
    h1:    { size: "28px", weight: 700,  tracking: "-0.02em"  },
    h2:    { size: "20px", weight: 600,  tracking: "-0.015em" },
    h3:    { size: "16px", weight: 500,  tracking: "-0.01em"  },
    body:  { size: "14px", weight: 400,  tracking: "0"        },
    label: { size: "12px", weight: 500,  tracking: "0.06em", transform: "uppercase" },
    small: { size: "11px", weight: 400,  tracking: "0"        },
  },

  layout: {
    sidebar:          "220px",
    sidebarCollapsed:  "52px",
    contentMax:       "960px",
    headerHeight:      "52px",
    sectionGap:        "40px",
    pagePadding:       "32px",
  },
} as const;

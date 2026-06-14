"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type AdminThemeId = "default" | "citron";

export interface AdminThemeColors {
  id: AdminThemeId;
  // Primary accent (orange vs lemon yellow)
  accent: string;       // button bg, strong badge bg, colored border
  accentSoft: string;   // subtle tinted bg (info box, sidebar active bg)
  accentBorder: string; // rgba border string
  accentHue: string;    // text colored in the accent (sidebar link, links)
  accentInk: string;    // text ON accent bg (button label)
  // Table / separator colors
  line: string;         // default border/separator
  lineSoft: string;     // softer separator
  // Sidebar specific
  sidebarActiveBg: string;
  sidebarActiveBorder: string;
}

const THEMES: Record<AdminThemeId, AdminThemeColors> = {
  default: {
    id: "default",
    accent: "#C96E2C",
    accentSoft: "#fff7ed",
    accentBorder: "rgba(201,110,44,0.2)",
    accentHue: "#C96E2C",
    accentInk: "#ffffff",
    line: "#e5e7eb",
    lineSoft: "#f0f0f0",
    sidebarActiveBg: "#fff7ed",
    sidebarActiveBorder: "#C96E2C",
  },
  citron: {
    id: "citron",
    accent: "#C8B600",
    accentSoft: "#FDFBE6",
    accentBorder: "rgba(200,182,0,0.28)",
    accentHue: "#7A6C00",
    accentInk: "#2E2800",
    line: "#8A9A52",
    lineSoft: "#C8D494",
    sidebarActiveBg: "#FDFBE6",
    sidebarActiveBorder: "#C8B600",
  },
};

interface AdminThemeCtxValue {
  tc: AdminThemeColors;
  setAdminTheme: (id: AdminThemeId) => void;
}

export const AdminThemeCtx = createContext<AdminThemeCtxValue>({
  tc: THEMES.default,
  setAdminTheme: () => {},
});

export function useAdminTheme() {
  return useContext(AdminThemeCtx);
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [tc, setTc] = useState<AdminThemeColors>(THEMES.default);

  useEffect(() => {
    const saved = localStorage.getItem("jj_admin_theme") as AdminThemeId | null;
    if (saved && THEMES[saved]) setTc(THEMES[saved]);
  }, []);

  function setAdminTheme(id: AdminThemeId) {
    setTc(THEMES[id]);
    localStorage.setItem("jj_admin_theme", id);
  }

  return (
    <AdminThemeCtx.Provider value={{ tc, setAdminTheme }}>
      {children}
    </AdminThemeCtx.Provider>
  );
}

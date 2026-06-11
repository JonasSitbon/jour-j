"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import type { AppState } from "@/lib/types";
import { initialState } from "@/lib/data";
import { loadAll, syncKey } from "@/lib/db";

/* ----------------------------- Store ----------------------------- */
type Updater<K extends keyof AppState> = AppState[K] | ((prev: AppState[K]) => AppState[K]);
interface StoreApi {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: Updater<K>) => void;
  reloadAll: () => Promise<void>;
  SIDES: { A: string; B: string };
}
const StoreCtx = createContext<StoreApi | null>(null);

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within <Providers>");
  return ctx;
}

/* ----------------------------- Theme ----------------------------- */
type Theme = "light" | "dark";
const ThemeCtx = createContext<{
  theme: Theme; setTheme: (t: Theme) => void;
  weddingTheme: string; setWeddingTheme: (t: string) => void;
}>({ theme: "light", setTheme: () => {}, weddingTheme: "boheme", setWeddingTheme: () => {} });
export const useTheme = () => useContext(ThemeCtx);

/* ----------------------------- Toast ----------------------------- */
interface Toast { id: number; msg: string; type: "ok" | "err"; }
const ToastCtx = createContext<(msg: string, type?: "ok" | "err") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

/* --------------------------- Providers --------------------------- */
export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [state, setState] = useState<AppState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const publicPaths = ["/login", "/signup", "/onboarding"];
    const isPublic = publicPaths.some((p) => pathname.startsWith(p));

    loadAll()
      .then((data) => {
        if (data) {
          setState((s) => ({ ...s, ...data }));
          setLoading(false);
        } else if (!isPublic) {
          router.push("/onboarding");
          // on garde loading=true pendant la navigation pour éviter le flash
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isPublic) {
          router.push("/onboarding");
        } else {
          setLoading(false);
        }
      });
  }, []);

  const reloadAll = useCallback(async () => {
    const data = await loadAll();
    if (data) setState((s) => ({ ...s, ...data }));
  }, []);

  const update = useCallback(<K extends keyof AppState>(key: K, value: Updater<K>) => {
    setState((s) => {
      const prevVal = s[key];
      const newVal = typeof value === "function" ? (value as any)(prevVal) : value;
      void syncKey(key, newVal, prevVal);
      return { ...s, [key]: newVal };
    });
  }, []);

  const [theme, setThemeState] = useState<Theme>("light");
  useEffect(() => {
    const saved = (localStorage.getItem("jj_theme") as Theme) || "light";
    setThemeState(saved);
  }, []);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("jj_theme", t);
  }, []);
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  const [weddingTheme, setWeddingThemeState] = useState<string>("boheme");
  useEffect(() => {
    const saved = localStorage.getItem("jj_wedding_theme") || "boheme";
    setWeddingThemeState(saved);
  }, []);
  const setWeddingTheme = useCallback((t: string) => {
    setWeddingThemeState(t);
    if (t === "boheme") document.documentElement.removeAttribute("data-wedding-theme");
    else document.documentElement.setAttribute("data-wedding-theme", t);
    localStorage.setItem("jj_wedding_theme", t);
  }, []);
  useEffect(() => {
    if (weddingTheme === "boheme") document.documentElement.removeAttribute("data-wedding-theme");
    else document.documentElement.setAttribute("data-wedding-theme", weddingTheme);
  }, [weddingTheme]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const isPublicPage = ["/login", "/signup", "/onboarding"].some((p) => pathname.startsWith(p));
  const showSpinner = loading && !isPublicPage;

  return (
    <StoreCtx.Provider value={{ state, update, reloadAll, SIDES: { A: state.wedding.partnerA, B: state.wedding.partnerB } }}>
      <ThemeCtx.Provider value={{ theme, setTheme, weddingTheme, setWeddingTheme }}>
        <ToastCtx.Provider value={pushToast}>
          {showSpinner ? (
            <div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--bg)" }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                <span className="text-sm" style={{ color: "var(--text-2)" }}>Chargement…</span>
              </div>
            </div>
          ) : children}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] flex flex-col-reverse gap-2 items-center pointer-events-none">
            <AnimatePresence mode="popLayout">
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88, y: 10, transition: { duration: 0.18, ease: "easeIn" } }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  className="flex items-center gap-3 bg-text text-bg px-[18px] py-3 rounded-full shadow-lg text-sm font-medium pointer-events-auto"
                >
                  {t.msg}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ToastCtx.Provider>
      </ThemeCtx.Provider>
    </StoreCtx.Provider>
  );
}

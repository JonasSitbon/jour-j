"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "./providers";
import { Icon } from "./icon";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Result {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  icon: string;
  href: string;
}

interface ResultGroup {
  label: string;
  results: Result[];
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MAX_PER_CAT = 5;

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function matches(query: string, ...fields: string[]) {
  const q = normalize(query);
  return fields.some((f) => normalize(f).includes(q));
}

// ─── Search palette ──────────────────────────────────────────────────────────

export function SearchPalette({ isOpen, onClose }: SearchPaletteProps) {
  const { state } = useStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Autofocus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      // Small delay to ensure modal is mounted before focusing
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Build flattened result groups
  const groups = useMemo<ResultGroup[]>(() => {
    const q = query.trim();

    const taskResults: Result[] = (q
      ? state.tasks.filter((t) => matches(q, t.title, t.cat, t.note))
      : state.tasks
    )
      .slice(0, MAX_PER_CAT)
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title,
        subtitle: `${t.cat}${t.due ? ` · ${t.due}` : ""}${t.done ? " · ✓" : ""}`,
        type: "Tâche",
        icon: "check-circle",
        href: "/checklist",
      }));

    const guestResults: Result[] = (q
      ? state.guests.filter((g) => matches(q, g.name, g.note ?? ""))
      : state.guests
    )
      .slice(0, MAX_PER_CAT)
      .map((g) => ({
        id: `guest-${g.id}`,
        title: g.name,
        subtitle: `Côté ${g.side} · ${g.rsvp}`,
        type: "Invité",
        icon: "users",
        href: "/guests",
      }));

    const vendorResults: Result[] = (q
      ? state.vendors.filter((v) => matches(q, v.name, v.cat, v.contact))
      : state.vendors
    )
      .slice(0, MAX_PER_CAT)
      .map((v) => ({
        id: `vendor-${v.id}`,
        title: v.name,
        subtitle: `${v.cat} · ${v.status}`,
        type: "Prestataire",
        icon: "file",
        href: "/vendors",
      }));

    const budgetResults: Result[] = (q
      ? state.budget.filter((b) => matches(q, b.label, b.cat))
      : state.budget
    )
      .slice(0, MAX_PER_CAT)
      .map((b) => ({
        id: `budget-${b.id}`,
        title: b.label,
        subtitle: `${b.cat} · ${b.planned.toLocaleString("fr-FR")} €`,
        type: "Poste budget",
        icon: "wallet",
        href: "/budget",
      }));

    const paymentResults: Result[] = (q
      ? state.payments.filter((p) => matches(q, p.vendor, p.label))
      : []
    )
      .slice(0, MAX_PER_CAT)
      .map((p) => ({
        id: `payment-${p.id}`,
        title: p.label,
        subtitle: `${p.vendor} · ${p.amount.toLocaleString("fr-FR")} € · ${p.status}`,
        type: "Paiement",
        icon: "card",
        href: "/payments",
      }));

    const NAV_PAGES = [
      { id: "nav-dashboard",  title: "Tableau de bord",      icon: "grid",         href: "/dashboard",    tags: "accueil overview" },
      { id: "nav-guests",     title: "Invités",               icon: "users",        href: "/guests",       tags: "rsvp table plan" },
      { id: "nav-budget",     title: "Budget",                icon: "wallet",       href: "/budget",       tags: "finances argent" },
      { id: "nav-payments",   title: "Paiements",             icon: "card",         href: "/payments",     tags: "factures echeances" },
      { id: "nav-vendors",    title: "Prestataires",          icon: "file",         href: "/vendors",      tags: "fournisseurs devis" },
      { id: "nav-checklist",  title: "Checklist",             icon: "check-circle", href: "/checklist",    tags: "taches todo" },
      { id: "nav-timeline",   title: "Timeline",              icon: "list",         href: "/timeline",     tags: "planning calendrier" },
      { id: "nav-dayj",       title: "Déroulé du Jour J",     icon: "clock",        href: "/dayj",         tags: "programme horaire" },
      { id: "nav-ceremony",   title: "Programme cérémonie",   icon: "rings",        href: "/ceremony",     tags: "etapes deroulement" },
      { id: "nav-music",      title: "Musique & playlist",    icon: "music",        href: "/music",        tags: "chansons premiere danse" },
      { id: "nav-gifts",      title: "Cadeaux",               icon: "gift",         href: "/gifts",        tags: "presents remerciements" },
      { id: "nav-contacts",   title: "Personnes clés",        icon: "key",          href: "/contacts",     tags: "temoins urgence equipe" },
      { id: "nav-journal",    title: "Journal de bord",       icon: "edit",         href: "/journal",      tags: "notes inspirations" },
      { id: "nav-moodboard",  title: "Mood Board",            icon: "sparkle",      href: "/moodboard",    tags: "style couleurs inspiration" },
      { id: "nav-dates",      title: "Sélecteur de dates",    icon: "calendar",     href: "/dates",        tags: "meteo comparaison" },
      { id: "nav-settings",   title: "Paramètres",            icon: "settings",     href: "/settings",     tags: "compte profil partage" },
    ];

    const navResults: Result[] = (q
      ? NAV_PAGES.filter((p) => matches(q, p.title, p.tags))
      : NAV_PAGES.slice(0, 6)
    ).map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: "Aller à cette section",
      type: "Page",
      icon: p.icon,
      href: p.href,
    }));

    const raw: ResultGroup[] = [
      { label: "Pages", results: navResults },
      { label: "Tâches", results: taskResults },
      { label: "Invités", results: guestResults },
      { label: "Prestataires", results: vendorResults },
      { label: "Budget", results: budgetResults },
      { label: "Paiements", results: paymentResults },
    ];

    return raw.filter((g) => g.results.length > 0);
  }, [query, state.tasks, state.guests, state.vendors, state.budget, state.payments]);

  // Flatten for keyboard navigation
  const allResults = useMemo(
    () => groups.flatMap((g) => g.results),
    [groups]
  );

  const totalCount = allResults.length;

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % Math.max(1, totalCount));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + Math.max(1, totalCount)) % Math.max(1, totalCount));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const result = allResults[activeIndex];
        if (result) navigate(result.href);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, totalCount, allResults, activeIndex, navigate, onClose]);

  // Build a map from result id → flat index for rendering
  let flatIdx = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        /* Backdrop */
        <div
          className="fixed inset-0 z-[400] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 460, damping: 32, mass: 0.7 }}
            className="w-full max-w-[560px] mx-4 bg-surface rounded-xl border border-line shadow-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-1">
              <span className="pl-3 text-text-3 shrink-0">
                <Icon name="search" size={16} />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher ou naviguer… (tâches, invités, pages)"
                className="w-full px-4 py-3.5 text-[15px] bg-transparent border-b border-line outline-none placeholder:text-text-3"
              />
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-[360px] overflow-y-auto"
            >
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-3">
                  <Icon name="search" size={28} strokeWidth={1.4} />
                  <span className="text-[14px]">
                    {query.trim() ? "Aucun résultat pour « " + query + " »" : "Commencez à taper pour chercher"}
                  </span>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.label}>
                    {/* Section label */}
                    <div className="px-4 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-text-3">
                      {group.label}
                    </div>

                    {/* Results in section */}
                    {group.results.map((result) => {
                      const idx = flatIdx++;
                      const isActive = idx === activeIndex;

                      return (
                        <button
                          key={result.id}
                          data-idx={idx}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => navigate(result.href)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                            ${isActive ? "bg-primary-soft" : "hover:bg-hover"}`}
                        >
                          <span className={`shrink-0 ${isActive ? "text-primary" : "text-text-3"}`}>
                            <Icon name={result.icon} size={16} strokeWidth={1.8} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-medium truncate text-text">
                              {result.title}
                            </div>
                            <div className="text-[11.5px] text-text-3 truncate">
                              {result.subtitle}
                            </div>
                          </div>
                          <span className="shrink-0 text-[11px] font-medium text-text-3 bg-surface-3 border border-line px-1.5 py-0.5 rounded">
                            {result.type}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-line bg-surface-2">
              <div className="flex items-center gap-3 text-[11px] text-text-3">
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-surface-3 border border-line px-1 py-0.5 rounded text-[10px]">↑↓</kbd>
                  naviguer
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-surface-3 border border-line px-1 py-0.5 rounded text-[10px]">↵</kbd>
                  ouvrir
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-surface-3 border border-line px-1 py-0.5 rounded text-[10px]">Esc</kbd>
                  fermer
                </span>
              </div>
              <span className="text-[11px] text-text-3">
                {totalCount > 0
                  ? `${totalCount} résultat${totalCount > 1 ? "s" : ""}`
                  : ""}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

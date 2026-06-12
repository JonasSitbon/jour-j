"use client";

import React, { useState, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, Logo } from "./icon";
import { Badge, IconButton, Avatar } from "./ui";
import { useStore, useTheme } from "./providers";
import { NotificationsPanel } from "./notifications-panel";
import { SearchPalette } from "./search-palette";
import { createClient } from "@/lib/supabase";
import type { WeddingRole } from "@/lib/types";
import { getFilteredNavGroups, weddingRoleToCollaboratorRole } from "@/lib/roles";

// ─── Navigation structure ────────────────────────────────────────────────────

const NAV_GROUPS = [
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

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

const BOTTOM_NAV = [
  { id: "dashboard", label: "Accueil",  icon: "home"         },
  { id: "guests",    label: "Invités",  icon: "users"        },
  { id: "budget",    label: "Budget",   icon: "wallet"       },
  { id: "checklist", label: "Tâches",   icon: "check-circle" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readLS(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex p-[3px] gap-[2px] rounded-[6px] border"
      style={{ background: "var(--surface-3)", borderColor: "var(--line)" }}>
      {(["light", "dark"] as const).map((t) => (
        <motion.button
          key={t}
          onClick={() => setTheme(t)}
          className={`px-2.5 h-[24px] rounded-[4px] flex items-center transition-colors text-[12px] ${
            theme === t
              ? "text-text bg-surface shadow-xs"
              : "text-text-3 hover:text-text-2"
          }`}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
          <Icon name={t === "light" ? "sun" : "moon"} size={13} />
        </motion.button>
      ))}
    </div>
  );
}

// ─── Tooltip (collapsed mode) ─────────────────────────────────────────────────

function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-[200]
                      opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
        <div className="px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium whitespace-nowrap shadow-md
                        text-text border"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
          {label}
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
          style={{ borderRightColor: "var(--line)" }} />
        <div className="absolute top-1/2 -translate-y-1/2 border-4 border-transparent"
          style={{ right: "calc(100% - 1px)", borderRightColor: "var(--surface)" }} />
      </div>
    </div>
  );
}

// ─── Nav groups ───────────────────────────────────────────────────────────────

function NavGroups({
  current, collapsed, onNavigate,
}: {
  current: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { state } = useStore();
  const id = useId();

  // ── Role-based nav filtering ──────────────────────────────────────────────
  const activeWedding = state.myWeddings.find((w) => w.id === state.activeWeddingId);
  const weddingRole: WeddingRole = activeWedding?.role ?? "viewer";
  const collaboratorRole = weddingRoleToCollaboratorRole(weddingRole);
  const visibleNavGroups = getFilteredNavGroups(collaboratorRole);
  // ─────────────────────────────────────────────────────────────────────────

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = readLS("nav-groups", "");
      if (stored) return JSON.parse(stored);
    } catch {}
    return Object.fromEntries(NAV_GROUPS.map((g) => [g.id, true]));
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      localStorage.setItem("nav-groups", JSON.stringify(next));
      return next;
    });
  };

  const badges: Record<string, number> = {
    guests:   state.guests.filter((g) => g.rsvp === "pending").length,
    payments: state.payments.filter((p) => p.status === "late").length,
  };

  const needsDot: Record<string, boolean> = {
    dates:   state.dateCandidates.length > 0 && !state.dateCandidates.some((d) => d.id === state.selectedDate),
    guests:  state.guests.length === 0,
    vendors: state.vendors.length === 0,
  };

  return (
    <nav className="flex flex-col gap-0 flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
      {visibleNavGroups.map((group, gi) => (
        <div key={group.id} className={collapsed ? "" : "mb-1"}>
          {/* Separator in collapsed mode */}
          {collapsed && gi > 0 && (
            <div className="my-2 mx-auto w-5 h-px" style={{ background: "var(--line)" }} />
          )}

          {/* Group header — expanded mode */}
          {!collapsed && (
            <button
              onClick={() => toggleGroup(group.id)}
              className="flex items-center justify-between w-full px-3 pt-4 pb-1.5 group transition-colors"
            >
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-3 group-hover:text-text-2 transition-colors">
                {group.label}
              </span>
              <motion.span
                animate={{ rotate: openGroups[group.id] ? 0 : -90 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="text-text-3"
              >
                <Icon name="chevronD" size={12} />
              </motion.span>
            </button>
          )}

          {/* Items */}
          <AnimatePresence initial={false}>
            {(collapsed || openGroups[group.id]) && (
              <motion.div
                key={`${group.id}-items`}
                initial={collapsed ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.16, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                {group.items.map((n) => {
                  const isActive = current === n.id;
                  const badge = badges[n.id];
                  const dot = needsDot[n.id];

                  const linkContent = (
                    <div className="relative px-2">
                      {/* Active background */}
                      {isActive && (
                        <motion.div
                          layoutId={`nav-bg-${id}`}
                          className="absolute inset-0 rounded-[6px] pointer-events-none"
                          style={{ background: "var(--hover)" }}
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      )}
                      {/* Active left bar */}
                      {isActive && (
                        <motion.div
                          layoutId={`nav-bar-${id}`}
                          className="absolute left-2 top-2 bottom-2 w-[2px] rounded-r-full pointer-events-none bg-primary"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      )}
                      <Link
                        href={`/${n.id}`}
                        onClick={onNavigate}
                        className={`flex items-center gap-2 rounded-[6px] text-[13px] transition-colors relative z-[1]
                          ${collapsed ? "justify-center px-1.5 py-2.5" : "pl-4 pr-2.5 py-2"}
                          ${isActive
                            ? "text-text font-medium"
                            : "text-text-2 hover:bg-hover hover:text-text"
                          }`}
                      >
                        <span className="shrink-0 inline-flex">
                          <Icon name={n.icon} size={16} strokeWidth={isActive ? 2 : 1.6} />
                        </span>
                        {!collapsed && (
                          <>
                            <span className="truncate flex-1">{n.label}</span>
                            {badge > 0
                              ? <span className="ml-auto shrink-0"><Badge tone={n.id === "payments" ? "coral" : "primary"}>{badge}</Badge></span>
                              : dot && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            }
                          </>
                        )}
                      </Link>
                    </div>
                  );

                  return collapsed
                    ? <NavTooltip key={n.id} label={`${n.label}${badge > 0 ? ` (${badge})` : ""}`}>{linkContent}</NavTooltip>
                    : <div key={n.id}>{linkContent}</div>;
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Settings */}
      <div className={`mt-2 pt-2 ${collapsed ? "border-t" : ""}`} style={{ borderColor: "var(--line)" }}>
        {!collapsed && (
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-3 px-3 pt-4 pb-1.5">
            Compte
          </div>
        )}
        {(() => {
          const isActive = current === "settings";
          const linkContent = (
            <div className="relative px-2">
              {isActive && (
                <motion.div
                  layoutId={`nav-bg-${id}`}
                  className="absolute inset-0 rounded-[6px] pointer-events-none"
                  style={{ background: "var(--hover)" }}
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId={`nav-bar-${id}`}
                  className="absolute left-2 top-2 bottom-2 w-[2px] rounded-r-full pointer-events-none bg-primary"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <Link
                href="/settings"
                onClick={onNavigate}
                className={`flex items-center gap-2 rounded-[6px] text-[13px] transition-colors relative z-[1]
                  ${collapsed ? "justify-center px-1.5 py-2.5" : "pl-4 pr-2.5 py-2"}
                  ${isActive ? "text-text font-medium" : "text-text-2 hover:bg-hover hover:text-text"}`}
              >
                <Icon name="settings" size={16} strokeWidth={isActive ? 2 : 1.6} className="shrink-0" />
                {!collapsed && "Paramètres"}
              </Link>
            </div>
          );
          return collapsed
            ? <NavTooltip label="Paramètres">{linkContent}</NavTooltip>
            : linkContent;
        })()}
      </div>
    </nav>
  );
}

// ─── Role label ───────────────────────────────────────────────────────────────

function roleLabel(role: WeddingRole) {
  switch (role) {
    case "owner":  return "Propriétaire";
    case "admin":  return "Admin";
    case "editor": return "Éditeur";
    case "viewer": return "Lecteur";
  }
}

// ─── Wedding Switcher ─────────────────────────────────────────────────────────

function WeddingSwitcher({ collapsed }: { collapsed: boolean }) {
  const { state, switchWedding } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const active = state.myWeddings.find((w) => w.id === state.activeWeddingId) ?? state.myWeddings[0];
  if (!active) return null;

  const color = active.coverColor || "#B5622E";

  function fmtShort(dateStr: string) {
    if (!dateStr) return "Date à définir";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Date à définir";
    if (d.getDate() === 15) return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  }

  if (collapsed) {
    return (
      <NavTooltip label={`${active.partnerA} & ${active.partnerB}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex justify-center w-full mb-3 py-1"
          aria-label="Changer de mariage"
        >
          <span className="w-5 h-5 rounded-[4px] shrink-0" style={{ background: color }} />
        </button>
      </NavTooltip>
    );
  }

  return (
    <div ref={ref} className="relative mb-3 px-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[7px] border transition-colors text-left
          ${open ? "border-line-strong bg-surface-2" : "border-line bg-surface-2 hover:border-line-strong hover:bg-surface-3"}`}
      >
        <span className="w-4 h-4 rounded-[3px] shrink-0" style={{ background: color }} />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold truncate leading-tight text-text">
            {active.partnerA} &amp; {active.partnerB}
          </div>
          <div className="text-[11px] text-text-3 truncate leading-tight mt-0.5">
            {fmtShort(active.date)}
          </div>
        </div>
        {state.myWeddings.length > 1 && (
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="text-text-3 shrink-0"
          >
            <Icon name="chevronD" size={13} />
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="absolute top-full left-0 right-0 mt-1.5 z-[250] rounded-[8px] border shadow-md overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          >
            <div className="py-1 max-h-[260px] overflow-y-auto">
              {state.myWeddings.map((w) => {
                const isActive = w.id === state.activeWeddingId;
                const wColor = w.coverColor || "#B5622E";
                return (
                  <button
                    key={w.id}
                    onClick={async () => {
                      setOpen(false);
                      if (!isActive) await switchWedding(w.id);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors
                      ${isActive ? "bg-primary-soft" : "hover:bg-hover"}`}
                  >
                    <span className="w-4 h-4 rounded-[3px] shrink-0" style={{ background: wColor }} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12.5px] font-semibold truncate ${isActive ? "text-primary-700" : "text-text"}`}>
                        {w.partnerA} &amp; {w.partnerB}
                      </div>
                      <div className="text-[11px] text-text-3 truncate">{fmtShort(w.date)}</div>
                    </div>
                    <span className={`badge text-[10px] shrink-0 ${
                      w.role === "owner"  ? "bg-primary-soft text-primary-700" :
                      w.role === "admin"  ? "bg-sage-soft text-sage" :
                      w.role === "editor" ? "bg-amber-soft text-[var(--gold-ink)]" :
                      "bg-surface-3 text-text-2"
                    }`}>
                      {roleLabel(w.role)}
                    </span>
                    {isActive && <Icon name="check" size={13} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="border-t" style={{ borderColor: "var(--line)" }}>
              <button
                onClick={() => { setOpen(false); router.push("/mes-mariages"); }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-[12px] text-text-3 hover:bg-hover hover:text-text transition-colors"
              >
                <Icon name="grid" size={13} />
                Voir tous mes mariages
              </button>
              <button
                onClick={() => { setOpen(false); router.push("/onboarding?new=1"); }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-medium text-primary-700 hover:bg-primary-soft transition-colors"
              >
                <Icon name="plus" size={14} className="text-primary" />
                Créer un mariage
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Brand ────────────────────────────────────────────────────────────────────

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center mb-4 ${collapsed ? "justify-center px-1" : "gap-2.5 px-2"}`}>
      <div className="w-[32px] h-[32px] flex items-center justify-center text-primary shrink-0">
        <Logo size={30} />
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col overflow-hidden"
          >
            <span className="text-[15px] font-semibold tracking-[-0.01em] whitespace-nowrap text-text">
              Jour <b className="font-bold">J</b>
            </span>
            <span className="text-[10px] text-text-3 font-mono tracking-wider whitespace-nowrap">
              wedding studio
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── User card ────────────────────────────────────────────────────────────────

function UserCard({ collapsed, onAction }: { collapsed: boolean; onAction?: () => void }) {
  const { state } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    await createClient().auth.signOut();
    onAction?.();
    router.push("/login");
    router.refresh();
  };

  const name = `${state.wedding.partnerA} ${state.wedding.partnerB}`;

  if (collapsed) {
    return (
      <NavTooltip label="Se déconnecter">
        <button onClick={logout} disabled={loggingOut}
          className="flex justify-center w-full py-1 text-text-3 hover:text-text-2 transition-colors">
          <Icon name="logout" size={16} />
        </button>
      </NavTooltip>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-[6px]">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold truncate text-text">{name}</div>
          <div className="text-[11px] text-text-3 truncate">{email ?? "…"}</div>
        </div>
      </div>
      <motion.button
        onClick={logout}
        disabled={loggingOut}
        className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[12.5px] text-text-2
                   hover:bg-hover hover:text-text transition-colors w-full"
        whileTap={loggingOut ? undefined : { scale: 0.98 }}
      >
        <Icon name="logout" size={14} className="text-text-3" />
        {loggingOut ? "Déconnexion…" : "Se déconnecter"}
      </motion.button>
    </div>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = pathname?.split("/")[1] || "dashboard";

  const { state } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(() => readLS("sidebar-collapsed", "false") === "true");

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const unread = state.notifications.filter((n) => !n.read).length;
  const cur = ALL_NAV.concat([{ id: "settings", label: "Paramètres", icon: "settings" }])
    .find((n) => n.id === current);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative z-[1] min-h-screen flex">

      {/* ── Sidebar desktop ── */}
      <motion.aside
        animate={{ width: collapsed ? 52 : 220 }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        className="hidden md:flex shrink-0 flex-col sticky top-0 h-screen overflow-hidden"
        style={{
          minWidth: collapsed ? 52 : 220,
          background: "var(--surface)",
          boxShadow: "1px 0 0 rgba(0,0,0,.05), 4px 0 20px rgba(0,0,0,.03)",
        }}
      >
        <div className={`flex flex-col h-full ${collapsed ? "px-1.5 py-4" : "px-2 py-4"}`}>

          {/* Brand + collapse toggle */}
          <div className="flex items-center mb-1">
            <div className="flex-1 min-w-0">
              <Brand collapsed={collapsed} />
            </div>
            <motion.button
              onClick={toggleCollapsed}
              title={collapsed ? "Développer" : "Réduire"}
              className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-[5px]
                         text-text-3 hover:bg-hover hover:text-text-2 transition-colors
                         ${collapsed ? "mb-4 mx-auto" : "-mt-4 -mr-1"}`}
              whileTap={{ scale: 0.88 }}
            >
              <Icon name={collapsed ? "chevronR" : "chevronL"} size={13} />
            </motion.button>
          </div>

          {/* Wedding Switcher */}
          <WeddingSwitcher collapsed={collapsed} />

          {/* Nav */}
          <NavGroups current={current} collapsed={collapsed} />

          {/* Footer */}
          <div className={`pt-3 flex flex-col gap-2 ${collapsed ? "mt-3 border-t" : "mt-auto border-t"}`}
            style={{ borderColor: "var(--line)" }}>
            {!collapsed && (
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-3">Thème</span>
                <ThemeToggle />
              </div>
            )}
            {collapsed && (
              <NavTooltip label={`Thème : ${useTheme().theme === "light" ? "clair" : "sombre"}`}>
                <div className="flex justify-center pt-1">
                  <ThemeToggle />
                </div>
              </NavTooltip>
            )}
            <UserCard collapsed={collapsed} />
          </div>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Topbar desktop */}
        <header className="hidden md:flex h-[52px] shrink-0 items-center gap-4 px-6 sticky top-0 z-50 border-b"
          style={{
            background: "rgba(250,250,248,0.92)",
            borderColor: "var(--line)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}>
          <div className="flex items-center gap-1.5 text-[13px] text-text-2">
            <Icon name="home" size={14} />
            <Icon name="chevronR" size={12} className="text-text-3" />
            <AnimatePresence mode="wait">
              <motion.span
                key={current}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="font-medium text-text"
              >
                {cur?.label ?? "—"}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden lg:flex items-center gap-2 px-3 h-8 rounded-[6px] border text-text-3 text-[12.5px] transition-colors hover:text-text"
            style={{
              borderColor: "var(--line)",
              background: "var(--surface-2)",
            }}
          >
            <Icon name="search" size={13} />
            Rechercher…
            <kbd className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded border"
              style={{ background: "var(--surface-3)", borderColor: "var(--line)" }}>⌘K</kbd>
          </button>

          <IconButton name="search" title="Rechercher" className="lg:hidden" onClick={() => setSearchOpen(true)} />
          <IconButton name="bell" title="Notifications" badge={unread > 0} onClick={() => setNotifOpen(true)} />
        </header>

        {/* Topbar mobile */}
        <header className="md:hidden flex items-center gap-3 h-[52px] px-4 border-b sticky top-0 z-50"
          style={{
            background: "rgba(250,250,248,0.92)",
            borderColor: "var(--line)",
            backdropFilter: "blur(16px)",
          }}>
          <IconButton name="menu" onClick={() => setMenuOpen(true)} />
          <div className="flex items-center gap-2">
            <div className="w-[26px] h-[26px] text-primary"><Logo size={24} /></div>
            <span className="text-[14px] font-semibold text-text">Jour <b>J</b></span>
          </div>
          <div className="flex-1" />
          <IconButton name="bell" badge={unread > 0} onClick={() => setNotifOpen(true)} />
        </header>

        <main className="flex-1">{children}</main>
      </div>

      {/* ── Bottom nav mobile ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[100] flex justify-around border-t
                      px-1.5 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        style={{
          background: "rgba(255,255,255,0.92)",
          borderColor: "var(--line)",
          backdropFilter: "blur(16px)",
        }}>
        {BOTTOM_NAV.map((n) => (
          <Link key={n.id} href={`/${n.id}`}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[10px] font-medium flex-1
                        ${current === n.id ? "text-primary" : "text-text-3"}`}>
            <span className="relative flex items-center justify-center w-[42px] h-[28px] rounded-[6px]">
              {current === n.id && (
                <motion.div
                  layoutId="bottom-tab-indicator"
                  className="absolute inset-0 rounded-[6px] pointer-events-none bg-primary-soft"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <Icon name={n.icon} size={19} className="relative z-[1]" />
            </span>
            {n.label}
          </Link>
        ))}
        <motion.button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[10px] font-medium flex-1 text-text-3"
          whileTap={{ scale: 0.92 }}
        >
          <span className="flex items-center justify-center w-[42px] h-[28px] rounded-[6px]">
            <Icon name="menu" size={19} />
          </span>
          Plus
        </motion.button>
      </nav>

      <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <SearchPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── Mobile menu sheet ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 z-[300] bg-black/30 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="md:hidden fixed top-0 left-0 bottom-0 z-[301] w-[260px] max-w-[86vw]
                         border-r shadow-lg px-2 py-4 flex flex-col overflow-auto"
              style={{ background: "var(--surface)", borderColor: "var(--line)" }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%", transition: { type: "spring", stiffness: 400, damping: 40 } }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <Brand collapsed={false} />
              <WeddingSwitcher collapsed={false} />
              <NavGroups current={current} collapsed={false} onNavigate={() => setMenuOpen(false)} />
              <div className="mt-auto pt-4 border-t flex flex-col gap-2" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-text-3">Thème</span>
                  <ThemeToggle />
                </div>
                <UserCard collapsed={false} onAction={() => setMenuOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────

export function PageHead({
  title, sub, actions,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-text">{title}</h1>
        {sub && <div className="text-[13.5px] text-text-2 mt-1">{sub}</div>}
      </motion.div>
      {actions && <div className="flex gap-2 items-center flex-wrap">{actions}</div>}
    </div>
  );
}

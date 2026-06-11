"use client";

import React, { useState, useEffect, useId } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, Logo } from "./icon";
import { Badge, IconButton, Avatar } from "./ui";
import { useStore, useTheme } from "./providers";
import { NotificationsPanel } from "./notifications-panel";
import { createClient } from "@/lib/supabase";

// ─── Navigation structure ───────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    items: [
      { id: "dashboard",  label: "Tableau de bord",     icon: "grid"         },
      { id: "dates",      label: "Sélecteur de dates",  icon: "calendar"     },
    ],
  },
  {
    id: "planning",
    label: "Planification",
    items: [
      { id: "checklist",  label: "Checklist",           icon: "check-circle" },
      { id: "timeline",   label: "Timeline",             icon: "list"         },
      { id: "dayj",       label: "Déroulé du Jour J",   icon: "clock"        },
    ],
  },
  {
    id: "people",
    label: "Personnes",
    items: [
      { id: "guests",     label: "Invités",              icon: "users"        },
      { id: "vendors",    label: "Prestataires",         icon: "file"         },
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function readLS(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

// ─── Theme toggle ────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex p-0.5 gap-0.5 bg-surface-3 rounded-sm border border-line">
      {(["light", "dark"] as const).map((t) => (
        <motion.button key={t} onClick={() => setTheme(t)}
          className={`px-2 h-[26px] rounded-md flex items-center ${theme === t ? "bg-surface shadow-xs text-text" : "text-text-2"}`}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}>
          <Icon name={t === "light" ? "sun" : "moon"} size={15} />
        </motion.button>
      ))}
    </div>
  );
}

// ─── Tooltip (for collapsed mode) ───────────────────────────────────────────

function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[200]
                      opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
        <div className="px-2.5 py-1.5 rounded-md text-[12.5px] font-medium whitespace-nowrap shadow-md
                        bg-popover border border-line text-text">
          {label}
        </div>
        {/* Arrow */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-line" />
        <div className="absolute right-[calc(100%-1px)] top-1/2 -translate-y-1/2 border-4 border-transparent border-r-popover" />
      </div>
    </div>
  );
}

// ─── Nav groups ──────────────────────────────────────────────────────────────

function NavGroups({
  current, collapsed, onNavigate,
}: {
  current: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { state } = useStore();
  const id = useId();

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
    <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.id}>
          {/* Group separator in collapsed mode */}
          {collapsed && gi > 0 && (
            <div className="my-2 mx-auto w-6 h-px bg-line" />
          )}

          {/* Group header — expanded mode only */}
          {!collapsed && (
            <button
              onClick={() => toggleGroup(group.id)}
              className="flex items-center justify-between w-full px-2.5 pt-3 pb-1 hover:text-text-2 transition-colors group"
            >
              <span className="text-[10.5px] font-semibold text-text-3 uppercase tracking-wider group-hover:text-text-2 transition-colors">
                {group.label}
              </span>
              <motion.span
                animate={{ rotate: openGroups[group.id] ? 0 : -90 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="text-text-3"
              >
                <Icon name="chevronD" size={13} />
              </motion.span>
            </button>
          )}

          {/* Group items */}
          <AnimatePresence initial={false}>
            {(collapsed || openGroups[group.id]) && (
              <motion.div
                key={`${group.id}-items`}
                initial={collapsed ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                {group.items.map((n) => {
                  const isActive = current === n.id;
                  const badge = badges[n.id];
                  const dot = needsDot[n.id];

                  const linkContent = (
                    <div className="relative">
                      {isActive && (
                        <motion.div
                          layoutId={`nav-active-${id}`}
                          className="absolute inset-0 bg-primary-soft rounded-sm pointer-events-none"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      )}
                      <Link
                        href={`/${n.id}`}
                        onClick={onNavigate}
                        className={`flex items-center gap-2.5 rounded-sm text-[13.5px] font-medium transition relative z-[1]
                          ${collapsed ? "justify-center px-1.5 py-2.5" : "px-2.5 py-2.5"}
                          ${isActive ? "text-primary-700" : "text-text-2 hover:bg-hover hover:text-text"}`}
                      >
                        <Icon name={n.icon} size={18} className="shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="truncate">{n.label}</span>
                            {badge > 0
                              ? <span className="ml-auto"><Badge tone={n.id === "payments" ? "coral" : "primary"}>{badge}</Badge></span>
                              : dot && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
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
      <div className={collapsed ? "mt-2 pt-2 border-t border-line" : "mt-1"}>
        {!collapsed && (
          <div className="text-[10.5px] font-semibold text-text-3 uppercase tracking-wider px-2.5 pt-3 pb-1">
            Compte
          </div>
        )}
        {(() => {
          const isActive = current === "settings";
          const linkContent = (
            <div className="relative">
              {isActive && (
                <motion.div
                  layoutId={`nav-active-${id}`}
                  className="absolute inset-0 bg-primary-soft rounded-sm pointer-events-none"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <Link
                href="/settings"
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-sm text-[13.5px] font-medium transition relative z-[1]
                  ${collapsed ? "justify-center px-1.5 py-2.5" : "px-2.5 py-2.5"}
                  ${isActive ? "text-primary-700" : "text-text-2 hover:bg-hover hover:text-text"}`}
              >
                <Icon name="settings" size={18} className="shrink-0" />
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

// ─── Brand ───────────────────────────────────────────────────────────────────

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center mb-5 ${collapsed ? "justify-center px-1" : "gap-2.5 px-2"}`}>
      <div className="w-[36px] h-[36px] flex items-center justify-center text-primary shrink-0">
        <Logo size={34} />
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
            <span className="text-[16.5px] font-semibold tracking-tight whitespace-nowrap">
              Jour <b className="font-bold">J</b>
            </span>
            <span className="text-[10.5px] text-text-3 font-mono tracking-wide whitespace-nowrap">
              wedding studio
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── User card ───────────────────────────────────────────────────────────────

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
          className="flex justify-center w-full py-1 text-text-3 hover:text-text transition-colors">
          <Icon name="logout" size={17} />
        </button>
      </NavTooltip>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-sm">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold truncate">{name}</div>
          <div className="text-[11px] text-text-3 truncate">{email ?? "…"}</div>
        </div>
      </div>
      <motion.button
        onClick={logout}
        disabled={loggingOut}
        className="flex items-center gap-2 px-2.5 py-2 rounded-sm text-[13px] font-medium text-text-2
                   hover:bg-hover hover:text-text transition w-full"
        whileTap={loggingOut ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <Icon name="logout" size={15} className="text-text-3" />
        {loggingOut ? "Déconnexion…" : "Se déconnecter"}
      </motion.button>
    </div>
  );
}

// ─── App shell ───────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = pathname?.split("/")[1] || "dashboard";

  const { state } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

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

  return (
    <div className="relative z-[1] min-h-screen flex">

      {/* ── Sidebar desktop ── */}
      <motion.aside
        animate={{ width: collapsed ? 62 : 252 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="hidden md:flex shrink-0 flex-col bg-surface border-r border-line sticky top-0 h-screen overflow-hidden"
        style={{ minWidth: collapsed ? 62 : 252 }}
      >
        <div className={`flex flex-col h-full ${collapsed ? "px-1.5 py-4" : "px-3 py-5"}`}>

          {/* Brand + collapse toggle */}
          <div className="flex items-center mb-1">
            <div className="flex-1 min-w-0">
              <Brand collapsed={collapsed} />
            </div>
            <motion.button
              onClick={toggleCollapsed}
              title={collapsed ? "Développer" : "Réduire"}
              className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-text-3
                         hover:bg-hover hover:text-text transition-colors
                         ${collapsed ? "mb-5" : "-mt-5 -mr-0.5"}`}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
            >
              <Icon name={collapsed ? "chevronR" : "chevronL"} size={15} />
            </motion.button>
          </div>

          {/* Nav */}
          <NavGroups current={current} collapsed={collapsed} />

          {/* Footer */}
          <div className={`pt-3 border-t border-line flex flex-col gap-2.5 ${collapsed ? "mt-3" : "mt-auto"}`}>
            {!collapsed && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[10.5px] font-semibold text-text-3 uppercase tracking-wider">Thème</span>
                <ThemeToggle />
              </div>
            )}
            {collapsed && (
              <NavTooltip label={`Thème : ${useTheme().theme === "light" ? "clair" : "sombre"}`}>
                <div className="flex justify-center">
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
        <header className="hidden md:flex h-14 shrink-0 items-center gap-4 px-6 border-b border-line
                           sticky top-0 z-50 bg-bg/80 backdrop-blur-xl">
          <div className="flex items-center gap-1.5 text-sm text-text-2">
            <Icon name="home" size={15} />
            <Icon name="chevronR" size={13} className="text-text-3" />
            <span className="text-text font-semibold">{cur?.label ?? "—"}</span>
          </div>
          <div className="flex-1" />
          <IconButton name="bell" title="Notifications" badge={unread > 0} onClick={() => setNotifOpen(true)} />
        </header>

        {/* Topbar mobile */}
        <header className="md:hidden flex items-center gap-3 h-[56px] px-4 border-b border-line
                           sticky top-0 z-50 bg-bg/85 backdrop-blur-xl">
          <IconButton name="menu" onClick={() => setMenuOpen(true)} />
          <div className="flex items-center gap-2">
            <div className="w-[28px] h-[28px] text-primary"><Logo size={26} /></div>
            <span className="text-base font-semibold">Jour <b>J</b></span>
          </div>
          <div className="flex-1" />
          <IconButton name="bell" badge={unread > 0} onClick={() => setNotifOpen(true)} />
        </header>

        <main className="flex-1">{children}</main>
      </div>

      {/* ── Bottom nav mobile ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[100] flex justify-around
                      bg-surface/90 backdrop-blur-xl border-t border-line
                      px-1.5 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {BOTTOM_NAV.map((n) => (
          <Link key={n.id} href={`/${n.id}`}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[10.5px] font-medium flex-1
                        ${current === n.id ? "text-primary" : "text-text-3"}`}>
            <span className="relative flex items-center justify-center w-[46px] h-[30px] rounded-md">
              {current === n.id && (
                <motion.div
                  layoutId="bottom-pill"
                  className="absolute inset-0 bg-primary-soft rounded-md pointer-events-none"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <Icon name={n.icon} size={21} className="relative z-[1]" />
            </span>
            {n.label}
          </Link>
        ))}
        <motion.button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[10.5px] font-medium flex-1 text-text-3"
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
          <span className="flex items-center justify-center w-[46px] h-[30px] rounded-md">
            <Icon name="menu" size={21} />
          </span>
          Plus
        </motion.button>
      </nav>

      <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* ── Mobile menu sheet ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 z-[300] bg-black/45 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="md:hidden fixed top-0 left-0 bottom-0 z-[301] w-[280px] max-w-[86vw]
                         bg-surface border-r border-line shadow-lg px-3 py-5 flex flex-col overflow-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%", transition: { type: "spring", stiffness: 400, damping: 40 } }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <Brand collapsed={false} />
              <NavGroups current={current} collapsed={false} onNavigate={() => setMenuOpen(false)} />
              <div className="mt-auto pt-4 border-t border-line flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10.5px] font-semibold text-text-3 uppercase tracking-wider">Thème</span>
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

// ─── Page header ─────────────────────────────────────────────────────────────

export function PageHead({
  title, sub, actions,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-[26px] font-semibold tracking-[-.025em]">{title}</h1>
        {sub && <div className="text-sm text-text-2 mt-1">{sub}</div>}
      </motion.div>
      {actions && <div className="flex gap-2 items-center flex-wrap">{actions}</div>}
    </div>
  );
}

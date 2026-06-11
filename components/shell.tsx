"use client";

import React, { useState, useEffect, useId } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, Logo } from "./icon";
import { Badge, IconButton, Avatar, Button } from "./ui";
import { useStore, useTheme } from "./providers";
import { NotificationsPanel } from "./notifications-panel";
import { fmt } from "@/lib/format";
import { createClient } from "@/lib/supabase";

const NAV = [
  { id: "dashboard", label: "Tableau de bord", icon: "grid" },
  { id: "dates", label: "Sélecteur de dates", icon: "calendar" },
  { id: "guests", label: "Invités", icon: "users" },
  { id: "vendors", label: "Devis & prestataires", icon: "file" },
  { id: "budget", label: "Budget", icon: "wallet" },
  { id: "payments", label: "Paiements", icon: "card" },
  { id: "checklist", label: "Checklist", icon: "check-circle" },
  { id: "timeline", label: "Timeline", icon: "list" },
  { id: "dayj", label: "Déroulé du Jour J", icon: "clock" },
  { id: "journal", label: "Journal de bord", icon: "edit" },
  { id: "moodboard", label: "Mood Board", icon: "sparkle" },
];
const BOTTOM = [
  { id: "dashboard", label: "Accueil", icon: "home" },
  { id: "guests", label: "Invités", icon: "users" },
  { id: "budget", label: "Budget", icon: "wallet" },
  { id: "checklist", label: "Tâches", icon: "check-circle" },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex p-0.5 gap-0.5 bg-surface-3 rounded-sm border border-line">
      {(["light", "dark"] as const).map((t) => (
        <motion.button key={t} onClick={() => setTheme(t)}
          className={`px-2 h-[26px] rounded-md flex items-center ${theme === t ? "bg-surface shadow-xs text-text" : "text-text-2"}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}>
          <Icon name={t === "light" ? "sun" : "moon"} size={15} />
        </motion.button>
      ))}
    </div>
  );
}

function NavLinks({ current, onNavigate }: { current: string; onNavigate?: () => void }) {
  const { state } = useStore();
  const id = useId();
  const badges: Record<string, number> = {
    guests: state.guests.filter((g) => g.rsvp === "pending").length,
    payments: state.payments.filter((p) => p.status === "late").length,
  };
  const needsSetup: Record<string, boolean> = {
    dates: state.dateCandidates.length > 0 && !state.dateCandidates.some((d) => d.id === state.selectedDate),
    guests: state.guests.length === 0,
    vendors: state.vendors.length === 0,
  };

  const allItems = [...NAV.map(n => ({ ...n, section: "org" })), { id: "settings", label: "Paramètres", icon: "settings", section: "account" }];

  return (
    <nav className="flex flex-col gap-0.5">
      <div className="text-[11px] font-semibold text-text-3 uppercase tracking-wider px-2.5 pt-3 pb-1.5">Organisation</div>
      {NAV.map((n) => (
        <div key={n.id} className="relative">
          {current === n.id && (
            <motion.div
              layoutId={`nav-${id}`}
              className="absolute inset-0 bg-primary-soft rounded-sm pointer-events-none"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          )}
          <Link href={`/${n.id}`} onClick={onNavigate}
            className={`flex items-center gap-3 px-2.5 py-2.5 rounded-sm text-sm font-medium transition relative z-[1] ${
              current === n.id ? "text-primary-700" : "text-text-2 hover:bg-hover hover:text-text"}`}>
            <Icon name={n.icon} size={19} />
            {n.label}
            {badges[n.id] > 0
              ? <span className="ml-auto"><Badge tone={n.id === "payments" ? "coral" : "primary"}>{badges[n.id]}</Badge></span>
              : needsSetup[n.id] && <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
          </Link>
        </div>
      ))}
      <div className="text-[11px] font-semibold text-text-3 uppercase tracking-wider px-2.5 pt-3 pb-1.5">Compte</div>
      <div className="relative">
        {current === "settings" && (
          <motion.div
            layoutId={`nav-${id}`}
            className="absolute inset-0 bg-primary-soft rounded-sm pointer-events-none"
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          />
        )}
        <Link href="/settings" onClick={onNavigate}
          className={`flex items-center gap-3 px-2.5 py-2.5 rounded-sm text-sm font-medium transition relative z-[1] ${
            current === "settings" ? "text-primary-700" : "text-text-2 hover:bg-hover hover:text-text"}`}>
          <Icon name="settings" size={19} />Paramètres
        </Link>
      </div>
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2 mb-5">
      <div className="w-[38px] h-[38px] flex items-center justify-center text-primary"><Logo /></div>
      <div className="flex flex-col">
        <span className="text-[17px] font-semibold tracking-tight">Jour <b className="font-bold">J</b></span>
        <span className="text-[11px] text-text-3 font-mono tracking-wide">wedding studio</span>
      </div>
    </div>
  );
}

function UserCard({ onAction }: { onAction?: () => void }) {
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 p-2 rounded-sm">
        <Avatar name={`${state.wedding.partnerA} ${state.wedding.partnerB}`} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold truncate">{state.wedding.partnerA} &amp; {state.wedding.partnerB}</div>
          <div className="text-[11px] text-text-3 truncate">{email ?? "…"}</div>
        </div>
      </div>
      <motion.button
        onClick={logout}
        disabled={loggingOut}
        className="flex items-center gap-2 px-2.5 py-2 rounded-sm text-[13px] font-medium text-text-2 hover:bg-hover hover:text-text transition w-full"
        whileHover={loggingOut ? undefined : { x: 2 }}
        whileTap={loggingOut ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <Icon name="logout" size={16} className="text-text-3" />
        {loggingOut ? "Déconnexion…" : "Se déconnecter"}
      </motion.button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = (pathname?.split("/")[1] || "dashboard");
  const { state } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = state.notifications.filter((n) => !n.read).length;
  const cur = NAV.concat([{ id: "settings", label: "Paramètres", icon: "settings" }]).find((n) => n.id === current);

  return (
    <div className="relative z-[1] min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-[252px] shrink-0 flex-col bg-surface border-r border-line sticky top-0 h-screen px-3 py-5">
        <Brand />
        <NavLinks current={current} />
        <div className="mt-auto pt-4 border-t border-line flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">Thème</span>
            <ThemeToggle />
          </div>
          <UserCard />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar desktop */}
        <header className="hidden md:flex h-16 shrink-0 items-center gap-4 px-6 border-b border-line sticky top-0 z-50 bg-bg/80 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-text-2">
            <Icon name="home" size={16} /><Icon name="chevronR" size={14} className="text-text-3" />
            <span className="text-text font-semibold">{cur?.label}</span>
          </div>
          <div className="flex-1" />
          <IconButton name="bell" title="Notifications" badge={unread > 0} onClick={() => setNotifOpen(true)} />
        </header>

        {/* Topbar mobile */}
        <header className="md:hidden flex items-center gap-3 h-[58px] px-4 border-b border-line sticky top-0 z-50 bg-bg/85 backdrop-blur-xl">
          <IconButton name="menu" onClick={() => setMenuOpen(true)} />
          <div className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] text-primary"><Logo size={28} /></div>
            <span className="text-base font-semibold">Jour <b>J</b></span>
          </div>
          <div className="flex-1" />
          <IconButton name="bell" badge={unread > 0} onClick={() => setNotifOpen(true)} />
        </header>

        <main className="flex-1">{children}</main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[100] flex justify-around bg-surface/90 backdrop-blur-xl border-t border-line px-1.5 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {BOTTOM.map((n) => (
          <Link key={n.id} href={`/${n.id}`}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[10.5px] font-medium flex-1 ${current === n.id ? "text-primary" : "text-text-3"}`}>
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
          <span className="flex items-center justify-center w-[46px] h-[30px] rounded-md"><Icon name="menu" size={21} /></span>Plus
        </motion.button>
      </nav>

      <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Mobile menu sheet */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 z-[300] bg-black/45 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
              transition={{ duration: 0.22 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="md:hidden fixed top-0 left-0 bottom-0 z-[301] w-[280px] max-w-[86vw] bg-surface border-r border-line shadow-lg p-5 flex flex-col overflow-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%", transition: { type: "spring", stiffness: 400, damping: 40 } }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <Brand />
              <NavLinks current={current} onNavigate={() => setMenuOpen(false)} />
              <div className="mt-auto pt-4 border-t border-line flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">Thème</span>
                  <ThemeToggle />
                </div>
                <UserCard onAction={() => setMenuOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/** En-tête de page réutilisable */
export function PageHead({ title, sub, actions }: { title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode }) {
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

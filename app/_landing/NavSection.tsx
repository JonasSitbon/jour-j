"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/icon";
import { TC, TEXT_MID, BROWN_DARK } from "./tokens";
import { Ic } from "./visuals";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    import("@/lib/supabase").then(({ createClient }) => {
      const client = createClient();
      client.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setLoggedIn(!!session);
      });
      unsub = () => subscription.unsubscribe();
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [accountOpen]);

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase");
    await createClient().auth.signOut();
    setLoggedIn(false);
    setAccountOpen(false);
    setMobileOpen(false);
  };

  const links = [
    { href: "#features", label: "Fonctionnalités" },
    { href: "#demo", label: "Démo" },
    { href: "#pricing", label: "Tarifs" },
    { href: "#faq", label: "FAQ" },
  ];

  const dropdownItemStyle = {
    color: TEXT_MID,
    background: "transparent",
    transition: "background 0.12s",
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[500] transition-all duration-300"
      style={{
        background: scrolled ? "rgba(253,250,245,0.92)" : "rgba(253,250,245,0.75)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid rgba(201,110,44,${scrolled ? "0.12" : "0.06"})`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8" style={{ color: TC }}><Logo size={30} /></div>
          <span className="text-[16px] font-semibold" style={{ color: BROWN_DARK }}>Jour J</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {links.map((l) => (
            <a key={l.href} href={l.href}
              className="text-[13.5px] font-medium transition-colors"
              style={{ color: TEXT_MID }}
              onMouseEnter={(e) => (e.currentTarget.style.color = TC)}
              onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MID)}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop right section */}
        <div className="hidden md:flex items-center gap-3 ml-auto">

          {/* Mon espace dropdown */}
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="flex items-center gap-1.5 text-[13.5px] font-medium px-4 py-2 rounded-full transition-all"
              style={{
                color: accountOpen ? TC : TEXT_MID,
                background: accountOpen ? `${TC}12` : "transparent",
              }}
            >
              Mon espace
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d={accountOpen ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
              </svg>
            </button>

            <AnimatePresence>
              {accountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl border overflow-hidden"
                  style={{
                    background: "rgba(253,250,245,0.98)",
                    borderColor: "rgba(201,110,44,0.12)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 12px 40px rgba(56,47,35,0.14)",
                  }}
                >
                  {loggedIn ? (
                    <div className="p-2">
                      <Link href="/dashboard" onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium"
                        style={dropdownItemStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.background = `${TC}08`)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <Ic name="grid" size={15} />Mon tableau de bord
                      </Link>
                      <Link href="/settings" onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium"
                        style={dropdownItemStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.background = `${TC}08`)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <Ic name="edit" size={15} />Paramètres
                      </Link>
                      <div className="my-1.5 mx-3 h-px" style={{ background: "rgba(201,110,44,0.1)" }} />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-left"
                        style={{ color: "#c94040", background: "transparent", transition: "background 0.12s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,64,64,0.06)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                        Se déconnecter
                      </button>
                    </div>
                  ) : (
                    <div className="p-2">
                      <Link href="/login" onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium"
                        style={dropdownItemStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.background = `${TC}08`)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <Ic name="key" size={15} />Se connecter
                      </Link>
                      <Link href="/signup" onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-bold"
                        style={{ color: TC, background: "transparent", transition: "background 0.12s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = `${TC}08`)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <Ic name="sparkle" size={15} />Commencer l'essai →
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main CTA */}
          {loggedIn ? (
            <Link href="/dashboard"
              className="px-5 py-2 rounded-full text-[13.5px] font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: TC, boxShadow: `0 4px 14px ${TC}40` }}>
              Mon mariage →
            </Link>
          ) : (
            <Link href="/signup"
              className="px-5 py-2 rounded-full text-[13.5px] font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: TC, boxShadow: `0 4px 14px ${TC}40` }}>
              Essai gratuit →
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden ml-auto transition-colors" style={{ color: TEXT_MID }}
          onClick={() => setMobileOpen(!mobileOpen)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {mobileOpen
              ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>
              : <><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t overflow-hidden"
            style={{ background: "rgba(253,250,245,0.98)", borderColor: "rgba(201,110,44,0.1)" }}>
            <div className="px-6 py-4 flex flex-col gap-3">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  className="text-[14px] font-medium py-1 transition-colors"
                  style={{ color: TEXT_MID }}>{l.label}</a>
              ))}

              <div className="my-1 h-px" style={{ background: "rgba(201,110,44,0.1)" }} />

              {loggedIn ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="mt-1 py-3 rounded-xl text-center text-[14px] font-semibold text-white"
                    style={{ background: TC }}>
                    Mon mariage →
                  </Link>
                  <Link href="/settings" onClick={() => setMobileOpen(false)}
                    className="py-2.5 rounded-xl text-center text-[14px] font-medium border"
                    style={{ color: TEXT_MID, borderColor: "rgba(201,110,44,0.2)" }}>
                    Paramètres
                  </Link>
                  <button onClick={handleLogout}
                    className="py-2.5 rounded-xl text-center text-[14px] font-medium"
                    style={{ color: "#c94040" }}>
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}
                    className="mt-1 py-3 rounded-xl text-center text-[14px] font-semibold text-white"
                    style={{ background: TC }}>
                    Commencer l'essai →
                  </Link>
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="py-2.5 rounded-xl text-center text-[14px] font-medium border"
                    style={{ color: TEXT_MID, borderColor: "rgba(201,110,44,0.2)" }}>
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

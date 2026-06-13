"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/icon";
import { TC, TEXT_MID, BROWN_DARK } from "./tokens";
import { Ic } from "./visuals";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    import("@/lib/supabase").then(({ createClient }) => {
      createClient().auth.getSession().then(({ data }) => {
        setLoggedIn(!!data.session);
      });
    });
  }, []);

  const links = [
    { href: "#features", label: "Fonctionnalités" },
    { href: "#demo", label: "Démo" },
    { href: "#pricing", label: "Tarifs" },
    { href: "#faq", label: "FAQ" },
  ];

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

        <div className="hidden md:flex items-center gap-3 ml-auto">
          {loggedIn ? (
            <>
              <Link href="/settings" className="flex items-center gap-2 text-[13.5px] font-medium transition-colors px-4 py-2 rounded-full"
                style={{ color: TEXT_MID }}
                onMouseEnter={(e) => (e.currentTarget.style.color = TC)}
                onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MID)}>
                <Ic name="users" size={15} />Mon compte
              </Link>
              <Link href="/dashboard"
                className="px-5 py-2 rounded-full text-[13.5px] font-semibold text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: TC, boxShadow: `0 4px 14px ${TC}40` }}>
                Accès à mon mariage →
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[13.5px] font-medium transition-colors px-4 py-2 rounded-full"
                style={{ color: TEXT_MID }}
                onMouseEnter={(e) => (e.currentTarget.style.color = TC)}
                onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MID)}>
                Connexion
              </Link>
              <Link href="/signup"
                className="px-5 py-2 rounded-full text-[13.5px] font-semibold text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: TC, boxShadow: `0 4px 14px ${TC}40` }}>
                Inscrivez-vous
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden ml-auto transition-colors" style={{ color: TEXT_MID }}
          onClick={() => setMobileOpen(!mobileOpen)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            {mobileOpen ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></> : <><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></>}
          </svg>
        </button>
      </div>

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
              {loggedIn ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="mt-2 py-3 rounded-xl text-center text-[14px] font-semibold text-white"
                    style={{ background: TC }}>
                    Accès à mon mariage →
                  </Link>
                  <Link href="/settings" onClick={() => setMobileOpen(false)}
                    className="py-2.5 rounded-xl text-center text-[14px] font-medium border"
                    style={{ color: TEXT_MID, borderColor: "rgba(201,110,44,0.2)" }}>
                    Mon compte
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}
                    className="mt-2 py-3 rounded-xl text-center text-[14px] font-semibold text-white"
                    style={{ background: TC }}>
                    Inscrivez-vous →
                  </Link>
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="py-2.5 rounded-xl text-center text-[14px] font-medium border"
                    style={{ color: TEXT_MID, borderColor: "rgba(201,110,44,0.2)" }}>
                    Connexion
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

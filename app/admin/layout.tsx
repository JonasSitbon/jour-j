"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";
import type { AccountType } from "@/lib/types";
import { AdminThemeProvider, useAdminTheme, type AdminThemeId } from "./admin-theme-context";

interface Profile {
  account_type: AccountType;
  first_name: string;
  last_name: string;
}

interface NavSubItem { href: string; label: string; }
interface NavItem { href: string; label: string; icon: string; subnav?: NavSubItem[]; }

const NAV: NavItem[] = [
  { href: "/admin",           label: "Dashboard",        icon: "grid" },
  { href: "/admin/crm",       label: "CRM Clients",      icon: "users", subnav: [
    { href: "/admin/crm",                 label: "Liste clients"  },
    { href: "/admin/crm/pipeline",        label: "Pipeline"       },
    { href: "/admin/crm/comptabilite",    label: "Comptabilité"   },
  ]},
  { href: "/admin/users",     label: "Utilisateurs",     icon: "users"     },
  { href: "/admin/emails",    label: "Emails",            icon: "mail"      },
  { href: "/admin/roles",     label: "Rôles & Accès",    icon: "key"       },
  { href: "/admin/features",  label: "Fonctionnalités",  icon: "flag"      },
  { href: "/admin/logs",      label: "Logs & Statut",    icon: "activity"  },
];

// ─── Theme switcher button ────────────────────────────────────────────────────

function ThemeSwitcher() {
  const { tc, setAdminTheme } = useAdminTheme();
  const isCitron = tc.id === "citron";

  return (
    <button
      onClick={() => setAdminTheme(isCitron ? "default" : "citron")}
      title={isCitron ? "Thème : Dolce Vita (actif) — cliquer pour repasser au défaut" : "Activer thème Dolce Vita"}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all border"
      style={{
        background: isCitron ? tc.accentSoft : "#f9fafb",
        borderColor: isCitron ? tc.accentBorder : "#e5e7eb",
        color: isCitron ? tc.accentHue : "#6b7280",
      }}
    >
      <span style={{ fontSize: 15 }}>🍋</span>
      <span className="flex-1 text-left">{isCitron ? "Dolce Vita" : "Thème Orange"}</span>
      <span
        className="w-4 h-4 rounded-full border flex-shrink-0"
        style={{
          background: isCitron ? tc.accent : "#C96E2C",
          borderColor: "transparent",
        }}
      />
    </button>
  );
}

// ─── Sidebar inner (consumes theme) ──────────────────────────────────────────

function SidebarInner({ profile }: { profile: Profile | null }) {
  const { tc } = useAdminTheme();
  const pathname = usePathname();

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col border-r"
      style={{ background: "#ffffff", borderColor: tc.line }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: tc.line }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
            style={{ background: tc.accent, color: tc.accentInk }}
          >
            J
          </div>
          <span className="font-bold text-[15px]" style={{ color: "#111827" }}>Jour J · Admin</span>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: tc.accentSoft, color: tc.accentHue, border: `1px solid ${tc.accentBorder}` }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: tc.accent }} />
          Super Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {NAV.map((item) => {
          const active     = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const subnavOpen = Array.isArray(item.subnav) && pathname.startsWith(item.href);

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium mb-0.5 transition-all"
                style={{
                  background:  active ? tc.sidebarActiveBg : "transparent",
                  color:       active ? tc.accentHue : "#374151",
                  borderLeft:  active ? `2px solid ${tc.sidebarActiveBorder}` : "2px solid transparent",
                }}
              >
                <Icon name={item.icon} size={15} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
              {subnavOpen && Array.isArray(item.subnav) && (
                <div className="ml-5 mb-1 flex flex-col gap-px">
                  {item.subnav.map((sub) => {
                    const subActive = pathname === sub.href || (sub.href !== item.href && pathname.startsWith(sub.href));
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all"
                        style={{
                          background: subActive ? tc.sidebarActiveBg : "transparent",
                          color:      subActive ? tc.accentHue : "#6b7280",
                          borderLeft: subActive ? `2px solid ${tc.sidebarActiveBorder}` : "2px solid transparent",
                        }}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t space-y-2" style={{ borderColor: tc.line }}>
        <ThemeSwitcher />
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[12.5px] transition-colors px-2 hover:opacity-70"
          style={{ color: "#6b7280" }}
        >
          <Icon name="chevronL" size={13} />
          Retour au dashboard
        </Link>
        {profile && (
          <div className="text-[11.5px] px-2" style={{ color: "#9ca3af" }}>
            {profile.first_name} {profile.last_name}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Layout shell ─────────────────────────────────────────────────────────────

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const { tc } = useAdminTheme();

  useEffect(() => {
    async function check() {
      const c = createClient();
      const { data: { user } } = await c.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data } = await c.from("profiles").select("account_type, first_name, last_name").eq("id", user.id).maybeSingle();
      if (!data || data.account_type !== "super_admin") { router.replace("/dashboard"); return; }
      setProfile(data as Profile);
      setChecking(false);
    }
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f6f8fa" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${tc.accent}40`, borderTopColor: tc.accent }}
          />
          <p className="text-sm" style={{ color: "#6b7280" }}>Vérification des droits…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f6f8fa", color: "#111827" }}>
      <SidebarInner profile={profile} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminThemeProvider>
  );
}

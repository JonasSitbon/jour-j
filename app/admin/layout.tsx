"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";
import type { AccountType } from "@/lib/types";

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile]   = useState<Profile | null>(null);

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
          <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: "#6b7280" }}>Vérification des droits…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f6f8fa", color: "#111827" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col border-r"
        style={{ background: "#ffffff", borderColor: "#e5e7eb" }}
      >
        {/* Logo / Header */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: "#C96E2C", color: "#fffaf2" }}
            >
              J
            </div>
            <span className="font-bold text-[15px]" style={{ color: "#111827" }}>Jour J · Admin</span>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: "#fff7ed", color: "#C96E2C", border: "1px solid rgba(201,110,44,0.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#C96E2C" }} />
            Super Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {NAV.map((item) => {
            const active      = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const hasSubnav   = Array.isArray(item.subnav);
            const subnavOpen  = hasSubnav && pathname.startsWith(item.href);

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium mb-0.5 transition-all"
                  style={{
                    background:  active ? "#fff7ed" : "transparent",
                    color:       active ? "#C96E2C" : "#374151",
                    borderLeft:  active ? "2px solid #C96E2C" : "2px solid transparent",
                  }}
                >
                  <Icon name={item.icon} size={15} strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
                {hasSubnav && subnavOpen && (
                  <div className="ml-5 mb-1 flex flex-col gap-px">
                    {item.subnav!.map((sub) => {
                      const subActive = pathname === sub.href || (sub.href !== item.href && pathname.startsWith(sub.href));
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all"
                          style={{
                            background: subActive ? "#fff7ed" : "transparent",
                            color:      subActive ? "#C96E2C" : "#6b7280",
                            borderLeft: subActive ? "2px solid #C96E2C" : "2px solid transparent",
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
        <div className="px-4 py-4 border-t" style={{ borderColor: "#e5e7eb" }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[13px] transition-colors mb-3 hover:opacity-70"
            style={{ color: "#6b7280" }}
          >
            <Icon name="chevronL" size={14} />
            Retour au dashboard
          </Link>
          {profile && (
            <div className="text-[12px]" style={{ color: "#9ca3af" }}>
              {profile.first_name} {profile.last_name}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

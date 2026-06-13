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

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/users", label: "Utilisateurs", icon: "users" },
  { href: "/admin/emails", label: "Emails", icon: "mail" },
  { href: "/admin/roles", label: "Rôles & Accès", icon: "key" },
  { href: "/admin/features", label: "Fonctionnalités", icon: "flag" },
  { href: "/admin/logs", label: "Logs & Statut", icon: "activity" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Vérification des droits…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0f1117", color: "#e8e4dc" }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col border-r"
        style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
      >
        {/* Header */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "#2a2a3e" }}>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: "#C96E2C", color: "#fffaf2" }}
            >
              J
            </div>
            <span className="font-bold text-[15px]" style={{ color: "#f0ead8" }}>Jour J · Admin</span>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: "#C96E2C22", color: "#e2945a", border: "1px solid #C96E2C44" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
            Super Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors"
                style={{
                  background: active ? "#C96E2C22" : "transparent",
                  color: active ? "#e2945a" : "#9ca3af",
                  border: active ? "1px solid #C96E2C33" : "1px solid transparent",
                }}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t" style={{ borderColor: "#2a2a3e" }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm transition-colors mb-3"
            style={{ color: "#6b7280" }}
          >
            <Icon name="chevronL" size={14} />
            Retour au dashboard
          </Link>
          {profile && (
            <div className="text-xs" style={{ color: "#4b5563" }}>
              {profile.first_name} {profile.last_name}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

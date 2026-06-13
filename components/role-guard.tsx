"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/components/providers";
import { Icon } from "@/components/icon";
import {
  ALL_PAGE_IDS,
  canAccessPage,
  getFilteredNavGroups,
  weddingRoleToCollaboratorRole,
} from "@/lib/roles";

/**
 * Garde d'accès par rôle au niveau page (le RLS bloque déjà côté base ;
 * ici on évite qu'un collaborateur atteigne une page interdite via l'URL,
 * et on affiche un bandeau lecture seule pour les lecteurs).
 */
export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const activeWedding = state.myWeddings.find((w) => w.id === state.activeWeddingId);
  const role = activeWedding?.role; // undefined tant que les données ne sont pas chargées
  const collabRole = role ? weddingRoleToCollaboratorRole(role) : null;

  const pageId = pathname.split("/")[1] ?? "";
  const isGuardedPage = (ALL_PAGE_IDS as readonly string[]).includes(pageId);
  const allowed = !collabRole || !isGuardedPage || canAccessPage(collabRole, pageId);

  useEffect(() => {
    if (!allowed && collabRole) {
      const groups = getFilteredNavGroups(collabRole);
      const fallback = groups[0]?.items[0]?.id ?? "dashboard";
      router.replace(`/${fallback}`);
    }
  }, [allowed, collabRole, router]);

  if (!allowed) return null;

  const readOnly = role === "viewer";

  return (
    <>
      {readOnly && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] border-b border-line"
          style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
        >
          <Icon name="eye" size={14} />
          Accès en lecture seule — vous pouvez consulter ce mariage mais pas le modifier.
        </div>
      )}
      {children}
    </>
  );
}

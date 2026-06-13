import { describe, it, expect } from "vitest";
import {
  canAccessPage,
  getFilteredNavGroups,
  weddingRoleToCollaboratorRole,
  DEFAULT_ROLE_PERMISSIONS,
} from "./roles";

describe("canAccessPage", () => {
  it("owner et admin ont accès à toutes les pages", () => {
    expect(canAccessPage("owner", "budget")).toBe(true);
    expect(canAccessPage("admin", "settings")).toBe(true);
  });

  it("un DJ accède à la musique mais pas au budget", () => {
    expect(canAccessPage("dj", "music")).toBe(true);
    expect(canAccessPage("dj", "budget")).toBe(false);
  });

  it("un lecteur n'a que le dashboard et le déroulé", () => {
    expect(canAccessPage("lecteur", "dashboard")).toBe(true);
    expect(canAccessPage("lecteur", "dayj")).toBe(true);
    expect(canAccessPage("lecteur", "guests")).toBe(false);
  });

  it("les permissions personnalisées priment sur les défauts du rôle", () => {
    expect(canAccessPage("dj", "budget", ["budget"])).toBe(true);
    expect(canAccessPage("dj", "music", ["budget"])).toBe(false);
  });
});

describe("getFilteredNavGroups", () => {
  it("owner voit tous les groupes de navigation", () => {
    const groups = getFilteredNavGroups("owner");
    expect(groups.length).toBeGreaterThan(0);
    // owner a accès partout : aucune page n'est filtrée
    for (const g of groups) {
      for (const item of g.items) {
        expect(canAccessPage("owner", item.id)).toBe(true);
      }
    }
    expect(groups.some((g) => g.items.some((i) => i.id === "budget"))).toBe(true);
  });

  it("supprime les groupes sans aucune page accessible", () => {
    const groups = getFilteredNavGroups("dj");
    // Le DJ n'a accès à aucune page Finances → le groupe disparaît
    expect(groups.some((g) => g.id === "finance")).toBe(false);
    // Mais toutes les pages affichées lui sont bien autorisées
    for (const g of groups) {
      for (const item of g.items) {
        expect(canAccessPage("dj", item.id)).toBe(true);
      }
    }
  });
});

describe("weddingRoleToCollaboratorRole", () => {
  it("mappe les rôles wedding vers les rôles collaborateur", () => {
    expect(weddingRoleToCollaboratorRole("owner")).toBe("owner");
    expect(weddingRoleToCollaboratorRole("admin")).toBe("admin");
    expect(weddingRoleToCollaboratorRole("editor")).toBe("coordinateur");
    expect(weddingRoleToCollaboratorRole("viewer")).toBe("lecteur");
  });
});

describe("DEFAULT_ROLE_PERMISSIONS", () => {
  it("le propriétaire a le plus de pages, le lecteur le moins", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.owner.length)
      .toBeGreaterThan(DEFAULT_ROLE_PERMISSIONS.lecteur.length);
  });
});

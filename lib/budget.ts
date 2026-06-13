import type { BudgetPost } from "./types";

// Libellés des règles de répartition d'un poste de budget entre les partenaires
export const BUDGET_RULES: Record<string, string> = {
  split50: "50 / 50",
  byGuests: "Au prorata des invités",
  onlyA: "Pris en charge par A",
  onlyB: "Pris en charge par B",
  family: "Contribution familles",
  custom: "Personnalisé",
};

export interface SplitContext {
  /** Nom du partenaire A */
  A: string;
  /** Nom du partenaire B */
  B: string;
  /** Nombre d'invités côté A (pour la règle byGuests) */
  ga: number;
  /** Nombre d'invités côté B */
  gb: number;
}

/**
 * Répartit le montant *prévu* d'un poste entre les contributeurs selon sa règle.
 * Renvoie un objet { contributeur: montant }.
 */
export function splitPost(b: BudgetPost, ctx: SplitContext): Record<string, number> {
  const amt = b.planned;
  const out: Record<string, number> = {};
  const add = (k: string, v: number) => { out[k] = (out[k] || 0) + v; };
  switch (b.rule) {
    case "onlyA": add(ctx.A, amt); break;
    case "onlyB": add(ctx.B, amt); break;
    case "byGuests": {
      const tot = ctx.ga + ctx.gb;
      if (tot === 0) {
        // Aucun invité compté → on évite que le montant disparaisse
        // (sans ce repli, byGuests donnerait 0 à chacun)
        add(ctx.A, amt / 2);
        add(ctx.B, amt / 2);
      } else {
        add(ctx.A, amt * ctx.ga / tot);
        add(ctx.B, amt * ctx.gb / tot);
      }
      break;
    }
    case "family":
      add("Famille " + ctx.A, amt / 2);
      add("Famille " + ctx.B, amt / 2);
      break;
    case "custom":
      add(ctx.A, amt * (b.custom?.A || 0) / 100);
      add(ctx.B, amt * (b.custom?.B || 0) / 100);
      break;
    default:
      add(ctx.A, amt / 2);
      add(ctx.B, amt / 2);
  }
  return out;
}

/**
 * Agrège la répartition de tous les postes : qui doit combien au total.
 */
export function aggregateSplits(posts: BudgetPost[], ctx: SplitContext): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const b of posts) {
    const s = splitPost(b, ctx);
    for (const [k, v] of Object.entries(s)) acc[k] = (acc[k] || 0) + v;
  }
  return acc;
}

/** Total prévu / total dépensé sur un ensemble de postes */
export function budgetTotals(posts: BudgetPost[]): { planned: number; spent: number } {
  return posts.reduce(
    (t, p) => ({ planned: t.planned + (p.planned || 0), spent: t.spent + (p.spent || 0) }),
    { planned: 0, spent: 0 }
  );
}

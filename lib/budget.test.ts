import { describe, it, expect } from "vitest";
import { splitPost, aggregateSplits, budgetTotals, type SplitContext } from "./budget";
import type { BudgetPost } from "./types";

const ctx: SplitContext = { A: "Camille", B: "Alex", ga: 60, gb: 40 };

function post(p: Partial<BudgetPost>): BudgetPost {
  return { id: 1, label: "Poste", cat: "divers", planned: 1000, spent: 0, rule: "split50", custom: null, ...p };
}

describe("splitPost", () => {
  it("split50 partage à parts égales", () => {
    expect(splitPost(post({ rule: "split50" }), ctx)).toEqual({ Camille: 500, Alex: 500 });
  });

  it("onlyA / onlyB attribuent tout à un seul partenaire", () => {
    expect(splitPost(post({ rule: "onlyA" }), ctx)).toEqual({ Camille: 1000 });
    expect(splitPost(post({ rule: "onlyB" }), ctx)).toEqual({ Alex: 1000 });
  });

  it("byGuests répartit au prorata des invités", () => {
    expect(splitPost(post({ rule: "byGuests" }), ctx)).toEqual({ Camille: 600, Alex: 400 });
  });

  it("byGuests sans invités évite la division par zéro", () => {
    const out = splitPost(post({ rule: "byGuests" }), { ...ctx, ga: 0, gb: 0 });
    expect(out.Camille + out.Alex).toBe(1000);
  });

  it("family partage entre les deux familles", () => {
    expect(splitPost(post({ rule: "family" }), ctx)).toEqual({
      "Famille Camille": 500,
      "Famille Alex": 500,
    });
  });

  it("custom respecte les pourcentages fournis", () => {
    expect(splitPost(post({ rule: "custom", custom: { A: 70, B: 30 } }), ctx)).toEqual({
      Camille: 700,
      Alex: 300,
    });
  });

  it("custom sans valeurs n'attribue rien", () => {
    expect(splitPost(post({ rule: "custom", custom: null }), ctx)).toEqual({ Camille: 0, Alex: 0 });
  });

  it("une règle inconnue retombe sur le partage 50/50", () => {
    expect(splitPost(post({ rule: "wat" as any }), ctx)).toEqual({ Camille: 500, Alex: 500 });
  });
});

describe("aggregateSplits", () => {
  it("additionne les contributions de plusieurs postes", () => {
    const posts = [
      post({ id: 1, planned: 1000, rule: "split50" }),
      post({ id: 2, planned: 500, rule: "onlyA" }),
      post({ id: 3, planned: 200, rule: "onlyB" }),
    ];
    expect(aggregateSplits(posts, ctx)).toEqual({ Camille: 1000, Alex: 700 });
  });

  it("renvoie un objet vide sans postes", () => {
    expect(aggregateSplits([], ctx)).toEqual({});
  });
});

describe("budgetTotals", () => {
  it("somme prévu et dépensé", () => {
    const posts = [
      post({ planned: 1000, spent: 800 }),
      post({ planned: 500, spent: 0 }),
    ];
    expect(budgetTotals(posts)).toEqual({ planned: 1500, spent: 800 });
  });

  it("tolère les champs manquants", () => {
    const posts = [post({ planned: undefined as any, spent: undefined as any })];
    expect(budgetTotals(posts)).toEqual({ planned: 0, spent: 0 });
  });
});

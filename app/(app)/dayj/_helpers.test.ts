import { describe, it, expect } from "vitest";
import {
  fmtTime, addMinutes, subMinutes, fmtDuration, toTotalMinutes,
  addDaysToDate, generateId, cx, getNowMinutes,
} from "./_helpers";

describe("fmtTime", () => {
  it("pad les heures et minutes sur 2 chiffres", () => {
    expect(fmtTime(9, 5)).toBe("09:05");
    expect(fmtTime(14, 30)).toBe("14:30");
    expect(fmtTime(0, 0)).toBe("00:00");
  });
});

describe("addMinutes", () => {
  it("additionne sans dépassement d'heure", () => {
    expect(addMinutes(14, 0, 30)).toEqual({ h: 14, m: 30 });
  });
  it("gère le passage à l'heure suivante", () => {
    expect(addMinutes(14, 45, 30)).toEqual({ h: 15, m: 15 });
  });
  it("repasse à 0 après minuit (modulo 24h)", () => {
    expect(addMinutes(23, 30, 60)).toEqual({ h: 0, m: 30 });
  });
});

describe("subMinutes", () => {
  it("soustrait normalement", () => {
    expect(subMinutes(14, 30, 45)).toEqual({ h: 13, m: 45 });
  });
  it("ne descend pas sous 00:00", () => {
    expect(subMinutes(0, 20, 60)).toEqual({ h: 0, m: 0 });
  });
});

describe("fmtDuration", () => {
  it("affiche les minutes seules sous 1h", () => {
    expect(fmtDuration(45)).toBe("45 min");
  });
  it("affiche les heures pleines", () => {
    expect(fmtDuration(120)).toBe("2h");
  });
  it("affiche heures + minutes", () => {
    expect(fmtDuration(90)).toBe("1h30");
    expect(fmtDuration(125)).toBe("2h05");
  });
});

describe("toTotalMinutes", () => {
  it("convertit h:m en minutes totales", () => {
    expect(toTotalMinutes(2, 30)).toBe(150);
  });
});

describe("addDaysToDate", () => {
  it("ajoute des jours à une date YYYY-MM-DD", () => {
    expect(addDaysToDate("2027-06-12", 1)).toBe("2027-06-13");
    expect(addDaysToDate("2027-06-30", 1)).toBe("2027-07-01");
  });
  it("retourne une chaîne vide sur entrée vide", () => {
    expect(addDaysToDate("", 1)).toBe("");
  });
});

describe("cx", () => {
  it("filtre les valeurs falsy et joint le reste", () => {
    expect(cx("a", false, "b", null, undefined, "c")).toBe("a b c");
    expect(cx(false, null)).toBe("");
  });
});

describe("generateId", () => {
  it("génère des identifiants uniques", () => {
    expect(generateId()).not.toBe(generateId());
  });
});

describe("getNowMinutes", () => {
  it("renvoie un nombre entre 0 et 1439", () => {
    const v = getNowMinutes();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(24 * 60);
  });
});

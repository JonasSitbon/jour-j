import { describe, it, expect } from "vitest";
import {
  guestToDb, guestFromDb,
  vendorToDb, vendorFromDb,
  paymentToDb, paymentFromDb,
} from "./db";
import type { Guest, Vendor, Payment } from "./types";

describe("mappers Guest", () => {
  const guest: Guest = {
    id: 1, name: "Sophie", side: "A", rsvp: "yes", diet: "none", table: 3,
    lodging: "hôtel", child: false, transport: true, gift: true,
    group: "Famille", note: "Tante", rsvpToken: "tok", rsvpMessage: "Hâte !",
  };

  it("traduit les noms de colonnes app → db", () => {
    const row = guestToDb(guest);
    expect(row.table_id).toBe(3);
    expect(row.group_name).toBe("Famille");
    // guestToDb ne renvoie pas les champs gérés côté DB (tokens)
    expect(row).not.toHaveProperty("rsvp_token");
  });

  it("relit une ligne db → app", () => {
    const back = guestFromDb({
      id: 1, name: "Sophie", side: "A", rsvp: "yes", diet: "none", table_id: 3,
      lodging: "hôtel", child: false, transport: true, gift: true,
      group_name: "Famille", note: "Tante", rsvp_token: "tok", rsvp_message: "Hâte !",
    });
    expect(back).toEqual(guest);
  });

  it("rsvpMessage absent devient une chaîne vide", () => {
    expect(guestFromDb({ id: 1, name: "X" }).rsvpMessage).toBe("");
  });
});

describe("mappers Vendor", () => {
  const vendor: Vendor = {
    id: 2, cat: "photo", name: "Studio", total: 2600, status: "signed",
    score: "A", scores: { prix: 4, qualite: 5, reactivite: 5, references: 5, flexibilite: 5 },
    included: "journée", contact: "Léa", phone: "06", email: "a@b.fr",
    lastContact: "2026-05-20", docs: 1,
  };

  it("round-trip conserve les données (lastContact ↔ last_contact)", () => {
    const row = vendorToDb(vendor);
    expect(row.last_contact).toBe("2026-05-20");
    expect(vendorFromDb(row)).toEqual(vendor);
  });
});

describe("mappers Payment", () => {
  const payment: Payment = {
    id: 3, vendor: "Studio", label: "Acompte", amount: 800, due: "2026-04-01",
    paidDate: "2026-04-01", who: "A", method: "virement", status: "paid", receipt: 1,
  };

  it("round-trip conserve les données (paidDate ↔ paid_date)", () => {
    const row = paymentToDb(payment);
    expect(row.paid_date).toBe("2026-04-01");
    expect(paymentFromDb(row)).toEqual(payment);
  });

  it("gère un paiement non réglé (paidDate null)", () => {
    const row = paymentToDb({ ...payment, paidDate: null, status: "upcoming" });
    expect(row.paid_date).toBeNull();
    expect(paymentFromDb(row).paidDate).toBeNull();
  });
});

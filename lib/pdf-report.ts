import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AppState } from "./types";

// ─── Colors ─────────────────────────────────────────────────────────────────
const C = {
  terra:  [201, 110, 44]  as [number, number, number],
  dark:   [28,  28,  30]  as [number, number, number],
  cream:  [251, 248, 243] as [number, number, number],
  sage:   [126, 154, 99]  as [number, number, number],
  coral:  [192, 83,  58]  as [number, number, number],
  amber:  [176, 122, 44]  as [number, number, number],
  muted:  [130, 110, 90]  as [number, number, number],
  line:   [232, 224, 216] as [number, number, number],
  surf:   [245, 240, 234] as [number, number, number],
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
};

const today = () =>
  new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// ─── Page helpers ────────────────────────────────────────────────────────────

function header(doc: jsPDF, title: string, partnerA: string, partnerB: string) {
  doc.setFillColor(...C.terra);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${partnerA} & ${partnerB}`, 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(title, 105, 13, { align: "center" });
  doc.text(today(), 196, 13, { align: "right" });
}

function footer(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text(`Page ${pageNum} / ${totalPages} — Jour J`, 105, 291, { align: "center" });
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(...C.surf);
  doc.rect(14, y, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.terra);
  doc.text(text, 17, y + 5.5);
  return y + 12;
}

function statRow(doc: jsPDF, label: string, value: string, y: number, valueColor = C.dark): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text(label, 17, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...valueColor);
  doc.text(value, 196, y, { align: "right" });
  return y + 6;
}

// ─── Cover page ───────────────────────────────────────────────────────────────

function drawCover(doc: jsPDF, state: AppState) {
  const { partnerA, partnerB, date, venue, city } = state.wedding;

  // Full gradient background
  doc.setFillColor(74, 51, 32);
  doc.rect(0, 0, 210, 297, "F");

  // Decorative circle
  doc.setFillColor(201, 110, 44);
  doc.circle(160, 240, 80, "F");
  doc.setFillColor(110, 68, 35);
  doc.circle(160, 240, 60, "F");
  doc.setFillColor(74, 51, 32);
  doc.circle(160, 240, 40, "F");

  // Logo area
  doc.setFillColor(244, 236, 221);
  doc.setFillColor(244, 236, 221, 0.15 as any);
  doc.roundedRect(14, 20, 55, 12, 3, 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(244, 236, 221);
  doc.text("JOUR J", 17, 28);

  // Names
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  doc.setTextColor(251, 248, 243);
  const name1 = partnerA || "Partenaire A";
  const name2 = partnerB || "Partenaire B";
  doc.text(name1, 14, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  doc.setTextColor(201, 110, 44);
  doc.text("& ", 14, 118);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  doc.setTextColor(251, 248, 243);
  const nameW = doc.getTextWidth("& ");
  doc.text(name2, 14 + nameW * 0.55, 118);

  // Decorative line
  doc.setFillColor(201, 110, 44);
  doc.rect(14, 125, 60, 2, "F");

  // Date & venue
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(244, 236, 221);
  if (date) doc.text(fmtDate(date), 14, 138);
  if (venue) {
    doc.setFontSize(11);
    doc.setTextColor(180, 150, 110);
    doc.text(`${venue}${city ? `, ${city}` : ""}`, 14, 148);
  }

  // Report label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(180, 150, 110);
  doc.text("RAPPORT DE PRÉPARATION COMPLET", 14, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Généré le ${today()}`, 14, 210);

  // Stats preview
  const totalGuests = state.guests.length;
  const confirmedGuests = state.guests.filter((g) => g.rsvp === "yes").length;
  const totalBudget = state.budgetTotal || state.budget.reduce((s, b) => s + b.planned, 0);
  const tasksDone = state.tasks.filter((t) => t.done).length;
  const tasksPct = state.tasks.length ? Math.round(tasksDone / state.tasks.length * 100) : 0;

  const stats = [
    { val: `${confirmedGuests}/${totalGuests}`, lbl: "Invités confirmés" },
    { val: fmtEur(totalBudget),                lbl: "Budget total" },
    { val: `${tasksPct}%`,                     lbl: "Checklist" },
    { val: String(state.vendors.filter((v) => v.status === "signed").length), lbl: "Prestataires signés" },
  ];
  stats.forEach((s, i) => {
    const sx = 14 + i * 47;
    doc.setFillColor(120, 80, 40);
    doc.roundedRect(sx, 230, 43, 22, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(251, 248, 243);
    doc.text(s.val, sx + 21.5, 241, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(180, 150, 110);
    doc.text(s.lbl, sx + 21.5, 248, { align: "center" });
  });
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function exportWeddingReport(state: AppState) {
  const { partnerA = "Partenaire A", partnerB = "Partenaire B" } = state.wedding;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Cover ──────────────────────────────────────────────────────────────────
  drawCover(doc, state);

  // ── Table of contents ─────────────────────────────────────────────────────
  doc.addPage();
  header(doc, "Sommaire", partnerA, partnerB);
  let y = 32;
  const sections = [
    { num: "01", title: "Vue d'ensemble & Informations" },
    { num: "02", title: "Invités & RSVP" },
    { num: "03", title: "Budget & Dépenses" },
    { num: "04", title: "Prestataires" },
    { num: "05", title: "Paiements & Échéances" },
    { num: "06", title: "Checklist & Tâches" },
  ];
  sections.forEach((s) => {
    doc.setFillColor(...C.surf);
    doc.rect(14, y, 182, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.terra);
    doc.text(s.num, 17, y + 6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark);
    doc.text(s.title, 32, y + 6.5);
    y += 13;
  });

  // ── Section 01 : Overview ─────────────────────────────────────────────────
  doc.addPage();
  header(doc, "01 — Vue d'ensemble", partnerA, partnerB);
  y = 32;
  y = sectionTitle(doc, "Informations du mariage", y);

  const info: Array<[string, string]> = [
    ["Partenaire A",   partnerA],
    ["Partenaire B",   partnerB],
    ["Date du mariage", state.wedding.date ? fmtDate(state.wedding.date) : "Non définie"],
    ["Lieu",           state.wedding.venue || "—"],
    ["Ville",          state.wedding.city  || "—"],
    ["Thème",          state.wedding.theme || "—"],
    ["Objectif invités", String(state.wedding.guestTarget || "—")],
  ];
  info.forEach(([label, val]) => { y = statRow(doc, label, val, y); });

  y += 6;
  y = sectionTitle(doc, "Résumé global", y);

  const totalBudget = state.budgetTotal || state.budget.reduce((s, b) => s + b.planned, 0);
  const totalSpent  = state.budget.reduce((s, b) => s + b.spent, 0);
  const latePayments = state.payments.filter((p) => p.status === "late");

  const summary: Array<[string, string, [number,number,number]?]> = [
    ["Invités confirmés",    `${state.guests.filter(g=>g.rsvp==="yes").length} / ${state.guests.length}`],
    ["Invités en attente",   String(state.guests.filter(g=>g.rsvp==="pending").length)],
    ["Budget total prévu",   fmtEur(totalBudget)],
    ["Budget dépensé",       fmtEur(totalSpent), totalSpent > totalBudget ? C.coral : C.sage],
    ["Paiements en retard",  String(latePayments.length), latePayments.length > 0 ? C.coral : C.sage],
    ["Prestataires signés",  `${state.vendors.filter(v=>v.status==="signed").length} / ${state.vendors.length}`],
    ["Tâches complétées",    `${state.tasks.filter(t=>t.done).length} / ${state.tasks.length} (${state.tasks.length ? Math.round(state.tasks.filter(t=>t.done).length/state.tasks.length*100) : 0}%)`],
  ];
  summary.forEach(([label, val, col]) => { y = statRow(doc, label, val, y, col); });

  // ── Section 02 : Guests ───────────────────────────────────────────────────
  doc.addPage();
  header(doc, "02 — Invités & RSVP", partnerA, partnerB);

  const dietCounts: Record<string, number> = {};
  state.guests.forEach((g) => {
    if (g.diet && g.diet !== "none" && g.diet !== "standard") {
      dietCounts[g.diet] = (dietCounts[g.diet] ?? 0) + 1;
    }
  });

  autoTable(doc, {
    startY: 28,
    head: [["Nom", "Côté", "RSVP", "Régime", "Table", "Enfant", "Transport"]],
    body: state.guests.map((g) => [
      g.name,
      g.side === "A" ? partnerA : partnerB,
      g.rsvp === "yes" ? "✓ Confirmé" : g.rsvp === "declined" ? "✗ Décliné" : "⏳ En attente",
      g.diet && g.diet !== "none" ? g.diet : "—",
      g.table != null ? String(g.table) : "—",
      g.child ? "Oui" : "—",
      g.transport ? "Oui" : "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: C.terra, textColor: [255, 250, 242] as [number,number,number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: C.dark, cellPadding: 1.8 },
    columnStyles: { 2: { fontStyle: "bold" } },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === "body") {
        const v = data.cell.text[0] ?? "";
        if (v.startsWith("✓")) data.cell.styles.textColor = C.sage;
        else if (v.startsWith("✗")) data.cell.styles.textColor = C.coral;
        else data.cell.styles.textColor = C.amber;
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Section 03 : Budget ───────────────────────────────────────────────────
  doc.addPage();
  header(doc, "03 — Budget & Dépenses", partnerA, partnerB);

  autoTable(doc, {
    startY: 28,
    head: [["Poste", "Catégorie", "Prévu", "Dépensé", "Solde", ""]],
    body: state.budget.map((b) => {
      const delta = b.spent - b.planned;
      return [
        b.label,
        b.cat,
        fmtEur(b.planned),
        fmtEur(b.spent),
        delta >= 0 ? `+${fmtEur(delta)}` : fmtEur(delta),
        `${b.planned > 0 ? Math.min(Math.round(b.spent/b.planned*100), 100) : 0}%`,
      ];
    }),
    foot: [[
      "TOTAL", "",
      fmtEur(state.budget.reduce((s,b)=>s+b.planned,0)),
      fmtEur(state.budget.reduce((s,b)=>s+b.spent,0)),
      fmtEur(state.budget.reduce((s,b)=>s+b.spent-b.planned,0)),
      "",
    ]],
    theme: "striped",
    headStyles: { fillColor: C.terra, textColor: [255,250,242] as [number,number,number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: C.dark, cellPadding: 1.8 },
    footStyles: { fillColor: C.surf, textColor: C.dark, fontStyle: "bold", fontSize: 8.5 },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === "body") {
        const v = data.cell.text[0] ?? "";
        data.cell.styles.textColor = v.startsWith("+") ? C.coral : C.sage;
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Section 04 : Vendors ──────────────────────────────────────────────────
  doc.addPage();
  header(doc, "04 — Prestataires", partnerA, partnerB);

  autoTable(doc, {
    startY: 28,
    head: [["Prestataire", "Catégorie", "Statut", "Total", "Contact", "Email"]],
    body: state.vendors.map((v) => [
      v.name,
      v.cat,
      v.status === "signed" ? "✓ Signé" : v.status === "declined" ? "✗ Refusé" : "⏳ En cours",
      fmtEur(v.total),
      v.contact || "—",
      v.email   || "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: C.terra, textColor: [255,250,242] as [number,number,number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: C.dark, cellPadding: 1.8 },
    columnStyles: { 3: { halign: "right" } },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === "body") {
        const v = data.cell.text[0] ?? "";
        data.cell.styles.textColor = v.startsWith("✓") ? C.sage : v.startsWith("✗") ? C.coral : C.amber;
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Section 05 : Payments ─────────────────────────────────────────────────
  doc.addPage();
  header(doc, "05 — Paiements & Échéances", partnerA, partnerB);

  const sortedPayments = [...state.payments].sort((a, b) => {
    const order = { late: 0, partial: 1, upcoming: 2, paid: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4) || a.due.localeCompare(b.due);
  });

  autoTable(doc, {
    startY: 28,
    head: [["Prestataire", "Libellé", "Montant", "Échéance", "Statut", "Méthode"]],
    body: sortedPayments.map((p) => [
      p.vendor,
      p.label,
      fmtEur(p.amount),
      fmtDate(p.due),
      p.status === "paid" ? "✓ Payé" : p.status === "late" ? "⚠ Retard" : p.status === "partial" ? "~ Partiel" : "◦ À venir",
      p.method,
    ]),
    theme: "striped",
    headStyles: { fillColor: C.terra, textColor: [255,250,242] as [number,number,number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: C.dark, cellPadding: 1.8 },
    columnStyles: { 2: { halign: "right" } },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === "body") {
        const v = data.cell.text[0] ?? "";
        data.cell.styles.textColor = v.startsWith("✓") ? C.sage : v.startsWith("⚠") ? C.coral : v.startsWith("~") ? C.amber : C.muted;
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Section 06 : Checklist ────────────────────────────────────────────────
  doc.addPage();
  header(doc, "06 — Checklist & Tâches", partnerA, partnerB);

  const sortedTasks = [...state.tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.due.localeCompare(b.due);
  });

  autoTable(doc, {
    startY: 28,
    head: [["", "Tâche", "Catégorie", "Échéance", "Responsable", "Note"]],
    body: sortedTasks.map((t) => [
      t.done ? "☑" : "☐",
      t.title,
      t.cat,
      fmtDate(t.due),
      t.who === "A" ? partnerA : partnerB,
      t.note || "",
    ]),
    theme: "plain",
    headStyles: { fillColor: C.terra, textColor: [255,250,242] as [number,number,number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: C.dark, cellPadding: 1.8 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center", fontStyle: "bold" },
      5: { textColor: C.muted as [number,number,number], cellWidth: 35 },
    },
    alternateRowStyles: { fillColor: C.surf },
    didParseCell: (data) => {
      const t = sortedTasks[data.row.index];
      if (!t) return;
      if (t.done) data.cell.styles.textColor = [160, 140, 120] as [number, number, number];
      const today2 = new Date().toISOString().split("T")[0];
      if (!t.done && t.due && t.due < today2 && data.column.index === 3) {
        data.cell.styles.textColor = C.coral;
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Paginate footers ──────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    footer(doc, i - 1, totalPages - 1);
  }

  doc.save(`rapport-complet-${partnerA}-${partnerB}.pdf`);
}

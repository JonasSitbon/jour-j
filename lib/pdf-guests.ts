import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Guest } from "./types";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK = [28, 28, 30] as [number, number, number];
const CREAM = [251, 248, 243] as [number, number, number];
const SAGE = [126, 154, 99] as [number, number, number];

function rsvpLabel(r: string) {
  if (r === "yes") return "Confirmé";
  if (r === "declined") return "Décliné";
  return "En attente";
}

export function exportGuestListPDF(guests: Guest[], partnerA: string, partnerB: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Header
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 297, 24, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${partnerA} & ${partnerB} — Liste des invités`, 14, 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Exporté le ${today}`, 283, 15.5, { align: "right" });

  // Stats bar
  const confirmed = guests.filter((g) => g.rsvp === "yes").length;
  const declined = guests.filter((g) => g.rsvp === "declined").length;
  const pending = guests.filter((g) => g.rsvp === "pending").length;
  const children = guests.filter((g) => g.child).length;

  doc.setFillColor(...CREAM);
  doc.rect(0, 24, 297, 14, "F");
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const stats = [
    `Total : ${guests.length}`,
    `Confirmés : ${confirmed}`,
    `En attente : ${pending}`,
    `Déclinés : ${declined}`,
    `Enfants : ${children}`,
  ];
  stats.forEach((s, i) => doc.text(s, 14 + i * 55, 33));

  // Table
  autoTable(doc, {
    startY: 40,
    head: [["Nom", "Côté", "RSVP", "Régime", "Enfant", "Table", "Groupe", "Note"]],
    body: guests.map((g) => [
      g.name,
      g.side === "A" ? partnerA : partnerB,
      rsvpLabel(g.rsvp),
      g.diet || "Standard",
      g.child ? "✓" : "",
      g.table ?? "—",
      g.group || "—",
      g.note || "",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: DARK,
      textColor: [251, 248, 243],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 8.5, cellPadding: 2.5, textColor: DARK },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 48 },
      1: { cellWidth: 28 },
      2: { cellWidth: 24 },
      3: { cellWidth: 32 },
      4: { cellWidth: 16, halign: "center" },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 28 },
      7: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const v = data.cell.raw as string;
        if (v === "Confirmé") data.cell.styles.textColor = SAGE;
        if (v === "Décliné") data.cell.styles.textColor = [192, 83, 58];
        if (v === "En attente") data.cell.styles.textColor = [160, 120, 40];
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(160, 140, 120);
      doc.text(
        `Page ${data.pageNumber} — Jour J · by The Cockpit`,
        148.5, doc.internal.pageSize.height - 6,
        { align: "center" }
      );
    },
  });

  doc.save(`invités-${partnerA}-${partnerB}.pdf`);
}

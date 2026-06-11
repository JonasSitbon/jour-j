import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Vendor } from "./types";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK = [28, 28, 30] as [number, number, number];
const CREAM = [251, 248, 243] as [number, number, number];
const SAGE = [126, 154, 99] as [number, number, number];

function statusLabel(s: string) {
  if (s === "signed") return "Signé";
  if (s === "declined") return "Refusé";
  return "En attente";
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
}

export function exportVendorsPDF(vendors: Vendor[], partnerA: string, partnerB: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Header
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 297, 24, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${partnerA} & ${partnerB} — Carnet de prestataires`, 14, 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Exporté le ${today}`, 283, 15.5, { align: "right" });

  // Stats
  const signed = vendors.filter((v) => v.status === "signed");
  const pending = vendors.filter((v) => v.status === "pending");
  const totalSigned = signed.reduce((s, v) => s + v.total, 0);

  doc.setFillColor(...CREAM);
  doc.rect(0, 24, 297, 12, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  const stats = [
    `Total : ${vendors.length} prestataires`,
    `Signés : ${signed.length}`,
    `En attente : ${pending.length}`,
    `Budget engagé : ${fmtEur(totalSigned)}`,
  ];
  stats.forEach((s, i) => doc.text(s, 14 + i * 68, 32));

  // Table
  autoTable(doc, {
    startY: 40,
    head: [["Catégorie", "Prestataire", "Statut", "Note globale", "Total", "Contact", "Téléphone", "Email", "Dernier contact"]],
    body: vendors.sort((a, b) => (a.status === "signed" ? -1 : 1) - (b.status === "signed" ? -1 : 1)).map((v) => [
      v.cat,
      v.name,
      statusLabel(v.status),
      v.score ?? "—",
      fmtEur(v.total),
      v.contact || "—",
      v.phone || "—",
      v.email || "—",
      v.lastContact ? new Date(v.lastContact).toLocaleDateString("fr-FR") : "—",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: DARK,
      textColor: [251, 248, 243],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 7.5, textColor: DARK, cellPadding: 2 },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 38, fontStyle: "bold" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 26, halign: "right" },
      5: { cellWidth: 28 },
      6: { cellWidth: 28 },
      7: { cellWidth: "auto" },
      8: { cellWidth: 26, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const v = data.cell.raw as string;
        if (v === "Signé") data.cell.styles.textColor = SAGE;
        if (v === "Refusé") data.cell.styles.textColor = [192, 83, 58];
        if (v === "En attente") data.cell.styles.textColor = [160, 120, 40];
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(160, 140, 120);
      doc.text(
        `Page ${data.pageNumber} — The Cockpit Wedding Studio`,
        148.5, doc.internal.pageSize.height - 6,
        { align: "center" }
      );
    },
  });

  doc.save(`prestataires-${partnerA}-${partnerB}.pdf`);
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { JournalEntry } from "./types";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK = [28, 28, 30] as [number, number, number];
const CREAM = [251, 248, 243] as [number, number, number];
const MUTED = [120, 100, 80] as [number, number, number];

const CAT_LABELS: Record<JournalEntry["category"], string> = {
  general: "Général",
  invites: "Invités",
  budget: "Budget",
  prestataires: "Prestataires",
  logistique: "Logistique",
  idees: "Idées",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncate(text: string, max = 500): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

export function exportJournalPDF(
  entries: JournalEntry[],
  partnerA: string,
  partnerB: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Sort: pinned first, then by createdAt desc
  const sorted = [...entries].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pinned = entries.filter((e) => e.pinned).length;

  // Header
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 210, 24, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`${partnerA} & ${partnerB} — Journal de bord`, 14, 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Exporté le ${today}`, 196, 15.5, { align: "right" });

  // Stats bar
  doc.setFillColor(...CREAM);
  doc.rect(0, 24, 210, 11, "F");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    `${entries.length} entrée${entries.length !== 1 ? "s" : ""} · ${pinned} épinglée${pinned !== 1 ? "s" : ""}`,
    14,
    31
  );

  // Entries table
  autoTable(doc, {
    startY: 38,
    head: [["", "Titre / Contenu", "Catégorie", "Date"]],
    body: sorted.map((entry) => [
      entry.pinned ? "📌" : "",
      [entry.title ? `${entry.title}\n` : "", truncate(entry.text)].join(""),
      CAT_LABELS[entry.category],
      fmtDate(entry.createdAt),
    ]),
    theme: "striped",
    headStyles: {
      fillColor: TERRACOTTA,
      textColor: [255, 250, 242] as [number, number, number],
      fontSize: 8.5,
      fontStyle: "bold",
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 8,
      textColor: DARK,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      valign: "top",
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: "auto", overflow: "linebreak" },
      2: { cellWidth: 28 },
      3: { cellWidth: 26, halign: "center" },
    },
    alternateRowStyles: {
      fillColor: [248, 245, 240] as [number, number, number],
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        const entry = sorted[data.row.index];
        if (entry?.pinned) {
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(160, 140, 120);
      doc.text(
        `Page ${data.pageNumber} — Jour J · by The Cockpit`,
        105,
        doc.internal.pageSize.height - 6,
        { align: "center" }
      );
    },
  });

  doc.save(`journal-${partnerA}-${partnerB}.pdf`);
}

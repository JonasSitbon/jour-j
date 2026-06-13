import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Payment } from "@/lib/types";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK       = [28, 28, 30]   as [number, number, number];
const CREAM      = [251, 248, 243] as [number, number, number];
const SAGE       = [126, 154, 99] as [number, number, number];
const CORAL      = [192, 83, 58]  as [number, number, number];
const AMBER      = [176, 122, 44] as [number, number, number];
const MUTED      = [150, 150, 150] as [number, number, number];

const METHOD_LABELS: Record<string, string> = {
  virement: "Virement",
  cheque:   "Chèque",
  cash:     "Espèces",
  carte:    "Carte",
};

const STATUS_LABELS: Record<string, string> = {
  paid:     "Payé",
  upcoming: "À venir",
  late:     "En retard",
  partial:  "Partiel",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtEur(amount: number): string {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function exportPaymentsPDF(payments: Payment[], partnerA: string, partnerB: string): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${partnerA} & ${partnerB} — Suivi des paiements`, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Exporté le ${today}`, 196, 22, { align: "right" });

  // ── Stats bar ────────────────────────────────────────────────────────────────
  const paidPayments     = payments.filter((p) => p.status === "paid");
  const upcomingPayments = payments.filter((p) => p.status === "upcoming");
  const latePayments     = payments.filter((p) => p.status === "late");

  const totalPaid     = paidPayments.reduce((s, p) => s + p.amount, 0);
  const totalUpcoming = upcomingPayments.reduce((s, p) => s + p.amount, 0);
  const totalLate     = latePayments.reduce((s, p) => s + p.amount, 0);

  doc.setFillColor(...CREAM);
  doc.rect(0, 28, 210, 14, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  const statItems = [
    `Total payé : ${fmtEur(totalPaid)}`,
    `À venir : ${fmtEur(totalUpcoming)}`,
    `En retard : ${fmtEur(totalLate)}`,
    `${payments.length} paiement${payments.length !== 1 ? "s" : ""}`,
  ];
  statItems.forEach((s, i) => doc.text(s, 14 + i * 49, 37));

  // ── Sort: late first, then upcoming, then paid last ─────────────────────────
  const ORDER: Record<string, number> = { late: 0, partial: 1, upcoming: 2, paid: 3 };
  const sorted = [...payments].sort((a, b) => {
    const od = (ORDER[a.status] ?? 2) - (ORDER[b.status] ?? 2);
    if (od !== 0) return od;
    return a.due.localeCompare(b.due);
  });

  // ── Table ────────────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 46,
    head: [["Prestataire", "Libellé", "Montant", "Échéance", "Date paiement", "Méthode", "Statut"]],
    body: sorted.map((p) => [
      p.vendor,
      p.label,
      fmtEur(p.amount),
      fmtDate(p.due),
      fmtDate(p.paidDate),
      METHOD_LABELS[p.method] ?? p.method,
      STATUS_LABELS[p.status] ?? p.status,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: DARK,
      textColor: [251, 248, 243],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 8, textColor: DARK, cellPadding: 2.5, minCellHeight: 7 },
    alternateRowStyles: { fillColor: [248, 245, 240] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 22, halign: "right", fontStyle: "bold" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 24, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 22, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const row = sorted[data.row.index];
      if (!row) return;

      // Status column colouring
      if (data.column.index === 6) {
        if (row.status === "paid")     data.cell.styles.textColor = SAGE;
        else if (row.status === "late")    data.cell.styles.textColor = CORAL;
        else if (row.status === "partial") data.cell.styles.textColor = AMBER;
        else data.cell.styles.textColor = DARK;
      }

      // Paid rows: grey out all cells
      if (row.status === "paid") {
        data.cell.styles.textColor = MUTED;
        data.cell.styles.fillColor = [245, 244, 242] as [number, number, number];
      }

      // Late rows: vendor + label in coral
      if (row.status === "late" && (data.column.index === 0 || data.column.index === 1)) {
        data.cell.styles.textColor = CORAL;
      }
    },
    foot: (() => {
      const totalRemaining = payments
        .filter((p) => p.status !== "paid")
        .reduce((s, p) => s + p.amount, 0);
      return [
        ["", "Total payé",    fmtEur(totalPaid),      "", "", "", ""],
        ["", "Total restant", fmtEur(totalRemaining),  "", "", "", ""],
      ];
    })(),
    footStyles: {
      fillColor: CREAM,
      textColor: DARK,
      fontStyle: "bold",
      fontSize: 8.5,
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(160, 140, 120);
      doc.text(
        `Page ${data.pageNumber} — Suivi des paiements — Jour J`,
        105,
        doc.internal.pageSize.height - 6,
        { align: "center" }
      );
    },
  });

  doc.save(`paiements-${partnerA}-${partnerB}.pdf`);
}

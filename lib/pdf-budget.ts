import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BudgetPost, Payment } from "./types";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK = [28, 28, 30] as [number, number, number];
const CREAM = [251, 248, 243] as [number, number, number];

function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function exportBudgetPDF(budget: BudgetPost[], payments: Payment[], budgetTotal: number, partnerA: string, partnerB: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Header
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 210, 24, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`${partnerA} & ${partnerB} — Budget mariage`, 14, 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Exporté le ${today}`, 196, 15.5, { align: "right" });

  // Summary boxes
  const totalPlanned = budget.reduce((s, b) => s + b.planned, 0);
  const totalSpent = budget.reduce((s, b) => s + b.spent, 0);
  const pct = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;

  const boxes = [
    { label: "Budget total", value: fmtEur(budgetTotal), color: [80, 80, 80] as [number, number, number] },
    { label: "Total prévu", value: fmtEur(totalPlanned), color: TERRACOTTA },
    { label: "Total dépensé", value: fmtEur(totalSpent), color: [126, 154, 99] as [number, number, number] },
    { label: "Avancement", value: `${pct}%`, color: pct > 100 ? [192, 83, 58] as [number, number, number] : DARK },
  ];

  boxes.forEach((b, i) => {
    const x = 14 + i * 46;
    doc.setFillColor(...CREAM);
    doc.roundedRect(x, 28, 43, 18, 2, 2, "F");
    doc.setTextColor(...b.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(b.value, x + 21.5, 38, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 100, 80);
    doc.text(b.label, x + 21.5, 43, { align: "center" });
  });

  // Budget table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text("Postes budgétaires", 14, 56);

  autoTable(doc, {
    startY: 60,
    head: [["Poste", "Catégorie", "Prévu", "Dépensé", "Reste"]],
    body: budget.map((b) => [
      b.label,
      b.cat,
      fmtEur(b.planned),
      fmtEur(b.spent),
      fmtEur(Math.max(0, b.planned - b.spent)),
    ]),
    theme: "grid",
    headStyles: { fillColor: DARK, textColor: [251, 248, 243], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: DARK },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: {
      0: { fontStyle: "bold" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  // Payments table (new page if needed)
  if (payments.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY ?? 180;
    if (finalY > 200) doc.addPage();

    const startY = (doc as any).lastAutoTable.finalY + 12 > 200 ? 20 : (doc as any).lastAutoTable.finalY + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text("Échéancier des paiements", 14, startY - 4);

    autoTable(doc, {
      startY,
      head: [["Prestataire", "Libellé", "Montant", "Échéance", "Statut"]],
      body: [...payments].sort((a, b) => a.due.localeCompare(b.due)).map((p) => [
        p.vendor,
        p.label,
        fmtEur(p.amount),
        new Date(p.due + "T00:00:00").toLocaleDateString("fr-FR"),
        p.status === "paid" ? "Payé" : p.status === "late" ? "En retard" : "À venir",
      ]),
      theme: "grid",
      headStyles: { fillColor: DARK, textColor: [251, 248, 243], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: DARK },
      alternateRowStyles: { fillColor: CREAM },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "center" } },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const v = data.cell.raw as string;
          if (v === "Payé") data.cell.styles.textColor = [126, 154, 99];
          if (v === "En retard") data.cell.styles.textColor = [192, 83, 58];
        }
      },
    });
  }

  doc.save(`budget-${partnerA}-${partnerB}.pdf`);
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK = [28, 28, 30] as [number, number, number];
const CREAM = [251, 248, 243] as [number, number, number];
const SAGE = [126, 154, 99] as [number, number, number];
const AMBER = [201, 110, 44] as [number, number, number];

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface TimelineTask {
  kind: "task";
  id: number;
  title: string;
  due: string;
  who: "A" | "B";
  done: boolean;
  cat: string;
  catIcon: string;
  note: string;
}

interface TimelinePayment {
  kind: "payment";
  id: number;
  vendor: string;
  label: string;
  amount: number;
  due: string;
  status: "paid" | "upcoming" | "late" | "partial";
  who: string;
}

type TimelineItem = TimelineTask | TimelinePayment;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTHS_FR[month]} ${year}`;
}

function itemMonthKey(item: TimelineItem): string {
  const d = new Date(item.due + "T00:00:00");
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
}

function getItemTitle(item: TimelineItem): string {
  if (item.kind === "task") return item.title;
  return item.label;
}

function getItemResponsible(item: TimelineItem, nameA: string, nameB: string): string {
  if (item.kind === "task") {
    return item.who === "A" ? nameA : nameB;
  }
  if (item.who === "A") return nameA;
  if (item.who === "B") return nameB;
  return item.who;
}

function getItemStatus(item: TimelineItem): string {
  if (item.kind === "task") {
    if (item.done) return "Terminé";
    const due = new Date(item.due + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today ? "En retard" : "À faire";
  }
  const statusMap: Record<string, string> = {
    paid: "Payé",
    upcoming: "À venir",
    late: "En retard",
    partial: "Partiel",
  };
  return statusMap[item.status] ?? item.status;
}

function getItemNote(item: TimelineItem): string {
  if (item.kind === "task") return item.note ?? "";
  if (item.kind === "payment") {
    return item.amount
      ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(item.amount)
      : "";
  }
  return "";
}

function getItemType(item: TimelineItem): string {
  return item.kind === "task" ? "Tâche" : "Paiement";
}

function isStatusDone(item: TimelineItem): boolean {
  if (item.kind === "task") return item.done;
  return item.status === "paid";
}

function isStatusInProgress(item: TimelineItem): boolean {
  if (item.kind === "task") {
    if (item.done) return false;
    const due = new Date(item.due + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }
  return item.status === "late" || item.status === "partial";
}

export function exportTimelinePDF(
  items: TimelineItem[],
  partnerA: string,
  partnerB: string,
  weddingDate: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const weddingDateFmt = weddingDate
    ? new Date(weddingDate + "T00:00:00").toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${partnerA} & ${partnerB} — Timeline mariage`, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Exporté le ${today}`, 196, 22, { align: "right" });

  // ── Stats bar ─────────────────────────────────────────────────────────────
  doc.setFillColor(...CREAM);
  doc.rect(0, 28, 210, 12, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  const stats: string[] = [
    `${items.length} événement${items.length > 1 ? "s" : ""}`,
    `${items.filter((i) => i.kind === "task").length} tâche${items.filter((i) => i.kind === "task").length > 1 ? "s" : ""}`,
    `${items.filter((i) => i.kind === "payment").length} paiement${items.filter((i) => i.kind === "payment").length > 1 ? "s" : ""}`,
  ];
  if (weddingDateFmt) stats.push(`Mariage : ${weddingDateFmt}`);
  stats.forEach((s, i) => doc.text(s, 14 + i * 50, 36));

  // ── Group items by month ──────────────────────────────────────────────────
  const sorted = [...items].sort((a, b) => a.due.localeCompare(b.due));

  const monthKeys: string[] = [];
  const byMonth: Record<string, TimelineItem[]> = {};
  sorted.forEach((item) => {
    const key = itemMonthKey(item);
    if (!byMonth[key]) {
      byMonth[key] = [];
      monthKeys.push(key);
    }
    byMonth[key].push(item);
  });

  // ── Build table body with month section headers ───────────────────────────
  type RowData = string[];

  const head: RowData = ["Date", "Type", "Événement / Titre", "Responsable", "Statut", "Note"];
  const body: (RowData | { isSection: true; label: string })[] = [];

  monthKeys.forEach((key) => {
    body.push({ isSection: true, label: formatMonthKey(key) });
    byMonth[key].forEach((item) => {
      body.push([
        formatDate(item.due),
        getItemType(item),
        getItemTitle(item),
        getItemResponsible(item, partnerA, partnerB),
        getItemStatus(item),
        getItemNote(item),
      ]);
    });
  });

  // Separate real rows (for autoTable) and track section positions
  const tableRows: RowData[] = [];
  const sectionRows: { rowIndex: number; label: string }[] = [];

  body.forEach((entry) => {
    if ("isSection" in entry) {
      sectionRows.push({ rowIndex: tableRows.length, label: entry.label });
      // Insert a visual section row as a data row with colspan-style styling
      tableRows.push([entry.label, "", "", "", "", ""]);
    } else {
      tableRows.push(entry);
    }
  });

  const sectionRowIndices = new Set(sectionRows.map((s) => s.rowIndex));

  // Build item index mapping (skipping section rows)
  // For each body row, we need to know the original item
  const itemForRow: (TimelineItem | null)[] = tableRows.map((_, rowIdx) => {
    if (sectionRowIndices.has(rowIdx)) return null;
    // Count non-section rows before this index
    let itemIdx = 0;
    for (let i = 0; i < rowIdx; i++) {
      if (!sectionRowIndices.has(i)) itemIdx++;
    }
    return sorted[itemIdx] ?? null;
  });

  autoTable(doc, {
    startY: 43,
    head: [head],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: DARK,
      textColor: [251, 248, 243] as [number, number, number],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: DARK,
      cellPadding: 2.5,
      minCellHeight: 8,
    },
    alternateRowStyles: { fillColor: [248, 245, 240] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: "auto" },
      3: { cellWidth: 28 },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 30 },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;

      const rowIdx = data.row.index;

      // Section header row styling
      if (sectionRowIndices.has(rowIdx)) {
        data.cell.styles.fillColor = [240, 230, 220] as [number, number, number];
        data.cell.styles.textColor = TERRACOTTA;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 9;
        // Only show text in first cell
        if (data.column.index > 0) {
          data.cell.text = [""];
        }
        return;
      }

      // Status column coloring
      if (data.column.index === 4) {
        const item = itemForRow[rowIdx];
        if (item) {
          if (isStatusDone(item)) {
            data.cell.styles.textColor = SAGE;
            data.cell.styles.fontStyle = "bold";
          } else if (isStatusInProgress(item)) {
            data.cell.styles.textColor = AMBER;
            data.cell.styles.fontStyle = "bold";
          }
        }
      }

      // Type column coloring
      if (data.column.index === 1) {
        const item = itemForRow[rowIdx];
        if (item?.kind === "payment") {
          data.cell.styles.textColor = [80, 100, 160] as [number, number, number];
        } else {
          data.cell.styles.textColor = TERRACOTTA;
        }
        data.cell.styles.fontStyle = "bold";
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

  const filename = `timeline-${partnerA.toLowerCase().replace(/\s+/g, "-")}-${partnerB.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
}

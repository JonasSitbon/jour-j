import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Task } from "./types";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK = [28, 28, 30] as [number, number, number];
const CREAM = [251, 248, 243] as [number, number, number];
const SAGE = [126, 154, 99] as [number, number, number];

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function daysLabel(iso: string, done: boolean): string {
  if (done) return "✓ Terminé";
  if (!iso) return "—";
  const d = Math.round((new Date(iso + "T00:00:00").getTime() - Date.now()) / 86400000);
  if (d < 0) return `${Math.abs(d)}j retard`;
  if (d === 0) return "Aujourd'hui";
  return `J-${d}`;
}

export function exportChecklistPDF(
  tasks: Task[],
  cats: { id: string; label: string; icon: string }[],
  partnerA: string,
  partnerB: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due);
  });

  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const late = tasks.filter((t) => !t.done && t.due && t.due < new Date().toISOString().split("T")[0]).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Header
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 210, 24, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${partnerA} & ${partnerB} — Checklist mariage`, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Exporté le ${today}`, 196, 14, { align: "right" });

  // Progress bar
  doc.setFillColor(240, 230, 220);
  doc.rect(14, 27, 182, 5, "F");
  doc.setFillColor(...SAGE);
  doc.rect(14, 27, 182 * pct / 100, 5, "F");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(`${pct}% complété`, 196, 30.5, { align: "right" });

  // Stats
  doc.setFillColor(...CREAM);
  doc.rect(0, 33, 210, 12, "F");
  doc.setFontSize(8.5);
  const stats = [
    `${done} / ${total} tâches terminées`,
    `${late} en retard`,
    `${tasks.filter((t) => !t.done && t.due).length} avec échéance`,
    `${tasks.filter((t) => !t.done && !t.due).length} sans date`,
  ];
  stats.forEach((s, i) => doc.text(s, 14 + i * 48, 41));

  // Group by category
  const byCat: Record<string, Task[]> = {};
  sorted.forEach((t) => {
    if (!byCat[t.cat]) byCat[t.cat] = [];
    byCat[t.cat].push(t);
  });

  let startY = 48;

  Object.entries(byCat).forEach(([catId, catTasks]) => {
    const catLabel = cats.find((c) => c.id === catId)?.label ?? catId;
    const catDone = catTasks.filter((t) => t.done).length;

    // Category header
    doc.setFillColor(240, 235, 228);
    doc.rect(14, startY, 182, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(catLabel, 17, startY + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 100, 80);
    doc.text(`${catDone}/${catTasks.length}`, 193, startY + 5, { align: "right" });
    startY += 7;

    autoTable(doc, {
      startY,
      head: undefined,
      body: catTasks.map((t) => [
        t.done ? "☑" : "☐",
        t.title,
        t.who === "A" ? partnerA : partnerB,
        fmtDate(t.due),
        daysLabel(t.due, t.done),
        t.note || "",
      ]),
      theme: "plain",
      bodyStyles: {
        fontSize: 8,
        textColor: DARK,
        cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
        minCellHeight: 6,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center", fontStyle: "bold" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 24 },
        3: { cellWidth: 26, halign: "center" },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 40, textColor: [120, 100, 80] as [number, number, number] },
      },
      alternateRowStyles: { fillColor: [248, 245, 240] as [number, number, number] },
      didParseCell: (data) => {
        const t = catTasks[data.row.index];
        if (!t) return;
        // Strikethrough done tasks via text color
        if (t.done) {
          data.cell.styles.textColor = [160, 140, 120] as [number, number, number];
        }
        // Highlight late tasks
        if (!t.done && t.due && t.due < new Date().toISOString().split("T")[0] && data.column.index === 4) {
          data.cell.styles.textColor = [192, 83, 58] as [number, number, number];
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(160, 140, 120);
        doc.text(
          `Page ${data.pageNumber} — Jour J`,
          105, doc.internal.pageSize.height - 6,
          { align: "center" }
        );
      },
    });

    const finalY: number | undefined = (doc as any).lastAutoTable?.finalY;
    startY = finalY != null ? finalY + 5 : startY + 30;
    if (startY > 260) {
      doc.addPage();
      startY = 15;
    }
  });

  doc.save(`checklist-${partnerA}-${partnerB}.pdf`);
}

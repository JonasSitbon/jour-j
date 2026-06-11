import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK = [28, 28, 30] as [number, number, number];
const CREAM = [251, 248, 243] as [number, number, number];
const SAGE = [126, 154, 99] as [number, number, number];

interface DayEvent {
  id: string;
  hour: number;
  minute: number;
  duration: number;
  title: string;
  description?: string;
  category: string;
  who: string;
  important: boolean;
}

const CATEGORY_COLORS: Record<string, [number, number, number]> = {
  preparations: [201, 110, 44],
  transport:    [176, 122, 44],
  ceremonie:    [180, 150, 60],
  photos:       [126, 154, 99],
  cocktail:     [192, 83, 58],
  diner:        [80, 100, 160],
  soiree:       [100, 80, 160],
  technique:    [100, 100, 100],
  autre:        [130, 130, 130],
};

const CATEGORY_LABELS: Record<string, string> = {
  preparations: "Préparatifs",
  transport:    "Transport",
  ceremonie:    "Cérémonie",
  photos:       "Photos & Vidéo",
  cocktail:     "Cocktail",
  diner:        "Dîner & Repas",
  soiree:       "Soirée & Danse",
  technique:    "Technique",
  autre:        "Autre",
};

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}h${String(minute).padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function exportDayJPDF(events: DayEvent[], partnerA: string, partnerB: string, weddingDate: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const weddingDateFmt = weddingDate
    ? new Date(weddingDate + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  // Header
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${partnerA} & ${partnerB} — Planning Jour J`, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (weddingDateFmt) doc.text(weddingDateFmt, 14, 22);
  doc.text(`Exporté le ${today}`, 196, 22, { align: "right" });

  // Stats row
  const sorted = [...events].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  const importantCount = events.filter((e) => e.important).length;
  const firstEvent = sorted[0];
  const lastEvent = sorted[sorted.length - 1];

  doc.setFillColor(...CREAM);
  doc.rect(0, 28, 210, 12, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  const stats = [
    `${events.length} événements`,
    firstEvent ? `Début : ${formatTime(firstEvent.hour, firstEvent.minute)}` : "",
    lastEvent ? `Fin estimée : ${formatTime(lastEvent.hour + Math.floor((lastEvent.minute + lastEvent.duration) / 60), (lastEvent.minute + lastEvent.duration) % 60)}` : "",
    `${importantCount} étape${importantCount > 1 ? "s" : ""} clé${importantCount > 1 ? "s" : ""}`,
  ].filter(Boolean);
  stats.forEach((s, i) => doc.text(s, 14 + i * 46, 36));

  // Timeline table
  autoTable(doc, {
    startY: 43,
    head: [["Heure", "Durée", "Événement", "Catégorie", "Pour qui", ""]],
    body: sorted.map((e) => [
      formatTime(e.hour, e.minute),
      formatDuration(e.duration),
      e.title + (e.description ? `\n${e.description}` : ""),
      CATEGORY_LABELS[e.category] ?? e.category,
      e.who,
      e.important ? "★" : "",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: DARK,
      textColor: [251, 248, 243],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 8, textColor: DARK, cellPadding: 2.5, minCellHeight: 8 },
    alternateRowStyles: { fillColor: [248, 245, 240] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: "bold", halign: "center" },
      1: { cellWidth: 16, halign: "center", textColor: [100, 80, 60] as [number, number, number] },
      2: { cellWidth: "auto", fontStyle: "normal" },
      3: { cellWidth: 32 },
      4: { cellWidth: 30 },
      5: { cellWidth: 8, halign: "center", textColor: TERRACOTTA },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const cat = sorted[data.row.index]?.category;
        if (cat && CATEGORY_COLORS[cat]) {
          data.cell.styles.textColor = CATEGORY_COLORS[cat];
          data.cell.styles.fontStyle = "bold";
        }
      }
      if (data.section === "body" && data.column.index === 2 && sorted[data.row.index]?.important) {
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(160, 140, 120);
      doc.text(
        `Page ${data.pageNumber} — Planning Jour J — The Cockpit`,
        105, doc.internal.pageSize.height - 6,
        { align: "center" }
      );
    },
  });

  // Legend
  const finalY: number = (doc as any).lastAutoTable?.finalY ?? 250;
  if (finalY + 30 < doc.internal.pageSize.height) {
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text("Légende des catégories :", 14, finalY + 10);
    doc.setFont("helvetica", "normal");
    let x = 14;
    Object.entries(CATEGORY_LABELS).forEach(([id, label]) => {
      const color = CATEGORY_COLORS[id] ?? [130, 130, 130];
      doc.setFillColor(...color);
      doc.circle(x + 2, finalY + 17, 2, "F");
      doc.setTextColor(...color);
      doc.text(label, x + 6, finalY + 18.5);
      x += doc.getTextWidth(label) + 14;
      if (x > 170) { x = 14; }
    });
  }

  doc.save(`planning-jour-j-${partnerA}-${partnerB}.pdf`);
}

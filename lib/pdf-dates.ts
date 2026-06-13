import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK       = [28, 28, 30]   as [number, number, number];
const CREAM      = [251, 248, 243] as [number, number, number];
const SAGE       = [126, 154, 99] as [number, number, number];
const SAGE_LIGHT = [220, 232, 210] as [number, number, number];
const CORAL      = [192, 83, 58]  as [number, number, number];
const AMBER      = [176, 122, 44] as [number, number, number];
const GRAY_LIGHT = [230, 230, 228] as [number, number, number];
const MUTED      = [160, 155, 150] as [number, number, number];

interface DateCandidate {
  id: number;
  date: string;
  weather: number;
  sun: number;
  rain: number;
  temp: number;
  holidays: number;
  longWeekend: number;
  availability: number;
  best: number;
  city: string;
  lat: number | null;
  lon: number | null;
}

function scoreOf(d: DateCandidate): number {
  return Math.round(d.weather * 0.45 + d.availability * 0.4 + (d.longWeekend ? 8 : 0) + 7);
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

export function exportDatesPDF(
  candidates: DateCandidate[],
  selectedDate: number,
  partnerA: string,
  partnerB: string
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // ── Header ───────────────────────────────────────────────────────────────────
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`Comparaison des dates — ${partnerA} & ${partnerB}`, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Rapport généré le ${today}`, 196, 22, { align: "right" });

  // ── Stats bar ─────────────────────────────────────────────────────────────────
  doc.setFillColor(...CREAM);
  doc.rect(0, 28, 210, 14, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  const bestCandidate = candidates.length > 0
    ? candidates.reduce((a, b) => scoreOf(b) > scoreOf(a) ? b : a)
    : null;
  const selectedCandidate = candidates.find((c) => c.id === selectedDate) ?? null;

  const statItems = [
    `${candidates.length} date${candidates.length !== 1 ? "s" : ""} candidate${candidates.length !== 1 ? "s" : ""}`,
    selectedCandidate ? `Choisie : ${fmtDate(selectedCandidate.date)}` : "Aucune date choisie",
    bestCandidate ? `Meilleur score : ${scoreOf(bestCandidate)}` : "",
    bestCandidate ? `Meilleure date : ${fmtDate(bestCandidate.date)}` : "",
  ].filter(Boolean);
  statItems.forEach((s, i) => doc.text(s, 14 + i * 48, 37));

  // ── Sort: selected first, then by score descending ───────────────────────────
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);

  const sorted = [...candidates].sort((a, b) => {
    if (a.id === selectedDate) return -1;
    if (b.id === selectedDate) return 1;
    return scoreOf(b) - scoreOf(a);
  });

  // ── Table ─────────────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 46,
    head: [["Date", "Ville", "Score", "☀ Ensoleil.", "🌧 Pluie", "🌡 Temp", "Dispo", "Long WE", "Statut"]],
    body: sorted.map((d) => [
      fmtDate(d.date),
      d.city ? d.city.split(",")[0] : "—",
      String(scoreOf(d)),
      `${d.weather}%`,
      `${d.rain}%`,
      `${d.temp}°C`,
      `${d.availability}%`,
      d.longWeekend ? "Oui" : "Non",
      d.id === selectedDate ? "✓ Choisie" : "—",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: DARK,
      textColor: [251, 248, 243] as [number, number, number],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 7.5, textColor: DARK, cellPadding: 2.5, minCellHeight: 7 },
    alternateRowStyles: { fillColor: [248, 245, 240] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 34 },
      2: { cellWidth: 14, halign: "center", fontStyle: "bold" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 14, halign: "center" },
      5: { cellWidth: 14, halign: "center" },
      6: { cellWidth: 14, halign: "center" },
      7: { cellWidth: 14, halign: "center" },
      8: { cellWidth: 20, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const row = sorted[data.row.index];
      if (!row) return;

      const isPast = new Date(row.date + "T00:00:00") < today0;
      const isBest = bestCandidate !== null && row.id === bestCandidate.id;
      const isSelected = row.id === selectedDate;

      // Selected row: sage background
      if (isSelected) {
        data.cell.styles.fillColor = SAGE_LIGHT;
      }
      // Best (non-selected) row: light sage tint
      else if (isBest) {
        data.cell.styles.fillColor = [236, 243, 228] as [number, number, number];
      }
      // Past dates: muted gray
      else if (isPast) {
        data.cell.styles.fillColor = GRAY_LIGHT;
        data.cell.styles.textColor = MUTED;
      }

      // Status column coloring
      if (data.column.index === 8) {
        if (isSelected) {
          data.cell.styles.textColor = SAGE;
        } else {
          data.cell.styles.textColor = MUTED;
        }
      }

      // Score column: color by value
      if (data.column.index === 2) {
        const sc = scoreOf(row);
        if (sc >= 85) data.cell.styles.textColor = SAGE;
        else if (sc >= 70) data.cell.styles.textColor = AMBER;
        // else keep DARK (or MUTED for past)
      }

      // Rain column: red if >30%
      if (data.column.index === 4 && !isPast) {
        if (row.rain > 30) data.cell.styles.textColor = CORAL;
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(160, 140, 120);
      doc.text(
        `Page ${data.pageNumber} — Données météo : Open-Meteo`,
        105,
        doc.internal.pageSize.height - 6,
        { align: "center" }
      );
    },
  });

  doc.save(`dates-candidates-${partnerA}-${partnerB}.pdf`);
}

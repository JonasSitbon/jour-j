import jsPDF from "jspdf";
import type { Guest, TableSeat } from "./types";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK       = [28, 28, 30]   as [number, number, number];
const CREAM      = [251, 248, 243] as [number, number, number];

const DIET_LABELS: Record<string, string> = {
  none:          "",
  standard:      "",
  vegetarien:    "🥗 Végétarien",
  vegetarian:    "🥗 Végétarien",
  vegan:         "🌱 Vegan",
  "sans gluten": "🌾 Sans gluten",
  "gluten-free": "🌾 Sans gluten",
  "sans lactose":"🥛 Sans lactose",
  "lactose-free":"🥛 Sans lactose",
  halal:         "☪ Halal",
  kosher:        "✡ Casher",
  "no-pork":     "Sans porc",
  "no-seafood":  "Sans fruits de mer",
  "nut-allergy": "⚠ Allergie noix",
  other:         "Régime spécial",
};

// Card layout: 4 columns × 5 rows = 20 cards per A4 landscape sheet
const COLS = 4;
const ROWS = 5;
const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 8;
const CARD_W = (PAGE_W - MARGIN * 2) / COLS;
const CARD_H = (PAGE_H - MARGIN * 2) / ROWS;

export function exportPlaceCardsPDF(
  guests: Guest[],
  tables: TableSeat[],
  partnerA: string,
  partnerB: string
) {
  const tableMap = new Map(tables.map((t) => [t.id, t.name]));

  // Sort: by table, then by name
  const sorted = [...guests]
    .filter((g) => g.rsvp !== "declined")
    .sort((a, b) => {
      const ta = a.table ?? 999;
      const tb = b.table ?? 999;
      if (ta !== tb) return ta - tb;
      return a.name.localeCompare(b.name, "fr");
    });

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let page = 0;
  const perPage = COLS * ROWS;

  sorted.forEach((g, idx) => {
    const posOnPage = idx % perPage;
    if (posOnPage === 0 && idx > 0) {
      doc.addPage();
      page++;
    }
    if (posOnPage === 0) {
      // Draw cut guides
      drawCutGuides(doc);
    }

    const col = posOnPage % COLS;
    const row = Math.floor(posOnPage / COLS);
    const x = MARGIN + col * CARD_W;
    const y = MARGIN + row * CARD_H;

    drawCard(doc, g, x, y, CARD_W, CARD_H, tableMap, partnerA, partnerB);
  });

  doc.save(`cartes-placement-${partnerA}-${partnerB}.pdf`);
}

function drawCutGuides(doc: jsPDF) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 2], 0);

  for (let c = 1; c < COLS; c++) {
    const x = MARGIN + c * CARD_W;
    doc.line(x, 0, x, PAGE_H);
  }
  for (let r = 1; r < ROWS; r++) {
    const y = MARGIN + r * CARD_H;
    doc.line(0, y, PAGE_W, y);
  }

  doc.setLineDashPattern([], 0);
}

function drawCard(
  doc: jsPDF,
  g: Guest,
  x: number, y: number,
  w: number, h: number,
  tableMap: Map<number | null, string>,
  partnerA: string,
  partnerB: string
) {
  const pad = 3;

  // Card background
  doc.setFillColor(...CREAM);
  doc.roundedRect(x + 1, y + 1, w - 2, h - 2, 2, 2, "F");

  // Top accent bar
  doc.setFillColor(...TERRACOTTA);
  doc.roundedRect(x + 1, y + 1, w - 2, 4, 2, 2, "F");
  doc.setFillColor(...TERRACOTTA);
  doc.rect(x + 1, y + 3, w - 2, 2, "F");

  // Guest name (centered, bold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const nameLines = doc.splitTextToSize(g.name, w - pad * 2);
  const nameY = y + 10;
  doc.text(nameLines, x + w / 2, nameY, { align: "center" });

  // Table assignment
  const tableLabel = g.table != null ? (tableMap.get(g.table) ?? `Table ${g.table}`) : "Sans table";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...TERRACOTTA);
  doc.text(tableLabel.toUpperCase(), x + w / 2, nameY + 5.5 + (nameLines.length - 1) * 3.5, { align: "center" });

  // Side (A/B → partner name)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(130, 110, 90);
  const sideLabel = g.side === "A" ? `Côté ${partnerA}` : `Côté ${partnerB}`;
  doc.text(sideLabel, x + w / 2, nameY + 9.5 + (nameLines.length - 1) * 3.5, { align: "center" });

  // Diet (if any)
  const dietLabel = DIET_LABELS[g.diet] || "";
  if (dietLabel) {
    doc.setFontSize(6);
    doc.setTextColor(150, 120, 80);
    doc.text(dietLabel, x + w / 2, y + h - 5, { align: "center" });
  }

  // Child indicator
  if (g.child) {
    doc.setFontSize(6);
    doc.setTextColor(100, 150, 200);
    doc.text("👶 Enfant", x + w - pad - 1, y + h - 5, { align: "right" });
  }
}

// Export a single list of all tables with their guests (for the seating coordinator)
export function exportSeatingListPDF(
  guests: Guest[],
  tables: TableSeat[],
  partnerA: string,
  partnerB: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Header
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${partnerA} & ${partnerB} — Plan de table`, 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(today, 196, 13, { align: "right" });

  let y = 28;

  // Ungrouped guests
  const unassigned = guests.filter((g) => g.rsvp !== "declined" && g.table == null);

  // Grouped by table
  const byTable = new Map<number, Guest[]>();
  guests
    .filter((g) => g.rsvp !== "declined" && g.table != null)
    .forEach((g) => {
      const arr = byTable.get(g.table!) ?? [];
      arr.push(g);
      byTable.set(g.table!, arr);
    });

  const sortedTables = [...byTable.entries()].sort(([a], [b]) => a - b);

  sortedTables.forEach(([tableId, tableGuests]) => {
    const tableName = tables.find((t) => t.id === tableId)?.name ?? `Table ${tableId}`;
    const capacity  = tables.find((t) => t.id === tableId)?.capacity ?? 0;

    if (y > 260) { doc.addPage(); y = 15; }

    // Table header
    doc.setFillColor(240, 235, 228);
    doc.rect(14, y, 182, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    doc.text(tableName, 17, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 110, 90);
    doc.text(`${tableGuests.length}${capacity > 0 ? `/${capacity}` : ""} places`, 193, y + 5.5, { align: "right" });
    y += 9;

    tableGuests
      .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      .forEach((g) => {
        if (y > 275) { doc.addPage(); y = 15; }
        doc.setFont("helvetica", g.rsvp === "yes" ? "normal" : "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK);
        doc.text(`${g.child ? "👶 " : ""}${g.name}`, 20, y);
        const diet = DIET_LABELS[g.diet] || "";
        if (diet) {
          doc.setFontSize(7);
          doc.setTextColor(150, 120, 80);
          doc.text(diet, 100, y);
        }
        const side = g.side === "A" ? partnerA : partnerB;
        doc.setFontSize(7);
        doc.setTextColor(160, 140, 120);
        doc.text(side, 193, y, { align: "right" });
        y += 5.5;
      });

    y += 4;
  });

  if (unassigned.length > 0) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFillColor(250, 243, 235);
    doc.rect(14, y, 182, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(180, 120, 60);
    doc.text(`Sans table assignée (${unassigned.length})`, 17, y + 5.5);
    y += 9;
    unassigned.forEach((g) => {
      if (y > 275) { doc.addPage(); y = 15; }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...DARK);
      doc.text(g.name, 20, y);
      y += 5.5;
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(160, 140, 120);
    doc.text(`Page ${i}/${pageCount} — Jour J · by The Cockpit`, 105, 291, { align: "center" });
  }

  doc.save(`plan-de-table-${partnerA}-${partnerB}.pdf`);
}

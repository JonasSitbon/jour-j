import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Song, SongMoment } from "./types";

const TERRACOTTA = [201, 110, 44] as [number, number, number];
const DARK = [28, 28, 30] as [number, number, number];
const CREAM = [251, 248, 243] as [number, number, number];
const MUTED = [120, 100, 80] as [number, number, number];

const MOMENT_ORDER: SongMoment[] = [
  "entree-cortege",
  "entree-marie",
  "entree-mariee",
  "sortie",
  "cocktail",
  "premiere-danse",
  "danse-parents",
  "diner",
  "soiree",
  "autre",
];

const MOMENT_LABELS: Record<SongMoment, string> = {
  "entree-cortege": "Entrée du cortège",
  "entree-marie": "Entrée du marié",
  "entree-mariee": "Entrée de la mariée",
  sortie: "Sortie des mariés",
  cocktail: "Cocktail",
  "premiere-danse": "Première danse",
  "danse-parents": "Danse des parents",
  diner: "Dîner",
  soiree: "Soirée / piste",
  autre: "Autre",
};

export function exportMusicPDF(
  songs: Song[],
  partnerA: string,
  partnerB: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Group by moment, in defined order
  const grouped = new Map<SongMoment, Song[]>();
  for (const m of MOMENT_ORDER) {
    const list = songs.filter((s) => s.moment === m);
    if (list.length > 0) grouped.set(m, list);
  }

  const approvedCount = songs.filter((s) => s.approved).length;

  // Header
  doc.setFillColor(...TERRACOTTA);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 250, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${partnerA} & ${partnerB} — Playlist de mariage`, 14, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Exporté le ${today}`, 196, 15, { align: "right" });

  // Stats bar
  doc.setFillColor(...CREAM);
  doc.rect(0, 26, 210, 11, "F");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    `${songs.length} morceau${songs.length !== 1 ? "x" : ""} · ${approvedCount} approuvé${approvedCount !== 1 ? "s" : ""} · ${grouped.size} moment${grouped.size !== 1 ? "s" : ""}`,
    14,
    33
  );

  let startY = 42;

  for (const [moment, list] of grouped) {
    const label = MOMENT_LABELS[moment];

    // Section header row
    autoTable(doc, {
      startY,
      head: [[{ content: label, colSpan: 4 }]],
      body: list.map((s) => [
        s.title,
        s.artist || "—",
        s.duration || "—",
        s.approved ? "Oui" : "Non",
      ]),
      theme: "striped",
      headStyles: {
        fillColor: DARK,
        textColor: [255, 250, 242] as [number, number, number],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: DARK,
        cellPadding: { top: 2.5, bottom: 2.5, left: 5, right: 5 },
      },
      alternateRowStyles: { fillColor: CREAM },
      columnStyles: {
        0: { cellWidth: "auto", fontStyle: "bold" },
        1: { cellWidth: 52 },
        2: { cellWidth: 22, halign: "center" },
        3: { cellWidth: 22, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          const song = list[data.row.index];
          if (song?.approved) {
            data.cell.styles.fontStyle = "bold";
            if (data.column.index === 3) {
              data.cell.styles.textColor = [126, 154, 99] as [
                number,
                number,
                number,
              ];
            }
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

    startY = (doc as any).lastAutoTable.finalY + 6;
  }

  doc.save(`playlist-${partnerA}-${partnerB}.pdf`);
}

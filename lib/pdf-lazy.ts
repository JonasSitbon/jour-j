/**
 * Lazy PDF loaders — import jsPDF only when the user clicks Export.
 * Each function dynamically imports its PDF module on first call.
 */

import type { Guest, TableSeat, Vendor, BudgetPost, Payment, DateCandidate, Task, Song, JournalEntry, AppState } from "./types";

type DayEvent = { id: string; hour: number; minute: number; duration: number; title: string; description?: string; category: string; who: string; important: boolean };
type TimelineItem = { id: number; date: string; title: string; category: string; who: string; done: boolean };
type ChecklistCat = { id: string; label: string; icon: string };

export async function lazyExportDayJPDF(events: DayEvent[], partnerA: string, partnerB: string, date: string) {
  const { exportDayJPDF } = await import("./pdf-dayj");
  return exportDayJPDF(events as any, partnerA, partnerB, date);
}

export async function lazyExportGuestListPDF(guests: Guest[], partnerA: string, partnerB: string) {
  const { exportGuestListPDF } = await import("./pdf-guests");
  return exportGuestListPDF(guests, partnerA, partnerB);
}

export async function lazyExportPlaceCardsPDF(guests: Guest[], tables: TableSeat[], partnerA: string, partnerB: string) {
  const { exportPlaceCardsPDF } = await import("./pdf-placecards");
  return exportPlaceCardsPDF(guests, tables, partnerA, partnerB);
}

export async function lazyExportSeatingListPDF(guests: Guest[], tables: TableSeat[], partnerA: string, partnerB: string) {
  const { exportSeatingListPDF } = await import("./pdf-placecards");
  return exportSeatingListPDF(guests, tables, partnerA, partnerB);
}

export async function lazyExportBudgetPDF(budget: BudgetPost[], payments: Payment[], budgetTotal: number, partnerA: string, partnerB: string) {
  const { exportBudgetPDF } = await import("./pdf-budget");
  return exportBudgetPDF(budget, payments, budgetTotal, partnerA, partnerB);
}

export async function lazyExportChecklistPDF(tasks: Task[], cats: ChecklistCat[], partnerA: string, partnerB: string) {
  const { exportChecklistPDF } = await import("./pdf-checklist");
  return exportChecklistPDF(tasks, cats, partnerA, partnerB);
}

export async function lazyExportVendorsPDF(vendors: Vendor[], partnerA: string, partnerB: string) {
  const { exportVendorsPDF } = await import("./pdf-vendors");
  return exportVendorsPDF(vendors, partnerA, partnerB);
}

export async function lazyExportMusicPDF(songs: Song[], partnerA: string, partnerB: string) {
  const { exportMusicPDF } = await import("./pdf-music");
  return exportMusicPDF(songs, partnerA, partnerB);
}

export async function lazyExportPaymentsPDF(payments: Payment[], partnerA: string, partnerB: string) {
  const { exportPaymentsPDF } = await import("./pdf-payments");
  return exportPaymentsPDF(payments, partnerA, partnerB);
}

export async function lazyExportDatesPDF(candidates: DateCandidate[], selectedDate: number, partnerA: string, partnerB: string) {
  const { exportDatesPDF } = await import("./pdf-dates");
  return exportDatesPDF(candidates, selectedDate, partnerA, partnerB);
}

export async function lazyExportTimelinePDF(items: TimelineItem[], partnerA: string, partnerB: string, weddingDate: string) {
  const { exportTimelinePDF } = await import("./pdf-timeline");
  return exportTimelinePDF(items as any, partnerA, partnerB, weddingDate);
}

export async function lazyExportJournalPDF(entries: JournalEntry[], partnerA: string, partnerB: string) {
  const { exportJournalPDF } = await import("./pdf-journal");
  return exportJournalPDF(entries, partnerA, partnerB);
}

export async function lazyExportWeddingReport(state: AppState) {
  const { exportWeddingReport } = await import("./pdf-report");
  return exportWeddingReport(state);
}

/**
 * Lazy PDF loaders — dynamically import jsPDF only when the user clicks Export.
 * Replace static imports in pages with these async wrappers to reduce initial bundle size.
 *
 * Usage in a page:
 *   import { lazyExportDayJPDF } from "@/lib/pdf-lazy";
 *   // in onClick:
 *   await lazyExportDayJPDF(events, partnerA, partnerB, date);
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportDayJPDF(...args: any[]) {
  const mod = await import("./pdf-dayj");
  return mod.exportDayJPDF(...(args as Parameters<typeof mod.exportDayJPDF>));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportGuestListPDF(...args: any[]) {
  const mod = await import("./pdf-guests");
  return mod.exportGuestListPDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportPlaceCardsPDF(...args: any[]) {
  const mod = await import("./pdf-placecards");
  return mod.exportPlaceCardsPDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportSeatingListPDF(...args: any[]) {
  const mod = await import("./pdf-placecards");
  return mod.exportSeatingListPDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportBudgetPDF(...args: any[]) {
  const mod = await import("./pdf-budget");
  return mod.exportBudgetPDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportChecklistPDF(...args: any[]) {
  const mod = await import("./pdf-checklist");
  return mod.exportChecklistPDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportVendorsPDF(...args: any[]) {
  const mod = await import("./pdf-vendors");
  return mod.exportVendorsPDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportMusicPDF(...args: any[]) {
  const mod = await import("./pdf-music");
  return mod.exportMusicPDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportPaymentsPDF(...args: any[]) {
  const mod = await import("./pdf-payments");
  return mod.exportPaymentsPDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportDatesPDF(...args: any[]) {
  const mod = await import("./pdf-dates");
  return mod.exportDatesPDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportTimelinePDF(...args: any[]) {
  const mod = await import("./pdf-timeline");
  return mod.exportTimelinePDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportJournalPDF(...args: any[]) {
  const mod = await import("./pdf-journal");
  return mod.exportJournalPDF(...(args as any));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lazyExportWeddingReport(...args: any[]) {
  const mod = await import("./pdf-report");
  return mod.exportWeddingReport(...(args as any));
}

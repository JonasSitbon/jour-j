const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
const numFmt = new Intl.NumberFormat("fr-FR");

export const fmt = {
  eur: (n: number) => eur.format(n || 0),
  eur2: (n: number) => eur2.format(n || 0),
  num: (n: number) => numFmt.format(n || 0),
  date: (iso: string, opt?: Intl.DateTimeFormatOptions) =>
    new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", opt || { day: "numeric", month: "long", year: "numeric" }),
  dateShort: (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
  daysUntil: (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - now.getTime()) / 86400000);
  },
};

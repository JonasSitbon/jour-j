// Helpers purs (temps, dates) + persistance localStorage du déroulé.

import type { DayEvent, WeddingDay } from "./_data";
import { DEFAULT_EVENTS } from "./_data";

export function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(h: number, m: number, mins: number) {
  const total = h * 60 + m + mins;
  return { h: Math.floor(total / 60) % 24, m: total % 60 };
}

export function subMinutes(h: number, m: number, mins: number) {
  let total = h * 60 + m - mins;
  if (total < 0) total = 0;
  return { h: Math.floor(total / 60), m: total % 60 };
}

export function fmtDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function toTotalMinutes(h: number, m: number) {
  return h * 60 + m;
}

/** Add offsetDays to a YYYY-MM-DD date string */
export function addDaysToDate(dateStr: string, offsetDays: number): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

/** Format a YYYY-MM-DD date to short French label like "Sam. 14 juin" */
export function fmtShortDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
  } catch {
    return "";
  }
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/* ------------------------------------------------------------------ */
/* Storage                                                              */
/* ------------------------------------------------------------------ */

export function loadDays(weddingDate: string): WeddingDay[] {
  try {
    const raw = localStorage.getItem("jj_days_v1");
    if (raw) return JSON.parse(raw) as WeddingDay[];
    // Migration from old flat format
    const oldRaw = localStorage.getItem("jj_dayj_v2");
    if (oldRaw) {
      const oldEvents = JSON.parse(oldRaw) as DayEvent[];
      const migrated: WeddingDay[] = [{
        id: generateId(),
        label: "Jour J",
        date: weddingDate ? weddingDate.slice(0, 10) : "",
        events: oldEvents,
      }];
      localStorage.setItem("jj_days_v1", JSON.stringify(migrated));
      return migrated;
    }
    // Fresh start — create default "Jour J" day
    const defaults = DEFAULT_EVENTS.map((e, i) => ({ ...e, id: String(Date.now() + i) }));
    const initial: WeddingDay[] = [{
      id: generateId(),
      label: "Jour J",
      date: weddingDate ? weddingDate.slice(0, 10) : "",
      events: defaults,
    }];
    localStorage.setItem("jj_days_v1", JSON.stringify(initial));
    return initial;
  } catch { return []; }
}

export function saveDays(days: WeddingDay[]) {
  try { localStorage.setItem("jj_days_v1", JSON.stringify(days)); } catch {}
}

export function loadChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem("jj_checked_v2");
    if (raw) return JSON.parse(raw);
    return {};
  } catch { return {}; }
}

export function saveChecked(checked: Record<string, boolean>) {
  try { localStorage.setItem("jj_checked_v2", JSON.stringify(checked)); } catch {}
}

export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/* Event Modal                                                          */
/* ------------------------------------------------------------------ */

export const EMPTY_EVENT: Omit<DayEvent, "id"> = {
  hour: 10, minute: 0, duration: 60,
  title: "", description: "",
  category: "autre", who: "Tous les invités", important: false,
};

export function getNowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

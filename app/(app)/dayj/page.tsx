"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/components/providers";
import { Icon } from "@/components/icon";
import { Button, Empty } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { lazyExportDayJPDF } from "@/lib/pdf-lazy";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

import type { DayEvent, WeddingDay, TemplateDay, TemplatePreset, LibrarySuggestion } from "./_data";
import { CATEGORIES, DEFAULT_EVENTS } from "./_data";
import { addMinutes, subMinutes, toTotalMinutes, addDaysToDate, generateId, loadDays, saveDays, loadChecked, saveChecked, cx, getNowMinutes } from "./_helpers";
import { EventModal, LibraryModal, AddDayModal, DayTabBar, TemplatePicker, ProgressTracker, EventCard } from "./_parts";

export default function DayJPage() {
  const { state } = useStore();
  const [mounted, setMounted] = useState(false);
  const [days, setDays] = useState<WeddingDay[]>([]);
  const [activeDayId, setActiveDayId] = useState<string>("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [filterCat, setFilterCat] = useState<DayEvent["category"] | "all">("all");
  const [editingEvent, setEditingEvent] = useState<Partial<DayEvent> | null | false>(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAddDay, setShowAddDay] = useState(false);
  const [editingDay, setEditingDay] = useState<WeddingDay | undefined>(undefined);

  // Current time tracking
  const [nowMinutes, setNowMinutes] = useState<number>(0);
  const currentTimeRef = useRef<HTMLDivElement | null>(null);
  const scrolledRef = useRef(false);

  // Drag state
  const [dragIdx, setDragIdx] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const weddingDate = state.wedding?.date ? state.wedding.date.slice(0, 10) : "";

  useEffect(() => {
    const loadedDays = loadDays(weddingDate);
    setDays(loadedDays);
    if (loadedDays.length > 0) {
      // Default to the day matching today, or the first day
      const todayDay = loadedDays.find((d) => d.date === today);
      setActiveDayId(todayDay ? todayDay.id : loadedDays[0].id);
    }
    setChecked(loadChecked());
    setNowMinutes(getNowMinutes());
    setMounted(true);
  }, []);

  // Tick current time every minute
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => setNowMinutes(getNowMinutes()), 60_000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Active day object
  const activeDay = days.find((d) => d.id === activeDayId) ?? days[0];
  const events = activeDay?.events ?? [];

  // Is the active day today (for live mode)?
  const isWeddingDay = !!(activeDay?.date && activeDay.date === today);

  // Auto-scroll to current time block on the active day, once
  useEffect(() => {
    if (!mounted || !isWeddingDay || scrolledRef.current) return;
    if (currentTimeRef.current) {
      currentTimeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      scrolledRef.current = true;
    }
  }, [mounted, isWeddingDay, events]);

  // Persist days helper — update active day's events
  const persistedSetEvents = useCallback((updater: DayEvent[] | ((prev: DayEvent[]) => DayEvent[])) => {
    setDays((prevDays) => {
      const next = prevDays.map((d) => {
        if (d.id !== activeDayId) return d;
        const newEvents = typeof updater === "function" ? updater(d.events) : updater;
        return { ...d, events: newEvents };
      });
      saveDays(next);
      return next;
    });
  }, [activeDayId]);

  const handleSave = useCallback((form: Omit<DayEvent, "id"> & { id?: string }) => {
    if (form.id) {
      persistedSetEvents((prev) => prev.map((e) => (e.id === form.id ? (form as DayEvent) : e)));
    } else {
      persistedSetEvents((prev) => [...prev, { ...form, id: String(Date.now()) }]);
    }
  }, [persistedSetEvents]);

  const handleDelete = useCallback((id: string) => {
    persistedSetEvents((prev) => prev.filter((e) => e.id !== id));
    setChecked((prev) => {
      const next = { ...prev };
      delete next[`${activeDayId}:${id}`];
      saveChecked(next);
      return next;
    });
  }, [persistedSetEvents, activeDayId]);

  const handleReset = useCallback(() => {
    if (!window.confirm("Réinitialiser le déroulé avec le modèle par défaut ?")) return;
    const defaults = DEFAULT_EVENTS.map((e, i) => ({ ...e, id: String(Date.now() + i) }));
    persistedSetEvents(defaults);
  }, [persistedSetEvents]);

  // Load template — creates multiple days from a TemplatePreset
  const handleLoadTemplate = useCallback((templateDays: TemplateDay[]) => {
    const ts = Date.now();
    const newDays: WeddingDay[] = templateDays.map((td, di) => ({
      id: `${ts}_day_${di}`,
      label: td.label,
      date: weddingDate ? addDaysToDate(weddingDate, td.offsetDays) : "",
      events: td.events.map((e, ei) => ({ ...e, id: `${ts}_${di}_${ei}` })),
    }));
    setDays(newDays);
    saveDays(newDays);
    setActiveDayId(newDays[0].id);
    setChecked({});
    saveChecked({});
  }, [weddingDate]);

  // Toggle checked state using composite key
  const handleToggleChecked = useCallback((eventId: string) => {
    setChecked((prev) => {
      const key = `${activeDayId}:${eventId}`;
      const next = { ...prev, [key]: !prev[key] };
      saveChecked(next);
      return next;
    });
  }, [activeDayId]);

  // Quick time adjust (+/- 15 min)
  const handleAdjustTime = useCallback((id: string, deltaMinutes: number) => {
    persistedSetEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== id) return ev;
        if (deltaMinutes > 0) {
          const result = addMinutes(ev.hour, ev.minute, deltaMinutes);
          return { ...ev, hour: result.h, minute: result.m };
        } else {
          const result = subMinutes(ev.hour, ev.minute, Math.abs(deltaMinutes));
          return { ...ev, hour: result.h, minute: result.m };
        }
      })
    );
  }, [persistedSetEvents]);

  // Library: add suggestion to timeline
  const handleAddFromLibrary = useCallback((s: LibrarySuggestion) => {
    setDays((prevDays) => {
      return prevDays.map((d) => {
        if (d.id !== activeDayId) return d;
        const atHour = d.events.filter((e) => e.hour === s.hour);
        let minute = 0;
        if (atHour.length > 0) {
          const last = atHour.reduce((a, b) =>
            a.hour * 60 + a.minute > b.hour * 60 + b.minute ? a : b
          );
          const end = addMinutes(last.hour, last.minute, last.duration + 30);
          if (end.h === s.hour) {
            minute = end.m;
          }
        }
        const newEvent: DayEvent = {
          id: String(Date.now() + Math.random()),
          hour: s.hour,
          minute,
          duration: s.duration,
          title: s.title,
          category: s.cat,
          who: "Tous les invités",
          important: false,
          description: "",
        };
        const updatedEvents = [...d.events, newEvent];
        const updatedDay = { ...d, events: updatedEvents };
        const next = prevDays.map((dd) => dd.id === activeDayId ? updatedDay : dd);
        saveDays(next);
        return updatedDay;
      });
    });
  }, [activeDayId]);

  // Day management
  const handleAddDay = useCallback((label: string, date: string) => {
    const newDay: WeddingDay = {
      id: generateId(),
      label,
      date,
      events: [],
    };
    setDays((prev) => {
      const next = [...prev, newDay];
      saveDays(next);
      return next;
    });
    setActiveDayId(newDay.id);
  }, []);

  const handleEditDay = useCallback((day: WeddingDay, label: string, date: string) => {
    setDays((prev) => {
      const next = prev.map((d) => d.id === day.id ? { ...d, label, date } : d);
      saveDays(next);
      return next;
    });
  }, []);

  const handleDeleteDay = useCallback((id: string) => {
    if (!window.confirm("Supprimer ce jour et tous ses événements ?")) return;
    setDays((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveDays(next);
      if (activeDayId === id && next.length > 0) {
        setActiveDayId(next[0].id);
      }
      return next;
    });
  }, [activeDayId]);

  // Drag & drop handlers
  const handleDragStart = useCallback((id: string) => {
    setDragIdx(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOver(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragIdx || dragIdx === targetId) {
      setDragIdx(null);
      setDragOver(null);
      return;
    }
    persistedSetEvents((prev) => {
      const from = prev.findIndex((ev) => ev.id === dragIdx);
      const to = prev.findIndex((ev) => ev.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragIdx(null);
    setDragOver(null);
  }, [dragIdx, persistedSetEvents]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOver(null);
  }, []);

  const sorted = [...events].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  const filtered = filterCat === "all" ? sorted : sorted.filter((e) => e.category === filterCat);

  const totalDuration = events.reduce((s, e) => s + e.duration, 0);
  const usedCats = new Set(events.map((e) => e.category));

  const weddingDateFormatted = state.wedding?.date
    ? new Date(state.wedding.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  const minHour = sorted.length > 0 ? Math.max(7, sorted[0].hour - 1) : 7;
  const maxHour = sorted.length > 0 ? Math.min(25, Math.max(...sorted.map((e) => {
    const end = addMinutes(e.hour, e.minute, e.duration);
    return end.h + (end.m > 0 ? 1 : 0);
  })) + 1) : 24;

  const timeSlots = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  // Determine current time block (event that is currently happening)
  const currentBlockId: string | null = isWeddingDay
    ? sorted.find((ev) => {
        const start = toTotalMinutes(ev.hour, ev.minute);
        const end = start + ev.duration;
        return nowMinutes >= start && nowMinutes < end;
      })?.id ?? null
    : null;

  // ID of the first upcoming event (first event whose start > nowMinutes)
  const nextBlockId: string | null = isWeddingDay
    ? sorted.find((ev) => toTotalMinutes(ev.hour, ev.minute) > nowMinutes)?.id ?? null
    : null;

  // Past event: start + duration <= nowMinutes
  const isPastEvent = (ev: DayEvent) =>
    isWeddingDay && toTotalMinutes(ev.hour, ev.minute) + ev.duration <= nowMinutes;

  // Empty days (no days have any events) — show template picker
  const allDaysEmpty = days.every((d) => d.events.length === 0);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <>
      <PageHead
        title="Déroulé du Jour J"
        sub={weddingDateFormatted ? `Programme heure par heure · ${weddingDateFormatted}` : "Programme heure par heure de votre mariage"}
        actions={
          <>
            {/* EN DIRECT badge on active day = today */}
            {isWeddingDay && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                En direct
              </span>
            )}
            <Button variant="ghost" icon="download" onClick={() => window.print()}>
              Imprimer
            </Button>
            <Button variant="secondary" icon="download" onClick={() => lazyExportDayJPDF(events, state.wedding.partnerA, state.wedding.partnerB, state.wedding.date)}>
              Export PDF
            </Button>
          </>
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-6">

        {/* Show template picker when all days are empty */}
        {allDaysEmpty ? (
          <TemplatePicker
            onSelect={handleLoadTemplate}
            onManual={() => setEditingEvent({})}
          />
        ) : (
          <>
            {/* Day Tab Bar */}
            {days.length > 0 && (
              <DayTabBar
                days={days}
                activeDayId={activeDayId}
                onSelect={(id) => { setActiveDayId(id); setFilterCat("all"); scrolledRef.current = false; }}
                onAdd={() => { setEditingDay(undefined); setShowAddDay(true); }}
                onEdit={(day) => { setEditingDay(day); setShowAddDay(true); }}
                onDelete={handleDeleteDay}
                today={today}
              />
            )}

            {/* Progress tracker */}
            <ProgressTracker
              events={sorted}
              checked={checked}
              activeDayId={activeDayId}
            />

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-card overflow-hidden">
              {[
                { value: events.length, label: "Événements", icon: "calendar" },
                { value: `${Math.floor(totalDuration / 60)}h${totalDuration % 60 > 0 ? String(totalDuration % 60).padStart(2, "0") : ""}`, label: "Durée totale", icon: "clock" },
                { value: usedCats.size, label: "Catégories", icon: "sparkle" },
              ].map((s, i) => (
                <div key={i} className="bg-surface px-5 py-4 flex flex-col gap-0.5">
                  <span className="font-mono text-2xl font-semibold tracking-tight">{s.value}</span>
                  <span className="text-[12px] text-text-2 flex items-center gap-1.5">
                    <Icon name={s.icon} size={12} />
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Button variant="ghost" size="sm" icon="refresh" onClick={handleReset}>
                Réinitialiser le modèle
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowLibrary(true)}>
                  📚 Bibliothèque
                </Button>
                <Button variant="primary" icon="plus" onClick={() => setEditingEvent({})}>
                  Ajouter un événement
                </Button>
              </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterCat("all")}
                className={cx(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                  filterCat === "all"
                    ? "bg-text text-bg border-transparent"
                    : "bg-surface-2 text-text-2 border-line hover:border-line-strong"
                )}
              >
                Tous
              </button>
              {(Object.entries(CATEGORIES) as [DayEvent["category"], typeof CATEGORIES[DayEvent["category"]]][]).filter(
                ([k]) => usedCats.has(k)
              ).map(([k, cat]) => (
                <button
                  key={k}
                  onClick={() => setFilterCat(k)}
                  className={cx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition",
                    filterCat === k
                      ? `${cat.bg} ${cat.text} border-transparent`
                      : "bg-surface-2 text-text-2 border-line hover:border-line-strong"
                  )}
                >
                  <Icon name={cat.icon} size={12} />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Timeline */}
            {filtered.length === 0 && filterCat === "all" ? (
              <Empty
                icon="clock"
                title="Aucun événement planifié"
                action={
                  <Button variant="primary" icon="plus" onClick={() => setEditingEvent({})}>
                    Ajouter le premier événement
                  </Button>
                }
              >
                Construisez le programme de votre journée heure par heure.
              </Empty>
            ) : (
              <div className="relative">
                <div className="flex flex-col gap-0">
                  {timeSlots.map((hour) => {
                    const slotEvents = filtered.filter((e) => e.hour === hour);
                    const hasEvents = slotEvents.length > 0;

                    return (
                      <div key={hour} className="flex gap-4 min-h-[4rem] relative">
                        <div className="w-12 flex-shrink-0 pt-3 text-right">
                          <span className={cx(
                            "text-[12px] font-mono tabular-nums font-medium",
                            hasEvents ? "text-text" : "text-text-3"
                          )}>
                            {String(hour).padStart(2, "0")}h
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 flex-1 pb-2 pt-2 relative">
                          <div
                            className={cx(
                              "absolute left-0 top-0 bottom-0 w-px",
                              hasEvents ? "bg-line-strong" : "border-l border-dashed border-line"
                            )}
                          />
                          <div className="absolute left-[-3px] top-[14px] w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: hasEvents ? "var(--line-strong)" : "var(--line)" }}
                          />

                          {hasEvents ? (
                            <div className="ml-4 flex flex-col gap-2">
                              {slotEvents.map((ev) => {
                                const sortedIdx = sorted.findIndex((s) => s.id === ev.id);
                                const nextEv = sorted[sortedIdx + 1];
                                const showGapWarning = nextEv
                                  ? toTotalMinutes(nextEv.hour, nextEv.minute) -
                                    (toTotalMinutes(ev.hour, ev.minute) + ev.duration) > 120
                                  : false;

                                const showNowLine = isWeddingDay && nextBlockId === ev.id;

                                return (
                                  <div key={ev.id}>
                                    {/* Current time divider line */}
                                    {showNowLine && (
                                      <div
                                        ref={currentTimeRef}
                                        className="flex items-center gap-2 mb-2 -ml-1"
                                      >
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-wide whitespace-nowrap">
                                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                                          Maintenant
                                        </span>
                                        <div className="flex-1 h-px bg-red-400" />
                                        <span className="text-[10px] font-mono text-red-500 whitespace-nowrap">
                                          {String(Math.floor(nowMinutes / 60)).padStart(2, "0")}:{String(nowMinutes % 60).padStart(2, "0")}
                                        </span>
                                      </div>
                                    )}

                                    <div
                                      draggable
                                      onDragStart={() => handleDragStart(ev.id)}
                                      onDragOver={(e) => handleDragOver(e, ev.id)}
                                      onDrop={(e) => handleDrop(e, ev.id)}
                                      onDragEnd={handleDragEnd}
                                    >
                                      <EventCard
                                        event={ev}
                                        onEdit={() => setEditingEvent(ev)}
                                        onDelete={() => handleDelete(ev.id)}
                                        onAdjustTime={(delta) => handleAdjustTime(ev.id, delta)}
                                        isDragging={dragIdx === ev.id}
                                        isDragOver={dragOver === ev.id && dragIdx !== ev.id}
                                        isChecked={!!checked[`${activeDayId}:${ev.id}`]}
                                        onToggleChecked={() => handleToggleChecked(ev.id)}
                                        isCurrentBlock={currentBlockId === ev.id}
                                        isPastBlock={isPastEvent(ev)}
                                        dragHandleProps={{
                                          onMouseDown: (e) => e.stopPropagation(),
                                        }}
                                      />
                                    </div>

                                    {/* Time gap warning */}
                                    {showGapWarning && (
                                      <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-medium">
                                        <span>⚠</span>
                                        <span>Pause longue : vérifiez ce créneau</span>
                                        {nextEv && (
                                          <span className="ml-auto text-[11px] text-amber-500 font-mono">
                                            +{Math.round((toTotalMinutes(nextEv.hour, nextEv.minute) - (toTotalMinutes(ev.hour, ev.minute) + ev.duration)) / 60)}h de blanc
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="ml-4 h-8 flex items-center">
                              <span className="text-[11.5px] text-text-3 italic select-none">—</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filtered.length === 0 && filterCat !== "all" && (
              <div className="text-center py-8 text-sm text-text-2">
                Aucun événement dans cette catégorie.{" "}
                <button className="text-primary underline underline-offset-2" onClick={() => setFilterCat("all")}>
                  Voir tout
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editingEvent !== false && (
        <EventModal
          event={editingEvent}
          onClose={() => setEditingEvent(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {showLibrary && (
        <LibraryModal
          onClose={() => setShowLibrary(false)}
          onAdd={handleAddFromLibrary}
        />
      )}

      {showAddDay && (
        <AddDayModal
          onClose={() => { setShowAddDay(false); setEditingDay(undefined); }}
          editDay={editingDay}
          onAdd={(label, date) => {
            if (editingDay) {
              handleEditDay(editingDay, label, date);
            } else {
              handleAddDay(label, date);
            }
          }}
        />
      )}
    </>
  );
}

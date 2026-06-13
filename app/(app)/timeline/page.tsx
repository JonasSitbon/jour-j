"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useStore } from "@/components/providers";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Empty, Segmented } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { fmt } from "@/lib/format";
import { lazyExportTimelinePDF } from "@/lib/pdf-lazy";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

type FilterType = "all" | "tasks" | "payments";

interface TimelineTask {
  kind: "task";
  id: number;
  title: string;
  due: string;
  who: "A" | "B";
  done: boolean;
  cat: string;
  catIcon: string;
  note: string;
}

interface TimelinePayment {
  kind: "payment";
  id: number;
  vendor: string;
  label: string;
  amount: number;
  due: string;
  status: "paid" | "upcoming" | "late" | "partial";
  who: string;
}

type TimelineItem = TimelineTask | TimelinePayment;

function taskStatus(item: TimelineTask): "done" | "late" | "upcoming" {
  if (item.done) return "done";
  const d = fmt.daysUntil(item.due);
  return d < 0 ? "late" : "upcoming";
}

function itemMonthKey(item: TimelineItem): string {
  const d = new Date(item.due + "T00:00:00");
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
}

function Popover({ item, nameA, nameB, onClose }: { item: TimelineItem; nameA: string; nameB: string; onClose: () => void }) {
  if (item.kind === "task") {
    const st = taskStatus(item);
    const daysLeft = fmt.daysUntil(item.due);
    const whoName = item.who === "A" ? nameA : nameB;
    return (
      <div className="absolute z-[50] left-0 top-full mt-1.5 w-[220px] bg-surface border border-line rounded-md shadow-lg p-3.5 animate-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={cx("text-[12.5px] font-semibold leading-snug flex-1", st === "done" ? "text-sage line-through" : st === "late" ? "text-coral" : "text-text")}>{item.title}</span>
          <button className="text-text-3 hover:text-text shrink-0 mt-0.5" onClick={onClose}><Icon name="x" size={13} /></button>
        </div>
        <div className="flex flex-col gap-1.5 text-[11.5px] text-text-2">
          <span className="flex items-center gap-1.5"><Icon name="clock" size={12} className="text-text-3" />{fmt.date(item.due)}</span>
          <span className="flex items-center gap-1.5"><Icon name="user" size={12} className="text-text-3" />{whoName}</span>
          {!item.done && <span className="flex items-center gap-1.5"><Icon name="flag" size={12} className={daysLeft < 0 ? "text-coral" : "text-text-3"} />{daysLeft < 0 ? `${Math.abs(daysLeft)}j de retard` : `J-${daysLeft}`}</span>}
          {item.done && <span className="flex items-center gap-1.5 text-sage"><Icon name="check-circle" size={12} />Terminée</span>}
          {item.note && <span className="text-text-3 italic truncate">"{item.note}"</span>}
        </div>
      </div>
    );
  }

  const whoName = item.who === "A" ? nameA : item.who === "B" ? nameB : item.who;
  const stMap = { paid: { label: "Payé", tone: "sage" as const }, upcoming: { label: "À venir", tone: "amber" as const }, late: { label: "En retard", tone: "coral" as const }, partial: { label: "Partiel", tone: "amber" as const } };
  const st = stMap[item.status];
  return (
    <div className="absolute z-[50] left-0 top-full mt-1.5 w-[220px] bg-surface border border-line rounded-md shadow-lg p-3.5 animate-pop" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[12.5px] font-semibold leading-snug flex-1">{item.label}</span>
        <button className="text-text-3 hover:text-text shrink-0 mt-0.5" onClick={onClose}><Icon name="x" size={13} /></button>
      </div>
      <div className="flex flex-col gap-1.5 text-[11.5px] text-text-2">
        <span className="flex items-center gap-1.5"><Icon name="wallet" size={12} className="text-text-3" />{item.vendor}</span>
        <span className="flex items-center gap-1.5"><Icon name="card" size={12} className="text-text-3" />{fmt.eur(item.amount)}</span>
        <span className="flex items-center gap-1.5"><Icon name="clock" size={12} className="text-text-3" />{fmt.date(item.due)}</span>
        <span className="flex items-center gap-1.5"><Icon name="user" size={12} className="text-text-3" />{whoName}</span>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
    </div>
  );
}

function ItemPill({ item, nameA, nameB }: { item: TimelineItem; nameA: string; nameB: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (item.kind === "task") {
    const st = taskStatus(item);
    const cls = st === "done"
      ? "bg-sage-soft text-sage border-sage/20"
      : st === "late"
      ? "bg-coral-soft text-coral border-coral/20"
      : "bg-primary-soft text-primary-700 border-primary/20";
    const whoInitial = item.who === "A" ? nameA[0] : nameB[0];

    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={cx("flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11.5px] font-medium w-full text-left transition hover:opacity-80 active:scale-[0.98]", cls)}
        >
          <Icon name={item.catIcon} size={12} strokeWidth={2} className="shrink-0" />
          <span className={cx("flex-1 truncate leading-tight", st === "done" && "line-through opacity-70")}>{item.title}</span>
          <span className={cx("w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 border", item.who === "A" ? "bg-primary-soft border-primary/30 text-primary-700" : "bg-gold-soft border-gold/30 text-[var(--gold-ink)]")}>
            {whoInitial}
          </span>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-[40]" onClick={() => setOpen(false)} />
            <Popover item={item} nameA={nameA} nameB={nameB} onClose={() => setOpen(false)} />
          </>
        )}
      </div>
    );
  }

  const stCls = item.status === "paid"
    ? "bg-sage-soft text-sage border-sage/20"
    : item.status === "late"
    ? "bg-coral-soft text-coral border-coral/20"
    : "bg-amber-soft text-[var(--gold-ink)] border-amber/20";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cx("flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11.5px] font-medium w-full text-left transition hover:opacity-80 active:scale-[0.98]", stCls)}
      >
        <Icon name="wallet" size={12} strokeWidth={2} className="shrink-0" />
        <span className="flex-1 truncate leading-tight">{item.vendor}</span>
        <span className="font-mono text-[10px] shrink-0 opacity-80">{fmt.eur(item.amount)}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[40]" onClick={() => setOpen(false)} />
          <Popover item={item} nameA={nameA} nameB={nameB} onClose={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}

function MonthColumn({ monthKey, items, isToday, isWedding, isPast, nameA, nameB, colRef }: {
  monthKey: string;
  items: TimelineItem[];
  isToday: boolean;
  isWedding: boolean;
  isPast: boolean;
  nameA: string;
  nameB: string;
  colRef?: React.RefCallback<HTMLDivElement>;
}) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 4;
  const visible = expanded ? items : items.slice(0, LIMIT);
  const hidden = items.length - LIMIT;

  const [year, month] = monthKey.split("-").map(Number);
  const monthName = MONTHS_FR[month];

  // Feature 4: all-done indicator
  const allDone = items.length > 0 && items.every((item) =>
    item.kind === "task" ? item.done : item.status === "paid"
  );

  return (
    <div
      id={`month-${monthKey}`}
      ref={colRef}
      className={cx(
        "flex-shrink-0 w-[190px] rounded-xl border p-3 flex flex-col gap-2 transition",
        isWedding ? "border-primary bg-primary-soft shadow-sm" : isToday ? "border-line-strong bg-surface-2" : "border-line bg-surface",
        isPast && !isWedding && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between gap-1.5 mb-0.5">
        <div className="flex flex-col">
          <span className={cx("text-[13px] font-semibold leading-tight capitalize", isWedding ? "text-primary-700" : "text-text")}>
            {monthName}
          </span>
          <span className="text-[11px] text-text-3 font-mono">{year}</span>
        </div>
        <div className="flex items-center gap-1">
          {allDone && (
            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sage-soft text-sage border border-sage/20 leading-none flex items-center gap-0.5">
              <Icon name="check" size={8} strokeWidth={2.5} />
              <span>Tout fait</span>
            </span>
          )}
          {isWedding && <Icon name="rings" size={15} className="text-primary" />}
          {isToday && (
            <span className="text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary text-white leading-none">
              Auj.
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center py-3 text-[11px] text-text-3">Aucun élément</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {visible.map((item) => (
            <ItemPill key={item.kind + "-" + item.id} item={item} nameA={nameA} nameB={nameB} />
          ))}
          {!expanded && hidden > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[11px] text-text-3 hover:text-text font-medium py-1 px-2 rounded-md hover:bg-hover transition text-left"
            >
              +{hidden} autres
            </button>
          )}
          {expanded && hidden > 0 && (
            <button
              onClick={() => setExpanded(false)}
              className="text-[11px] text-text-3 hover:text-text font-medium py-1 px-2 rounded-md hover:bg-hover transition text-left"
            >
              Réduire
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function WeddingEndCard({ date, nameA, nameB }: { date: string; nameA: string; nameB: string }) {
  return (
    <div className="flex-shrink-0 w-[190px] rounded-xl border-2 border-primary p-4 flex flex-col items-center gap-2.5 text-center"
      style={{ background: "linear-gradient(135deg, var(--primary-softer), var(--gold-soft))" }}>
      <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center">
        <Icon name="rings" size={20} className="text-primary" />
      </div>
      <div className="text-[13px] font-semibold text-primary-700">Jour J</div>
      <div className="text-[12px] text-text-2 leading-snug">
        {nameA} &amp; {nameB}
      </div>
      <div className="text-[11px] font-mono text-text-3">{fmt.date(date, { day: "numeric", month: "long", year: "numeric" })}</div>
    </div>
  );
}

export default function TimelinePage() {
  const { state, SIDES } = useStore();
  const [filter, setFilter] = useState<FilterType>("all");

  // Refs for each month column element, keyed by monthKey
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Ref for the horizontal scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const nameA = state.wedding.partnerA || "A";
  const nameB = state.wedding.partnerB || "B";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()).padStart(2, "0")}`;

  const weddingDate = state.wedding.date;
  const hasWeddingDate = !!weddingDate;
  const weddingMonthKey = hasWeddingDate
    ? (() => { const d = new Date(weddingDate + "T00:00:00"); return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`; })()
    : null;

  const allItems = useMemo<TimelineItem[]>(() => {
    const tasks: TimelineItem[] = state.tasks
      .filter((t) => t.due)
      .map((t) => {
        const catObj = state.checklistCats.find((c) => c.id === t.cat);
        return {
          kind: "task",
          id: t.id,
          title: t.title,
          due: t.due,
          who: t.who,
          done: t.done,
          cat: t.cat,
          catIcon: catObj?.icon ?? "check",
          note: t.note,
        };
      });

    const payments: TimelineItem[] = state.payments
      .filter((p) => p.due)
      .map((p) => ({
        kind: "payment",
        id: p.id,
        vendor: p.vendor,
        label: p.label,
        amount: p.amount,
        due: p.due,
        status: p.status,
        who: p.who,
      }));

    return [...tasks, ...payments].sort((a, b) => a.due.localeCompare(b.due));
  }, [state.tasks, state.payments, state.checklistCats]);

  const filteredItems = useMemo(() => {
    if (filter === "tasks") return allItems.filter((i) => i.kind === "task");
    if (filter === "payments") return allItems.filter((i) => i.kind === "payment");
    return allItems;
  }, [allItems, filter]);

  const monthKeys = useMemo(() => {
    const keys = new Set<string>();
    filteredItems.forEach((item) => keys.add(itemMonthKey(item)));
    if (weddingMonthKey) keys.add(weddingMonthKey);
    return Array.from(keys).sort();
  }, [filteredItems, weddingMonthKey]);

  const itemsByMonth = useMemo(() => {
    const map: Record<string, TimelineItem[]> = {};
    filteredItems.forEach((item) => {
      const key = itemMonthKey(item);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [filteredItems]);

  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter((t) => t.done).length;
  const totalPayments = state.payments.length;
  const paidPayments = state.payments.filter((p) => p.status === "paid").length;
  const totalAmountDue = state.payments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const daysLeft = hasWeddingDate ? fmt.daysUntil(weddingDate) : null;

  const hasContent = allItems.length > 0;

  // Feature 3: stats for the compact stat row (timeline-scoped items only)
  const timelineTotal = filteredItems.length;
  const timelineDone = filteredItems.filter((i) =>
    i.kind === "task" ? i.done : i.status === "paid"
  ).length;
  const timelineLate = filteredItems.filter((i) =>
    i.kind === "task" ? taskStatus(i) === "late" : i.status === "late"
  ).length;

  // Scrolls the horizontal timeline container to bring a month column into view
  const scrollToMonth = useCallback((key: string) => {
    const col = colRefs.current[key];
    const container = scrollContainerRef.current;
    if (!col || !container) return;
    const containerLeft = container.getBoundingClientRect().left;
    const colLeft = col.getBoundingClientRect().left;
    const offset = colLeft - containerLeft + container.scrollLeft - 16; // 16px breathing room
    container.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
  }, []);

  // Feature 2: scroll to the nearest upcoming (or today's) month
  const scrollToToday = useCallback(() => {
    if (monthKeys.length === 0) return;
    // Find the first month key >= todayKey
    const upcoming = monthKeys.find((k) => k >= todayKey) ?? monthKeys[monthKeys.length - 1];
    scrollToMonth(upcoming);
  }, [monthKeys, todayKey, scrollToMonth]);

  // Feature 5: scroll to wedding month
  const scrollToWedding = useCallback(() => {
    if (!weddingMonthKey) return;
    // Find the closest key to the wedding month in the list
    const target = monthKeys.find((k) => k >= weddingMonthKey) ?? monthKeys[monthKeys.length - 1] ?? weddingMonthKey;
    scrollToMonth(target);
  }, [weddingMonthKey, monthKeys, scrollToMonth]);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">
      <PageHead
        title="Chronologie"
        sub="Vue mensuelle de toutes vos échéances et paiements"
        actions={
          <div className="flex items-center gap-2">
            {/* Feature 5: Jump to wedding date */}
            {hasWeddingDate && hasContent && (
              <Button
                variant="secondary"
                size="sm"
                icon="rings"
                onClick={scrollToWedding}
              >
                Aller au Jour J
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon="download"
              onClick={() => lazyExportTimelinePDF(allItems, nameA, nameB, weddingDate ?? "")}
            >
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-card overflow-hidden mb-6">
        <div className="bg-surface px-4 py-3.5 flex flex-col gap-0.5">
          <span className="font-mono text-lg font-semibold">{doneTasks} <span className="text-text-3 text-sm font-normal">/ {totalTasks}</span></span>
          <span className="text-[12px] text-text-2 flex items-center gap-1.5"><Icon name="check-circle" size={13} className="text-sage" />Tâches</span>
        </div>
        <div className="bg-surface px-4 py-3.5 flex flex-col gap-0.5">
          <span className="font-mono text-lg font-semibold">{paidPayments} <span className="text-text-3 text-sm font-normal">/ {totalPayments}</span></span>
          <span className="text-[12px] text-text-2 flex items-center gap-1.5"><Icon name="card" size={13} className="text-primary" />Paiements</span>
        </div>
        <div className="bg-surface px-4 py-3.5 flex flex-col gap-0.5">
          <span className="font-mono text-lg font-semibold">{fmt.eur(totalAmountDue)}</span>
          <span className="text-[12px] text-text-2 flex items-center gap-1.5"><Icon name="wallet" size={13} className="text-amber" />À régler</span>
        </div>
        <div className="bg-surface px-4 py-3.5 flex flex-col gap-0.5">
          {daysLeft !== null ? (
            <>
              <span className="font-mono text-lg font-semibold">{daysLeft > 0 ? `J-${daysLeft}` : daysLeft === 0 ? "Aujourd'hui !" : `J+${Math.abs(daysLeft)}`}</span>
              <span className="text-[12px] text-text-2 flex items-center gap-1.5"><Icon name="rings" size={13} className="text-primary" />Avant le mariage</span>
            </>
          ) : (
            <>
              <span className="font-mono text-lg font-semibold text-text-3">—</span>
              <span className="text-[12px] text-text-2 flex items-center gap-1.5"><Icon name="calendar" size={13} className="text-text-3" />Date non définie</span>
            </>
          )}
        </div>
      </div>

      {/* Feature 3: compact inline stats row */}
      {hasContent && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="text-text-3">Total</span>
            <span className="font-semibold tabular-nums text-text">{timelineTotal}</span>
          </div>
          <span className="text-line-strong select-none">·</span>
          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="w-2 h-2 rounded-full bg-sage shrink-0" />
            <span className="text-text-3">Terminés</span>
            <span className="font-semibold tabular-nums text-sage">{timelineDone}</span>
          </div>
          <span className="text-line-strong select-none">·</span>
          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="w-2 h-2 rounded-full bg-coral shrink-0" />
            <span className="text-text-3">En retard</span>
            <span className={cx("font-semibold tabular-nums", timelineLate > 0 ? "text-coral" : "text-text-3")}>{timelineLate}</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Segmented<FilterType>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Tous", icon: "list" },
            { value: "tasks", label: "Tâches", icon: "check-circle" },
            { value: "payments", label: "Paiements", icon: "card" },
          ]}
        />
        {/* Feature 2: Today button */}
        {hasContent && monthKeys.length > 0 && (
          <button
            onClick={scrollToToday}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-line bg-surface-2 hover:bg-hover text-[12px] font-medium text-text-2 hover:text-text transition"
          >
            <Icon name="clock" size={12} />
            Aujourd&apos;hui
          </button>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[12px] text-text-3">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-sage-soft border border-sage/20 inline-block" />Terminé</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary-soft border border-primary/20 inline-block" />À venir</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-coral-soft border border-coral/20 inline-block" />En retard</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-soft border border-amber/20 inline-block" />Paiement</span>
        </div>
      </div>

      {/* Feature 1: Month jump navigation strip */}
      {hasContent && monthKeys.length > 1 && (
        <div className="mb-4 -mx-1 px-1">
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {monthKeys.map((key) => {
              const [y, m] = key.split("-").map(Number);
              const count = (itemsByMonth[key] ?? []).length;
              const isCurrentMonth = key === todayKey;
              const isWeddingMonth = key === weddingMonthKey;
              return (
                <button
                  key={key}
                  onClick={() => scrollToMonth(key)}
                  className={cx(
                    "flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] font-medium transition whitespace-nowrap",
                    isWeddingMonth
                      ? "bg-primary-soft border-primary/30 text-primary-700 hover:bg-primary/20"
                      : isCurrentMonth
                      ? "bg-surface-3 border-line-strong text-text hover:bg-hover"
                      : "bg-surface-3 border-line text-text-2 hover:bg-primary-soft hover:text-primary-700 hover:border-primary/20"
                  )}
                >
                  <span>{MONTHS_SHORT[m]} {y}</span>
                  {count > 0 && (
                    <span className={cx(
                      "min-w-[16px] h-4 rounded-full text-[9.5px] font-bold flex items-center justify-center px-1 leading-none",
                      isWeddingMonth
                        ? "bg-primary text-white"
                        : isCurrentMonth
                        ? "bg-line-strong text-text"
                        : "bg-line text-text-3"
                    )}>
                      {count}
                    </span>
                  )}
                  {isWeddingMonth && <Icon name="rings" size={11} className="text-primary" />}
                  {isCurrentMonth && !isWeddingMonth && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasContent && (
        <Card>
          <Empty
            icon="calendar"
            title="Aucune échéance pour le moment"
            action={
              <div className="flex gap-3 flex-wrap justify-center">
                <Button variant="secondary" size="sm" icon="check-circle" onClick={() => window.location.assign("/checklist")}>
                  Voir la checklist
                </Button>
                <Button variant="primary" size="sm" icon="card" onClick={() => window.location.assign("/payments")}>
                  Ajouter un paiement
                </Button>
              </div>
            }
          >
            Ajoutez des tâches dans la checklist et des paiements pour voir apparaître votre chronologie ici.
          </Empty>
        </Card>
      )}

      {/* Timeline */}
      {hasContent && monthKeys.length > 0 && (
        <div ref={scrollContainerRef} className="overflow-x-auto pb-4 -mx-1 px-1">
          <div className="flex gap-3 min-w-max">
            {monthKeys.map((key) => {
              const [y, m] = key.split("-").map(Number);
              const monthDate = new Date(y, m, 1);
              const isPast = monthDate < new Date(today.getFullYear(), today.getMonth(), 1);
              const isToday = key === todayKey;
              const isWedding = key === weddingMonthKey;
              const items = itemsByMonth[key] ?? [];

              return (
                <MonthColumn
                  key={key}
                  monthKey={key}
                  items={items}
                  isToday={isToday}
                  isWedding={isWedding}
                  isPast={isPast}
                  nameA={nameA}
                  nameB={nameB}
                  colRef={(el) => { colRefs.current[key] = el; }}
                />
              );
            })}

            {hasWeddingDate && (
              <div className="flex items-start">
                <div className="self-center mx-1 h-px w-8 bg-line-strong shrink-0" />
                <WeddingEndCard date={weddingDate} nameA={nameA} nameB={nameB} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* No items after filter */}
      {hasContent && monthKeys.length === 0 && (
        <Card>
          <Empty icon="list" title="Aucun élément pour ce filtre">
            Essayez de sélectionner «&nbsp;Tous&nbsp;» pour voir l&apos;ensemble des échéances.
          </Empty>
        </Card>
      )}
    </div>
  );
}

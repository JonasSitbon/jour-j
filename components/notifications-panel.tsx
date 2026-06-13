"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useStore } from "@/components/providers";
import { Icon } from "@/components/icon";
import { IconButton } from "@/components/ui";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type SmartNotif = {
  id: string;
  type: "alert" | "warning" | "info" | "success";
  category: "payment" | "task" | "guest" | "vendor" | "budget" | "general";
  title: string;
  body: string;
  link?: string;
  urgent: boolean;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

const today = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

function isBefore(dateStr: string): boolean {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

const CATEGORY_ORDER: SmartNotif["category"][] = [
  "payment", "task", "vendor", "guest", "budget", "general",
];

function sortNotifs(notifs: SmartNotif[]): SmartNotif[] {
  return [...notifs].sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  });
}

/* ------------------------------------------------------------------ */
/*  Notification computation                                           */
/* ------------------------------------------------------------------ */

function useSmartNotifs(): SmartNotif[] {
  const { state } = useStore();

  return useMemo<SmartNotif[]>(() => {
    const notifs: SmartNotif[] = [];

    // 1. Late payments
    state.payments
      .filter((p) => p.status === "late")
      .forEach((p) => {
        notifs.push({
          id: `payment-late-${p.id}`,
          type: "alert",
          category: "payment",
          title: `Paiement en retard — ${p.vendor}`,
          body: `Montant : ${p.amount.toLocaleString("fr-FR")}€. À régulariser rapidement.`,
          link: "/payments",
          urgent: true,
        });
      });

    // 2. Payments due within 7 days
    state.payments
      .filter((p) => {
        if (p.status === "paid") return false;
        const days = daysUntil(p.due);
        return days >= 0 && days <= 7;
      })
      .forEach((p) => {
        const days = daysUntil(p.due);
        notifs.push({
          id: `payment-soon-${p.id}`,
          type: "warning",
          category: "payment",
          title: `Échéance imminente — ${p.vendor}`,
          body: `${p.vendor} — ${p.amount.toLocaleString("fr-FR")}€ à régler dans ${days} jour${days !== 1 ? "s" : ""}.`,
          link: "/payments",
          urgent: true,
        });
      });

    // 3. Overdue tasks
    const overdueTasks = state.tasks.filter(
      (t) => !t.done && t.due && isBefore(t.due)
    );
    if (overdueTasks.length > 2) {
      notifs.push({
        id: "tasks-overdue-group",
        type: "alert",
        category: "task",
        title: `${overdueTasks.length} tâches en retard`,
        body: "À traiter en priorité.",
        link: "/checklist",
        urgent: true,
      });
    } else {
      overdueTasks.forEach((t) => {
        notifs.push({
          id: `task-overdue-${t.id}`,
          type: "alert",
          category: "task",
          title: `Tâche en retard — ${t.title}`,
          body: `Échéance dépassée. À traiter en priorité.`,
          link: "/checklist",
          urgent: true,
        });
      });
    }

    // 4. Pending RSVPs when wedding < 60 days away
    const pendingGuests = state.guests.filter((g) => g.rsvp === "pending");
    const weddingDays = daysUntil(state.wedding.date);
    if (pendingGuests.length > 0 && weddingDays < 60) {
      notifs.push({
        id: "guests-pending-rsvp",
        type: "info",
        category: "guest",
        title: `${pendingGuests.length} invité${pendingGuests.length > 1 ? "s" : ""} sans réponse`,
        body: `${pendingGuests.length} invité${pendingGuests.length > 1 ? "s" : ""} n'ont pas encore répondu. Pensez à les relancer.`,
        link: "/guests",
        urgent: false,
      });
    }

    // 5. Vendors without a signed contract (active ones only — exclude declined)
    const vendorsNoContract = state.vendors.filter(
      (v) => v.status !== "signed" && v.status !== "declined"
    );
    if (vendorsNoContract.length > 0) {
      notifs.push({
        id: "vendors-no-contract",
        type: "warning",
        category: "vendor",
        title: `${vendorsNoContract.length} prestataire${vendorsNoContract.length > 1 ? "s" : ""} sans contrat`,
        body: `${vendorsNoContract.length} prestataire${vendorsNoContract.length > 1 ? "s" : ""} sans contrat signé. Sécurisez votre mariage.`,
        link: "/vendors",
        urgent: false,
      });
    }

    // 6. Budget exceeded by more than 5%
    const totalSpent = state.budget.reduce((s, p) => s + p.spent, 0);
    if (totalSpent > state.budgetTotal * 1.05) {
      const overPct = Math.round(((totalSpent - state.budgetTotal) / state.budgetTotal) * 100);
      notifs.push({
        id: "budget-exceeded",
        type: "alert",
        category: "budget",
        title: "Budget dépassé",
        body: `Budget dépassé de ${overPct}%. Revoyez vos postes de dépenses.`,
        link: "/budget",
        urgent: true,
      });
    }

    // 7. Missing critical vendor categories
    const criticalCats: { id: string; label: string }[] = [
      { id: "traiteur", label: "traiteur" },
      { id: "photo", label: "photographe" },
      { id: "salle", label: "salle/lieu" },
    ];
    criticalCats.forEach(({ id, label }) => {
      const hasConfirmed = state.vendors.some(
        (v) => v.cat === id && v.status === "signed"
      );
      if (!hasConfirmed) {
        notifs.push({
          id: `vendor-missing-${id}`,
          type: "info",
          category: "vendor",
          title: `Pas de ${label} confirmé`,
          body: `Vous n'avez pas encore de ${label} confirmé.`,
          link: "/vendors",
          urgent: false,
        });
      }
    });

    // 8. Wedding in less than 30 days
    if (weddingDays > 0 && weddingDays <= 30) {
      notifs.push({
        id: "wedding-soon",
        type: "success",
        category: "general",
        title: `Plus que ${weddingDays} jour${weddingDays !== 1 ? "s" : ""} ! 🎉`,
        body: "Votre grand jour approche. Félicitations !",
        urgent: false,
      });
    }

    // 9. Checklist < 50% and wedding < 90 days away
    const doneTasks = state.tasks.filter((t) => t.done).length;
    const totalTasks = state.tasks.length;
    const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    if (pct < 50 && weddingDays > 0 && weddingDays < 90) {
      notifs.push({
        id: "checklist-low",
        type: "warning",
        category: "task",
        title: "Checklist incomplète",
        body: `Votre checklist n'est complétée qu'à ${pct}% et le mariage approche.`,
        link: "/checklist",
        urgent: true,
      });
    }

    return sortNotifs(notifs);
  }, [state]);
}

/* ------------------------------------------------------------------ */
/*  Read tracking                                                       */
/* ------------------------------------------------------------------ */

const LS_KEY = "jj_notifs_read";

function useReadIds(): [Set<string>, (id: string) => void, (ids: string[]) => void] {
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(LS_KEY);
      return stored ? new Set<string>(JSON.parse(stored) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const persist = useCallback((next: Set<string>) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify([...next]));
    } catch {
      // ignore
    }
    setReadIds(next);
  }, []);

  const markRead = useCallback(
    (id: string) => {
      persist(new Set([...readIds, id]));
    },
    [readIds, persist]
  );

  const markAllRead = useCallback(
    (ids: string[]) => {
      persist(new Set([...readIds, ...ids]));
    },
    [readIds, persist]
  );

  return [readIds, markRead, markAllRead];
}

/* ------------------------------------------------------------------ */
/*  Icon + colour helpers                                               */
/* ------------------------------------------------------------------ */

const TYPE_STRIP: Record<SmartNotif["type"], string> = {
  alert: "var(--coral)",
  warning: "var(--amber)",
  info: "var(--primary)",
  success: "var(--sage)",
};

const TYPE_ICON: Record<SmartNotif["type"], string> = {
  alert: "alert",
  warning: "alert",
  info: "info",
  success: "check-circle",
};

const TYPE_ICON_COLOR: Record<SmartNotif["type"], string> = {
  alert: "text-[var(--coral)]",
  warning: "text-[var(--amber)]",
  info: "text-primary",
  success: "text-[var(--sage)]",
};

/* ------------------------------------------------------------------ */
/*  Notification item                                                   */
/* ------------------------------------------------------------------ */

function NotifItem({
  notif,
  isRead,
  onRead,
}: {
  notif: SmartNotif;
  isRead: boolean;
  onRead: (id: string) => void;
}) {
  return (
    <div
      className="flex gap-0 transition-opacity"
      style={{ opacity: isRead ? 0.45 : 1 }}
      onClick={() => onRead(notif.id)}
    >
      {/* Colored strip */}
      <div
        className="w-[3px] rounded-full shrink-0 self-stretch"
        style={{ background: TYPE_STRIP[notif.type] }}
      />

      <div className="flex-1 min-w-0 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          {/* Icon */}
          <span className={`shrink-0 mt-0.5 ${TYPE_ICON_COLOR[notif.type]}`}>
            <Icon name={TYPE_ICON[notif.type]} size={16} strokeWidth={2} />
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div
              className="text-[14px] font-semibold leading-snug"
              style={{ color: "var(--text)" }}
            >
              {notif.title}
            </div>
            <div
              className="text-[13px] leading-snug mt-0.5"
              style={{ color: "var(--text-2)" }}
            >
              {notif.body}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span
                className="text-[11px]"
                style={{ color: "var(--text-3)" }}
              >
                Maintenant
              </span>
              {notif.link && (
                <Link
                  href={notif.link}
                  className="text-[12px] font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Voir →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center py-16">
      {/* CSS-only illustration: concentric circles + check */}
      <div
        className="relative w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "var(--primary-soft)" }}
      >
        <div
          className="absolute inset-2 rounded-full"
          style={{ background: "var(--primary-softer)" }}
        />
        <span className="relative" style={{ color: "var(--primary)" }}>
          <Icon name="check-circle" size={32} strokeWidth={1.5} />
        </span>
      </div>
      <div>
        <div
          className="text-[15px] font-semibold"
          style={{ color: "var(--text)" }}
        >
          Tout est en ordre ✓
        </div>
        <div
          className="text-[13px] mt-1"
          style={{ color: "var(--text-2)" }}
        >
          Aucune action requise pour le moment.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                          */
/* ------------------------------------------------------------------ */

export interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const notifs = useSmartNotifs();
  const [readIds, markRead, markAllRead] = useReadIds();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const unreadCount = notifs.filter((n) => !readIds.has(n.id)).length;
  const allIds = notifs.map((n) => n.id);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 499, background: "transparent" }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className="fixed top-0 right-0 h-[100dvh] flex flex-col"
        style={{
          width: 380,
          maxWidth: "100vw",
          zIndex: 500,
          background: "var(--surface)",
          borderLeft: "1px solid var(--line)",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms cubic-bezier(0.32, 0, 0.15, 1)",
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <span
            className="text-[17px] font-semibold flex-1"
            style={{ color: "var(--text)" }}
          >
            Notifications
          </span>

          {unreadCount > 0 && (
            <span
              className="inline-flex items-center justify-center rounded-full text-[11px] font-bold px-2 h-5 min-w-[20px]"
              style={{
                background: "var(--coral)",
                color: "#fff",
              }}
            >
              {unreadCount}
            </span>
          )}

          {notifs.length > 0 && (
            <button
              className="text-[12px] font-medium shrink-0"
              style={{ color: "var(--primary)" }}
              onClick={() => markAllRead(allIds)}
            >
              Tout marquer comme lu
            </button>
          )}

          <IconButton name="x" size="sm" onClick={onClose} title="Fermer" />
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {notifs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--line)" }}>
              {notifs.map((n) => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  isRead={readIds.has(n.id)}
                  onRead={markRead}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-5 py-3"
          style={{
            borderTop: "1px solid var(--line)",
            color: "var(--text-3)",
            fontSize: 11,
          }}
        >
          Ces notifications sont calculées automatiquement depuis vos données.
        </div>
      </div>
    </>
  );
}

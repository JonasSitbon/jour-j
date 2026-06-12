"use client";

import { createClient } from "./supabase";
import type { AppState } from "./types";

const SESSION_KEY = "jj_autonotif_done";

interface NotifToCreate {
  type: "alert" | "warning" | "info" | "success";
  title: string;
  body: string;
}

function daysUntil(iso: string): number {
  if (!iso) return Infinity;
  const d = new Date(iso + "T00:00:00");
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function daysSince(iso: string): number {
  if (!iso) return 0;
  const d = new Date(iso + "T00:00:00");
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - d.getTime()) / 86400000);
}

export async function runAutoNotifications(state: AppState, weddingId: number): Promise<void> {
  // Run at most once per browser session
  if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY + weddingId)) return;
  if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY + weddingId, "1");

  const toCreate: NotifToCreate[] = [];
  const existing = new Set(state.notifications.map((n) => n.title));

  // ── Wedding date proximity ──────────────────────────────────────────────────
  if (state.wedding.date) {
    const days = daysUntil(state.wedding.date);
    if (days > 0 && days <= 30 && !existing.has("J-30 : dernier sprint")) {
      toCreate.push({ type: "alert", title: "J-30 : dernier sprint", body: `Plus que ${days} jour${days > 1 ? "s" : ""} avant le mariage — vérifiez la checklist et confirmez les prestataires.` });
    } else if (days > 30 && days <= 90 && !existing.has("J-90 : cap important")) {
      toCreate.push({ type: "warning", title: "J-90 : cap important", body: `${days} jours avant le mariage — c'est le bon moment pour finaliser les contrats prestataires.` });
    }
  }

  // ── Late payments ─────────────────────────────────────────────────────────
  const latePayments = state.payments.filter((p) => p.status === "late");
  if (latePayments.length > 0 && !existing.has("Paiements en retard")) {
    const total = latePayments.reduce((s, p) => s + p.amount, 0);
    const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(total);
    toCreate.push({ type: "alert", title: "Paiements en retard", body: `${latePayments.length} paiement${latePayments.length > 1 ? "s" : ""} en retard (${fmt}) — régularisez au plus vite.` });
  }

  // ── Vendors not contacted ─────────────────────────────────────────────────
  const staleVendors = state.vendors.filter(
    (v) => v.status === "pending" && v.lastContact && daysSince(v.lastContact) > 14
  );
  if (staleVendors.length > 0 && !existing.has("Prestataires à relancer")) {
    const names = staleVendors.slice(0, 2).map((v) => v.name).join(", ");
    toCreate.push({ type: "warning", title: "Prestataires à relancer", body: `${staleVendors.length} prestataire${staleVendors.length > 1 ? "s" : ""} sans contact depuis +14 jours : ${names}${staleVendors.length > 2 ? "…" : ""}.` });
  }

  // ── RSVP reminders ────────────────────────────────────────────────────────
  if (state.guests.length >= 10) {
    const pending = state.guests.filter((g) => g.rsvp === "pending").length;
    const pct = Math.round(pending / state.guests.length * 100);
    if (pct >= 40 && !existing.has("Réponses RSVP en attente")) {
      toCreate.push({ type: "info", title: "Réponses RSVP en attente", body: `${pending} invité${pending > 1 ? "s" : ""} n'ont pas encore répondu (${pct}%). Pensez à leur envoyer un rappel.` });
    }
  }

  // ── Budget overrun ────────────────────────────────────────────────────────
  if (state.budget.length > 0) {
    const totalPlanned = state.budget.reduce((s, p) => s + p.planned, 0);
    const totalSpent   = state.budget.reduce((s, p) => s + p.spent, 0);
    if (totalSpent > totalPlanned && !existing.has("Budget global dépassé")) {
      const over = totalSpent - totalPlanned;
      const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(over);
      toCreate.push({ type: "alert", title: "Budget global dépassé", body: `Les dépenses dépassent le budget prévu de ${fmt}. Révisez vos postes budgétaires.` });
    }
  }

  // ── Checklist milestones ──────────────────────────────────────────────────
  if (state.tasks.length > 5) {
    const pct = Math.round(state.tasks.filter((t) => t.done).length / state.tasks.length * 100);
    if (pct >= 50 && pct < 60 && !existing.has("Checklist à mi-chemin !")) {
      toCreate.push({ type: "success", title: "Checklist à mi-chemin !", body: `${pct}% des tâches sont complètes — vous avancez à merveille ! Continuez ainsi.` });
    } else if (pct >= 80 && pct < 100 && !existing.has("Checklist presque terminée !")) {
      toCreate.push({ type: "success", title: "Checklist presque terminée !", body: `${pct}% des tâches sont complètes — la ligne d'arrivée est en vue !` });
    }
  }

  // ── Late tasks reminder ───────────────────────────────────────────────────
  const lateTasks = state.tasks.filter((t) => !t.done && t.due && daysUntil(t.due) < 0);
  if (lateTasks.length >= 3 && !existing.has("Tâches en retard")) {
    toCreate.push({ type: "warning", title: "Tâches en retard", body: `${lateTasks.length} tâches sont en retard sur votre checklist. Prenez quelques minutes pour les régler.` });
  }

  if (toCreate.length === 0) return;

  const now = new Date().toISOString();
  const supabase = createClient();
  await Promise.all(
    toCreate.map((n) =>
      supabase.from("notifications").insert({
        wedding_id: weddingId,
        type: n.type,
        title: n.title,
        body: n.body,
        time: now,
        read: 0,
      })
    )
  );
}

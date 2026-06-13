"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Empty, Drawer, Field, Select } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { fmt } from "@/lib/format";
import type { Gift } from "@/lib/types";
import { getWeddingId, loadGifts, addGift, updateGift, deleteGift } from "@/lib/db";

// ── Types ──────────────────────────────────────────────────────────────────

type FilterKey = "all" | "pending-thanks" | "received" | "not-received";
type SortKey = "name" | "amount-desc" | "date";

// ── Empty form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  giverName: "",
  item: "",
  amount: "",
  note: "",
  received: false,
  thankYouSent: false,
};

// ── Stat pill ──────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="bg-surface-2 border border-line rounded-card px-4 py-3 flex flex-col gap-0.5 min-w-[110px]">
      <span
        className="text-[22px] font-semibold tracking-tight tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
      <span className="text-[12px] text-text-3">{label}</span>
    </div>
  );
}

// ── PDF export ─────────────────────────────────────────────────────────────

async function exportGiftsPDF(gifts: Gift[]) {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header band
  doc.setFillColor(201, 110, 44); // terracotta --primary
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Liste de cadeaux", 14, 18);

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Exporté le ${today}`, 196, 18, { align: "right" });

  // Table
  autoTable(doc, {
    startY: 36,
    head: [["Donateur", "Cadeau", "Montant", "Reçu", "Merci envoyé", "Note"]],
    body: gifts.map((g) => [
      g.giverName,
      g.item || "—",
      g.amount != null ? fmt.eur(g.amount) : "—",
      g.received ? "Oui" : "Non",
      g.thankYouSent ? "Oui" : "Non",
      g.note || "—",
    ]),
    headStyles: {
      fillColor: [201, 110, 44],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [253, 249, 245] },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 40 },
      2: { cellWidth: 22, halign: "right" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 24, halign: "center" },
      5: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
  });

  // Total footer
  const totalAmount = gifts.reduce((s, g) => s + (g.amount ?? 0), 0);
  const finalY = (doc as any).lastAutoTable.finalY ?? 36;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 40, 20);
  doc.text(
    `Total : ${fmt.eur(totalAmount)}  —  ${gifts.length} cadeau${gifts.length > 1 ? "x" : ""}`,
    196,
    finalY + 8,
    { align: "right" }
  );

  doc.save("cadeaux.pdf");
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [weddingId, setWeddingId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Filter / sort
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("date");

  // ── Load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const wId = getWeddingId();
    if (!wId) {
      setMounted(true);
      return;
    }
    setWeddingId(wId);
    setSyncing(true);
    loadGifts(wId)
      .then(setGifts)
      .finally(() => {
        setSyncing(false);
        setMounted(true);
      });
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────

  const totalAmount = useMemo(
    () => gifts.reduce((s, g) => s + (g.amount ?? 0), 0),
    [gifts]
  );
  const receivedCount = useMemo(() => gifts.filter((g) => g.received).length, [gifts]);
  const pendingThanks = useMemo(
    () => gifts.filter((g) => g.received && !g.thankYouSent).length,
    [gifts]
  );
  const thanksSentCount = useMemo(
    () => gifts.filter((g) => g.thankYouSent).length,
    [gifts]
  );

  // ── Filtered + sorted list ───────────────────────────────────────────────

  const displayed = useMemo(() => {
    let list = [...gifts];

    switch (filter) {
      case "pending-thanks":
        list = list.filter((g) => g.received && !g.thankYouSent);
        break;
      case "received":
        list = list.filter((g) => g.received);
        break;
      case "not-received":
        list = list.filter((g) => !g.received);
        break;
    }

    switch (sort) {
      case "name":
        list.sort((a, b) => a.giverName.localeCompare(b.giverName, "fr"));
        break;
      case "amount-desc":
        list.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
        break;
      case "date":
      default:
        list.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
    }

    return list;
  }, [gifts, filter, sort]);

  // ── Handlers ────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingGift(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(g: Gift) {
    setEditingGift(g);
    setForm({
      giverName: g.giverName,
      item: g.item,
      amount: g.amount != null ? String(g.amount) : "",
      note: g.note,
      received: g.received,
      thankYouSent: g.thankYouSent,
    });
    setDrawerOpen(true);
  }

  async function handleSave() {
    if (!form.giverName.trim() || !weddingId) return;
    setSyncing(true);
    try {
      const payload = {
        giverName: form.giverName.trim(),
        item: form.item.trim(),
        amount: form.amount !== "" ? Number(form.amount) : null,
        note: form.note.trim(),
        received: form.received,
        thankYouSent: form.thankYouSent,
      };

      if (editingGift) {
        await updateGift(editingGift.id, payload);
        setGifts((prev) =>
          prev.map((g) => (g.id === editingGift.id ? { ...g, ...payload } : g))
        );
      } else {
        const created = await addGift(weddingId, payload);
        setGifts((prev) => [...prev, created]);
      }
      setDrawerOpen(false);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: number) {
    setSyncing(true);
    try {
      await deleteGift(id);
      setGifts((prev) => prev.filter((g) => g.id !== id));
    } finally {
      setSyncing(false);
    }
  }

  async function toggleReceived(g: Gift) {
    const newVal = !g.received;
    setGifts((prev) => prev.map((x) => (x.id === g.id ? { ...x, received: newVal } : x)));
    await updateGift(g.id, { received: newVal });
  }

  async function toggleThankYou(g: Gift) {
    const newVal = !g.thankYouSent;
    setGifts((prev) =>
      prev.map((x) => (x.id === g.id ? { ...x, thankYouSent: newVal } : x))
    );
    await updateGift(g.id, { thankYouSent: newVal });
  }

  // ── Guard: not mounted ───────────────────────────────────────────────────

  if (!mounted) return null;

  // ── Guard: no wedding ────────────────────────────────────────────────────

  if (!weddingId) {
    return (
      <div className="p-6 max-w-6xl mx-auto pb-24">
        <PageHead title="Cadeaux" sub="Suivi des cadeaux reçus" />
        <Card className="!p-0 mt-6">
          <Empty icon="gift" title="Aucun mariage sélectionné">
            Sélectionnez un mariage pour gérer les cadeaux.
          </Empty>
        </Card>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const subLine = `${gifts.length} cadeau${gifts.length > 1 ? "x" : ""} · ${fmt.eur(totalAmount)} · ${pendingThanks} remerciement${pendingThanks > 1 ? "s" : ""} en attente`;

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <PageHead
        title="Cadeaux"
        sub={subLine}
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            {syncing && (
              <span className="flex items-center gap-1.5 text-[12px] text-text-3">
                <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Synchronisation…
              </span>
            )}
            {gifts.length > 0 && (
              <Button
                variant="secondary"
                icon="download"
                size="sm"
                onClick={() => exportGiftsPDF(gifts)}
              >
                Exporter PDF
              </Button>
            )}
            <Button variant="primary" icon="plus" onClick={openAdd}>
              Ajouter un cadeau
            </Button>
          </div>
        }
      />

      {/* Stat pills */}
      <div className="flex gap-3 flex-wrap mb-6">
        <StatPill label="Total cadeaux" value={gifts.length} />
        <StatPill label="Reçus" value={receivedCount} accent="var(--sage)" />
        <StatPill
          label="Montant total"
          value={fmt.eur(totalAmount)}
          accent="var(--primary)"
        />
        <StatPill
          label="Remerciements envoyés"
          value={thanksSentCount}
          accent="var(--sage)"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              { key: "all", label: "Tous" },
              { key: "pending-thanks", label: "À remercier" },
              { key: "received", label: "Reçus" },
              { key: "not-received", label: "Non reçus" },
            ] as { key: FilterKey; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition ${
                filter === key
                  ? "bg-primary text-white border-primary"
                  : "bg-surface border-line text-text-2 hover:border-primary/40 hover:text-text"
              }`}
            >
              {label}
              {key === "all" && gifts.length > 0 && (
                <span className="ml-1.5 opacity-70">{gifts.length}</span>
              )}
              {key === "pending-thanks" && pendingThanks > 0 && (
                <span className="ml-1.5 opacity-70">{pendingThanks}</span>
              )}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px] text-text-3">Trier par</span>
          <Select
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: "date", label: "Date" },
              { value: "name", label: "Nom" },
              { value: "amount-desc", label: "Montant" },
            ]}
            className="!h-8 !text-[13px] !py-0 min-w-[120px]"
          />
        </div>
      </div>

      {/* Gift list */}
      {displayed.length === 0 ? (
        <Card className="!p-0">
          {gifts.length === 0 ? (
            <Empty
              icon="gift"
              title="Aucun cadeau enregistré"
              action={
                <Button variant="primary" icon="plus" onClick={openAdd}>
                  Ajouter un cadeau
                </Button>
              }
            >
              Commencez à suivre les cadeaux reçus et les remerciements à envoyer.
            </Empty>
          ) : (
            <Empty icon="search" title="Aucun cadeau dans ce filtre">
              Essayez un autre filtre.
            </Empty>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((g) => (
            <GiftCard
              key={g.id}
              gift={g}
              onEdit={() => openEdit(g)}
              onDelete={() => handleDelete(g.id)}
              onToggleReceived={() => toggleReceived(g)}
              onToggleThankYou={() => toggleThankYou(g)}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <Drawer
          title={editingGift ? "Modifier le cadeau" : "Ajouter un cadeau"}
          onClose={() => setDrawerOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                icon="save"
                onClick={handleSave}
                disabled={!form.giverName.trim() || syncing}
              >
                {editingGift ? "Enregistrer" : "Ajouter"}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Nom du donateur *">
              <input
                className="input"
                value={form.giverName}
                onChange={(e) => setForm((f) => ({ ...f, giverName: e.target.value }))}
                placeholder="Ex : Famille Martin"
                autoFocus
              />
            </Field>

            <Field label="Objet / description du cadeau">
              <input
                className="input"
                value={form.item}
                onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
                placeholder="Ex : Service à café, chèque, bon cadeau…"
              />
            </Field>

            <Field label="Montant (€)" hint="Laisser vide si pas de montant">
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="Ex : 150"
              />
            </Field>

            <Field label="Note">
              <textarea
                className="input !h-auto py-3 leading-relaxed resize-y"
                rows={3}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Remarques, contexte…"
              />
            </Field>

            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.received}
                  onChange={(e) => setForm((f) => ({ ...f, received: e.target.checked }))}
                  className="w-4 h-4 accent-[var(--sage)] cursor-pointer"
                />
                <span className="text-[14px] font-medium text-text group-hover:text-primary transition">
                  Cadeau reçu
                </span>
                {form.received && (
                  <span className="badge bg-sage-soft text-sage ml-auto">Reçu</span>
                )}
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.thankYouSent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, thankYouSent: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[var(--sage)] cursor-pointer"
                />
                <span className="text-[14px] font-medium text-text group-hover:text-primary transition">
                  Remerciement envoyé
                </span>
                {form.thankYouSent && (
                  <span className="badge bg-sage-soft text-sage ml-auto">Envoyé</span>
                )}
              </label>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}

// ── GiftCard ───────────────────────────────────────────────────────────────

function GiftCard({
  gift,
  onEdit,
  onDelete,
  onToggleReceived,
  onToggleThankYou,
}: {
  gift: Gift;
  onEdit: () => void;
  onDelete: () => void;
  onToggleReceived: () => void;
  onToggleThankYou: () => void;
}) {
  return (
    <Card className="!p-4 flex flex-col gap-3 group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-text truncate">
            {gift.giverName}
          </div>
          {gift.item && (
            <div className="text-[13px] text-text-2 mt-0.5 truncate">{gift.item}</div>
          )}
        </div>
        {gift.amount != null && (
          <span className="text-[14px] font-semibold text-primary shrink-0">
            {fmt.eur(gift.amount)}
          </span>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {gift.received ? (
          <Badge tone="sage" icon="check">
            Reçu
          </Badge>
        ) : (
          <Badge tone="neutral" icon="clock">
            Non reçu
          </Badge>
        )}
        {gift.thankYouSent ? (
          <Badge tone="sage" icon="mail">
            Merci envoyé
          </Badge>
        ) : (
          <Badge tone="coral" icon="mail">
            À remercier
          </Badge>
        )}
      </div>

      {/* Note */}
      {gift.note && (
        <p className="text-[12.5px] text-text-3 leading-relaxed line-clamp-2">
          {gift.note}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1 mt-auto pt-1 border-t border-line opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          title={gift.received ? "Marquer non reçu" : "Marquer reçu"}
          onClick={onToggleReceived}
          className={`icon-btn w-8 h-8 ${gift.received ? "text-sage" : "text-text-3"}`}
        >
          <Icon name="check" size={16} />
        </button>
        <button
          title={gift.thankYouSent ? "Retirer remerciement" : "Marquer merci envoyé"}
          onClick={onToggleThankYou}
          className={`icon-btn w-8 h-8 ${gift.thankYouSent ? "text-sage" : "text-text-3"}`}
        >
          <Icon name="mail" size={16} />
        </button>
        <button
          title="Modifier"
          onClick={onEdit}
          className="icon-btn w-8 h-8 ml-auto"
        >
          <Icon name="edit" size={16} />
        </button>
        <button
          title="Supprimer"
          onClick={onDelete}
          className="icon-btn w-8 h-8 text-coral hover:bg-coral-soft"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </Card>
  );
}

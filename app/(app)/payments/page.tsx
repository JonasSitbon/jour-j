"use client";

import { useState, useMemo } from "react";
import { useStore, useToast } from "@/components/providers";
import { fmt } from "@/lib/format";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Select, Segmented, Drawer, Field, Input, Empty, Tabs } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { PageTutorial } from "@/components/tutorial";
import type { Payment } from "@/lib/types";
import { createClient } from "@/lib/supabase";
import { getWeddingId } from "@/lib/db";

const PSTATUS: Record<string, { label: string; tone: any; ico: string; m: string }> = {
  paid:     { label: "Payé",       tone: "sage",    ico: "check",  m: "bg-sage-soft text-sage" },
  upcoming: { label: "À venir",    tone: "primary", ico: "clock",  m: "bg-primary-soft text-primary-700" },
  late:     { label: "En retard",  tone: "coral",   ico: "alert",  m: "bg-coral-soft text-coral" },
  partial:  { label: "Partiel",    tone: "amber",   ico: "card",   m: "bg-amber-soft text-[var(--gold-ink)]" },
};
const METHODS: Record<string, { label: string; icon: string }> = {
  virement: { label: "Virement", icon: "card" }, cheque: { label: "Chèque", icon: "file" },
  cash: { label: "Espèces", icon: "wallet" }, carte: { label: "Carte", icon: "card" },
};
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MAIN_TABS = [
  { id: "list", label: "Liste" },
  { id: "calendar", label: "Calendrier" },
];

function PaymentDetailDrawer({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const { state, update } = useStore();
  const toast = useToast();
  const who = payment.who === "A" ? state.wedding.partnerA : payment.who === "B" ? state.wedding.partnerB : String(payment.who);
  const markPaid = () => {
    update("payments", (l) => l.map((p) => p.id === payment.id ? { ...p, status: "paid", paidDate: new Date().toISOString().split("T")[0] } : p));
    toast("Paiement marqué comme payé");
    onClose();
  };
  const rows: [string, string][] = [
    ["Prestataire", payment.vendor], ["Montant", fmt.eur(payment.amount)],
    ["Échéance prévue", fmt.date(payment.due)], ["Date réelle", payment.paidDate ? fmt.date(payment.paidDate) : "—"],
    ["Réglé par", who], ["Moyen", METHODS[payment.method].label],
  ];
  return (
    <Drawer title={payment.label} onClose={onClose}
      footer={<>
        {payment.status !== "paid" && <Button variant="primary" block icon="check" onClick={markPaid}>Marquer comme payé</Button>}
        {payment.status === "paid" && <Button variant="ghost" block onClick={onClose}>Fermer</Button>}
      </>}>
      <div className="flex items-center justify-between mb-[18px]">
        <Badge tone={PSTATUS[payment.status].tone} dot>{PSTATUS[payment.status].label}</Badge>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-text-2"><Icon name={METHODS[payment.method].icon} size={14} />{METHODS[payment.method].label}</span>
      </div>
      {rows.map(([k, v]) => <div key={k} className="flex items-center justify-between py-3 border-b border-line last:border-0"><span className="text-text-2 text-[13.5px]">{k}</span><span className="font-medium text-sm">{v}</span></div>)}
    </Drawer>
  );
}

function NewPaymentDrawer({ onClose }: { onClose: () => void }) {
  const { state, update } = useStore();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const A = state.wedding.partnerA, B = state.wedding.partnerB;
  const [form, setForm] = useState({ vendor: "", label: "", amount: "", due: "", who: "A", method: "virement", status: "upcoming" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.vendor.trim()) { toast("Le prestataire est obligatoire", "err"); return; }
    if (!form.label.trim()) { toast("Le libellé est obligatoire", "err"); return; }
    if (!form.amount || isNaN(parseFloat(form.amount))) { toast("Le montant est obligatoire", "err"); return; }
    if (!form.due) { toast("La date d'échéance est obligatoire", "err"); return; }
    setSaving(true);
    const wId = getWeddingId();
    const newPayment: Payment = {
      id: Date.now(), vendor: form.vendor.trim(), label: form.label.trim(),
      amount: parseFloat(form.amount), due: form.due, paidDate: null,
      who: form.who as any, method: form.method as any, status: form.status as any, receipt: 0,
    };
    if (wId) {
      await createClient().from("payments").insert({ ...newPayment, paid_date: null, wedding_id: wId });
    }
    update("payments", (l) => [...l, newPayment]);
    toast("Paiement ajouté");
    setSaving(false);
    onClose();
  };

  return (
    <Drawer title="Nouveau paiement" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><div className="flex-1" /><Button variant="primary" icon="check" onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Ajouter"}</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Field label="Prestataire *"><Input value={form.vendor} onChange={set("vendor")} placeholder="Ex : Domaine des Tilleuls" /></Field>
          <Field label="Libellé *"><Input value={form.label} onChange={set("label")} placeholder="Ex : Acompte 30%" /></Field>
        </div>
        <div className="flex gap-3">
          <Field label="Montant (€) *"><Input type="number" value={form.amount} onChange={set("amount")} placeholder="0" min="0" /></Field>
          <Field label="Date d'échéance *"><Input type="date" value={form.due} onChange={set("due")} /></Field>
        </div>
        <div className="flex gap-3">
          <Field label="Réglé par">
            <Select value={form.who} onChange={(v) => setForm((f) => ({ ...f, who: v }))} options={[{ value: "A", label: A }, { value: "B", label: B }]} />
          </Field>
          <Field label="Moyen de paiement">
            <Select value={form.method} onChange={(v) => setForm((f) => ({ ...f, method: v }))} options={Object.entries(METHODS).map(([k, x]) => ({ value: k, label: x.label }))} />
          </Field>
        </div>
        <Field label="Statut">
          <Select value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} options={Object.entries(PSTATUS).map(([k, x]) => ({ value: k, label: x.label }))} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ─── Calendar view helpers ─────────────────────────────────────────────── */

function CashFlowBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-[6px] rounded-full overflow-hidden bg-surface-3 flex">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "var(--sage)" }}
        />
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${100 - pct}%`, background: pct === 100 ? "transparent" : "var(--primary)" }}
        />
      </div>
      <span className="text-[11px] text-text-3 font-mono shrink-0">{pct}%</span>
    </div>
  );
}

function CalendarView({ payments, onView }: { payments: Payment[]; onView: (p: Payment) => void }) {
  const { state } = useStore();
  const [expandedPast, setExpandedPast] = useState<Record<string, boolean>>({});

  const todayKey = (() => {
    const now = new Date();
    return now.getFullYear() + "-" + now.getMonth();
  })();

  const calGroups = useMemo(() => {
    const g: Record<string, { key: string; label: string; year: number; month: number; items: Payment[]; paidTotal: number; total: number }> = {};
    const sorted = [...payments].sort((a, b) => a.due.localeCompare(b.due));
    sorted.forEach((p) => {
      const d = new Date(p.due + "T00:00:00");
      const k = d.getFullYear() + "-" + d.getMonth();
      if (!g[k]) g[k] = { key: k, label: MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), items: [], paidTotal: 0, total: 0 };
      g[k].items.push(p);
      g[k].total += p.amount;
      if (p.status === "paid") g[k].paidTotal += p.amount;
    });
    return Object.values(g).sort((a, b) => a.key.localeCompare(b.key));
  }, [payments]);

  const remaining = useMemo(() =>
    payments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  if (calGroups.length === 0) {
    return (
      <Card>
        <Empty icon="clock" title="Aucun paiement planifié">
          Ajoutez des paiements pour visualiser votre calendrier.
        </Empty>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {calGroups.map((grp) => {
        const isCurrent = grp.key === todayKey;
        const isPast = grp.key < todayKey;
        const allPaid = grp.items.every((p) => p.status === "paid");
        const isCollapsed = isPast && allPaid && !expandedPast[grp.key];

        return (
          <div key={grp.key} className={`rounded-xl border transition-all ${isCurrent ? "border-primary/30 shadow-sm" : "border-line"} ${isPast && allPaid ? "opacity-70" : ""}`}>
            {/* Month header */}
            <button
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${isCollapsed ? "rounded-xl" : "rounded-t-xl"} ${isCurrent ? "bg-primary-soft/40" : isPast && allPaid ? "bg-surface-2" : "bg-surface"} transition hover:bg-hover`}
              onClick={() => {
                if (isPast && allPaid) setExpandedPast((s) => ({ ...s, [grp.key]: !s[grp.key] }));
              }}
              style={{ cursor: isPast && allPaid ? "pointer" : "default" }}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[15px]">{grp.label}</span>
                  <span className="text-text-3 text-sm">{grp.year}</span>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary text-white">
                      Ce mois-ci
                    </span>
                  )}
                  {isPast && allPaid && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-sage-soft text-sage">
                      <Icon name="check" size={10} /> Tout réglé
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <CashFlowBar paid={grp.paidTotal} total={grp.total} />
                  <span className="text-[12.5px] text-text-2 font-mono shrink-0">{fmt.eur(grp.total)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] text-text-3">{grp.items.length} paiement{grp.items.length > 1 ? "s" : ""}</span>
                {isPast && allPaid && (
                  <Icon name={isCollapsed ? "chevron-down" : "chevron-up"} size={15} className="text-text-3" />
                )}
              </div>
            </button>

            {/* Payment rows */}
            {!isCollapsed && (
              <div className="px-3 pb-3 pt-1 flex flex-col gap-2">
                {grp.items.map((p) => {
                  const st = PSTATUS[p.status];
                  const who = p.who === "A" ? state.wedding.partnerA : p.who === "B" ? state.wedding.partnerB : String(p.who);
                  return (
                    <div
                      key={p.id}
                      onClick={() => onView(p)}
                      className="flex items-center gap-3 px-3.5 py-3 bg-surface border border-line rounded-lg hover:border-line-strong hover:shadow-xs transition cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${st.m}`}>
                        <Icon name={st.ico} size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-tight">{p.label}</div>
                        <div className="text-[12px] text-text-2 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{p.vendor}</span>
                          <span className="text-text-3">·</span>
                          <span>{fmt.dateShort(p.due)}</span>
                          <span className="text-text-3">·</span>
                          <span>{who}</span>
                          {p.receipt ? (
                            <>
                              <span className="text-text-3">·</span>
                              <span className="inline-flex items-center gap-0.5 text-sage"><Icon name="receipt" size={11} />Justif.</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono text-[15px] font-semibold">{fmt.eur(p.amount)}</span>
                        <Badge tone={st.tone} dot>{st.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Remaining summary */}
      {remaining > 0 && (
        <div className="mt-3 px-4 py-3.5 rounded-xl border border-dashed border-primary/40 bg-primary-soft/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13.5px] font-medium text-primary-700">
            <Icon name="wallet" size={16} />
            Total restant à payer
          </div>
          <span className="font-mono text-[17px] font-semibold text-primary-700">{fmt.eur(remaining)}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Stats bar ──────────────────────────────────────────────────────────── */

function StatsBar({ payments }: { payments: Payment[] }) {
  const stats = useMemo(() => {
    const paidPayments = payments.filter((p) => p.status === "paid");
    const upcomingPayments = payments.filter((p) => p.status === "upcoming");
    const latePayments = payments.filter((p) => p.status === "late");

    const totalPaid = paidPayments.reduce((s, p) => s + p.amount, 0);
    const totalUpcoming = upcomingPayments.reduce((s, p) => s + p.amount, 0);
    const totalLate = latePayments.reduce((s, p) => s + p.amount, 0);
    const totalAll = payments.reduce((s, p) => s + p.amount, 0);

    return { totalPaid, totalUpcoming, totalLate, totalAll, upcomingCount: upcomingPayments.length, lateCount: latePayments.length };
  }, [payments]);

  const tiles: { label: string; value: string; sub: string; icon: string; color: string; bg: string; ring: string }[] = [
    {
      label: "Total versé",
      value: fmt.eur(stats.totalPaid),
      sub: `${payments.filter((p) => p.status === "paid").length} paiement${payments.filter((p) => p.status === "paid").length !== 1 ? "s" : ""} effectué${payments.filter((p) => p.status === "paid").length !== 1 ? "s" : ""}`,
      icon: "check",
      color: "text-sage",
      bg: "bg-sage-soft",
      ring: "ring-sage/20",
    },
    {
      label: "À venir",
      value: fmt.eur(stats.totalUpcoming),
      sub: stats.upcomingCount > 0 ? `${stats.upcomingCount} échéance${stats.upcomingCount > 1 ? "s" : ""} à venir` : "Aucune échéance",
      icon: "clock",
      color: "text-primary-700",
      bg: "bg-primary-soft",
      ring: "ring-primary/20",
    },
    {
      label: "En retard",
      value: fmt.eur(stats.totalLate),
      sub: stats.lateCount > 0 ? `${stats.lateCount} paiement${stats.lateCount > 1 ? "s" : ""} en retard` : "Aucun retard",
      icon: "alert",
      color: stats.lateCount > 0 ? "text-coral" : "text-text-2",
      bg: stats.lateCount > 0 ? "bg-coral-soft" : "bg-surface-2",
      ring: stats.lateCount > 0 ? "ring-coral/20" : "ring-line",
    },
    {
      label: "Budget total engagé",
      value: fmt.eur(stats.totalAll),
      sub: `${payments.length} paiement${payments.length !== 1 ? "s" : ""} au total`,
      icon: "wallet",
      color: "text-text-2",
      bg: "bg-surface-2",
      ring: "ring-line",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`flex items-start gap-3 px-4 py-4 rounded-xl border bg-surface ring-1 ${t.ring} transition`}
        >
          <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${t.bg}`}>
            <Icon name={t.icon} size={17} className={t.color} />
          </div>
          <div className="min-w-0">
            <div className={`font-mono text-[18px] font-semibold leading-tight ${t.color}`}>{t.value}</div>
            <div className="text-[11.5px] text-text-3 mt-0.5 font-medium">{t.label}</div>
            <div className="text-[11px] text-text-3 mt-0.5">{t.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function PaymentsPage() {
  const { state } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("list");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [viewing, setViewing] = useState<Payment | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = state.payments.filter((p) => (method === "all" || p.method === method) && (status === "all" || p.status === status)).slice().sort((a, b) => a.due.localeCompare(b.due));
  const byMonth = useMemo(() => {
    const g: Record<string, { label: string; items: Payment[] }> = {};
    filtered.forEach((p) => { const d = new Date(p.due + "T00:00:00"); const k = d.getFullYear() + "-" + d.getMonth(); (g[k] = g[k] || { label: MONTHS[d.getMonth()] + " " + d.getFullYear(), items: [] }).items.push(p); });
    return g;
  }, [filtered]);

  const paid = useMemo(() => state.payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0), [state.payments]);
  const due = useMemo(() => state.payments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0), [state.payments]);
  const cash = state.payments.filter((p) => p.method === "cash");
  const cashTotal = cash.reduce((s, p) => s + p.amount, 0);
  const vendors: Record<string, { paid: number; due: number }> = {};
  state.payments.forEach((p) => { vendors[p.vendor] = vendors[p.vendor] || { paid: 0, due: 0 }; if (p.status === "paid") vendors[p.vendor].paid += p.amount; else vendors[p.vendor].due += p.amount; });

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">
      <PageHead title="Suivi des paiements" sub={`${fmt.eur(paid)} réglés · ${fmt.eur(due)} à venir`}
        actions={<>
          <Button variant="secondary" icon="download" onClick={() => toast("Export comptable — fonctionnalité à venir")}>Export comptable</Button>
          <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Paiement</Button>
        </>} />

      <PageTutorial pageId="payments" title="Comment suivre vos paiements ?"
        steps={[
          { icon: "card", title: "Ajoutez les échéances", desc: "Créez une ligne par versement (acompte, solde) avec la date d'échéance et le prestataire concerné." },
          { icon: "clock", title: "Alertes automatiques", desc: "Les paiements en retard ou proches de l'échéance apparaissent en rouge sur le dashboard." },
          { icon: "receipt", title: "Marquez comme payé", desc: "Changez le statut en Payé et notez la date effective pour un suivi comptable précis." },
        ]} />

      {/* ─── Stats bar ─── */}
      <StatsBar payments={state.payments} />

      {/* ─── Tabs ─── */}
      <div className="mb-5">
        <Tabs tabs={MAIN_TABS} value={tab} onChange={setTab} />
      </div>

      {/* ─── List tab ─── */}
      {tab === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-4">
              <Segmented value={status} onChange={setStatus} options={[{ value: "all", label: "Tous" }, ...Object.entries(PSTATUS).map(([k, x]) => ({ value: k, label: x.label }))]} />
              <div className="flex-1" />
              <Select value={method} onChange={setMethod} options={[{ value: "all", label: "Tous moyens" }, ...Object.entries(METHODS).map(([k, x]) => ({ value: k, label: x.label }))]} className="w-40" />
            </div>
            {filtered.length === 0 ? (
              <Card>
                {state.payments.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center">
                      <Icon name="card" size={26} className="text-primary-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg mb-1">Aucun paiement enregistré</div>
                      <p className="text-text-2 text-[14px] max-w-sm">Centralisez ici toutes les échéances de vos prestataires : acomptes, soldes, remboursements…</p>
                    </div>
                    <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Ajouter un paiement</Button>
                    {state.vendors.filter((v) => v.status === "signed").length > 0 && (
                      <div className="flex flex-col gap-2 w-full max-w-[300px]">
                        <div className="text-[12px] text-text-3 font-semibold uppercase tracking-wide">Prestataires signés à régler</div>
                        {state.vendors.filter((v) => v.status === "signed").slice(0, 3).map((v) => (
                          <button key={v.id} onClick={() => setAdding(true)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-md border border-dashed border-line hover:bg-hover hover:border-line-strong transition text-left">
                            <Icon name="file" size={15} className="text-text-3 shrink-0" />
                            <span className="text-[13px] font-medium flex-1">{v.name}</span>
                            <span className="font-mono text-[12px] text-text-2">{fmt.eur(v.total)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Empty icon="card" title="Aucun résultat">Modifiez vos filtres pour afficher d&apos;autres paiements.</Empty>
                )}
              </Card>
            ) : (
              <div>
                {Object.values(byMonth).map((grp) => (
                  <div key={grp.label}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-text-3 mt-5 first:mt-0 mb-3 pl-1">{grp.label}</div>
                    {grp.items.map((p) => {
                      const st = PSTATUS[p.status]; const who = p.who === "A" ? state.wedding.partnerA : p.who === "B" ? state.wedding.partnerB : String(p.who);
                      return (
                        <div key={p.id} onClick={() => setViewing(p)} className="flex items-center gap-4 px-4 py-3.5 border border-line rounded-md mb-2.5 hover:border-line-strong hover:shadow-xs transition cursor-pointer">
                          <div className={`w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0 ${st.m}`}><Icon name={st.ico} size={18} /></div>
                          <div className="min-w-0"><div className="text-sm font-semibold">{p.label}</div><div className="text-[12.5px] text-text-2 mt-0.5">{p.vendor} · {fmt.dateShort(p.due)} · {who}</div></div>
                          <div className="ml-auto text-right"><div className="font-mono text-base font-semibold">{fmt.eur(p.amount)}</div><div className="inline-flex items-center gap-1.5 text-[11.5px] text-text-2 mt-0.5"><Icon name={METHODS[p.method].icon} size={13} />{METHODS[p.method].label}</div></div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <Card style={{ background: "var(--gold-soft)", borderColor: "transparent" }}>
              <div className="sec-title mb-3"><Icon name="wallet" size={16} />Paiements en espèces</div>
              <div className="font-mono text-[28px] font-semibold text-[var(--gold-ink)]">{fmt.eur(cashTotal)}</div>
              <div className="text-text-2 text-[12.5px] mb-3">{cash.length} paiement{cash.length > 1 ? "s" : ""} à prévoir en liquide</div>
              {cash.map((p) => <div key={p.id} className="flex items-center justify-between text-[13px] py-1.5"><span>{p.vendor}</span><span className="font-mono">{fmt.eur(p.amount)}</span></div>)}
            </Card>
            <Card>
              <div className="sec-title mb-3.5"><Icon name="file" size={16} className="text-text-3" />Solde par prestataire</div>
              {Object.keys(vendors).length === 0 ? (
                <p className="text-text-3 text-[13px] text-center py-4">Aucun paiement enregistré</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(vendors).map(([name, v]) => (
                    <div key={name}>
                      <div className="flex items-center justify-between text-[13.5px] mb-1.5"><span className="font-medium">{name}</span><span className="font-mono text-text-2">{v.due > 0 ? "Reste " + fmt.eur(v.due) : "Soldé"}</span></div>
                      <div className="progress-track h-[5px]"><span className="block h-full rounded-full bg-sage" style={{ width: `${(v.paid / (v.paid + v.due) * 100) || 0}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ─── Calendar tab ─── */}
      {tab === "calendar" && (
        <CalendarView payments={state.payments} onView={setViewing} />
      )}

      {viewing && <PaymentDetailDrawer payment={viewing} onClose={() => setViewing(null)} />}
      {adding && <NewPaymentDrawer onClose={() => setAdding(false)} />}
    </div>
  );
}

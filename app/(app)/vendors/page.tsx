"use client";

import { useState, useMemo, useCallback } from "react";
import { useStore, useToast } from "@/components/providers";
import { fmt } from "@/lib/format";
import { Icon } from "@/components/icon";
import Link from "next/link";
import { Card, Badge, Button, Modal, Drawer, Empty, Field, Input, Select, Textarea } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { PageTutorial } from "@/components/tutorial";
import type { Vendor } from "@/lib/types";
import { createClient } from "@/lib/supabase";
import { getWeddingId } from "@/lib/db";
import { ScrollReveal } from "@/components/scroll-reveal";
import { exportVendorsPDF } from "@/lib/pdf-vendors";

const STATUS: Record<string, { label: string; tone: any }> = {
  signed: { label: "Signé", tone: "sage" }, pending: { label: "En attente", tone: "amber" }, declined: { label: "Refusé", tone: "coral" },
};
const CRITERIA = [
  { id: "prix", label: "Prix", icon: "wallet" }, { id: "qualite", label: "Qualité perçue", icon: "sparkle" },
  { id: "reactivite", label: "Réactivité", icon: "clock" }, { id: "references", label: "Références", icon: "star" },
  { id: "flexibilite", label: "Flexibilité", icon: "heart" },
] as const;
const SCORE_CLS: Record<string, string> = { A: "bg-sage-soft text-sage", B: "bg-amber-soft text-[var(--gold-ink)]", C: "bg-coral-soft text-coral" };
const daysSince = (iso: string) => fmt.daysUntil(iso) * -1;
function daysSinceContact(lastContact: string): number {
  if (!lastContact) return 999;
  return Math.floor((Date.now() - new Date(lastContact).getTime()) / 86400000);
}
function avgScore(scores: Record<string, number>): number {
  const vals = Object.values(scores).filter((v) => v > 0);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── Vendor type picker data ──────────────────────────────────────────────────

const VENDOR_TYPES = [
  { cat: "Lieu / Salle",           catId: "salle",     emoji: "🏛",  range: "3 000 – 15 000 €", docs: ["Contrat de location", "Devis détaillé", "Assurance annulation"],          tip: "Vérifiez la capacité, le parking et les horaires autorisés." },
  { cat: "Traiteur",               catId: "traiteur",  emoji: "🍽",  range: "8 000 – 25 000 €", docs: ["Menu détaillé", "Conditions d'annulation", "Attestation hygiène"],          tip: "Demandez une dégustation avant de signer." },
  { cat: "Photographe",            catId: "photo",     emoji: "📷",  range: "2 000 – 6 000 €",  docs: ["Contrat prestation", "Droits à l'image", "Livraison album"],                tip: "Regardez 2-3 reportages complets, pas juste les highlights." },
  { cat: "Vidéaste",               catId: "video",     emoji: "🎬",  range: "1 500 – 5 000 €",  docs: ["Contrat prestation", "Droits à l'image"],                                   tip: "Demandez un exemple de film complet (pas de teaser)." },
  { cat: "Fleuriste",              catId: "fleurs",    emoji: "🌸",  range: "1 500 – 5 000 €",  docs: ["Devis fleurs", "Book créations"],                                            tip: "Précisez les fleurs de saison pour réduire les coûts." },
  { cat: "DJ / Animation",         catId: "dj",        emoji: "🎵",  range: "800 – 3 000 €",    docs: ["Contrat prestation", "Liste matériel"],                                      tip: "Testez son mix et discutez de vos morceaux incontournables." },
  { cat: "Groupe / Orchestre",     catId: "dj",        emoji: "🎷",  range: "1 500 – 6 000 €",  docs: ["Contrat prestation", "Setlist"],                                             tip: "Précisez la durée des sets et les pauses." },
  { cat: "Officiant / Célébrant",  catId: "officiant", emoji: "💍",  range: "500 – 1 500 €",    docs: ["Dossier cérémonie"],                                                         tip: "Rencontrez-le en personne pour vérifier le feeling." },
  { cat: "Wedding Planner",        catId: "divers",    emoji: "📋",  range: "1 500 – 6 000 €",  docs: ["Contrat de coordination", "Planning J"],                                     tip: "Clarifiez exactement ce qui est inclus (J-only ou full)." },
  { cat: "Transport",              catId: "voiture",   emoji: "🚗",  range: "300 – 1 500 €",    docs: ["Contrat transport", "Assurance"],                                             tip: "Réservez 6-12 mois avant pour les voitures de prestige." },
  { cat: "Coiffure & Maquillage",  catId: "beaute",    emoji: "💄",  range: "300 – 1 200 €",    docs: ["Devis prestation", "Test J-2 mois"],                                         tip: "Planifiez un essai 2 mois avant — obligatoire." },
  { cat: "Pâtissier / Gâteau",     catId: "gateau",    emoji: "🎂",  range: "300 – 1 500 €",    docs: ["Devis gâteau", "Dégustation"],                                               tip: "Réservez dès que possible, les bons pâtissiers sont vite complets." },
  { cat: "Faire-part & Papeterie", catId: "fairepart", emoji: "💌",  range: "300 – 1 000 €",    docs: ["Bon à tirer", "Devis impression"],                                           tip: "Envoyez les save-the-dates 12 mois avant, les invitations 3 mois avant." },
  { cat: "Autre",                  catId: null,        emoji: "⚡",  range: "",                  docs: ["Devis"],                                                                      tip: "" },
] as const;

type VendorTypeItem = typeof VENDOR_TYPES[number];

// ─── Score star badge ─────────────────────────────────────────────────────────

function ScoreStarBadge({ score }: { score: number }) {
  const cls =
    score >= 4
      ? "bg-sage-soft text-sage"
      : score >= 3
      ? "bg-amber-soft text-[var(--gold-ink)]"
      : "bg-coral-soft text-coral";
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${cls}`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      {score.toFixed(1)}
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return <span className="inline-flex gap-0.5 text-gold">{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={13} strokeWidth={i <= n ? 0 : 1.6} className={i <= n ? "fill-gold" : ""} />)}</span>;
}

// ─── Comparator ───────────────────────────────────────────────────────────────

function Comparator({ vendors, label, onClose }: { vendors: Vendor[]; label: string; onClose: () => void }) {
  const [weights, setWeights] = useState<Record<string, number>>({ prix: 3, qualite: 3, reactivite: 2, references: 2, flexibilite: 1 });
  const totalW = Object.values(weights).reduce((s, v) => s + v, 0);
  const scored = vendors.map((v) => ({ ...v, weighted: CRITERIA.reduce((s, c) => s + (v.scores as any)[c.id] * weights[c.id], 0) / totalW }));
  const best = scored.reduce((a, b) => b.weighted > a.weighted ? b : a, scored[0]);
  return (
    <Modal title={`Comparateur — ${label}`} lg onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Fermer</Button>}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead><tr className="[&>th]:px-3.5 [&>th]:py-3 [&>th]:text-left [&>th]:border-b [&>th]:border-line [&>th]:text-[11.5px] [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-text-3 [&>th]:font-semibold">
            <th>Critère</th><th className="w-[70px]">Poids</th>{scored.map((v) => <th key={v.id}>{v.name}</th>)}
          </tr></thead>
          <tbody className="[&>tr>td]:px-3.5 [&>tr>td]:py-3 [&>tr>td]:border-b [&>tr>td]:border-line">
            {CRITERIA.map((c) => (
              <tr key={c.id}>
                <td className="text-text-2 font-medium"><span className="flex items-center gap-2"><Icon name={c.icon} size={15} className="text-text-3" />{c.label}</span></td>
                <td><input type="range" min={0} max={5} value={weights[c.id]} onChange={(e) => setWeights((w) => ({ ...w, [c.id]: +e.target.value }))} className="w-[60px] accent-primary" /> <span className="font-mono text-xs">{weights[c.id]}</span></td>
                {scored.map((v) => <td key={v.id}><Stars n={(v.scores as any)[c.id]} /></td>)}
              </tr>
            ))}
            <tr><td className="font-semibold">Prix total</td><td /> {scored.map((v) => <td key={v.id} className="font-mono font-semibold">{fmt.eur(v.total)}</td>)}</tr>
            <tr className="bg-surface-2"><td className="font-semibold">Score pondéré</td><td />{scored.map((v) => (
              <td key={v.id}><span className="flex items-center gap-2"><b className={`font-mono text-base ${v.id === best.id ? "text-primary" : ""}`}>{v.weighted.toFixed(1)}</b>{v.id === best.id && <Badge tone="primary" icon="check">Recommandé</Badge>}</span></td>
            ))}</tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ─── Vendor detail drawer ─────────────────────────────────────────────────────

function VendorDetailDrawer({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const { state, update } = useStore();
  const toast = useToast();
  const setStatus = (status: any) => { update("vendors", (l) => l.map((v) => v.id === vendor.id ? { ...v, status } : v)); toast("Statut mis à jour"); onClose(); };
  const remove = () => { update("vendors", (l) => l.filter((v) => v.id !== vendor.id)); toast("Devis supprimé"); onClose(); };
  return (
    <Drawer title={vendor.name} onClose={onClose}
      footer={<>
        <Button variant="danger" icon="trash" onClick={remove}>Supprimer</Button>
        <div className="flex-1" />
        {vendor.status !== "signed" && <Button variant="ghost" onClick={() => setStatus("declined")}>Refuser</Button>}
        {vendor.status !== "signed" && <Button variant="primary" icon="check" onClick={() => setStatus("signed")}>Marquer signé</Button>}
        {vendor.status === "signed" && (
          <Link href="/payments"><Button variant="secondary" icon="card">Ajouter paiement</Button></Link>
        )}
        {vendor.status === "signed" && <Button variant="ghost" onClick={onClose}>Fermer</Button>}
      </>}>
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-center justify-between">
          <div className={`w-[38px] h-[38px] rounded-[11px] flex items-center justify-center font-mono font-bold text-[17px] ${SCORE_CLS[vendor.score]}`}>{vendor.score}</div>
          <Badge tone={STATUS[vendor.status].tone} dot>{STATUS[vendor.status].label}</Badge>
        </div>
        <div className="font-mono text-[22px] font-semibold tracking-[-.02em]">{fmt.eur(vendor.total)}</div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 text-[13.5px]"><Icon name="user" size={16} className="text-text-3" />{vendor.contact || "—"}</div>
          <div className="flex items-center gap-2.5 text-[13.5px]"><Icon name="phone" size={16} className="text-text-3" />{vendor.phone || "—"}</div>
          <div className="flex items-center gap-2.5 text-[13.5px]"><Icon name="mail" size={16} className="text-text-3" />{vendor.email || "—"}</div>
          {vendor.email && (
            <a
              href={`mailto:${vendor.email}?subject=Mariage de ${state.wedding.partnerA} et ${state.wedding.partnerB}&body=Bonjour,`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm flex items-center gap-2 w-fit"
            >
              <Icon name="mail" size={14} />
              Envoyer un email
            </a>
          )}
        </div>
        {vendor.included && <div><div className="field-label mb-1.5">Prestations incluses</div><div className="text-[12.5px] text-text-2 leading-relaxed">{vendor.included}</div></div>}
        <div><div className="field-label mb-2">Évaluation</div><div className="flex flex-col gap-1.5">{CRITERIA.map((c) => <div key={c.id} className="flex items-center justify-between text-[13px]"><span className="text-text-2">{c.label}</span><Stars n={(vendor.scores as any)[c.id]} /></div>)}</div></div>
      </div>
    </Drawer>
  );
}

// ─── Vendor type picker modal (step 1) ────────────────────────────────────────

function VendorTypePicker({
  onPick,
  onClose,
}: {
  onPick: (item: VendorTypeItem) => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="w-full max-w-[720px] max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--line)" }}
        >
          <div>
            <div className="font-semibold text-[16px]">Quel type de prestataire ?</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: "var(--text-3)" }}>
              Choisissez une catégorie pour pré-remplir le formulaire
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-70"
            style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {VENDOR_TYPES.map((item) => {
              const isHovered = hovered === item.cat;
              return (
                <div key={item.cat} className="relative group">
                  <button
                    onClick={() => onPick(item)}
                    onMouseEnter={() => setHovered(item.cat)}
                    onMouseLeave={() => setHovered(null)}
                    className="w-full flex flex-col items-center gap-2 px-3 py-4 rounded-xl border text-center transition-all"
                    style={{
                      background: isHovered ? "var(--bg)" : "var(--surface-2, var(--bg))",
                      borderColor: isHovered ? "var(--primary)" : "var(--line)",
                      transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                      boxShadow: isHovered
                        ? "0 6px 20px rgba(0,0,0,0.10)"
                        : "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <span style={{ fontSize: 32, lineHeight: 1 }}>{item.emoji}</span>
                    <span className="text-[13px] font-semibold leading-snug" style={{ color: "var(--text)" }}>
                      {item.cat}
                    </span>
                    {item.range && (
                      <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                        {item.range}
                      </span>
                    )}
                  </button>

                  {/* Tooltip */}
                  {item.tip && isHovered && (
                    <div
                      className="absolute bottom-full left-1/2 mb-2 z-10 pointer-events-none"
                      style={{ transform: "translateX(-50%)", width: 200 }}
                    >
                      <div
                        className="px-3 py-2 rounded-lg text-[11.5px] leading-snug text-center"
                        style={{
                          background: "var(--text)",
                          color: "var(--bg)",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                        }}
                      >
                        {item.tip}
                      </div>
                      <div
                        className="mx-auto mt-[-1px]"
                        style={{
                          width: 8,
                          height: 4,
                          background: "var(--text)",
                          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New vendor drawer (step 2 — form) ───────────────────────────────────────

function NewVendorDrawer({
  pickedType,
  onBack,
  onClose,
}: {
  pickedType: VendorTypeItem | null;
  onBack: () => void;
  onClose: () => void;
}) {
  const { state, update } = useStore();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  // Pre-fill cat from picked type if possible
  const defaultCat = useMemo(() => {
    if (!pickedType || pickedType.catId === null) return state.vendorCats[0]?.id ?? "salle";
    // Use explicit catId mapping first
    const byId = state.vendorCats.find((c) => c.id === pickedType.catId);
    if (byId) return byId.id;
    return state.vendorCats[0]?.id ?? "salle";
  }, [pickedType, state.vendorCats]);

  const [form, setForm] = useState({
    name: "",
    cat: defaultCat,
    contact: "",
    phone: "",
    email: "",
    total: "",
    included: "",
    status: "pending",
  });

  // Checklist state for suggested docs
  const suggestedDocs: readonly string[] = pickedType?.docs ?? [];
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(suggestedDocs.map((d) => [d, false]))
  );

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { toast("Le nom est obligatoire", "err"); return; }
    setSaving(true);
    const wId = getWeddingId();
    const today = new Date().toISOString().split("T")[0];
    const newVendor: Vendor = {
      id: Date.now(), cat: form.cat, name: form.name.trim(), total: parseFloat(form.total) || 0,
      status: form.status as any, score: "B",
      scores: { prix: 3, qualite: 3, reactivite: 3, references: 3, flexibilite: 3 },
      included: form.included.trim(), contact: form.contact.trim(),
      phone: form.phone.trim(), email: form.email.trim(), lastContact: today, docs: 0,
    };
    if (wId) {
      await createClient().from("vendors").insert({ ...newVendor, last_contact: today, wedding_id: wId });
    }
    update("vendors", (l) => [...l, newVendor]);
    toast("Devis ajouté");
    setSaving(false);
    onClose();
  };

  return (
    <Drawer
      title={pickedType && pickedType.cat !== "Autre" ? `Nouveau devis · ${pickedType.emoji} ${pickedType.cat}` : "Nouveau devis / prestataire"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" icon="arrow-left" onClick={onBack}>
            Retour
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" icon="check" onClick={save} disabled={saving}>
            {saving ? "Enregistrement…" : "Ajouter"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Tip callout */}
        {pickedType?.tip && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl text-[13px] leading-relaxed"
            style={{ background: "var(--sage-soft, #e8f0eb)", border: "1px solid var(--sage-line, #c2d4c7)" }}
          >
            <span className="text-[18px] shrink-0 mt-0.5">💡</span>
            <div>
              <span className="font-semibold" style={{ color: "var(--sage, #4a7c5f)" }}>Conseil · </span>
              <span style={{ color: "var(--text-2)" }}>{pickedType.tip}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Field label="Nom du prestataire *">
            <Input value={form.name} onChange={set("name")} placeholder="Ex : Studio Lumière" />
          </Field>
          <Field label="Catégorie">
            <Select
              value={form.cat}
              onChange={(v) => setForm((f) => ({ ...f, cat: v }))}
              options={state.vendorCats.map((c) => ({ value: c.id, label: c.label }))}
            />
          </Field>
        </div>
        <div className="flex gap-3">
          <Field label="Montant total (€)">
            <Input type="number" value={form.total} onChange={set("total")} placeholder="0" min="0" />
          </Field>
          <Field label="Statut">
            <Select
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              options={Object.entries(STATUS).map(([k, x]) => ({ value: k, label: x.label }))}
            />
          </Field>
        </div>
        <Field label="Contact">
          <Input value={form.contact} onChange={set("contact")} placeholder="Prénom Nom" />
        </Field>
        <div className="flex gap-3">
          <Field label="Téléphone">
            <Input value={form.phone} onChange={set("phone")} placeholder="06 00 00 00 00" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set("email")} placeholder="contact@prestataire.fr" />
          </Field>
        </div>
        <Field label="Prestations incluses">
          <Textarea
            rows={3}
            value={form.included}
            onChange={set("included") as any}
            placeholder="Décrivez ce qui est inclus dans ce devis…"
          />
        </Field>

        {/* Suggested docs checklist */}
        {suggestedDocs.length > 0 && (
          <div
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
          >
            <div className="text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-3)" }}>
              Documents à demander
            </div>
            {suggestedDocs.map((doc) => (
              <label key={doc} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checkedDocs[doc] ?? false}
                  onChange={(e) => setCheckedDocs((prev) => ({ ...prev, [doc]: e.target.checked }))}
                  className="accent-primary w-3.5 h-3.5 shrink-0"
                />
                <span
                  className="text-[13px] transition"
                  style={{
                    color: checkedDocs[doc] ? "var(--text-3)" : "var(--text-2)",
                    textDecoration: checkedDocs[doc] ? "line-through" : "none",
                  }}
                >
                  {doc}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}

// ─── Email Templates ───────────────────────────────────────────────────────

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\[([^\]]+)\]/g, (_, key) => {
    const val = vars[key];
    return val !== undefined && val !== "" ? val : "[à compléter]";
  });
}

const EMAIL_TEMPLATES = [
  {
    id: "devis",
    icon: "📬",
    name: "Demande de devis",
    desc: "Première prise de contact",
    subject: "Demande de devis — Mariage de [partnerA] & [partnerB] — [date]",
    body: `Bonjour,

Je me permets de vous contacter au sujet de notre mariage prévu le [date] à [venue], [city].

Nous sommes [partnerA] et [partnerB] et nous recherchons un(e) [category] pour notre grande journée. Votre travail nous a particulièrement séduits et nous aimerions obtenir un devis pour notre événement.

Quelques informations utiles :
- Date : [date]
- Lieu : [venue], [city]
- Nombre d'invités estimé : [guestTarget]

Seriez-vous disponible(s) à cette date et pourriez-vous nous faire parvenir un devis détaillé ?

Nous restons à votre disposition pour tout renseignement complémentaire ou pour organiser un rendez-vous.

Dans l'attente de votre retour, nous vous adressons nos cordiales salutations.

[partnerA] & [partnerB]`,
    extraFields: [],
  },
  {
    id: "relance",
    icon: "🔔",
    name: "Relance sans réponse",
    desc: "Pas de réponse après 7 jours",
    subject: "Relance — Mariage de [partnerA] & [partnerB] — [date]",
    body: `Bonjour,

Je me permets de revenir vers vous suite à mon précédent message resté sans réponse concernant notre mariage du [date] à [venue].

Nous sommes toujours intéressés par vos services et espérons que vous êtes disponible à cette date. Pourriez-vous me confirmer si vous avez bien reçu ma demande initiale ?

Si vous n'êtes pas disponible ou si vous ne proposez plus ce type de prestation, n'hésitez pas à nous le faire savoir — nous comprendrions tout à fait.

Merci d'avance pour votre retour.

Cordialement,
[partnerA] & [partnerB]`,
    extraFields: [],
  },
  {
    id: "rdv",
    icon: "📅",
    name: "Demande de rendez-vous",
    desc: "Organiser une visite ou une démo",
    subject: "Demande de rendez-vous — Mariage de [partnerA] & [partnerB]",
    body: `Bonjour,

Suite à nos échanges, nous souhaiterions organiser un rendez-vous pour en savoir plus sur vos prestations et discuter de notre mariage du [date].

Nous sommes disponibles [preferredDates].

Ce rendez-vous pourrait se tenir [meetingType].

Pourriez-vous nous proposer quelques créneaux à votre convenance ?

Cordialement,
[partnerA] & [partnerB]`,
    extraFields: ["preferredDates", "meetingType"],
  },
  {
    id: "confirmation",
    icon: "✅",
    name: "Confirmation de réservation",
    desc: "Confirmer après accord",
    subject: "Confirmation de réservation — Mariage de [partnerA] & [partnerB] — [date]",
    body: `Bonjour,

Suite à nos échanges, nous avons le plaisir de vous confirmer notre souhait de faire appel à vos services pour notre mariage du [date] à [venue].

Nous attendons votre devis/contrat définitif afin de pouvoir le signer dans les meilleurs délais. Pourriez-vous nous l'envoyer à [coupleEmail] ?

Nous sommes impatients de travailler avec vous pour préparer cette belle journée !

Cordialement,
[partnerA] & [partnerB]`,
    extraFields: ["coupleEmail"],
  },
  {
    id: "modification",
    icon: "✏️",
    name: "Demande de modification",
    desc: "Changer une date ou détail",
    subject: "Demande de modification — Mariage de [partnerA] & [partnerB] — [date]",
    body: `Bonjour,

Nous nous permettons de vous contacter concernant notre mariage du [date] à [venue], pour lequel nous avons fait appel à vos services.

Nous souhaitons vous informer d'une modification : [modificationText]

Pourriez-vous nous confirmer que cette modification est possible et, le cas échéant, nous indiquer si elle entraîne un ajustement tarifaire ?

Nous restons à votre disposition pour en discuter.

Cordialement,
[partnerA] & [partnerB]`,
    extraFields: ["modificationText"],
  },
  {
    id: "annulation",
    icon: "❌",
    name: "Annulation",
    desc: "Annuler avec ou sans pénalité",
    subject: "Annulation — Mariage de [partnerA] & [partnerB] — [date]",
    body: `Bonjour,

Nous vous contactons au sujet de notre mariage du [date] à [venue], pour lequel nous avions convenu de votre intervention.

Nous sommes au regret de vous informer que nous devons annuler notre collaboration.[cancellationReasonLine]

Nous prenons bonne note des conditions d'annulation prévues dans notre contrat et nous nous engageons à les respecter.

Nous vous remercions pour votre compréhension et vous souhaitons bonne continuation.

Cordialement,
[partnerA] & [partnerB]`,
    extraFields: ["cancellationReason"],
  },
];

type TemplateId = (typeof EMAIL_TEMPLATES)[number]["id"];
type ExtraFieldKey = "preferredDates" | "meetingType" | "coupleEmail" | "modificationText" | "cancellationReason";
const hasField = (fields: readonly string[], key: ExtraFieldKey) => fields.includes(key);

function formatWeddingDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function EmailTemplatesModal({ onClose }: { onClose: () => void }) {
  const { state } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("devis");
  const [selectedVendorIdx, setSelectedVendorIdx] = useState<string>("");
  const [preferredDates, setPreferredDates] = useState("en semaine, de préférence en soirée ou le week-end");
  const [meetingType, setMeetingType] = useState("en présentiel à votre établissement");
  const [coupleEmail, setCoupleEmail] = useState("");
  const [modificationText, setModificationText] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedVendor = selectedVendorIdx !== "" ? state.vendors[parseInt(selectedVendorIdx)] : null;
  const template = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate)!;

  const weddingDate = formatWeddingDate(state.wedding.date);

  const categoryLabel = useMemo(() => {
    if (!selectedVendor) return "";
    const cat = state.vendorCats.find((c) => c.id === selectedVendor.cat);
    return cat?.label ?? selectedVendor.cat;
  }, [selectedVendor, state.vendorCats]);

  const vars: Record<string, string> = {
    partnerA: state.wedding.partnerA || "",
    partnerB: state.wedding.partnerB || "",
    date: weddingDate,
    venue: state.wedding.venue || "",
    city: state.wedding.city || "",
    guestTarget: state.wedding.guestTarget ? String(state.wedding.guestTarget) : "",
    category: categoryLabel,
    preferredDates,
    meetingType,
    coupleEmail,
    modificationText,
  };

  // For annulation: inject reason sentence only when provided
  const cancellationReasonLine = cancellationReason.trim()
    ? ` ${cancellationReason.trim()}`
    : "";

  const allVars = { ...vars, cancellationReasonLine };

  const filledSubject = fillTemplate(template.subject, allVars);
  const filledBody = fillTemplate(template.body, allVars);

  const copyEmail = useCallback(() => {
    navigator.clipboard.writeText(filledBody).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [filledBody]);

  const openMail = useCallback(() => {
    const to = selectedVendor?.email ?? "";
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(filledSubject)}&body=${encodeURIComponent(filledBody)}`;
    window.open(url, "_blank");
  }, [selectedVendor, filledSubject, filledBody]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div
        className="w-full max-w-[960px] max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
        style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">📧</span>
            <div>
              <div className="font-semibold text-[16px]">Modèles d&apos;emails</div>
              <div className="text-[12.5px]" style={{ color: "var(--text-3)" }}>Emails professionnels prêts à envoyer à vos prestataires</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-70"
            style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Left sidebar — template selector */}
          <div
            className="md:w-[30%] w-full md:border-r overflow-y-auto p-3 flex flex-col gap-1.5 shrink-0"
            style={{ borderColor: "var(--line)", background: "var(--bg)" }}
          >
            {EMAIL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id as TemplateId)}
                className="flex items-start gap-3 px-3.5 py-3 rounded-xl text-left transition"
                style={{
                  background: selectedTemplate === t.id ? "var(--surface)" : "transparent",
                  border: `1px solid ${selectedTemplate === t.id ? "var(--primary)" : "transparent"}`,
                  boxShadow: selectedTemplate === t.id ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <span className="text-[18px] mt-0.5 shrink-0">{t.icon}</span>
                <div>
                  <div className="text-[13.5px] font-semibold" style={{ color: selectedTemplate === t.id ? "var(--primary)" : "var(--text)" }}>
                    {t.name}
                  </div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-3)" }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Right — form + preview */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Form fields */}
            <div className="p-5 border-b flex flex-col gap-4" style={{ borderColor: "var(--line)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Vendor selector */}
                <Field label="Prestataire">
                  <Select
                    value={selectedVendorIdx}
                    onChange={(v) => setSelectedVendorIdx(v)}
                    options={[
                      { value: "", label: "— Choisir un prestataire —" },
                      ...state.vendors.map((v, i) => {
                        const cat = state.vendorCats.find((c) => c.id === v.cat);
                        return { value: String(i), label: `${v.name} (${cat?.label ?? v.cat})` };
                      }),
                    ]}
                  />
                </Field>

                {/* Couple names (read-only display) */}
                <Field label="Prénoms des mariés">
                  <Input
                    value={`${state.wedding.partnerA || ""}${state.wedding.partnerA && state.wedding.partnerB ? " & " : ""}${state.wedding.partnerB || ""}`}
                    readOnly
                    placeholder="[à compléter dans Paramètres]"
                  />
                </Field>

                {/* Wedding date */}
                <Field label="Date du mariage">
                  <Input value={weddingDate} readOnly placeholder="[à compléter dans Paramètres]" />
                </Field>

                {/* Venue */}
                <Field label="Lieu de réception">
                  <Input value={state.wedding.venue || ""} readOnly placeholder="[à compléter dans Paramètres]" />
                </Field>
              </div>

              {/* Template-specific extra fields */}
              {hasField(template.extraFields, "preferredDates") && (
                <Field label="Disponibilités (texte libre)">
                  <Input
                    value={preferredDates}
                    onChange={(e) => setPreferredDates(e.target.value)}
                    placeholder="ex : en semaine en soirée ou le week-end"
                  />
                </Field>
              )}
              {hasField(template.extraFields, "meetingType") && (
                <Field label="Format du rendez-vous">
                  <Select
                    value={meetingType}
                    onChange={(v) => setMeetingType(v)}
                    options={[
                      { value: "en présentiel à votre établissement", label: "En présentiel à votre établissement" },
                      { value: "par visioconférence", label: "Par visioconférence" },
                      { value: "par téléphone", label: "Par téléphone" },
                    ]}
                  />
                </Field>
              )}
              {hasField(template.extraFields, "coupleEmail") && (
                <Field label="Email des mariés (optionnel)">
                  <Input
                    type="email"
                    value={coupleEmail}
                    onChange={(e) => setCoupleEmail(e.target.value)}
                    placeholder="votre@email.fr"
                  />
                </Field>
              )}
              {hasField(template.extraFields, "modificationText") && (
                <Field label="Détail de la modification">
                  <Textarea
                    rows={3}
                    value={modificationText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setModificationText(e.target.value)}
                    placeholder="Décrivez la modification souhaitée…"
                  />
                </Field>
              )}
              {hasField(template.extraFields, "cancellationReason") && (
                <Field label="Motif d'annulation (optionnel)">
                  <Textarea
                    rows={3}
                    value={cancellationReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancellationReason(e.target.value)}
                    placeholder="Expliquez la raison de l'annulation si vous le souhaitez…"
                  />
                </Field>
              )}
            </div>

            {/* Email preview */}
            <div className="p-5 flex flex-col gap-3 flex-1">
              {/* Subject line */}
              <div
                className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg"
                style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide mt-0.5 shrink-0" style={{ color: "var(--text-3)" }}>Objet</span>
                <span className="text-[13.5px] font-medium flex-1" style={{ color: "var(--text)" }}>{filledSubject}</span>
              </div>

              {/* Body */}
              <div
                className="flex-1 p-4 rounded-xl text-[13px] leading-[1.75] whitespace-pre-wrap overflow-y-auto min-h-[180px]"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  fontFamily: "'SF Mono', 'Fira Code', Consolas, 'Courier New', monospace",
                  color: "var(--text)",
                }}
              >
                {filledBody}
              </div>
            </div>

            {/* Action buttons */}
            <div
              className="flex flex-wrap items-center gap-2 px-5 py-4 border-t"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <Button variant="primary" icon="copy" onClick={copyEmail}>
                {copied ? "Copié !" : "Copier l'email"}
              </Button>
              <Button variant="secondary" icon="mail" onClick={openMail}>
                Ouvrir dans Mail
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" onClick={onClose}>Fermer</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────

// ─── Comparison view (side-by-side table per category) ───────────────────────

function ComparisonView({ vendors, cats }: { vendors: Vendor[]; cats: { id: string; label: string; icon: string }[] }) {
  // Group vendors by category, keep only categories with ≥ 2
  const grouped = useMemo(() => {
    const g: Record<string, Vendor[]> = {};
    vendors.forEach((v) => { (g[v.cat] = g[v.cat] || []).push(v); });
    return Object.entries(g).filter(([, vs]) => vs.length >= 2);
  }, [vendors]);

  if (grouped.length === 0) {
    return (
      <Card>
        <Empty icon="bars" title="Aucune catégorie à comparer">
          Ajoutez au moins 2 prestataires dans la même catégorie pour activer la comparaison.
        </Empty>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {grouped.map(([cid, vs]) => {
        const catObj = cats.find((c) => c.id === cid);
        return (
          <div key={cid}>
            <div className="sec-title mb-4">
              <Icon name={catObj?.icon ?? "file" as any} size={17} className="text-text-3" />
              {catObj?.label ?? cid}
              <Badge tone="neutral">{vs.length}</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]" style={{ border: "1px solid var(--line)", borderRadius: 12 }}>
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide font-semibold text-text-3 border-b border-r" style={{ borderColor: "var(--line)", background: "var(--bg)", minWidth: 140 }}>
                      Critère
                    </th>
                    {vs.map((v) => (
                      <th
                        key={v.id}
                        className="px-4 py-3 text-left text-[13px] font-semibold border-b"
                        style={{
                          borderColor: "var(--line)",
                          background: v.status === "signed" ? "var(--sage-soft, #e8f0eb)" : "var(--surface)",
                          borderLeft: "1px solid var(--line)",
                          borderTop: v.status === "signed" ? "3px solid var(--sage, #4a7c5f)" : "3px solid transparent",
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="truncate max-w-[180px]">{v.name}</span>
                          {v.status === "signed" && (
                            <Badge tone="sage" icon="check">Signé</Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Prix total */}
                  <tr>
                    <td className="px-4 py-3 font-medium text-text-2 border-b border-r text-[12.5px]" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
                      Prix total
                    </td>
                    {vs.map((v) => (
                      <td key={v.id} className="px-4 py-3 border-b" style={{ borderColor: "var(--line)", borderLeft: "1px solid var(--line)" }}>
                        <span className="font-mono font-semibold text-[15px]">{fmt.eur(v.total)}</span>
                      </td>
                    ))}
                  </tr>
                  {/* Statut */}
                  <tr>
                    <td className="px-4 py-3 font-medium text-text-2 border-b border-r text-[12.5px]" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
                      Statut
                    </td>
                    {vs.map((v) => (
                      <td key={v.id} className="px-4 py-3 border-b" style={{ borderColor: "var(--line)", borderLeft: "1px solid var(--line)" }}>
                        <Badge tone={STATUS[v.status].tone} dot>{STATUS[v.status].label}</Badge>
                      </td>
                    ))}
                  </tr>
                  {/* Score global */}
                  <tr>
                    <td className="px-4 py-3 font-medium text-text-2 border-b border-r text-[12.5px]" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
                      Score global
                    </td>
                    {vs.map((v) => {
                      const score = avgScore(v.scores as unknown as Record<string, number>);
                      return (
                        <td key={v.id} className="px-4 py-3 border-b" style={{ borderColor: "var(--line)", borderLeft: "1px solid var(--line)" }}>
                          {score > 0 ? <ScoreStarBadge score={score} /> : <span className="text-text-3 text-[12px]">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Inclus */}
                  <tr>
                    <td className="px-4 py-3 font-medium text-text-2 border-b border-r text-[12.5px]" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
                      Inclus
                    </td>
                    {vs.map((v) => (
                      <td key={v.id} className="px-4 py-3 border-b text-[12px] text-text-2 leading-relaxed" style={{ borderColor: "var(--line)", borderLeft: "1px solid var(--line)", maxWidth: 240 }}>
                        {v.included ? <span className="line-clamp-3">{v.included}</span> : <span className="text-text-3">—</span>}
                      </td>
                    ))}
                  </tr>
                  {/* Contact */}
                  <tr>
                    <td className="px-4 py-3 font-medium text-text-2 border-r text-[12.5px]" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
                      Contact
                    </td>
                    {vs.map((v) => (
                      <td key={v.id} className="px-4 py-3 text-[12.5px]" style={{ borderColor: "var(--line)", borderLeft: "1px solid var(--line)" }}>
                        <div className="flex flex-col gap-0.5">
                          {v.contact && <span className="text-text-2">{v.contact}</span>}
                          {v.phone && <span className="text-text-3">{v.phone}</span>}
                          {v.email && <span className="text-text-3 truncate max-w-[200px]">{v.email}</span>}
                          {!v.contact && !v.phone && !v.email && <span className="text-text-3">—</span>}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const { state, update } = useStore();
  const toast = useToast();
  const [cat, setCat] = useState("all");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [viewing, setViewing] = useState<Vendor | null>(null);
  const [comparing, setComparing] = useState<{ vendors: Vendor[]; label: string } | null>(null);
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);

  // ── Add flow: "pick" → "form" → null ──────────────────────────────────────
  const [addStep, setAddStep] = useState<"pick" | "form" | null>(null);
  const [pickedType, setPickedType] = useState<VendorTypeItem | null>(null);

  const openAdd = () => setAddStep("pick");
  const handlePick = (item: VendorTypeItem) => {
    setPickedType(item);
    setAddStep("form");
  };
  const handleBackToPick = () => setAddStep("pick");
  const handleCloseAdd = () => { setAddStep(null); setPickedType(null); };

  // ── Drag & drop reordering ────────────────────────────────────────────────
  const [dragVendorId, setDragVendorId] = useState<number | null>(null);
  const [dragOverVendorId, setDragOverVendorId] = useState<number | null>(null);

  const handleDragStart = useCallback((id: number) => {
    setDragVendorId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: number) => {
    e.preventDefault();
    setDragOverVendorId(id);
  }, []);

  const handleDrop = useCallback(
    (targetId: number) => {
      if (dragVendorId === null || dragVendorId === targetId) {
        setDragVendorId(null);
        setDragOverVendorId(null);
        return;
      }
      const vendors = [...state.vendors];
      const fromIdx = vendors.findIndex((v) => v.id === dragVendorId);
      const toIdx = vendors.findIndex((v) => v.id === targetId);
      if (fromIdx === -1 || toIdx === -1) {
        setDragVendorId(null);
        setDragOverVendorId(null);
        return;
      }
      const [moved] = vendors.splice(fromIdx, 1);
      vendors.splice(toIdx, 0, moved);
      update("vendors", vendors);
      setDragVendorId(null);
      setDragOverVendorId(null);
    },
    [dragVendorId, state.vendors, update]
  );

  const handleDragEnd = useCallback(() => {
    setDragVendorId(null);
    setDragOverVendorId(null);
  }, []);

  const cats = state.vendorCats;
  const filtered = cat === "all" ? state.vendors : state.vendors.filter((v) => v.cat === cat);
  const grouped = useMemo(() => {
    const g: Record<string, Vendor[]> = {};
    filtered.forEach((v) => { (g[v.cat] = g[v.cat] || []).push(v); });
    return g;
  }, [filtered]);

  // Numeric score derived from letter score for the badge
  const scoreToNum = (score: "A" | "B" | "C"): number => score === "A" ? 4.5 : score === "B" ? 3.5 : 2;

  // Budget summary
  const signedVendors = state.vendors.filter((v) => v.status === "signed");
  const pendingVendors = state.vendors.filter((v) => v.status === "pending");
  const signedTotal = signedVendors.reduce((s, v) => s + (v.total || 0), 0);
  const pendingTotal = pendingVendors.reduce((s, v) => s + (v.total || 0), 0);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">
      <PageHead
        title="Devis & prestataires"
        sub={`${state.vendors.length} devis · ${state.vendors.filter((v) => v.status === "signed").length} signés · ${state.vendors.filter((v) => v.status === "pending").length} en attente`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon="download" onClick={() => exportVendorsPDF(state.vendors, state.wedding.partnerA, state.wedding.partnerB)}>
              Export PDF
            </Button>
            <Button variant="secondary" onClick={() => setShowEmailTemplates(true)}>📧 Modèles d&apos;emails</Button>
            <Button variant="primary" icon="plus" onClick={openAdd}>Ajouter un devis</Button>
          </div>
        }
      />

      <PageTutorial pageId="vendors" title="Comment gérer vos prestataires ?"
        steps={[
          { icon: "star", title: "Comparez les devis", desc: "Notez chaque prestataire sur 5 critères (prix, qualité, réactivité…) pour obtenir un score global automatique." },
          { icon: "file", title: "Suivez les statuts", desc: "Faites évoluer chaque devis de En attente → Signé ou Refusé. Les signés alimentent automatiquement le budget." },
          { icon: "card", title: "Gérez les paiements", desc: "Une fois signé, créez les échéances de paiement directement depuis la fiche prestataire." },
        ]} />

      {/* Budget summary */}
      {state.vendors.length > 0 && (
        <ScrollReveal delay={0}>
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 rounded-xl mb-4 text-[13.5px]"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            <Icon name="wallet" size={16} className="text-text-3 shrink-0" />
            <span>
              <span className="font-semibold font-mono">{fmt.eur(signedTotal)}</span>
              <span className="text-text-2"> engagés </span>
              <span className="text-text-3">({signedVendors.length} signé{signedVendors.length !== 1 ? "s" : ""})</span>
            </span>
            {pendingVendors.length > 0 && (
              <>
                <span className="text-text-3 select-none">·</span>
                <span>
                  <span className="font-semibold font-mono text-[var(--gold-ink)]">{fmt.eur(pendingTotal)}</span>
                  <span className="text-text-2"> en cours de négociation </span>
                  <span className="text-text-3">({pendingVendors.length} en attente)</span>
                </span>
              </>
            )}
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0}>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setCat("all")} className={`inline-flex items-center gap-2 h-[38px] px-3.5 rounded-full border text-[13px] font-medium whitespace-nowrap transition ${cat === "all" ? "bg-text text-bg border-transparent" : "bg-surface border-line text-text-2 hover:border-line-strong"}`}>Tous <span className="text-[11px] opacity-70">{state.vendors.length}</span></button>
          {cats.map((c) => {
            const n = state.vendors.filter((v) => v.cat === c.id).length;
            return (
              <button key={c.id} onClick={() => setCat(c.id)} className={`inline-flex items-center gap-2 h-[38px] px-3.5 rounded-full border text-[13px] font-medium whitespace-nowrap transition ${cat === c.id ? "bg-text text-bg border-transparent" : "bg-surface border-line text-text-2 hover:border-line-strong"}`}>
                <Icon name={c.icon as any} size={15} />{c.label}{n > 0 && <span className="text-[11px] opacity-70">{n}</span>}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setComparisonMode((v) => !v)}
          className={`inline-flex items-center gap-2 h-[38px] px-4 rounded-full border text-[13px] font-medium whitespace-nowrap transition shrink-0 ${comparisonMode ? "bg-text text-bg border-transparent" : "bg-surface border-line text-text-2 hover:border-line-strong"}`}
        >
          <Icon name="bars" size={15} />
          Vue comparaison
        </button>
      </div>
      </ScrollReveal>

      {comparisonMode ? (
        <ScrollReveal delay={0}>
          <ComparisonView vendors={filtered} cats={cats} />
        </ScrollReveal>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          {cat !== "all" ? (
            <Empty icon="file" title="Aucun devis dans cette catégorie">
              Ajoutez un prestataire pour cette catégorie.
            </Empty>
          ) : (
            <div className="flex flex-col items-center gap-5 py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gold-soft flex items-center justify-center">
                <Icon name="file" size={30} className="text-[var(--gold-ink)]" />
              </div>
              <div>
                <div className="font-semibold text-xl mb-2">Trouvez vos prestataires</div>
                <p className="text-text-2 text-[14px] max-w-[360px] leading-relaxed">
                  Ajoutez vos prestataires clés (salle, traiteur, photographe…) et comparez leurs devis côte à côte pour faire le meilleur choix.
                </p>
              </div>
              <Button variant="primary" icon="plus" onClick={openAdd}>Ajouter mon premier devis</Button>
              <div className="flex flex-col gap-2 w-full max-w-[320px]">
                {[["rings", "Salle & réception"], ["camera", "Photographe / vidéaste"], ["cake", "Traiteur"], ["music", "DJ / Musique"]].map(([ic, label]) => (
                  <button key={label} onClick={openAdd}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-md border border-dashed border-line hover:bg-hover hover:border-line-strong transition text-left">
                    <Icon name={ic as any} size={16} className="text-text-3 shrink-0" />
                    <span className="text-[13px] font-medium text-text-2">{label}</span>
                    <Icon name="plus" size={14} className="ml-auto text-text-3" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : Object.entries(grouped).map(([cid, vs]) => {
        const catObj = cats.find((c) => c.id === cid)!;
        return (
          <ScrollReveal key={cid} delay={0.05}>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="sec-title">
                <Icon name={catObj?.icon ?? "file"} size={17} className="text-text-3" />
                {catObj?.label ?? cid}
                <Badge tone="neutral">{vs.length}</Badge>
              </div>
              {vs.length >= 2 && (
                <Button variant="secondary" size="sm" icon="bars" onClick={() => setComparing({ vendors: vs, label: catObj?.label ?? cid })}>
                  Comparer
                </Button>
              )}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-3">
              {vs.map((v) => {
                const late = v.status === "pending" && daysSince(v.lastContact) > 14;
                const isDragging = dragVendorId === v.id;
                const isDragOver = dragOverVendorId === v.id && dragVendorId !== v.id;
                return (
                  <div
                    key={v.id}
                    draggable
                    onDragStart={() => handleDragStart(v.id)}
                    onDragOver={(e) => handleDragOver(e, v.id)}
                    onDrop={() => handleDrop(v.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: isDragging ? 0.4 : 1,
                      borderTop: isDragOver ? "2px solid var(--terracotta, #c0634c)" : "2px solid transparent",
                      transition: "opacity 0.15s, border-color 0.15s",
                    }}
                  >
                    <Card hover className="p-[18px] flex flex-col gap-3.5" onClick={() => setViewing(v)}>
                      <div className="flex items-start justify-between gap-3">
                        {/* Drag handle */}
                        <div
                          className="shrink-0 mt-1 text-text-3 select-none"
                          style={{
                            cursor: isDragging ? "grabbing" : "grab",
                            fontSize: 16,
                            lineHeight: 1,
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⠿
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-[15.5px] font-semibold truncate">{v.name}</div>
                            <ScoreStarBadge score={avgScore(v.scores as unknown as Record<string, number>) || scoreToNum(v.score)} />
                          </div>
                          <div className="text-[12.5px] text-text-2 mt-0.5">{v.contact || "—"}</div>
                        </div>
                        <div className={`w-[38px] h-[38px] rounded-[11px] flex items-center justify-center font-mono font-bold text-[17px] shrink-0 ${SCORE_CLS[v.score]}`}>{v.score}</div>
                      </div>
                      <div className="font-mono text-[22px] font-semibold tracking-[-.02em]">{fmt.eur(v.total)}</div>
                      {v.included && <div className="text-[12.5px] text-text-2 leading-relaxed line-clamp-2">{v.included}</div>}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge tone={STATUS[v.status].tone} dot>{STATUS[v.status].label}</Badge>
                        {v.docs > 0 && <Badge tone="neutral" icon="file">Contrat</Badge>}
                        {late && <Badge tone="coral" icon="clock">Sans réponse {daysSince(v.lastContact)}j</Badge>}
                        {v.status === "pending" && daysSinceContact(v.lastContact) > 14 && (
                          <Badge tone="coral" icon="alert">Relancer</Badge>
                        )}
                      </div>
                      {v.lastContact && (() => {
                        const days = daysSinceContact(v.lastContact);
                        const isLate = days > 21 && v.status === "pending";
                        return (
                          <div className={`flex items-center gap-1.5 text-[11.5px] mt-0.5 ${isLate ? "text-[var(--gold-ink)]" : "text-text-3"}`}>
                            {isLate && <Icon name="alert" size={12} className="shrink-0" />}
                            Contacté il y a {days} jour{days !== 1 ? "s" : ""}
                          </div>
                        );
                      })()}
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
          </ScrollReveal>
        );
      })}

      {/* Modals & drawers */}
      {viewing && <VendorDetailDrawer vendor={viewing} onClose={() => setViewing(null)} />}
      {comparing && <Comparator vendors={comparing.vendors} label={comparing.label} onClose={() => setComparing(null)} />}
      {addStep === "pick" && (
        <VendorTypePicker
          onPick={handlePick}
          onClose={handleCloseAdd}
        />
      )}
      {addStep === "form" && (
        <NewVendorDrawer
          pickedType={pickedType}
          onBack={handleBackToPick}
          onClose={handleCloseAdd}
        />
      )}
      {showEmailTemplates && <EmailTemplatesModal onClose={() => setShowEmailTemplates(false)} />}
    </div>
  );
}

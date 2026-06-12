"use client";

import { useState, useMemo, useRef } from "react";
import { useStore, useToast } from "@/components/providers";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Search, Select, Segmented, Field, Input, Textarea, Avatar, Drawer, Modal, Empty, Tabs } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { PageTutorial } from "@/components/tutorial";
import { ScrollReveal } from "@/components/scroll-reveal";
import type { Guest, Diet } from "@/lib/types";
import { exportGuestListPDF } from "@/lib/pdf-guests";
import { exportElementAsPNG } from "@/lib/export-canvas";
import { exportPlaceCardsPDF, exportSeatingListPDF } from "@/lib/pdf-placecards";
import Papa from "papaparse";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase";
import { getWeddingId } from "@/lib/db";

const RSVP: Record<string, { label: string; tone: any; dot: string }> = {
  yes: { label: "Confirmé", tone: "sage", dot: "var(--sage)" },
  pending: { label: "En attente", tone: "amber", dot: "var(--amber)" },
  declined: { label: "Décliné", tone: "coral", dot: "var(--coral)" },
};

const DIET_OPTIONS: { value: Diet; label: string; emoji: string }[] = [
  { value: "standard",     label: "Standard",          emoji: "✅" },
  { value: "vegetarian",   label: "Végétarien",         emoji: "🥗" },
  { value: "vegan",        label: "Vegan",              emoji: "🌱" },
  { value: "gluten-free",  label: "Sans gluten",        emoji: "🌾" },
  { value: "halal",        label: "Halal",              emoji: "☪️" },
  { value: "kosher",       label: "Casher",             emoji: "✡️" },
  { value: "no-pork",      label: "Sans porc",          emoji: "🐷" },
  { value: "no-seafood",   label: "Sans fruits de mer", emoji: "🦐" },
  { value: "lactose-free", label: "Sans lactose",       emoji: "🥛" },
  { value: "nut-allergy",  label: "Allergie aux noix",  emoji: "🥜" },
  { value: "other",        label: "Autre",              emoji: "✏️" },
];

function dietLabel(diet: Diet): string {
  const found = DIET_OPTIONS.find((d) => d.value === diet);
  if (found) return found.label;
  // Legacy values
  if (diet === "vegetarien") return "Végétarien";
  if (diet === "sans gluten") return "Sans gluten";
  if (diet === "sans lactose") return "Sans lactose";
  if (diet === "none") return "Standard";
  return diet;
}

function dietEmoji(diet: Diet): string {
  const found = DIET_OPTIONS.find((d) => d.value === diet);
  if (found) return found.emoji;
  if (diet === "vegetarien") return "🥗";
  if (diet === "none") return "✅";
  return "🍽️";
}

// ─────────────────────────────────────────────────────────────────
// Counters
// ─────────────────────────────────────────────────────────────────
function Counters() {
  const { state } = useStore();
  const g = state.guests;
  const vegCount = g.filter((x) =>
    x.diet === "vegetarien" || x.diet === "vegan" || x.diet === "vegetarian"
  ).length;
  const items = [
    { v: g.length, l: "Total", c: "var(--text-3)" },
    { v: g.filter((x) => x.rsvp === "yes").length, l: "Confirmés", c: "var(--sage)" },
    { v: g.filter((x) => x.rsvp === "pending").length, l: "En attente", c: "var(--amber)" },
    { v: g.filter((x) => x.rsvp === "declined").length, l: "Déclinés", c: "var(--coral)" },
    { v: g.filter((x) => x.child).length, l: "Enfants", c: "var(--primary)" },
    { v: vegCount, l: "Végé / vegan", c: "var(--gold)" },
    { v: g.filter((x) => x.transport).length, l: "Transport", c: "var(--text-3)" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-line border border-line rounded-card overflow-hidden">
      {items.map((it, i) => (
        <div key={i} className="bg-surface px-4 py-4 flex flex-col gap-0.5">
          <span className="font-mono text-2xl font-semibold tracking-[-.02em]">{it.v}</span>
          <span className="text-[12.5px] text-text-2 flex items-center gap-1.5"><span className="w-2 h-2 rounded-[3px]" style={{ background: it.c }} />{it.l}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DietPicker
// ─────────────────────────────────────────────────────────────────
function DietPicker({ value, onChange }: { value: Diet; onChange: (v: Diet) => void }) {
  const [customVal, setCustomVal] = useState(value === "other" ? "" : "");
  // Normalize legacy to nearest chip value for display
  const normalised: Diet =
    value === "vegetarien" ? "vegetarian" :
    value === "sans gluten" ? "gluten-free" :
    value === "sans lactose" ? "lactose-free" :
    value === "none" ? "standard" :
    value;

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        {DIET_OPTIONS.map((opt) => {
          const selected = normalised === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[12.5px] font-medium transition-all
                ${selected
                  ? "bg-primary text-white border-transparent shadow-sm"
                  : "bg-surface border-line text-text-2 hover:border-line-strong hover:bg-surface-2"
                }`}
            >
              <span className="text-base leading-none">{opt.emoji}</span>
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>
      {normalised === "other" && (
        <div className="mt-2">
          <Input
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            placeholder="Précisez le régime…"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RsvpPicker
// ─────────────────────────────────────────────────────────────────
const RSVP_CARDS: {
  value: "yes" | "pending" | "declined";
  icon: string;
  label: string;
  desc: string;
  selectedClass: string;
}[] = [
  { value: "yes",      icon: "🎉", label: "Confirmé",   desc: "Sera présent(e)",           selectedClass: "border-sage bg-sage/10" },
  { value: "declined", icon: "😔", label: "Décliné",    desc: "Ne pourra pas venir",       selectedClass: "border-coral bg-coral/10" },
  { value: "pending",  icon: "🤔", label: "En attente", desc: "N'a pas encore répondu",    selectedClass: "border-amber bg-amber/10" },
];

function RsvpPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {RSVP_CARDS.map((c) => {
        const selected = value === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 transition-all text-center
              ${selected ? c.selectedClass : "border-line bg-surface hover:border-line-strong hover:bg-surface-2"}`}
          >
            <span className="text-2xl leading-none">{c.icon}</span>
            <span className={`text-[12.5px] font-semibold ${selected ? "" : "text-text-2"}`}>{c.label}</span>
            <span className="text-[11px] text-text-3 leading-snug">{c.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// QRCodeButton — inline button that opens QRModal
// ─────────────────────────────────────────────────────────────────
function QRCodeButton({ guest }: { guest: Guest }) {
  const [showQR, setShowQR] = useState(false);
  if (!guest.rsvpToken) return null;
  return (
    <>
      <Button variant="secondary" size="sm" icon="qr-code" onClick={() => setShowQR(true)}>
        QR Code RSVP
      </Button>
      {showQR && <QRModal guest={guest} onClose={() => setShowQR(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// GuestDrawer
// ─────────────────────────────────────────────────────────────────
function GuestDrawer({ guest, onClose }: { guest: Guest; onClose: () => void }) {
  const { state, update, SIDES } = useStore();
  const toast = useToast();
  const [g, setG] = useState(guest);
  const set = (k: keyof Guest, v: any) => setG((p) => ({ ...p, [k]: v }));
  const isNew = !guest.id;
  const save = () => {
    if (!g.name.trim()) { toast("Le nom est requis", "err"); return; }
    update("guests", (list) => isNew ? [...list, { ...g, id: Date.now() }] : list.map((x) => x.id === g.id ? g : x));
    toast(isNew ? "Invité ajouté" : "Invité mis à jour"); onClose();
  };
  const remove = () => { update("guests", (l) => l.filter((x) => x.id !== g.id)); toast("Invité supprimé"); onClose(); };
  return (
    <Drawer title={isNew ? "Nouvel invité" : "Modifier l'invité"} onClose={onClose}
      footer={<>
        {!isNew && <Button variant="danger" icon="trash" onClick={remove}>Supprimer</Button>}
        <div className="flex-1" />
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button variant="primary" icon="check" onClick={save}>Enregistrer</Button>
      </>}>
      <div className="flex flex-col gap-4">
        <Field label="Nom complet"><Input value={g.name} onChange={(e) => set("name", e.target.value)} placeholder="Prénom Nom" /></Field>

        {/* Côté selector */}
        <Field label="Côté">
          <Select value={g.side} onChange={(v) => set("side", v)} options={[{ value: "A", label: SIDES.A }, { value: "B", label: SIDES.B }]} />
        </Field>

        {/* RSVP visual picker */}
        <Field label="Statut RSVP">
          <RsvpPicker value={g.rsvp} onChange={(v) => set("rsvp", v)} />
        </Field>

        {/* Diet visual chip picker */}
        <Field label="Régime alimentaire">
          <DietPicker value={g.diet} onChange={(v) => set("diet", v)} />
        </Field>

        <Field label="Table">
          <Select value={String(g.table || "")} onChange={(v) => set("table", v ? +v : null)} options={[{ value: "", label: "Non assignée" }, ...state.tables.map((t) => ({ value: String(t.id), label: t.name }))]} />
        </Field>

        <Field label="Groupe familial"><Input value={g.group} onChange={(e) => set("group", e.target.value)} placeholder="Ex : Famille Laurent" /></Field>
        <Field label="Hébergement"><Select value={g.lodging} onChange={(v) => set("lodging", v)} options={[{ value: "", label: "Aucun" }, { value: "sur place", label: "Sur place" }, { value: "hôtel", label: "Hôtel partenaire" }]} /></Field>
        <div className="flex gap-[18px] flex-wrap">
          {([["child", "Enfant"], ["transport", "Transport nécessaire"], ["gift", "Cadeau reçu"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-[13.5px] cursor-pointer">
              <input type="checkbox" checked={!!g[k]} onChange={(e) => set(k, e.target.checked)} className="w-4 h-4 accent-primary" />{l}
            </label>
          ))}
        </div>
        <Field label="Notes"><Textarea rows={3} value={g.note} onChange={(e) => set("note", e.target.value)} placeholder="Allergies, précisions…" /></Field>
        {!isNew && g.rsvpToken && (
          <div className="pt-3 border-t border-line">
            <div className="text-[12px] font-semibold text-text-2 mb-2 flex items-center gap-1.5">
              <Icon name="link" size={13} className="text-text-3" />Lien RSVP personnel
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-[11px] text-text-3 bg-surface-2 rounded-md px-2.5 py-2 truncate border border-line">
                {typeof window !== "undefined" ? `${window.location.origin}/rsvp/${g.rsvpToken}` : `/rsvp/${g.rsvpToken}`}
              </div>
              <Button variant="secondary" size="sm" icon="copy" onClick={() => {
                if (typeof window !== "undefined") { navigator.clipboard.writeText(`${window.location.origin}/rsvp/${g.rsvpToken}`); }
                toast("Lien copié !");
              }}>Copier</Button>
            </div>
            <p className="text-[11.5px] text-text-3 mt-1.5">Partagez ce lien par WhatsApp ou email pour recevoir la réponse directement.</p>
            <div className="mt-2">
              <QRCodeButton guest={g} />
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

// ─────────────────────────────────────────────────────────────────
// QRModal
// ─────────────────────────────────────────────────────────────────
function QRModal({ guest, onClose }: { guest: { name: string; rsvpToken?: string }; onClose: () => void }) {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/rsvp/${guest.rsvpToken}`
    : `/rsvp/${guest.rsvpToken}`;

  const print = () => window.print();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-surface rounded-2xl p-6 max-w-[340px] w-full flex flex-col items-center gap-5 shadow-2xl">
        <div className="w-full flex items-center justify-between">
          <span className="text-[15px] font-semibold">QR Code — {guest.name}</span>
          <button onClick={onClose} className="icon-btn w-8 h-8"><Icon name="x" size={16} /></button>
        </div>

        <div className="p-4 bg-white rounded-xl border border-line">
          <QRCodeSVG
            value={url}
            size={200}
            level="M"
            includeMargin={false}
            fgColor="#1C1C1E"
          />
        </div>

        <p className="text-[12px] text-text-3 text-center">
          Imprimez ce QR code sur votre invitation.<br />
          En le scannant, {guest.name} pourra confirmer sa présence.
        </p>

        <div className="text-[11px] font-mono text-text-3 break-all text-center bg-surface-2 px-3 py-2 rounded-lg w-full">{url}</div>

        <div className="flex gap-2 w-full">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => { navigator.clipboard?.writeText(url); }}>
            Copier le lien
          </Button>
          <Button variant="primary" size="sm" className="flex-1" icon="download" onClick={print}>
            Imprimer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// parseBulkText — returns flat array of names
// ─────────────────────────────────────────────────────────────────
function parseBulkText(text: string): string[] {
  const results: string[] = [];
  const lines = text.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // "(N personnes)" pattern
    const personnesMatch = line.match(/^(.+?)\s*\((\d+)\s*personnes?\)$/i);
    if (personnesMatch) {
      const base = personnesMatch[1].trim();
      const count = Math.min(parseInt(personnesMatch[2], 10), 20);
      for (let i = 1; i <= count; i++) results.push(`${base} ${i}`);
      continue;
    }

    // " & " split
    if (line.includes(" & ")) {
      const parts = line.split(" & ").map((p) => p.trim()).filter(Boolean);
      results.push(...parts);
      continue;
    }

    results.push(line);
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────
// Guest group templates
// ─────────────────────────────────────────────────────────────────
interface GroupTemplate {
  icon: string;
  label: string;
  desc: string;
  note: string;
  side: "A" | "B" | "both";
  child?: boolean;
}

const GROUP_TEMPLATES: GroupTemplate[] = [
  { icon: "👨‍👩‍👧‍👦", label: "Famille proche (mariée)", desc: "Parents, frères/sœurs, grands-parents", note: "Famille proche — côté mariée",  side: "A" },
  { icon: "👨‍👩‍👧‍👦", label: "Famille proche (marié)",  desc: "Parents, frères/sœurs, grands-parents", note: "Famille proche — côté marié",    side: "B" },
  { icon: "👫",         label: "Amis proches",             desc: "Le cercle d'amis principaux",           note: "Amis proches",                  side: "both" },
  { icon: "🏢",         label: "Collègues",                desc: "Invités professionnels",                note: "Collègues",                     side: "both" },
  { icon: "🧒",         label: "Enfants",                  desc: "Les enfants de la famille",             note: "Enfant",                        side: "both", child: true },
];

// ─────────────────────────────────────────────────────────────────
// BulkImportModal
// ─────────────────────────────────────────────────────────────────
function BulkImportModal({ onClose }: { onClose: () => void }) {
  const { state, update, SIDES } = useStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"import" | "templates">("import");
  const [text, setText] = useState("");
  const [importSide, setImportSide] = useState<"A" | "B" | "both">("both");
  const [tableId, setTableId] = useState<string>("");

  const parsedNames = useMemo(() => parseBulkText(text), [text]);

  const handleImport = () => {
    if (parsedNames.length === 0) { toast("Aucun invité détecté", "err"); return; }
    const maxId = Math.max(0, ...state.guests.map((g) => g.id));
    const newGuests: Guest[] = parsedNames.map((name, idx) => ({
      id: maxId + idx + 1,
      name,
      side: importSide === "both" ? "A" : importSide,
      rsvp: "pending",
      diet: "standard",
      table: tableId ? parseInt(tableId, 10) : null,
      lodging: "",
      child: false,
      transport: false,
      gift: false,
      group: "",
      note: "",
    }));
    update("guests", [...state.guests, ...newGuests]);
    toast(`${newGuests.length} invité${newGuests.length > 1 ? "s" : ""} importé${newGuests.length > 1 ? "s" : ""} !`);
    onClose();
  };

  const handleTemplate = (tpl: GroupTemplate) => {
    const maxId = Math.max(0, ...state.guests.map((g) => g.id));
    const sideVal: "A" | "B" = tpl.side === "both" ? "A" : tpl.side;
    const newGuest: Guest = {
      id: maxId + 1,
      name: `Invité — ${tpl.label}`,
      side: sideVal,
      rsvp: "pending",
      diet: "standard",
      table: null,
      lodging: "",
      child: tpl.child ?? false,
      transport: false,
      gift: false,
      group: tpl.label,
      note: tpl.note,
    };
    update("guests", [...state.guests, newGuest]);
    toast(`Invité "${tpl.label}" ajouté`);
    onClose();
  };

  return (
    <Modal title="📥 Ajout en lot" onClose={onClose}
      footer={activeTab === "import" ? (
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" icon="upload" onClick={handleImport} disabled={parsedNames.length === 0}>
            Importer {parsedNames.length > 0 ? `${parsedNames.length} invité${parsedNames.length > 1 ? "s" : ""}` : ""}
          </Button>
        </>
      ) : (
        <Button variant="ghost" onClick={onClose}>Fermer</Button>
      )}>

      {/* Tab bar */}
      <div className="flex border-b border-line mb-5 -mx-0.5">
        {(["import", "templates"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors
              ${activeTab === t ? "border-primary text-primary" : "border-transparent text-text-2 hover:text-text"}`}>
            {t === "import" ? "Importer du texte" : "Groupes prédéfinis"}
          </button>
        ))}
      </div>

      {activeTab === "import" && (
        <div className="flex flex-col gap-4">
          <Field label="Collez vos invités ici — un nom par ligne">
            <Textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Marie Dupont\nJean-Paul Martin\nSophie & Thomas Lefebvre\nLa famille Moreau (4 personnes)"}
            />
          </Field>

          {/* Live preview */}
          {parsedNames.length > 0 && (
            <div>
              <div className="text-[12.5px] font-semibold text-text-2 mb-2">
                {parsedNames.length} invité{parsedNames.length > 1 ? "s" : ""} détecté{parsedNames.length > 1 ? "s" : ""}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-2 bg-surface-2 rounded-lg border border-line">
                {parsedNames.map((name, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-soft text-primary-700 text-[12px] font-medium border border-primary/20">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Side selector */}
          <Field label="Côté">
            <div className="flex gap-2">
              {(["A", "both", "B"] as const).map((s) => {
                const label = s === "A" ? SIDES.A : s === "B" ? SIDES.B : "Les deux";
                return (
                  <button key={s} type="button" onClick={() => setImportSide(s)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-[12.5px] font-medium transition
                      ${importSide === s ? "bg-primary text-white border-transparent" : "border-line bg-surface text-text-2 hover:border-line-strong"}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Optional table */}
          {state.tables.length > 0 && (
            <Field label="Table par défaut (optionnel)">
              <Select
                value={tableId}
                onChange={setTableId}
                options={[{ value: "", label: "Aucune" }, ...state.tables.map((t) => ({ value: String(t.id), label: t.name }))]}
              />
            </Field>
          )}
        </div>
      )}

      {activeTab === "templates" && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-text-2 mb-2">
            Cliquez sur un groupe pour créer un invité de départ avec ce tag — vous pourrez ensuite en ajouter d&apos;autres.
          </p>
          {GROUP_TEMPLATES.map((tpl, i) => (
            <button key={i} onClick={() => handleTemplate(tpl)}
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-line bg-surface hover:border-primary/40 hover:bg-primary-softer transition-all text-left group">
              <span className="text-2xl leading-none shrink-0">{tpl.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13.5px] group-hover:text-primary transition-colors">{tpl.label}</div>
                <div className="text-[12px] text-text-3 mt-0.5">{tpl.desc}</div>
              </div>
              <Icon name="plus" size={15} className="text-text-3 shrink-0 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
// (Legacy CSV import modal — kept for backwards compat)
// ─────────────────────────────────────────────────────────────────
function ImportModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  return (
    <Modal title="Importer des invités (CSV)" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" icon="upload" onClick={() => { toast("Import simulé — 12 invités détectés"); onClose(); }}>Importer</Button></>}>
      <div className="border-[1.5px] border-dashed border-line-strong rounded-md py-9 px-5 text-center text-text-2">
        <Icon name="upload" size={32} className="mx-auto text-text-3" />
        <div className="mt-2.5 font-medium">Glissez votre fichier .csv ici</div>
        <div className="text-[13px] mt-1">Colonnes attendues : Nom, Côté, Email, Régime…</div>
      </div>
      <div className="text-text-3 text-[12.5px] mt-3.5 flex gap-2 items-center"><Icon name="info" size={14} />Un modèle de fichier est disponible au téléchargement.</div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
// getTablePositions (unchanged)
// ─────────────────────────────────────────────────────────────────
function getTablePositions(count: number, shape: "round" | "rect" | "square"): Array<{ x: number; y: number }> {
  if (count === 0) return [];
  if (shape === "round") {
    const pos: Array<{ x: number; y: number }> = [];
    let idx = 0;
    for (let ring = 0; idx < count; ring++) {
      if (ring === 0) {
        pos.push({ x: 50, y: 50 });
        idx++;
      } else {
        const n = Math.min(Math.round(ring * 5.5), count - idx);
        const r = ring * 17;
        for (let i = 0; i < n && idx < count; i++) {
          const a = (i / n) * 2 * Math.PI - Math.PI / 2;
          pos.push({ x: Math.min(92, Math.max(8, 50 + r * Math.cos(a))), y: Math.min(92, Math.max(8, 50 + r * Math.sin(a))) });
          idx++;
        }
      }
    }
    return pos;
  } else {
    const cols = Math.ceil(Math.sqrt(count * (shape === "rect" ? 1.5 : 1)));
    const rows = Math.ceil(count / cols);
    const padX = 12, padY = 14;
    return Array.from({ length: count }, (_, i) => ({
      x: padX + (i % cols) / Math.max(cols - 1, 1) * (100 - 2 * padX),
      y: padY + Math.floor(i / cols) / Math.max(rows - 1, 1) * (100 - 2 * padY),
    }));
  }
}

// ─────────────────────────────────────────────────────────────────
// TableManager (unchanged)
// ─────────────────────────────────────────────────────────────────
function TableManager({ onClose }: { onClose: () => void }) {
  const { state, update } = useStore();
  const toast = useToast();
  const [newName, setNewName] = useState("");
  const [newCap, setNewCap] = useState("8");
  const [genCount, setGenCount] = useState("5");
  const [genCap, setGenCap] = useState("10");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCap, setEditCap] = useState("");

  const addOne = () => {
    if (!newName.trim()) { toast("Nom requis", "err"); return; }
    update("tables", (l) => [...l, { id: Date.now(), name: newName.trim(), capacity: Math.max(1, parseInt(newCap) || 8) }]);
    setNewName(""); setNewCap("8");
    toast("Table ajoutée");
  };

  const generate = () => {
    const n = Math.min(30, Math.max(1, parseInt(genCount) || 1));
    const cap = Math.max(1, parseInt(genCap) || 10);
    const base = state.tables.length;
    update("tables", (l) => [...l, ...Array.from({ length: n }, (_, i) => ({ id: Date.now() + i, name: `Table ${base + i + 1}`, capacity: cap }))]);
    toast(`${n} tables générées`);
  };

  const removeTable = (id: number) => {
    update("tables", (l) => l.filter((t) => t.id !== id));
    update("guests", (l) => l.map((g) => g.table === id ? { ...g, table: null } : g));
    toast("Table supprimée");
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    update("tables", (l) => l.map((t) => t.id === editId ? { ...t, name: editName.trim(), capacity: Math.max(1, parseInt(editCap) || t.capacity) } : t));
    setEditId(null);
    toast("Table modifiée");
  };

  const total = state.tables.reduce((s, t) => s + t.capacity, 0);
  const placed = state.guests.filter((g) => g.table && g.rsvp !== "declined").length;

  return (
    <Modal title="Gestion des tables" onClose={onClose}>
      <div className="p-4 rounded-lg bg-surface-2 border border-line mb-5">
        <div className="text-[13px] font-semibold mb-3">Générer des tables</div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-28"><Field label="Nombre de tables">
            <Input type="number" min={1} max={30} value={genCount} onChange={(e) => setGenCount(e.target.value)} />
          </Field></div>
          <div className="w-28"><Field label="Places par table">
            <Input type="number" min={2} max={30} value={genCap} onChange={(e) => setGenCap(e.target.value)} />
          </Field></div>
          <Button variant="secondary" icon="plus" onClick={generate}>Générer</Button>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[160px]"><Field label="Nom de la table">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Table d'honneur" onKeyDown={(e) => e.key === "Enter" && addOne()} />
        </Field></div>
        <div className="w-24"><Field label="Places">
          <Input type="number" min={1} max={50} value={newCap} onChange={(e) => setNewCap(e.target.value)} />
        </Field></div>
        <Button variant="primary" icon="plus" onClick={addOne}>Ajouter</Button>
      </div>

      <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
        {state.tables.length === 0
          ? <Empty icon="table" title="Aucune table" action={null}>Commencez par en générer ou ajouter une ci-dessus</Empty>
          : state.tables.map((t) => {
            const occ = state.guests.filter((g) => g.table === t.id && g.rsvp !== "declined").length;
            return editId === t.id ? (
              <div key={t.id} className="flex items-end gap-2 p-2.5 rounded-lg bg-primary-softer border border-primary/30 flex-wrap">
                <div className="flex-1 min-w-[140px]"><Field label="Nom">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditId(null); }} autoFocus />
                </Field></div>
                <div className="w-20"><Field label="Places">
                  <Input type="number" min={1} max={50} value={editCap} onChange={(e) => setEditCap(e.target.value)} />
                </Field></div>
                <div className="flex gap-1 pb-0.5">
                  <Button variant="primary" size="sm" onClick={saveEdit}>OK</Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditId(null)}>Annuler</Button>
                </div>
              </div>
            ) : (
              <div key={t.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-2 border border-line hover:border-line-strong transition">
                <Icon name="table" size={15} className="text-text-3 shrink-0" />
                <span className="flex-1 text-[13px] font-medium truncate">{t.name}</span>
                <span className={`font-mono text-[12px] ${occ >= t.capacity ? "text-coral font-semibold" : "text-text-2"}`}>{occ}/{t.capacity}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button className="icon-btn w-7 h-7 text-text-3" onClick={() => { setEditId(t.id); setEditName(t.name); setEditCap(String(t.capacity)); }}>
                    <Icon name="edit" size={14} />
                  </button>
                  <button className="icon-btn w-7 h-7 text-text-3 hover:text-coral" onClick={() => removeTable(t.id)}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {state.tables.length > 0 && (
        <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[12.5px] text-text-2">
          <span>{state.tables.length} tables · {total} places au total</span>
          <span className={placed > total ? "text-coral" : ""}>{placed} invités placés</span>
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
// TablePlan (unchanged — do NOT modify)
// ─────────────────────────────────────────────────────────────────
function TablePlan() {
  const { state, update } = useStore();
  const toast = useToast();
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<number | "pool" | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [managing, setManaging] = useState(false);
  const [roomShape, setRoomShape] = useState<"round" | "rect" | "square">(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("jj_room_shape") as "round" | "rect" | "square") || "rect";
    return "rect";
  });

  const assignable = state.guests.filter((g) => g.rsvp !== "declined");
  const pool = assignable.filter((g) => !g.table);
  const move = (gid: number, tid: number | null) => update("guests", (l) => l.map((x) => x.id === gid ? { ...x, table: tid } : x));

  const setShape = (s: "round" | "rect" | "square") => {
    setRoomShape(s);
    localStorage.setItem("jj_room_shape", s);
  };

  const positions = useMemo(() => getTablePositions(state.tables.length, roomShape), [state.tables.length, roomShape]);

  const roomContainerClass = roomShape === "round"
    ? "rounded-full aspect-square"
    : roomShape === "square"
    ? "rounded-xl aspect-square"
    : "rounded-2xl";

  const selectedT = state.tables.find((t) => t.id === selectedTable);
  const selectedSeats = selectedT ? assignable.filter((g) => g.table === selectedT.id) : [];

  return (
    <div>
      {/* Config bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-3.5 rounded-card bg-surface-2 border border-line">
        <span className="text-[13px] font-semibold text-text-2">Salle :</span>
        {(["round", "rect", "square"] as const).map((s) => {
          const labels: Record<string, string> = { round: "Ronde", rect: "Rectangle", square: "Carrée" };
          return (
            <button key={s} onClick={() => setShape(s)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium border transition-all ${roomShape === s ? "bg-text text-bg border-transparent shadow-sm" : "border-line text-text-2 hover:border-line-strong bg-surface"}`}>
              {labels[s]}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12.5px] text-text-3">
            {assignable.filter((g) => g.table).length}/{assignable.length} placés
            {pool.length > 0 && <span className="text-amber ml-1">· {pool.length} à placer</span>}
          </span>
          <Button variant="secondary" size="sm" icon="settings" onClick={() => setManaging(true)}>Tables</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">
        {/* Guest pool + selected table detail */}
        <div className="lg:sticky lg:top-20 flex flex-col gap-3">
          <Card>
            <div className="sec-title mb-3">
              <Icon name="users" size={16} className="text-text-3" />
              À placer <Badge tone={pool.length > 0 ? "amber" : "sage"}>{pool.length}</Badge>
            </div>
            <div
              className={`flex flex-col gap-1.5 max-h-[45vh] overflow-y-auto p-0.5 rounded-lg transition ${over === "pool" ? "ring-2 ring-primary bg-primary-softer" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setOver("pool"); }}
              onDragLeave={() => setOver((o) => o === "pool" ? null : o)}
              onDrop={() => { if (dragId) { move(dragId, null); toast("Retiré de la table"); } setOver(null); setDragId(null); }}>
              {pool.length === 0
                ? <div className="text-[12.5px] text-sage font-medium text-center py-3 border border-dashed border-sage/40 rounded-lg">Tous les invités sont placés</div>
                : pool.map((g) => (
                  <div key={g.id} draggable
                    onDragStart={() => setDragId(g.id)}
                    onDragEnd={() => { setDragId(null); setOver(null); }}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md border border-line bg-surface text-[13px] cursor-grab hover:border-primary/40 hover:shadow-xs transition select-none ${dragId === g.id ? "opacity-40 scale-95" : ""}`}>
                    <Avatar name={g.name} side={g.side} size="sm" />
                    <span className="truncate flex-1">{g.name}</span>
                    <Icon name="drag" size={15} className="text-text-3 shrink-0" />
                  </div>
                ))}
            </div>
          </Card>

          {selectedT && (
            <Card>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-[14px]">{selectedT.name}</div>
                  <div className={`text-[12px] mt-0.5 ${selectedSeats.length >= selectedT.capacity ? "text-coral" : "text-text-2"}`}>
                    {selectedSeats.length}/{selectedT.capacity} places
                  </div>
                </div>
                <button onClick={() => setSelectedTable(null)} className="icon-btn w-7 h-7 text-text-3">
                  <Icon name="x" size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-1.5 max-h-[35vh] overflow-y-auto">
                {selectedSeats.map((g) => (
                  <div key={g.id} draggable onDragStart={() => setDragId(g.id)} onDragEnd={() => setDragId(null)}
                    className="group flex items-center gap-2 text-[12.5px] px-2.5 py-2 rounded-md bg-surface-2 cursor-grab select-none">
                    <Avatar name={g.name} side={g.side} size="sm" />
                    <span className="truncate flex-1">{g.name}</span>
                    <button className="icon-btn w-6 h-6 opacity-0 group-hover:opacity-100 text-text-3 hover:text-coral" onClick={() => { move(g.id, null); toast("Retiré de la table"); }}>
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, selectedT.capacity - selectedSeats.length) }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] text-text-3 px-2.5 py-1.5 rounded-md border border-dashed border-line">
                    <div className="w-6 h-6 rounded-full border border-line bg-surface-3 shrink-0" />
                    Place libre
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Visual room */}
        <div id="seating-plan-export">
          {state.tables.length === 0 ? (
            <Empty icon="table" title="Aucune table configurée" action={
              <Button variant="primary" icon="plus" onClick={() => setManaging(true)}>Configurer les tables</Button>
            }>
              Ajoutez des tables depuis le bouton en haut à droite ou ci-dessous
            </Empty>
          ) : (
            <>
              <div className={`relative bg-gradient-to-br from-surface-2 to-surface-3 border-2 border-line-strong ${roomContainerClass} w-full overflow-hidden`} style={{ minHeight: 380 }}>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-text-3 font-medium tracking-widest uppercase pointer-events-none">
                  {roomShape === "round" ? "Salle ronde" : roomShape === "square" ? "Salle carrée" : "Salle rectangle"}
                </div>

                {state.tables.map((t, i) => {
                  const pos = positions[i] ?? { x: 50, y: 50 };
                  const seats = assignable.filter((g) => g.table === t.id);
                  const pct = t.capacity > 0 ? seats.length / t.capacity : 0;
                  const full = seats.length >= t.capacity;
                  const isSelected = selectedTable === t.id;
                  const isOver = over === t.id;
                  const r = 34;
                  const circ = 2 * Math.PI * r;

                  return (
                    <div key={t.id} className="absolute"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
                      onDragOver={(e) => { e.preventDefault(); setOver(t.id); }}
                      onDragLeave={() => setOver((o) => o === t.id ? null : o)}
                      onDrop={() => { if (dragId) { move(dragId, t.id); toast(`Placé à ${t.name}`); } setOver(null); setDragId(null); }}>
                      <button onClick={() => setSelectedTable(isSelected ? null : t.id)}
                        className={`relative flex flex-col items-center justify-center rounded-full transition-all duration-150 select-none ${isOver ? "scale-110" : isSelected ? "scale-105" : "hover:scale-105"}`}
                        style={{ width: 76, height: 76 }}>
                        <div className={`absolute inset-0 rounded-full transition-all ${isOver ? "bg-primary-soft border-2 border-primary" : isSelected ? "bg-surface border-2 border-primary shadow-lg shadow-primary/20" : full ? "bg-coral-soft border-2 border-coral/60" : "bg-surface border-2 border-line-strong"}`} />
                        <svg className="absolute inset-0" width={76} height={76} style={{ transform: "rotate(-90deg)" }}>
                          <circle cx={38} cy={38} r={r} fill="none" stroke="var(--line)" strokeWidth={2} />
                          {pct > 0 && (
                            <circle cx={38} cy={38} r={r} fill="none"
                              stroke={full ? "var(--coral)" : "var(--primary)"}
                              strokeWidth={3.5} strokeLinecap="round"
                              strokeDasharray={`${pct * circ} ${circ}`}
                              className="transition-all duration-300" />
                          )}
                        </svg>
                        <span className={`relative z-[1] font-bold text-[16px] leading-none ${full ? "text-coral" : isOver || isSelected ? "text-primary" : ""}`}>{seats.length}</span>
                        <span className="relative z-[1] text-[10px] text-text-3 leading-none mt-0.5">/{t.capacity}</span>
                      </button>
                      <div className={`text-[10.5px] font-medium text-center mt-1.5 max-w-[90px] truncate leading-tight ${isSelected ? "text-primary font-semibold" : "text-text-2"}`}>
                        {t.name}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11.5px] text-text-3">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full border-2 border-primary" />Sélectionnée / survol</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-coral-soft border-2 border-coral/60" />Pleine</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-surface border-2 border-line-strong" />Disponible</span>
                <span className="ml-auto">Glissez-déposez les invités sur les tables</span>
              </div>
            </>
          )}
        </div>
      </div>

      {managing && <TableManager onClose={() => setManaging(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Lodging (unchanged)
// ─────────────────────────────────────────────────────────────────
function Lodging() {
  const { state } = useStore();
  const options = [
    { id: "sur place", label: "Sur place — Domaine", icon: "home", capacity: 14 },
    { id: "hôtel", label: "Hôtel partenaire", icon: "bed", capacity: 20 },
  ];
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
      {options.map((o) => {
        const used = state.guests.filter((g) => g.lodging === o.id && g.rsvp !== "declined").length;
        return (
          <Card key={o.id} className="p-[18px]">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center bg-primary-soft text-primary-700"><Icon name={o.icon} size={20} /></div>
              <div><div className="font-semibold text-sm">{o.label}</div><div className="text-text-2 text-[12.5px]">{used} / {o.capacity} places</div></div>
            </div>
            <div className="flex gap-1 my-3">{Array.from({ length: o.capacity }).map((_, i) => <span key={i} className={`flex-1 h-[7px] rounded-[3px] ${i < used ? "bg-sage" : "bg-surface-3"}`} />)}</div>
            <div className="text-text-2 text-[12.5px]">{o.capacity - used} place{o.capacity - used > 1 ? "s" : ""} restante{o.capacity - used > 1 ? "s" : ""}</div>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// GroupsTab
// ─────────────────────────────────────────────────────────────────
function GroupsTab({ onViewGroup }: { onViewGroup: (groupName: string) => void }) {
  const { state, update, SIDES } = useStore();
  const toast = useToast();

  // Derive unique group names
  const groups = useMemo(() => {
    const names = new Set<string>();
    state.guests.forEach((g) => { if (g.group && g.group.trim()) names.add(g.group.trim()); });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [state.guests]);

  const withGroup = state.guests.filter((g) => g.group && g.group.trim()).length;
  const withoutGroup = state.guests.length - withGroup;

  // Inline rename state: key = current group name, value = draft
  const [renaming, setRenaming] = useState<Record<string, string>>({});

  const startRename = (name: string) => {
    setRenaming((prev) => ({ ...prev, [name]: name }));
  };

  const commitRename = (oldName: string) => {
    const newName = (renaming[oldName] ?? "").trim();
    if (!newName || newName === oldName) {
      setRenaming((prev) => { const n = { ...prev }; delete n[oldName]; return n; });
      return;
    }
    update("guests", (list) =>
      list.map((g) => g.group === oldName ? { ...g, group: newName } : g)
    );
    toast(`Groupe renommé en "${newName}"`);
    setRenaming((prev) => { const n = { ...prev }; delete n[oldName]; return n; });
  };

  const cancelRename = (name: string) => {
    setRenaming((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  // Build card data for a group name (pass null for "Autres")
  const buildCard = (groupName: string | null) => {
    const members = groupName === null
      ? state.guests.filter((g) => !g.group || !g.group.trim())
      : state.guests.filter((g) => g.group === groupName);
    const confirmed = members.filter((g) => g.rsvp === "yes").length;
    const sideA = members.filter((g) => g.side === "A").length;
    const sideB = members.filter((g) => g.side === "B").length;
    const preview = members.slice(0, 5);
    const extra = Math.max(0, members.length - 5);
    return { members, confirmed, sideA, sideB, preview, extra };
  };

  if (state.guests.length === 0 || groups.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        {/* Stats row — always visible */}
        <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-card overflow-hidden">
          {[
            { v: groups.length, l: "Groupes" },
            { v: withGroup, l: "Avec groupe" },
            { v: withoutGroup, l: "Sans groupe" },
          ].map((it, i) => (
            <div key={i} className="bg-surface px-4 py-4 flex flex-col gap-0.5">
              <span className="font-mono text-2xl font-semibold tracking-[-.02em]">{it.v}</span>
              <span className="text-[12.5px] text-text-2">{it.l}</span>
            </div>
          ))}
        </div>
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center">
              <Icon name="users" size={26} className="text-primary-700" />
            </div>
            <div>
              <div className="font-semibold text-[16px] mb-2">Aucun groupe défini</div>
              <p className="text-text-2 text-[13.5px] max-w-[380px] leading-relaxed">
                Assignez des groupes à vos invités pour les organiser (famille, amis, collègues…).<br />
                Ouvrez la fiche d&apos;un invité et renseignez le champ <strong>Groupe familial</strong>.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-card overflow-hidden">
        {[
          { v: groups.length, l: "Groupes" },
          { v: withGroup, l: "Avec groupe" },
          { v: withoutGroup, l: "Sans groupe" },
        ].map((it, i) => (
          <div key={i} className="bg-surface px-4 py-4 flex flex-col gap-0.5">
            <span className="font-mono text-2xl font-semibold tracking-[-.02em]">{it.v}</span>
            <span className="text-[12.5px] text-text-2">{it.l}</span>
          </div>
        ))}
      </div>

      {/* Group cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {groups.map((groupName) => {
          const { members, confirmed, sideA, sideB, preview, extra } = buildCard(groupName);
          const isRenaming = groupName in renaming;

          return (
            <Card key={groupName} className="p-4 flex flex-col gap-3">
              {/* Header: group name (editable) */}
              <div className="flex items-start justify-between gap-2">
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renaming[groupName]}
                    onChange={(e) =>
                      setRenaming((prev) => ({ ...prev, [groupName]: e.target.value }))
                    }
                    onBlur={() => commitRename(groupName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(groupName);
                      if (e.key === "Escape") cancelRename(groupName);
                    }}
                    className="flex-1 text-[15px] font-semibold bg-surface-2 border border-primary rounded-md px-2 py-0.5 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                ) : (
                  <button
                    type="button"
                    title="Cliquez pour renommer"
                    onClick={() => startRename(groupName)}
                    className="flex-1 text-left text-[15px] font-semibold hover:text-primary transition-colors truncate"
                  >
                    {groupName}
                  </button>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {!isRenaming && (
                    <button
                      type="button"
                      onClick={() => startRename(groupName)}
                      className="icon-btn w-7 h-7 text-text-3 hover:text-primary"
                      title="Renommer"
                    >
                      <Icon name="edit" size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Confirmed / total */}
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] text-text-2">
                  <span className="font-semibold text-sage">{confirmed}</span>
                  <span className="text-text-3"> / {members.length} confirmés</span>
                </span>
                <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sage rounded-full transition-all"
                    style={{ width: members.length > 0 ? `${(confirmed / members.length) * 100}%` : "0%" }}
                  />
                </div>
              </div>

              {/* Side breakdown */}
              <div className="text-[12px] text-text-3">
                {SIDES.A}: <span className="font-semibold text-text">{sideA}</span>
                {" · "}
                {SIDES.B}: <span className="font-semibold text-text">{sideB}</span>
              </div>

              {/* Guest name pills */}
              <div className="flex flex-wrap gap-1.5">
                {preview.map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-2 border border-line text-[11.5px] text-text-2 font-medium truncate max-w-[140px]"
                  >
                    {g.name}
                  </span>
                ))}
                {extra > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-3 text-[11.5px] text-text-3 font-medium">
                    +{extra} autres
                  </span>
                )}
              </div>

              {/* View button */}
              <div className="pt-1 border-t border-line">
                <Button
                  variant="secondary"
                  size="sm"
                  icon="users"
                  onClick={() => onViewGroup(groupName)}
                >
                  Voir ce groupe
                </Button>
              </div>
            </Card>
          );
        })}

        {/* "Autres" card for guests without a group */}
        {withoutGroup > 0 && (() => {
          const { members, confirmed, sideA, sideB, preview, extra } = buildCard(null);
          return (
            <Card key="__autres__" className="p-4 flex flex-col gap-3 border-dashed">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[15px] font-semibold text-text-2">Autres</span>
                <Badge tone="neutral">{members.length}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[12.5px] text-text-2">
                  <span className="font-semibold text-sage">{confirmed}</span>
                  <span className="text-text-3"> / {members.length} confirmés</span>
                </span>
                <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sage rounded-full transition-all"
                    style={{ width: members.length > 0 ? `${(confirmed / members.length) * 100}%` : "0%" }}
                  />
                </div>
              </div>

              <div className="text-[12px] text-text-3">
                {SIDES.A}: <span className="font-semibold text-text">{sideA}</span>
                {" · "}
                {SIDES.B}: <span className="font-semibold text-text">{sideB}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {preview.map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-2 border border-line text-[11.5px] text-text-2 font-medium truncate max-w-[140px]"
                  >
                    {g.name}
                  </span>
                ))}
                {extra > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-3 text-[11.5px] text-text-3 font-medium">
                    +{extra} autres
                  </span>
                )}
              </div>

              <div className="pt-1 border-t border-line">
                <Button
                  variant="secondary"
                  size="sm"
                  icon="users"
                  onClick={() => onViewGroup("__no_group__")}
                >
                  Voir ces invités
                </Button>
              </div>
            </Card>
          );
        })()}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// GuestsPage
// ─────────────────────────────────────────────────────────────────
export default function GuestsPage() {
  const { state, update, SIDES } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("list");
  const [view, setView] = useState<"table" | "cards">("table");
  const [q, setQ] = useState("");
  const [side, setSide] = useState<"all" | "A" | "B">("all");
  const [rsvp, setRsvp] = useState("all");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [importing, setImporting] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  // Group filter: set when navigating from GroupsTab → list
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const exportCSV = () => {
    const rows = state.guests.map((g) => ({
      "Nom": g.name,
      "Côté": g.side === "A" ? state.wedding.partnerA : state.wedding.partnerB,
      "RSVP": g.rsvp === "yes" ? "Confirmé" : g.rsvp === "declined" ? "Décliné" : "En attente",
      "Régime": g.diet || "Standard",
      "Enfant": g.child ? "Oui" : "Non",
      "Table": g.table ?? "",
      "Groupe": g.group || "",
      "Note": g.note || "",
    }));
    const csv = Papa.unparse(rows, { delimiter: ";", quotes: true });
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invités-${state.wedding.partnerA}-${state.wedding.partnerB}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Liste exportée en CSV");
  };

  const downloadTemplate = () => {
    const template = Papa.unparse([
      { "Nom": "Exemple: Marie Dupont", "Côté": state.wedding.partnerA, "RSVP": "En attente", "Régime": "Standard", "Enfant": "Non", "Groupe": "Famille", "Note": "" },
    ], { delimiter: ";", quotes: true });
    const blob = new Blob(["﻿" + template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "modele-invites.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        const wId = getWeddingId();
        let imported = 0;

        for (const row of rows) {
          const name = row["Nom"] || row["name"] || row["Name"] || "";
          if (!name.trim()) continue;

          const sideRaw = (row["Côté"] || row["side"] || row["Side"] || "A").toLowerCase();
          const guestSide: "A" | "B" = (sideRaw === "b" || sideRaw === state.wedding.partnerB.toLowerCase()) ? "B" : "A";
          const rsvpRaw = (row["RSVP"] || row["rsvp"] || "").toLowerCase();
          const guestRsvp: "yes" | "pending" | "declined" =
            rsvpRaw === "yes" || rsvpRaw === "oui" || rsvpRaw === "confirmé" ? "yes"
            : rsvpRaw === "no" || rsvpRaw === "non" || rsvpRaw === "décliné" ? "declined"
            : "pending";

          const newGuest: Guest = {
            id: Date.now() + imported,
            name: name.trim(),
            side: guestSide,
            rsvp: guestRsvp,
            diet: (row["Régime"] || row["diet"] || "standard") as Diet,
            table: null,
            lodging: row["Hébergement"] || row["lodging"] || "",
            child: ["oui", "yes", "true", "1"].includes((row["Enfant"] || row["child"] || "").toLowerCase()),
            transport: false,
            gift: false,
            group: row["Groupe"] || row["group"] || "",
            note: row["Note"] || row["note"] || "",
          };

          if (wId) {
            const { data } = await createClient().from("guests").insert({
              ...newGuest,
              table_id: null,
              wedding_id: wId,
            }).select("id").single();
            if (data) newGuest.id = (data as { id: number }).id;
          }

          update("guests", (prev) => [...prev, newGuest]);
          imported++;
        }

        toast(`${imported} invité${imported > 1 ? "s" : ""} importé${imported > 1 ? "s" : ""}`);
        setCsvImporting(false);
        e.target.value = "";
      },
      error: () => {
        toast("Erreur lors de l'import CSV", "err");
        setCsvImporting(false);
      }
    });
  };

  const filtered = useMemo(() => state.guests.filter((g) => {
    if (groupFilter !== null) {
      if (groupFilter === "__no_group__") {
        if (g.group && g.group.trim()) return false;
      } else {
        if (g.group !== groupFilter) return false;
      }
    }
    return (
      (q === "" || g.name.toLowerCase().includes(q.toLowerCase()) || g.group.toLowerCase().includes(q.toLowerCase())) &&
      (side === "all" || g.side === side) &&
      (rsvp === "all" || g.rsvp === rsvp)
    );
  }), [state.guests, q, side, rsvp, groupFilter]);

  const newGuest: Guest = { id: 0, name: "", side: "A", rsvp: "pending", diet: "standard", table: null, lodging: "", child: false, transport: false, gift: false, group: "", note: "" };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">
      <PageHead title="Invités" sub={`${state.guests.length} personnes · ${state.guests.filter((g) => g.rsvp === "yes").length} confirmées`}
        actions={<>
          <Button variant="ghost" size="sm" onClick={downloadTemplate}>Modèle CSV</Button>
          <Button variant="secondary" icon="download" onClick={exportCSV}>Exporter CSV</Button>
          <Button variant="secondary" icon="upload" onClick={() => csvInputRef.current?.click()} disabled={csvImporting}>
            {csvImporting ? "Import…" : "Importer CSV"}
          </Button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVImport}
          />
          <Button variant="secondary" icon="mail" onClick={() => toast(`Rappels RSVP envoyés à ${state.guests.filter((g) => g.rsvp === "pending").length} invités`)}>Relancer les RSVP</Button>
          <Button variant="secondary" icon="download" onClick={() => exportGuestListPDF(state.guests, state.wedding.partnerA, state.wedding.partnerB)}>Export PDF</Button>
          <Button variant="secondary" icon="download" onClick={() => exportSeatingListPDF(state.guests, state.tables, state.wedding.partnerA || "A", state.wedding.partnerB || "B")}>Plan de table PDF</Button>
          <Button variant="secondary" icon="download" onClick={() => exportPlaceCardsPDF(state.guests, state.tables, state.wedding.partnerA || "A", state.wedding.partnerB || "B")}>Cartons placement</Button>
          <Button variant="secondary" icon="download" onClick={() => exportElementAsPNG("seating-plan-export", "plan-de-table.png")}>Exporter PNG</Button>
          <Button variant="secondary" onClick={() => setBulkImporting(true)}>📥 Ajout en lot</Button>
          <Button variant="primary" icon="plus" onClick={() => setEditing(newGuest)}>Ajouter</Button>
        </>} />

      <PageTutorial pageId="guests" title="Comment gérer vos invités ?"
        steps={[
          { icon: "users", title: "Ajoutez vos invités", desc: "Renseignez le côté famille, le groupe et les besoins spéciaux (régime, hébergement, transport)." },
          { icon: "mail", title: "Suivez les RSVP", desc: "Filtrez par statut pour relancer rapidement les invités en attente de réponse." },
          { icon: "table", title: "Plan de table", desc: "Glissez-déposez vos invités sur les tables dans l'onglet Plan de table." },
        ]} />

      <ScrollReveal delay={0}>
        <div className="mb-5"><Counters /></div>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
      <div className="mb-5"><Tabs value={tab} onChange={(t) => { setTab(t); if (t !== "list") { setGroupFilter(null); } }} tabs={[{ id: "list", label: "Liste" }, { id: "groups", label: "Groupes" }, { id: "plan", label: "Plan de table" }, { id: "lodge", label: "Hébergements" }]} /></div>
      </ScrollReveal>

      {tab === "list" && <>
        {groupFilter !== null && (
          <div className="flex items-center gap-2.5 mb-3 px-3.5 py-2.5 rounded-card bg-primary-soft border border-primary/20 text-[13px]">
            <Icon name="users" size={15} className="text-primary-700 shrink-0" />
            <span className="flex-1 font-medium text-primary-700">
              Filtre actif : groupe <strong>{groupFilter === "__no_group__" ? "Autres (sans groupe)" : groupFilter}</strong>
            </span>
            <button
              type="button"
              onClick={() => setGroupFilter(null)}
              className="icon-btn w-7 h-7 text-primary-700 hover:text-primary"
              title="Supprimer le filtre"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        )}
        <ScrollReveal delay={0.1}>
        <div className="flex items-center gap-2.5 flex-wrap mb-4">
          <Search value={q} onChange={setQ} placeholder="Rechercher un invité, un groupe…" className="flex-1 min-w-[200px]" />
          <Segmented value={side} onChange={setSide} options={[{ value: "all", label: "Tous" }, { value: "A", label: SIDES.A }, { value: "B", label: SIDES.B }]} />
          {Object.entries(RSVP).map(([k, x]) => (
            <button key={k} onClick={() => setRsvp(rsvp === k ? "all" : k)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-[13px] font-medium transition ${rsvp === k ? "bg-primary-soft border-transparent text-primary-700" : "bg-surface border-line-strong text-text-2 hover:border-text-3"}`}>
              <span className="w-2 h-2 rounded-[3px]" style={{ background: x.dot }} />{x.label}
            </button>
          ))}
          <div className="flex-1" />
          <Segmented value={view} onChange={setView} options={[{ value: "table", icon: "table" }, { value: "cards", icon: "grid" }]} />
        </div>

        {filtered.length === 0 ? (
          <Card>
            {state.guests.length === 0 ? (
              <div className="flex flex-col items-center gap-5 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center">
                  <Icon name="users" size={30} className="text-primary-700" />
                </div>
                <div>
                  <div className="font-semibold text-xl mb-2">Qui invitez-vous ?</div>
                  <p className="text-text-2 text-[14px] max-w-[360px] leading-relaxed">
                    Construisez votre liste d&apos;invités et suivez les confirmations (RSVP), les régimes alimentaires et le plan de table depuis un seul endroit.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3 w-full max-w-[280px]">
                  <Button variant="primary" icon="plus" block onClick={() => setEditing(newGuest)}>Ajouter mon premier invité</Button>
                  <Button variant="secondary" block onClick={() => setBulkImporting(true)}>📥 Ajouter en lot</Button>
                  <Button variant="secondary" icon="upload" block onClick={() => setImporting(true)}>Importer une liste CSV</Button>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-text-3">
                  <Icon name="info" size={13} />
                  Conseil : commencez par votre liste A, les incontournables.
                </div>
              </div>
            ) : (
              <Empty icon="users" title="Aucun invité trouvé">Modifiez vos filtres pour afficher d&apos;autres invités.</Empty>
            )}
          </Card>
        )
          : view === "table" ? (
            <div className="overflow-x-auto border border-line rounded-card bg-surface">
              <table className="w-full border-collapse text-[13.5px] min-w-[760px]">
                <thead><tr className="[&>th]:text-left [&>th]:text-[11.5px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-text-3 [&>th]:px-3.5 [&>th]:py-3 [&>th]:border-b [&>th]:border-line [&>th]:bg-surface-2 [&>th]:whitespace-nowrap">
                  <th>Nom</th><th>Côté</th><th>RSVP</th><th>Régime</th><th>Table</th><th>Hébergement</th><th>Enfant</th><th>Transport</th><th>Cadeau</th><th>Notes</th>
                </tr></thead>
                <tbody>
                  {filtered.map((g) => (
                    <tr key={g.id} onClick={() => setEditing(g)} className="group cursor-pointer hover:bg-hover [&>td]:px-3.5 [&>td]:py-2.5 [&>td]:border-b [&>td]:border-line">
                      <td><span className="flex items-center gap-2.5 font-medium whitespace-nowrap">
                        <Avatar name={g.name} side={g.side} size="sm" />{g.name}
                        {g.rsvpToken && <button className="icon-btn w-6 h-6 opacity-0 group-hover:opacity-100 text-text-3 hover:text-primary ml-1" title="Copier lien RSVP"
                          onClick={(e) => { e.stopPropagation(); if (typeof window !== "undefined") { navigator.clipboard.writeText(`${window.location.origin}/rsvp/${g.rsvpToken}`); } toast("Lien RSVP copié !"); }}>
                          <Icon name="link" size={13} />
                        </button>}
                      </span></td>
                      <td>{g.side === "A" ? SIDES.A : SIDES.B}</td>
                      <td><Badge tone={RSVP[g.rsvp].tone} dot>{RSVP[g.rsvp].label}</Badge></td>
                      <td>
                        {g.diet === "none" || !g.diet
                          ? <span className="text-text-3">—</span>
                          : <span className="inline-flex items-center gap-1 text-[12.5px]">
                              <span>{dietEmoji(g.diet)}</span>
                              <span>{dietLabel(g.diet)}</span>
                            </span>
                        }
                      </td>
                      <td>{g.table ? state.tables.find((t) => t.id === g.table)?.name : <span className="text-text-3">—</span>}</td>
                      <td>{g.lodging || <span className="text-text-3">—</span>}</td>
                      <td>{g.child ? <Icon name="check" size={16} className="text-sage" /> : <span className="text-text-3">—</span>}</td>
                      <td>{g.transport ? <Icon name="check" size={16} className="text-sage" /> : <span className="text-text-3">—</span>}</td>
                      <td>{g.gift ? <Icon name="check" size={16} className="text-sage" /> : <span className="text-text-3">—</span>}</td>
                      <td><span className="text-text-3 text-[12.5px] max-w-[160px] truncate inline-block">{g.note || "—"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-3">
              {filtered.map((g) => (
                <Card key={g.id} hover className="p-4 flex flex-col gap-3" onClick={() => setEditing(g)}>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={g.name} side={g.side} />
                    <div className="min-w-0"><div className="text-[14.5px] font-semibold">{g.name}</div><div className="text-xs text-text-3">{g.group || (g.side === "A" ? SIDES.A : SIDES.B)}</div></div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={RSVP[g.rsvp].tone} dot>{RSVP[g.rsvp].label}</Badge>
                    {g.diet && g.diet !== "none" && <Badge tone="gold">{dietEmoji(g.diet)} {dietLabel(g.diet)}</Badge>}
                    {g.child && <Badge tone="primary" icon="baby">Enfant</Badge>}
                    {g.table && <Badge tone="neutral" icon="table">{state.tables.find((t) => t.id === g.table)?.name}</Badge>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollReveal>
      </>}

      {tab === "groups" && (
        <GroupsTab
          onViewGroup={(groupName) => {
            setGroupFilter(groupName);
            setTab("list");
          }}
        />
      )}
      {tab === "plan" && <TablePlan />}
      {tab === "lodge" && <Lodging />}

      {editing && <GuestDrawer guest={editing} onClose={() => setEditing(null)} />}
      {importing && <ImportModal onClose={() => setImporting(false)} />}
      {bulkImporting && <BulkImportModal onClose={() => setBulkImporting(false)} />}
    </div>
  );
}

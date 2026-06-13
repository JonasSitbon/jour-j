"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Empty, Drawer, Field, Select, Modal } from "@/components/ui";
import { PageHead } from "@/components/shell";
import {
  getWeddingId,
  loadContacts,
  addContact,
  updateContact,
  deleteContact,
} from "@/lib/db";
import type { KeyContact, ContactRole } from "@/lib/types";

// ── Role config ────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  ContactRole,
  { label: string; icon: string; colorClass: string }
> = {
  "temoin-a": {
    label: "Témoin côté A",
    icon: "heart",
    colorClass: "bg-primary-soft text-primary-700",
  },
  "temoin-b": {
    label: "Témoin côté B",
    icon: "heart",
    colorClass: "bg-primary-soft text-primary-700",
  },
  officiant: {
    label: "Officiant(e)",
    icon: "rings",
    colorClass: "bg-amber-soft text-[var(--gold-ink)]",
  },
  traiteur: {
    label: "Traiteur",
    icon: "cake",
    colorClass: "bg-orange-100 text-orange-700",
  },
  photographe: {
    label: "Photographe",
    icon: "camera",
    colorClass: "bg-purple-100 text-purple-700",
  },
  videaste: {
    label: "Vidéaste",
    icon: "camera",
    colorClass: "bg-purple-100 text-purple-700",
  },
  fleuriste: {
    label: "Fleuriste",
    icon: "flower",
    colorClass: "bg-green-100 text-green-700",
  },
  chauffeur: {
    label: "Chauffeur",
    icon: "car",
    colorClass: "bg-surface-3 text-text-2",
  },
  organisatrice: {
    label: "Wedding planner",
    icon: "star",
    colorClass: "bg-gold-soft text-[var(--gold-ink)]",
  },
  "famille-a": {
    label: "Famille côté A",
    icon: "users",
    colorClass: "bg-surface-3 text-text-2",
  },
  "famille-b": {
    label: "Famille côté B",
    icon: "users",
    colorClass: "bg-surface-3 text-text-2",
  },
  autre: {
    label: "Autre",
    icon: "user",
    colorClass: "bg-surface-3 text-text-2",
  },
};

const ROLE_OPTIONS = Object.entries(ROLE_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}));

// Role sort order for grouping
const ROLE_ORDER: ContactRole[] = [
  "temoin-a",
  "temoin-b",
  "officiant",
  "organisatrice",
  "photographe",
  "videaste",
  "traiteur",
  "fleuriste",
  "chauffeur",
  "famille-a",
  "famille-b",
  "autre",
];

// ── Quick-add presets ──────────────────────────────────────────────────────

interface Preset {
  role: ContactRole;
  isBridalParty: boolean;
  label: string;
  hint: string;
}

const PRESETS: Preset[] = [
  {
    role: "temoin-a",
    isBridalParty: true,
    label: "Témoin côté A",
    hint: "Votre témoin",
  },
  {
    role: "temoin-b",
    isBridalParty: true,
    label: "Témoin côté B",
    hint: "Témoin de votre partenaire",
  },
  {
    role: "officiant",
    isBridalParty: false,
    label: "Officiant(e)",
    hint: "Célébrant de la cérémonie",
  },
  {
    role: "traiteur",
    isBridalParty: false,
    label: "Traiteur",
    hint: "Contact sur site le Jour J",
  },
  {
    role: "photographe",
    isBridalParty: false,
    label: "Photographe",
    hint: "Photographe officiel",
  },
  {
    role: "organisatrice",
    isBridalParty: false,
    label: "Wedding planner",
    hint: "Coordinatrice du mariage",
  },
];

// ── Empty form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  role: "autre" as ContactRole,
  phone: "",
  email: "",
  note: "",
  isBridalParty: false,
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

// ── Contact Card ───────────────────────────────────────────────────────────

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: KeyContact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cfg = ROLE_CONFIG[contact.role] ?? ROLE_CONFIG.autre;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <Card className="!p-4 flex flex-col gap-3 group h-full">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Role icon badge */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.colorClass}`}
          >
            <Icon name={cfg.icon} size={18} strokeWidth={1.8} />
          </div>

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-text truncate leading-tight">
              {contact.name}
            </div>
            <div className="text-[12.5px] text-text-2 mt-0.5">{cfg.label}</div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-medium ${cfg.colorClass}`}
          >
            <Icon name={cfg.icon} size={11} strokeWidth={2} />
            {cfg.label}
          </span>
          {contact.isBridalParty && (
            <Badge tone="primary" icon="heart">
              Jour J
            </Badge>
          )}
        </div>

        {/* Contact details */}
        <div className="flex flex-col gap-1.5">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-[13px] text-text-2 hover:text-primary transition-colors group/link"
            >
              <Icon
                name="phone"
                size={13}
                className="text-text-3 group-hover/link:text-primary transition-colors shrink-0"
              />
              <span className="truncate">{contact.phone}</span>
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-[13px] text-text-2 hover:text-primary transition-colors group/link"
            >
              <Icon
                name="mail"
                size={13}
                className="text-text-3 group-hover/link:text-primary transition-colors shrink-0"
              />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {!contact.phone && !contact.email && (
            <span className="text-[12px] text-text-3 italic">Aucun contact renseigné</span>
          )}
        </div>

        {/* Note */}
        {contact.note && (
          <p className="text-[12px] text-text-3 leading-relaxed line-clamp-2 italic">
            {contact.note}
          </p>
        )}

        {/* Action row — visible on hover */}
        <div className="flex items-center gap-1 mt-auto pt-2 border-t border-line opacity-0 group-hover:opacity-100 transition-opacity">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              title="Appeler"
              className="icon-btn w-8 h-8 text-text-3 hover:text-primary"
            >
              <Icon name="phone" size={15} />
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              title="Envoyer un email"
              className="icon-btn w-8 h-8 text-text-3 hover:text-primary"
            >
              <Icon name="mail" size={15} />
            </a>
          )}
          <button
            title="Modifier"
            onClick={onEdit}
            className="icon-btn w-8 h-8 ml-auto"
          >
            <Icon name="edit" size={15} />
          </button>
          <button
            title="Supprimer"
            onClick={onDelete}
            className="icon-btn w-8 h-8 text-coral hover:bg-coral-soft"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────

function SectionHeading({
  icon,
  title,
  count,
}: {
  icon: string;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon name={icon} size={17} className="text-text-3" />
      <span className="text-[15px] font-semibold text-text">{title}</span>
      <Badge tone="neutral">{count}</Badge>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [contacts, setContacts] = useState<KeyContact[]>([]);
  const [weddingId, setWeddingId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<KeyContact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Quick-add presets modal
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<Record<number, boolean>>({});
  const [presetNames, setPresetNames] = useState<Record<number, string>>({});

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const wId = getWeddingId();
    if (!wId) {
      setMounted(true);
      return;
    }
    setWeddingId(wId);
    setSyncing(true);
    loadContacts(wId)
      .then(setContacts)
      .finally(() => {
        setSyncing(false);
        setMounted(true);
      });
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    return [...contacts].sort((a, b) => {
      // Bridal party first
      if (a.isBridalParty !== b.isBridalParty) return a.isBridalParty ? -1 : 1;
      // Then by role order
      const ra = ROLE_ORDER.indexOf(a.role);
      const rb = ROLE_ORDER.indexOf(b.role);
      if (ra !== rb) return ra - rb;
      // Then by name
      return a.name.localeCompare(b.name, "fr");
    });
  }, [contacts]);

  const bridalParty = useMemo(
    () => sorted.filter((c) => c.isBridalParty),
    [sorted]
  );
  const vendors = useMemo(
    () => sorted.filter((c) => !c.isBridalParty),
    [sorted]
  );
  const withPhone = useMemo(
    () => contacts.filter((c) => c.phone.trim() !== "").length,
    [contacts]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingContact(null);
    setForm({ ...EMPTY_FORM });
    setDrawerOpen(true);
  }

  function openEdit(c: KeyContact) {
    setEditingContact(c);
    setForm({
      name: c.name,
      role: c.role,
      phone: c.phone,
      email: c.email,
      note: c.note,
      isBridalParty: c.isBridalParty,
    });
    setDrawerOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !weddingId) return;
    setSyncing(true);
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role,
        phone: form.phone.trim(),
        email: form.email.trim(),
        note: form.note.trim(),
        isBridalParty: form.isBridalParty,
      };

      if (editingContact) {
        await updateContact(editingContact.id, payload);
        setContacts((prev) =>
          prev.map((c) => (c.id === editingContact.id ? { ...c, ...payload } : c))
        );
      } else {
        const created = await addContact(weddingId, payload);
        setContacts((prev) => [...prev, created]);
      }
      setDrawerOpen(false);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: number) {
    // Optimistic
    setContacts((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteContact(id);
    } catch {
      // Re-load on error
      if (weddingId) {
        const refreshed = await loadContacts(weddingId);
        setContacts(refreshed);
      }
    }
  }

  // ── Preset modal ──────────────────────────────────────────────────────────

  function openPresetModal() {
    const initSel: Record<number, boolean> = {};
    const initNames: Record<number, string> = {};
    PRESETS.forEach((_, i) => {
      initSel[i] = false;
      initNames[i] = "";
    });
    setSelectedPresets(initSel);
    setPresetNames(initNames);
    setPresetModalOpen(true);
  }

  async function applyPresets() {
    if (!weddingId) return;
    const toAdd = PRESETS.filter((_, i) => selectedPresets[i]);
    if (toAdd.length === 0) {
      setPresetModalOpen(false);
      return;
    }
    setSyncing(true);
    setPresetModalOpen(false);
    try {
      const created = await Promise.all(
        toAdd.map((p, relIdx) => {
          const origIdx = PRESETS.indexOf(p);
          return addContact(weddingId, {
            name: presetNames[origIdx]?.trim() || p.label,
            role: p.role,
            phone: "",
            email: "",
            note: "",
            isBridalParty: p.isBridalParty,
          });
        })
      );
      setContacts((prev) => [...prev, ...created]);
    } finally {
      setSyncing(false);
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!mounted) return null;

  if (!weddingId) {
    return (
      <div className="p-6 max-w-5xl mx-auto pb-24">
        <PageHead
          title="Personnes clés"
          sub="Contacts d'urgence, témoins et prestataires essentiels du Jour J"
        />
        <Card className="!p-0 mt-6">
          <Empty icon="users" title="Aucun mariage sélectionné">
            Sélectionnez un mariage pour gérer vos contacts clés.
          </Empty>
        </Card>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const subLine = (
    <span className="flex items-center gap-2">
      {contacts.length > 0
        ? `${contacts.length} contact${contacts.length > 1 ? "s" : ""} · ${bridalParty.length} dans le cortège`
        : "Aucun contact encore"}
      {syncing && (
        <span className="flex items-center gap-1.5 text-[12px] text-text-3">
          <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Synchronisation…
        </span>
      )}
    </span>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <PageHead
        title="Personnes clés"
        sub={subLine}
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            {contacts.length === 0 && (
              <Button
                variant="secondary"
                icon="sparkle"
                size="sm"
                onClick={openPresetModal}
              >
                Initialiser
              </Button>
            )}
            <Button variant="primary" icon="plus" onClick={openAdd}>
              Ajouter un contact
            </Button>
          </div>
        }
      />

      {/* Stat pills */}
      {contacts.length > 0 && (
        <div className="flex gap-3 flex-wrap mb-6">
          <StatPill label="Contacts au total" value={contacts.length} />
          <StatPill
            label="Dans le cortège"
            value={bridalParty.length}
            accent="var(--primary)"
          />
          <StatPill
            label="Avec téléphone"
            value={withPhone}
            accent="var(--sage)"
          />
        </div>
      )}

      {/* Empty state */}
      {contacts.length === 0 ? (
        <Card className="!p-0">
          <Empty
            icon="users"
            title="Aucun contact"
            action={
              <div className="flex gap-2 flex-wrap justify-center">
                <Button
                  variant="secondary"
                  icon="sparkle"
                  onClick={openPresetModal}
                >
                  Initialiser les contacts essentiels
                </Button>
                <Button variant="primary" icon="plus" onClick={openAdd}>
                  Ajouter un contact
                </Button>
              </div>
            }
          >
            Ajoutez vos contacts clés pour le Jour J — témoins, traiteur, photographe et
            toutes les personnes essentielles.
          </Empty>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Section: Bridal party */}
          {bridalParty.length > 0 && (
            <section>
              <SectionHeading
                icon="heart"
                title="Cortège & témoins"
                count={bridalParty.length}
              />
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bridalParty.map((c) => (
                    <ContactCard
                      key={c.id}
                      contact={c}
                      onEdit={() => openEdit(c)}
                      onDelete={() => handleDelete(c.id)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </section>
          )}

          {/* Section: Vendors & family */}
          {vendors.length > 0 && (
            <section>
              <SectionHeading
                icon="users"
                title="Prestataires & famille"
                count={vendors.length}
              />
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.map((c) => (
                    <ContactCard
                      key={c.id}
                      contact={c}
                      onEdit={() => openEdit(c)}
                      onDelete={() => handleDelete(c.id)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </section>
          )}
        </div>
      )}

      {/* Add / Edit Drawer */}
      {drawerOpen && (
        <Drawer
          title={editingContact ? "Modifier le contact" : "Ajouter un contact"}
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
                disabled={!form.name.trim() || syncing}
              >
                {editingContact ? "Enregistrer" : "Ajouter"}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Nom *">
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex : Marie Dupont"
                autoFocus
              />
            </Field>

            <Field label="Rôle">
              <Select
                value={form.role}
                onChange={(v) => setForm((f) => ({ ...f, role: v as ContactRole }))}
                options={ROLE_OPTIONS}
              />
            </Field>

            <Field label="Téléphone">
              <input
                className="input"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Ex : 06 12 34 56 78"
              />
            </Field>

            <Field label="Email">
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Ex : marie@email.fr"
              />
            </Field>

            <Field label="Note">
              <textarea
                className="input !h-auto py-3 leading-relaxed resize-y"
                rows={3}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Informations utiles, disponibilités, instructions…"
              />
            </Field>

            <label className="flex items-center gap-3 cursor-pointer group pt-1">
              <input
                type="checkbox"
                checked={form.isBridalParty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isBridalParty: e.target.checked }))
                }
                className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
              />
              <span className="text-[14px] font-medium text-text group-hover:text-primary transition">
                Dans le cortège / équipe Jour J
              </span>
              {form.isBridalParty && (
                <Badge tone="primary" icon="heart">
                  Cortège
                </Badge>
              )}
            </label>
          </div>
        </Drawer>
      )}

      {/* Quick-add presets modal */}
      {presetModalOpen && (
        <Modal
          title="Initialiser les contacts essentiels"
          onClose={() => setPresetModalOpen(false)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setPresetModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                icon="plus"
                onClick={applyPresets}
                disabled={!Object.values(selectedPresets).some(Boolean)}
              >
                Ajouter la sélection
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-1">
            <p className="text-[13px] text-text-2 mb-4">
              Sélectionnez les contacts à créer. Vous pourrez compléter leurs
              informations (téléphone, email) ensuite.
            </p>

            {PRESETS.map((preset, i) => {
              const cfg = ROLE_CONFIG[preset.role];
              const isSelected = selectedPresets[i] ?? false;
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-4 transition-colors cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary-soft"
                      : "border-line hover:border-primary/40 hover:bg-surface-2"
                  }`}
                  onClick={() =>
                    setSelectedPresets((prev) => ({ ...prev, [i]: !prev[i] }))
                  }
                >
                  <div className="flex items-center gap-3 mb-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedPresets((prev) => ({
                          ...prev,
                          [i]: e.target.checked,
                        }));
                      }}
                      className="w-4 h-4 accent-[var(--primary)] cursor-pointer shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.colorClass}`}
                    >
                      <Icon name={cfg.icon} size={15} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-text">
                        {preset.label}
                      </div>
                      <div className="text-[12px] text-text-3">{preset.hint}</div>
                    </div>
                    {preset.isBridalParty && (
                      <Badge tone="primary" icon="heart">
                        Cortège
                      </Badge>
                    )}
                  </div>

                  {isSelected && (
                    <div
                      className="mt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        className="input !text-[13px] !h-9"
                        placeholder={`Nom de ${preset.label.toLowerCase()} (optionnel)`}
                        value={presetNames[i] ?? ""}
                        onChange={(e) =>
                          setPresetNames((prev) => ({
                            ...prev,
                            [i]: e.target.value,
                          }))
                        }
                        autoComplete="off"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

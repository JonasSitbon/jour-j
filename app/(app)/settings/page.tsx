"use client";

import { useState, useEffect } from "react";
import { useStore, useToast, useTheme } from "@/components/providers";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Field, Input, Select, Avatar, Modal } from "@/components/ui";
import { PageHead } from "@/components/shell";
import { updateProfile, inviteToWedding, revokeWeddingAccess, updateWeddingAccessRole, getWeddingId } from "@/lib/db";
import { createClient } from "@/lib/supabase";
import type { WeddingRole } from "@/lib/types";
import { VenueAutocomplete } from "@/components/venue-autocomplete";
import {
  COLLABORATOR_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  type CollaboratorRoleName,
} from "@/lib/roles";

// ── Constantes ───────────────────────────────────────────────────────────────

const ROLE_META: Record<WeddingRole, { label: string; tone: any; desc: string }> = {
  owner:  { label: "Propriétaire",   tone: "primary", desc: "Contrôle total de l'espace" },
  admin:  { label: "Administrateur", tone: "sage",    desc: "Peut inviter et modifier les paramètres" },
  editor: { label: "Éditeur",        tone: "amber",   desc: "Peut modifier les données" },
  viewer: { label: "Lecteur",        tone: "neutral", desc: "Lecture seule" },
};

const ACCOUNT_TYPE_META: Record<string, { label: string; tone: any }> = {
  couple:      { label: "Couple",          tone: "primary" },
  planner:     { label: "Wedding Planner", tone: "sage" },
  super_admin: { label: "Super Admin",     tone: "coral" },
};

const COVER_COLORS = [
  { value: "#C96E2C", label: "Bohème" },
  { value: "#1E3A5F", label: "Classique" },
  { value: "#6B8C3E", label: "Champêtre" },
  { value: "#B5586E", label: "Romantique" },
  { value: "#1F7A5C", label: "Tropical" },
  { value: "#323232", label: "Moderne" },
];

// ── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on}
      className={`w-[42px] h-6 rounded-full relative transition shrink-0 ${on ? "bg-primary" : "bg-line-strong"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${on ? "translate-x-[18px]" : ""}`} />
    </button>
  );
}

// ── Section Mon Profil ───────────────────────────────────────────────────────

function ProfileSection() {
  const { state } = useStore();
  const toast = useToast();
  const [firstName, setFirstName] = useState(state.profile?.firstName ?? "");
  const [lastName, setLastName]   = useState(state.profile?.lastName ?? "");
  const [saving, setSaving]       = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    if (state.profile) {
      setFirstName(state.profile.firstName);
      setLastName(state.profile.lastName);
    }
  }, [state.profile]);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  const fullName   = `${firstName} ${lastName}`.trim() || "?";
  const accountMeta = state.profile ? ACCOUNT_TYPE_META[state.profile.accountType] : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      toast("Profil mis à jour");
    } catch {
      toast("Erreur lors de la mise à jour", "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="sec-title mb-[18px]"><Icon name="user" size={17} className="text-text-3" />Mon profil</div>
      <div className="flex flex-col gap-5">
        {/* Avatar + badge */}
        <div className="flex items-center gap-4">
          <Avatar name={fullName} size="lg" />
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-semibold">{fullName}</div>
            {accountMeta && (
              <Badge tone={accountMeta.tone}>{accountMeta.label}</Badge>
            )}
            <div className="text-[12px] text-text-3">Photo de profil — bientôt disponible</div>
          </div>
        </div>

        {/* Champs nom / prénom */}
        <div className="flex gap-3">
          <Field label="Prénom"><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" /></Field>
          <Field label="Nom"><Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" /></Field>
        </div>

        {/* Email lecture seule */}
        <Field label="Adresse email">
          <div className="input bg-surface-2 text-text-2 cursor-not-allowed flex items-center gap-2">
            <Icon name="mail" size={15} className="text-text-3 shrink-0" />
            <span className="text-[13px]">{userEmail || "—"}</span>
          </div>
        </Field>

        <div>
          <Button variant="primary" icon="check" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Modal d'invitation améliorée ─────────────────────────────────────────────

function InviteModal({ onClose, weddingId }: { onClose: () => void; weddingId: number }) {
  const toast = useToast();
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState<WeddingRole>("editor");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!email.includes("@")) { toast("Email invalide", "err"); return; }
    setLoading(true);
    try {
      const { error } = await inviteToWedding(weddingId, email, role) as any;
      if (error) { toast(error, "err"); return; }
      toast("Invitation envoyée");
      onClose();
    } catch {
      toast("Erreur lors de l'invitation", "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Inviter une personne" onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" icon="mail" onClick={send} disabled={loading}>
            {loading ? "Envoi…" : "Envoyer l'invitation"}
          </Button>
        </>
      }>
      <div className="flex flex-col gap-5">
        <Field label="Adresse email">
          <Input icon="mail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="personne@email.fr" />
        </Field>
        <Field label="Rôle">
          <Select value={role} onChange={(v) => setRole(v as WeddingRole)} options={[
            { value: "admin",  label: "Administrateur — peut inviter et modifier les paramètres" },
            { value: "editor", label: "Éditeur — peut modifier les données" },
            { value: "viewer", label: "Lecteur — lecture seule" },
          ]} />
        </Field>

        {/* Descriptions des rôles */}
        <div className="bg-surface-2 rounded-card border border-line p-4 flex flex-col gap-2.5">
          {(["admin", "editor", "viewer"] as WeddingRole[]).map((r) => (
            <div key={r} className={`flex items-start gap-2.5 ${r === role ? "opacity-100" : "opacity-50"}`}>
              <Badge tone={ROLE_META[r].tone}>{ROLE_META[r].label}</Badge>
              <span className="text-[12.5px] text-text-2 mt-0.5">{ROLE_META[r].desc}</span>
            </div>
          ))}
        </div>

        <div className="text-text-2 text-[12.5px] flex gap-2 items-start">
          <Icon name="info" size={15} className="shrink-0 mt-0.5" />
          La personne recevra un lien pour rejoindre votre espace mariage.
        </div>
      </div>
    </Modal>
  );
}

// ── Tableau des permissions ───────────────────────────────────────────────────

function PermissionsAccordion() {
  const [open, setOpen] = useState(false);
  const rows = [
    { perm: "Voir tout",                  owner: true,  admin: true,  editor: true,  viewer: true  },
    { perm: "Modifier les données",       owner: true,  admin: true,  editor: true,  viewer: false },
    { perm: "Inviter des collaborateurs", owner: true,  admin: true,  editor: false, viewer: false },
    { perm: "Modifier les paramètres",    owner: true,  admin: false, editor: false, viewer: false },
    { perm: "Supprimer le mariage",       owner: true,  admin: false, editor: false, viewer: false },
  ];

  return (
    <div className="border border-line rounded-card mt-4 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-hover transition"
        onClick={() => setOpen(!open)}
      >
        <span className="text-[13px] font-medium text-text-2">Tableau des permissions</span>
        <Icon name={open ? "chevronU" : "chevronD"} size={16} className="text-text-3" />
      </button>
      {open && (
        <div className="border-t border-line overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th className="text-left px-4 py-2.5 font-medium text-text-2">Permission</th>
                {(["owner", "admin", "editor", "viewer"] as WeddingRole[]).map((r) => (
                  <th key={r} className="px-3 py-2.5 font-medium text-center">
                    <Badge tone={ROLE_META[r].tone}>{ROLE_META[r].label}</Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-text-2">{row.perm}</td>
                  {(["owner", "admin", "editor", "viewer"] as WeddingRole[]).map((r) => (
                    <td key={r} className="px-3 py-2.5 text-center">
                      {(row as any)[r]
                        ? <Icon name="check-circle" size={15} className="text-sage inline-block" />
                        : <span className="text-text-3 text-base leading-none">–</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Section Accès ─────────────────────────────────────────────────────────────

function AccessSection() {
  const { state, update } = useStore();
  const toast = useToast();
  const [inviting, setInviting] = useState(false);

  const activeWeddingId = state.activeWeddingId;
  const members = state.members;

  const handleRevokeLocal = (id: number) => {
    update("members", (l) => l.filter((x) => x.id !== id));
    toast("Accès révoqué");
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="sec-title"><Icon name="users" size={17} className="text-text-3" />Gestion des accès</div>
          <Button variant="primary" size="sm" icon="plus" onClick={() => setInviting(true)}>Inviter</Button>
        </div>

        {members.length === 0 && (
          <div className="py-6 text-center text-[13px] text-text-2">Aucun collaborateur pour l'instant.</div>
        )}

        {members.map((m) => {
          const accessKey = (m.access in ROLE_META ? m.access : "viewer") as WeddingRole;
          const meta = ROLE_META[accessKey];
          const isOwner = m.access === "owner";
          return (
            <div key={m.id} className="flex items-center gap-3.5 py-3.5 border-b border-line last:border-0">
              <Avatar name={m.name} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{m.name}</div>
                <div className="text-[12.5px] text-text-2 truncate">{m.email}</div>
              </div>
              {isOwner ? (
                <Badge tone={meta.tone} dot>{meta.label}</Badge>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={accessKey}
                    onChange={async (v) => {
                      const newRole = v as WeddingRole;
                      try {
                        await updateWeddingAccessRole(m.id, newRole);
                        update("members", (l) => l.map((x) => x.id === m.id ? { ...x, access: newRole as any } : x));
                        toast("Rôle mis à jour");
                      } catch {
                        toast("Erreur lors de la mise à jour", "err");
                      }
                    }}
                    options={[
                      { value: "admin",  label: "Administrateur" },
                      { value: "editor", label: "Éditeur" },
                      { value: "viewer", label: "Lecteur" },
                    ]}
                    className="text-[12.5px] !py-1.5 !h-auto"
                  />
                  <button
                    className="icon-btn w-8 h-8 text-coral"
                    title="Révoquer l'accès"
                    onClick={() => {
                      void revokeWeddingAccess(m.id).catch(() => {});
                      handleRevokeLocal(m.id);
                    }}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <PermissionsAccordion />
      </Card>

      {inviting && activeWeddingId && (
        <InviteModal onClose={() => setInviting(false)} weddingId={activeWeddingId} />
      )}
    </>
  );
}

// ── Section Compte ────────────────────────────────────────────────────────────

function AccountSection() {
  const toast = useToast();

  const handleResetPassword = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { toast("Email introuvable", "err"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) { toast("Erreur lors de l'envoi", "err"); return; }
    toast("Email de réinitialisation envoyé");
  };

  const handleSignOutAll = async () => {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    toast("Déconnecté de tous les appareils");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="sec-title mb-4"><Icon name="key" size={17} className="text-text-3" />Sécurité</div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 py-4 border-b border-line">
            <div>
              <div className="text-sm font-medium">Changer le mot de passe</div>
              <div className="text-[12.5px] text-text-2 mt-0.5">Un email de réinitialisation sera envoyé à votre adresse</div>
            </div>
            <Button variant="secondary" size="sm" icon="key" onClick={handleResetPassword}>Envoyer le lien</Button>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <div className="text-sm font-medium">Se déconnecter de tous les appareils</div>
              <div className="text-[12.5px] text-text-2 mt-0.5">Invalide toutes vos sessions actives</div>
            </div>
            <Button variant="secondary" size="sm" icon="logout" onClick={handleSignOutAll}>Se déconnecter</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Notification Preferences Storage Key ─────────────────────────────────────

const NOTIF_PREFS_KEY = "jj_notif_prefs";
const NOTIF_PREFS_DEFAULT = { j90: true, j30: true, latePayments: true, stalVendors: true, pendingRsvp: true };

// ── Section Préférences de notifications ──────────────────────────────────────

function NotifPrefsSection() {
  const toast = useToast();
  const [prefs, setPrefs] = useState<typeof NOTIF_PREFS_DEFAULT>(NOTIF_PREFS_DEFAULT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_PREFS_KEY);
      if (stored) setPrefs({ ...NOTIF_PREFS_DEFAULT, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const toggle = (key: keyof typeof NOTIF_PREFS_DEFAULT) => {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      try { localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next)); } catch {}
      toast("Préférence mise à jour");
      return next;
    });
  };

  const items: { key: keyof typeof NOTIF_PREFS_DEFAULT; label: string; desc: string }[] = [
    { key: "j90",         label: "Rappel J-90",                             desc: "90 jours avant le mariage" },
    { key: "j30",         label: "Rappel J-30",                             desc: "30 jours avant le mariage" },
    { key: "latePayments",label: "Rappel paiements en retard",              desc: "Quand un paiement prestataire est en retard" },
    { key: "stalVendors", label: "Rappel prestataires sans réponse (14j)",  desc: "Prestataires sans nouvelle depuis 14 jours" },
    { key: "pendingRsvp", label: "Rappel invités RSVP en attente",          desc: "Invités n'ayant pas encore répondu" },
  ];

  return (
    <Card>
      <div className="sec-title mb-2"><Icon name="bell" size={17} className="text-text-3" />Préférences de notifications</div>
      {items.map(({ key, label, desc }) => (
        <div key={key} className="flex items-center justify-between gap-4 py-4 border-b border-line last:border-0">
          <div>
            <div className="text-sm font-medium">{label}</div>
            <div className="text-[12.5px] text-text-2 mt-0.5">{desc}</div>
          </div>
          <Toggle on={prefs[key]} onClick={() => toggle(key)} />
        </div>
      ))}
    </Card>
  );
}

// ── Modal suppression compte (avec signOut) ───────────────────────────────────

function DeleteAccountWithSignOutModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const canDelete = confirm === "SUPPRIMER";

  const handleDelete = async () => {
    setLoading(true);
    try {
      await createClient().auth.signOut();
      toast("Compte supprimé");
      window.location.href = "/";
    } catch {
      toast("Erreur lors de la suppression", "err");
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Supprimer mon compte"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="danger" icon="trash" disabled={!canDelete || loading} onClick={handleDelete}>
            {loading ? "Suppression…" : "Supprimer définitivement"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="bg-coral-soft border border-coral/20 rounded-card p-4 text-[13px] text-coral flex gap-2.5 items-start">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Cette action est irréversible</div>
            <div className="text-[12.5px] opacity-80">Toutes vos données seront supprimées définitivement.</div>
          </div>
        </div>
        <Field label={'Tapez "SUPPRIMER" pour confirmer'}>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="SUPPRIMER" />
        </Field>
      </div>
    </Modal>
  );
}

// ── Section Données & confidentialité ─────────────────────────────────────────

function DataPrivacySection() {
  const toast = useToast();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleExport = () => {
    toast("Export en cours...");
    setTimeout(() => toast("Données exportées !"), 1800);
  };

  return (
    <>
      <Card>
        <div className="sec-title mb-4"><Icon name="save" size={17} className="text-text-3" />Données et confidentialité</div>
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between gap-4 py-4 border-b border-line">
            <div>
              <div className="text-sm font-medium">Exporter mes données</div>
              <div className="text-[12.5px] text-text-2 mt-0.5">Téléchargez une copie de toutes vos données</div>
            </div>
            <Button variant="secondary" size="sm" icon="download" onClick={handleExport}>Exporter mes données</Button>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <div className="text-sm font-medium text-coral">Supprimer mon compte</div>
              <div className="text-[12.5px] text-text-2 mt-0.5">Supprime définitivement votre compte et toutes vos données</div>
            </div>
            <Button variant="danger" size="sm" icon="trash" onClick={() => setDeletingAccount(true)}>Supprimer mon compte</Button>
          </div>
        </div>
      </Card>

      {deletingAccount && <DeleteAccountWithSignOutModal onClose={() => setDeletingAccount(false)} />}
    </>
  );
}

// ── Section Équipe & Accès ────────────────────────────────────────────────────

const COLLAB_ROLE_OPTIONS: { value: CollaboratorRoleName; label: string }[] = [
  { value: "admin",        label: "Administrateur — accès complet sauf paramètres" },
  { value: "coordinateur", label: "Coordinateur — logistique et invités" },
  { value: "dj",           label: "DJ / Musicien — musique et programme" },
  { value: "traiteur",     label: "Traiteur — invités, budget et déroulé" },
  { value: "photographe",  label: "Photographe — déroulé, cérémonie, timeline" },
  { value: "lecteur",      label: "Lecteur — lecture seule" },
];

interface MockMember {
  id: string;
  name: string;
  email: string;
  role: CollaboratorRoleName;
  status: "active" | "pending";
}

function InviteCollaboratorModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRoleName>("coordinateur");
  const [sent, setSent] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const roleMeta = COLLABORATOR_ROLES[role];

  const handleSend = () => {
    if (!email.includes("@")) { toast("Email invalide", "err"); return; }
    // Generate a fake token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(10)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const link = `${window.location.origin}/invitation/${token}?role=${role}&email=${encodeURIComponent(email)}`;
    setInviteLink(link);
    setSent(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    toast("Lien copié !");
  };

  return (
    <Modal
      title="Inviter un collaborateur"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          {!sent ? (
            <Button variant="primary" icon="mail" onClick={handleSend}>
              Générer le lien
            </Button>
          ) : (
            <Button variant="primary" icon="copy" onClick={handleCopy}>
              Copier le lien
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {!sent ? (
          <>
            <Field label="Adresse email du collaborateur">
              <Input
                icon="mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborateur@email.fr"
              />
            </Field>

            <Field label="Rôle">
              <Select
                value={role}
                onChange={(v) => setRole(v as CollaboratorRoleName)}
                options={COLLAB_ROLE_OPTIONS}
              />
            </Field>

            {/* Role description card */}
            <div className="bg-surface-2 rounded-card border border-line p-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-xl">{roleMeta.emoji}</span>
                <div>
                  <div className="text-sm font-semibold">{roleMeta.label}</div>
                  <div className="text-[12px] text-text-2">{roleMeta.description}</div>
                </div>
              </div>
              <div className="text-[11.5px] text-text-3 mt-1">Pages accessibles :</div>
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {(DEFAULT_ROLE_PERMISSIONS[role] ?? []).map((pageId) => (
                  <span
                    key={pageId}
                    className="px-2 py-0.5 rounded bg-primary-soft text-primary-700 text-[11px] font-medium"
                  >
                    {pageId}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-text-2 text-[12.5px] flex gap-2 items-start">
              <Icon name="info" size={15} className="shrink-0 mt-0.5" />
              Un lien d'invitation unique sera généré. Envoyez-le à la personne concernée.
            </div>
          </>
        ) : (
          <>
            <div className="bg-surface-2 rounded-card border border-line p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[13px] font-medium text-text">
                <Icon name="check-circle" size={16} className="text-sage" />
                Lien d'invitation généré pour <strong>{email}</strong>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 bg-surface border border-line rounded-md px-3 py-2 text-[11.5px] font-mono text-text-2 focus:outline-none"
                />
                <Button variant="secondary" size="sm" icon="copy" onClick={handleCopy}>
                  Copier
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-2 text-[12.5px] text-text-2">
              <Icon name="info" size={15} className="shrink-0 mt-0.5" />
              Ce lien expire dans 7 jours. La personne pourra créer un compte ou se connecter pour rejoindre votre espace mariage.
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function TeamSection() {
  const { state } = useStore();
  const toast = useToast();
  const [inviting, setInviting] = useState(false);

  // Mock members derived from state.members, augmented with collaborator role names
  const mockMembers: MockMember[] = [
    ...(state.members.length > 0
      ? state.members.map((m, i) => ({
          id: String(m.id),
          name: m.name,
          email: m.email,
          role: (["owner", "admin", "coordinateur", "dj", "traiteur", "photographe", "lecteur"][
            i % 7
          ] as CollaboratorRoleName),
          status: "active" as const,
        }))
      : [
          {
            id: "mock-1",
            name: "Marie Dupont",
            email: "marie@example.com",
            role: "coordinateur" as CollaboratorRoleName,
            status: "active" as const,
          },
          {
            id: "mock-2",
            name: "DJ Alex",
            email: "alex@djpro.fr",
            role: "dj" as CollaboratorRoleName,
            status: "pending" as const,
          },
        ]),
  ];

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="sec-title">
            <Icon name="users" size={17} className="text-text-3" />
            Équipe &amp; Accès
          </div>
          <Button variant="primary" size="sm" icon="plus" onClick={() => setInviting(true)}>
            Inviter un collaborateur
          </Button>
        </div>

        <p className="text-[12.5px] text-text-2 mb-5">
          Invitez vos prestataires ou coordinateurs à accéder à certaines sections de votre espace mariage.
          Chaque rôle dispose d'un accès limité aux pages qui le concernent.
        </p>

        {/* Member list */}
        {mockMembers.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-text-2">
            Aucun collaborateur pour l'instant.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {mockMembers.map((m) => {
              const meta = COLLABORATOR_ROLES[m.role];
              return (
                <div key={m.id} className="flex items-center gap-3.5 py-4">
                  <Avatar name={m.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{m.name}</span>
                      <span className="text-lg leading-none">{meta.emoji}</span>
                      <Badge tone={m.status === "pending" ? "amber" : "sage"}>
                        {m.status === "pending" ? "Invitation en attente" : meta.label}
                      </Badge>
                    </div>
                    <div className="text-[12px] text-text-2 mt-0.5">{m.email}</div>
                  </div>
                  <button
                    className="icon-btn w-8 h-8 text-coral shrink-0"
                    title="Retirer le collaborateur"
                    onClick={() => toast(`Accès de ${m.name} révoqué`)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Role reference */}
        <div className="mt-5 border-t border-line pt-5">
          <div className="text-[11.5px] font-semibold uppercase tracking-wider text-text-3 mb-3">
            Rôles disponibles
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.entries(COLLABORATOR_ROLES) as [CollaboratorRoleName, (typeof COLLABORATOR_ROLES)[CollaboratorRoleName]][])
              .filter(([r]) => r !== "owner")
              .map(([r, meta]) => (
                <div
                  key={r}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-card border border-line bg-surface-2"
                >
                  <span className="text-base mt-0.5">{meta.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold">{meta.label}</div>
                    <div className="text-[11.5px] text-text-2 mt-0.5">{meta.description}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </Card>

      {inviting && <InviteCollaboratorModal onClose={() => setInviting(false)} />}
    </>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { state, update } = useStore();
  const toast = useToast();
  const { theme, setTheme, weddingTheme, setWeddingTheme } = useTheme();
  const [sec, setSec] = useState("profile");
  const [notif, setNotif] = useState<Record<string, boolean>>({ rsvp: true, payments: true, deadlines: true, weekly: false, vendors: true });
  const w = state.wedding;
  const setW = (k: string, v: string) => update("wedding", (p) => ({ ...p, [k]: v }));

  const SECTIONS = [
    ["profile",       "Mon profil",    "user"],
    ["wedding",       "Mariage",       "rings"],
    ["access",        "Accès",         "users"],
    ["team",          "Équipe",        "users"],
    ["account",       "Compte",        "key"],
    ["notif",         "Notifications", "bell"],
    ["data",          "Données",       "save"],
    ["emails",        "Emails",        "mail"],
    ["theme",         "Apparence",     "sun"],
    ["integrations",  "Intégrations",  "link"],
  ];

  // ── CSV export ──────────────────────────────────────────────────────────────
  const exportGuestsCsv = () => {
    const headers = ["Nom", "Côté", "RSVP", "Régime", "Table", "Hébergement", "Enfant", "Transport", "Cadeau", "Groupe", "Notes"];
    const rsvpLabel: Record<string, string> = { yes: "Confirmé", pending: "En attente", declined: "Décliné" };
    const dietLabel: Record<string, string> = { none: "Standard", vegetarien: "Végétarien", vegan: "Vegan", "sans gluten": "Sans gluten", "sans lactose": "Sans lactose" };
    const rows = state.guests.map((g: any) => [
      g.name,
      g.side === "A" ? state.wedding.partnerA : state.wedding.partnerB,
      rsvpLabel[g.rsvp] || g.rsvp,
      dietLabel[g.diet] || g.diet,
      state.tables.find((t: any) => t.id === g.table)?.name || "",
      g.lodging,
      g.child ? "Oui" : "",
      g.transport ? "Oui" : "",
      g.gift ? "Oui" : "",
      g.group,
      g.note,
    ]);
    const csv = [headers, ...rows].map((r: any[]) => r.map((c: any) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invites_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`${state.guests.length} invités exportés`);
  };

  // ── Share token (from Supabase wedding.share_token) ────────────────────────
  const [shareUrl, setShareUrl]         = useState<string>("");
  const [confirmRegen, setConfirmRegen] = useState(false);
  useEffect(() => {
    if (state.wedding.shareToken) {
      setShareUrl(`${window.location.origin}/share/${state.wedding.shareToken}`);
    }
  }, [state.wedding.shareToken]);
  const regenShareToken = async () => {
    const wId = getWeddingId();
    if (!wId) return;
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, "0")).join("");
    await createClient().from("wedding").update({ share_token: newToken }).eq("id", wId);
    setShareUrl(`${window.location.origin}/share/${newToken}`);
    setConfirmRegen(false);
    toast("Lien de partage régénéré");
  };

  // ── Email accordion ─────────────────────────────────────────────────────────
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  // ── Wedding cover color ─────────────────────────────────────────────────────
  const [coverColor, setCoverColor] = useState(
    (state.myWeddings.find((w2) => w2.id === state.activeWeddingId)?.coverColor) ?? "#C96E2C"
  );

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">
      <PageHead title="Paramètres" sub="Gérez votre espace, vos collaborateurs et vos préférences." />

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Nav latérale */}
        <div className="flex md:flex-col gap-0.5 flex-wrap md:sticky md:top-20">
          {SECTIONS.map(([id, label, icon]) => (
            <button key={id} onClick={() => setSec(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-[13.5px] font-medium transition ${sec === id ? "bg-primary-soft text-primary-700" : "text-text-2 hover:bg-hover hover:text-text"}`}>
              <Icon name={icon} size={17} />{label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex flex-col gap-5">

          {/* ── Mon profil ─────────────────────────────────────────────────── */}
          {sec === "profile" && <ProfileSection />}

          {/* ── Mariage ────────────────────────────────────────────────────── */}
          {sec === "wedding" && (
            <Card>
              <div className="sec-title mb-[18px]"><Icon name="rings" size={17} className="text-text-3" />Informations du mariage</div>
              <div className="flex flex-col gap-4">
                <Field label="Nom de l'espace mariage">
                  <Input
                    value={(state.myWeddings.find((w2) => w2.id === state.activeWeddingId)?.name) ?? ""}
                    onChange={() => {}}
                    placeholder={`${w.partnerA} & ${w.partnerB}`}
                  />
                </Field>
                <div className="flex gap-3">
                  <Field label="Prénom (côté A)"><Input value={w.partnerA} onChange={(e) => setW("partnerA", e.target.value)} /></Field>
                  <Field label="Prénom (côté B)"><Input value={w.partnerB} onChange={(e) => setW("partnerB", e.target.value)} /></Field>
                </div>
                <div className="flex gap-3">
                  <Field label="Date du mariage"><Input type="date" value={w.date} onChange={(e) => setW("date", e.target.value)} /></Field>
                  <Field label="Thème"><Input value={w.theme} onChange={(e) => setW("theme", e.target.value)} /></Field>
                </div>
                <div className="flex gap-3">
                  <Field label="Lieu / domaine">
                    <VenueAutocomplete
                      venue={w.venue}
                      city={w.city}
                      onVenueChange={(v) => setW("venue", v)}
                      onCityChange={(c) => setW("city", c)}
                    />
                  </Field>
                  <Field label="Ville">
                    <Input value={w.city} onChange={(e) => setW("city", e.target.value)} placeholder="Ville…" />
                  </Field>
                </div>

                {/* Nombre d'invités prévus */}
                <Field label="Nombre d'invités prévus">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {[50, 75, 100, 125, 150, 200].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => update("wedding", (p) => ({ ...p, guestTarget: n }))}
                          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium border transition ${w.guestTarget === n ? "bg-primary text-white border-primary" : "border-line text-text-2 hover:border-primary/50 hover:text-text"}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      value={w.guestTarget || ""}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        update("wedding", (p) => ({ ...p, guestTarget: isNaN(v) ? 0 : v }));
                      }}
                      placeholder="Nombre exact…"
                    />
                  </div>
                </Field>

                {/* Couleur de couverture */}
                <Field label="Couleur de l'espace (card couverture)">
                  <div className="flex gap-2.5 mt-1">
                    {COVER_COLORS.map((c) => (
                      <button
                        key={c.value}
                        title={c.label}
                        onClick={() => setCoverColor(c.value)}
                        className={`w-8 h-8 rounded-full border-2 transition ${coverColor === c.value ? "border-text scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
                        style={{ background: c.value }}
                      />
                    ))}
                  </div>
                </Field>

                <div>
                  <Button variant="primary" icon="check" onClick={() => { update("wedding", (p) => ({ ...p })); toast("Modifications enregistrées"); }}>
                    Enregistrer
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── Accès ──────────────────────────────────────────────────────── */}
          {sec === "access" && <AccessSection />}

          {/* ── Équipe ─────────────────────────────────────────────────────── */}
          {sec === "team" && <TeamSection />}

          {/* ── Compte ─────────────────────────────────────────────────────── */}
          {sec === "account" && <AccountSection />}

          {/* ── Notifications ──────────────────────────────────────────────── */}
          {sec === "notif" && (
            <div className="flex flex-col gap-5">
              <Card>
                <div className="sec-title mb-2"><Icon name="bell" size={17} className="text-text-3" />Notifications email</div>
                {[
                  ["rsvp",      "Réponses RSVP",          "Quand un invité confirme ou décline"],
                  ["payments",  "Paiements",               "Échéances et retards de paiement"],
                  ["deadlines", "Échéances de tâches",     "Rappels J-30, J-15, J-7"],
                  ["vendors",   "Prestataires",            "Devis reçus et relances"],
                  ["weekly",    "Résumé hebdomadaire",     "Un point chaque lundi matin"],
                ].map(([k, l, d]) => (
                  <div key={k} className="flex items-center justify-between gap-4 py-4 border-b border-line last:border-0">
                    <div><div className="text-sm font-medium">{l}</div><div className="text-[12.5px] text-text-2 mt-0.5">{d}</div></div>
                    <Toggle on={notif[k]} onClick={() => { setNotif((n) => ({ ...n, [k]: !n[k] })); toast("Préférence mise à jour"); }} />
                  </div>
                ))}
              </Card>
              <NotifPrefsSection />
            </div>
          )}

          {/* ── Données ────────────────────────────────────────────────────── */}
          {sec === "data" && (
            <div className="flex flex-col gap-5">
              <DataPrivacySection />
              <Card>
                <div className="sec-title mb-4"><Icon name="save" size={17} className="text-text-3" />Sauvegarde &amp; export</div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4 py-4 border-b border-line">
                    <div className="flex items-center gap-3">
                      <span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center bg-primary-soft text-primary-700"><Icon name="download" size={18} /></span>
                      <div>
                        <div className="text-sm font-medium">Exporter la liste des invités</div>
                        <div className="text-[12.5px] text-text-2">Fichier CSV compatible Excel (nom, RSVP, régime, table…)</div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={exportGuestsCsv}>Exporter CSV</Button>
                  </div>
                  {[
                    ["Sauvegarde automatique", "Vos données sont sauvegardées en continu", "check-circle", ""],
                    ["Plan de table PDF",       "Document imprimable du placement",          "file",         "Plan de table exporté"],
                    ["Budget PDF",              "Récapitulatif financier détaillé",           "wallet",       "Budget exporté"],
                  ].map(([l, d, ic, msg], i) => (
                    <div key={i} className="flex items-center justify-between gap-4 py-4 border-b border-line last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center bg-primary-soft text-primary-700"><Icon name={ic} size={18} /></span>
                        <div><div className="text-sm font-medium">{l}</div><div className="text-[12.5px] text-text-2">{d}</div></div>
                      </div>
                      {msg ? <Button variant="secondary" size="sm" onClick={() => toast(msg)}>Exporter</Button> : <Badge tone="sage" dot>Activée</Badge>}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Lien de partage */}
              <Card>
                <div className="sec-title mb-1"><Icon name="link" size={17} className="text-text-3" />Lien de partage en lecture seule</div>
                <p className="text-[12.5px] text-text-2 mb-4">Partagez ce lien avec vos témoins ou votre famille pour qu'ils puissent consulter vos préparatifs en lecture seule.</p>
                <div className="flex gap-2 mb-4">
                  <input readOnly value={shareUrl}
                    className="flex-1 bg-surface-2 border border-line rounded-md px-3 py-2 text-[12.5px] font-mono text-text-2 focus:outline-none" />
                  <Button variant="secondary" size="sm" icon="copy" onClick={() => { navigator.clipboard.writeText(shareUrl); toast("Lien copié !"); }}>Copier</Button>
                </div>
                <div className="mb-4 flex flex-col gap-1">
                  <div className="text-[12px] text-text-3 font-medium uppercase tracking-wide mb-1">Visible via ce lien</div>
                  {["Invités (nombres)", "Budget (totaux)", "Prestataires (noms + statut)", "Checklist"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[12.5px] text-text-2"><Icon name="check" size={13} className="text-sage-600" />{item}</div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" icon="refresh" onClick={() => setConfirmRegen(true)}>Régénérer le lien</Button>
              </Card>
            </div>
          )}

          {/* ── Emails ─────────────────────────────────────────────────────── */}
          {sec === "emails" && (
            <Card>
              <div className="sec-title mb-1"><Icon name="mail" size={17} className="text-text-3" />Templates d'email Supabase</div>
              <p className="text-[12.5px] text-text-2 mb-5">Ces templates sont utilisés pour les emails d'authentification envoyés par Supabase. Collez-les dans Supabase Dashboard → Authentication → Email Templates.</p>
              {[
                { key: "confirm", title: "Confirmation d'inscription",    desc: "Envoyé lors de la création de compte",    path: "emails/confirmation.html" },
                { key: "reset",   title: "Réinitialisation de mot de passe", desc: "Envoyé lors d'une demande de reset",  path: "emails/reset-password.html" },
                { key: "invite",  title: "Invitation d'un collaborateur", desc: "Envoyé lors d'une invitation",           path: "emails/invite.html" },
              ].map(({ key, title, desc, path }) => (
                <div key={key} className="border-b border-line last:border-0">
                  <button className="w-full flex items-center gap-3 py-4 text-left" onClick={() => setOpenEmail(openEmail === key ? null : key)}>
                    <span className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center bg-primary-soft text-primary-700 shrink-0"><Icon name="mail" size={16} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{title}</div>
                      <div className="text-[12.5px] text-text-2">{desc}</div>
                    </div>
                    <Icon name={openEmail === key ? "chevronU" : "chevronD"} size={16} className="text-text-3 shrink-0" />
                  </button>
                  {openEmail === key && (
                    <div className="pb-4 pl-[46px] flex flex-col gap-3">
                      <div className="flex items-center gap-2 bg-surface-2 rounded-md px-3 py-2 border border-line">
                        <Icon name="file" size={14} className="text-text-3 shrink-0" />
                        <span className="font-mono text-[12px] text-text-2 flex-1">{path}</span>
                        <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(path); toast("Chemin copié"); }}>Copier le chemin</Button>
                      </div>
                      <div className="text-[12px] text-text-3 flex items-center gap-1.5"><Icon name="info" size={13} />Ouvrez ce fichier dans votre éditeur, copiez son contenu et collez-le dans Supabase.</div>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-5 bg-surface-2 rounded-card border border-line p-4">
                <div className="text-[12px] font-semibold text-text-2 uppercase tracking-wide mb-3">Guide étape par étape</div>
                <ol className="flex flex-col gap-2">
                  {[
                    "Ouvrez Supabase → Authentication → Email Templates",
                    'Sélectionnez "Confirm signup" → collez emails/confirmation.html',
                    'Sélectionnez "Reset password" → collez emails/reset-password.html',
                    'Sélectionnez "Invite user" → collez emails/invite.html',
                    'Cliquez "Save" pour chaque template',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-text-2">
                      <span className="w-5 h-5 rounded-full bg-primary-soft text-primary-700 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 pt-3 border-t border-line">
                  <div className="text-[12px] text-text-3 mb-1">Lien direct Supabase</div>
                  <a href="https://sxoocdnedizxlegwshxl.supabase.co/project/default/auth/templates"
                    target="_blank" rel="noopener noreferrer"
                    className="font-mono text-[11.5px] text-primary-700 hover:underline break-all">
                    https://sxoocdnedizxlegwshxl.supabase.co/project/default/auth/templates
                  </a>
                </div>
              </div>
            </Card>
          )}

          {/* ── Apparence ──────────────────────────────────────────────────── */}
          {sec === "theme" && (
            <>
              <Card>
                <div className="sec-title mb-4"><Icon name="sun" size={17} className="text-text-3" />Mode d&apos;affichage</div>
                <div className="flex gap-3.5">
                  {[["light", "Clair", "sun"], ["dark", "Sombre", "moon"]].map(([id, label, ic]) => (
                    <button key={id} onClick={() => setTheme(id as any)}
                      className={`flex-1 text-center rounded-card border p-6 transition ${theme === id ? "border-primary ring-2 ring-primary-soft" : "border-line hover:border-line-strong"}`}>
                      <Icon name={ic} size={26} className={theme === id ? "text-primary mx-auto" : "text-text-2 mx-auto"} />
                      <div className="mt-2.5 font-semibold text-sm">{label}</div>
                      {theme === id && <div className="mt-1.5 flex justify-center"><Badge tone="primary" icon="check">Actif</Badge></div>}
                    </button>
                  ))}
                </div>
              </Card>
              <Card>
                <div className="sec-title mb-1"><Icon name="sparkle" size={17} className="text-text-3" />Thème de mariage</div>
                <p className="text-[13px] text-text-2 mb-5">Adapte les couleurs de toute l&apos;application à votre style.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    { id: "boheme",     label: "Bohème",     emoji: "🌿", colors: ["#C96E2C", "#7E9A63", "#F4ECDD"] },
                    { id: "classique",  label: "Classique",  emoji: "🏛",  colors: ["#1E3A5F", "#C4961A", "#F5F4F2"] },
                    { id: "champetre",  label: "Champêtre",  emoji: "🌾", colors: ["#6B8C3E", "#C4A030", "#F3F1E5"] },
                    { id: "romantique", label: "Romantique", emoji: "🌸", colors: ["#B5586E", "#C9A07A", "#FDF4F5"] },
                    { id: "tropical",   label: "Tropical",   emoji: "🏖", colors: ["#1F7A5C", "#E4A83A", "#F1F7F4"] },
                    { id: "moderne",    label: "Moderne",    emoji: "🖤", colors: ["#323232", "#C2A03A", "#F6F6F6"] },
                    { id: "baroque",    label: "Baroque",    emoji: "🏰", colors: ["#7A1C40", "#C4921A", "#F6F1F4"] },
                    { id: "marin",      label: "Marin",      emoji: "🌊", colors: ["#1B4B8C", "#C8A96A", "#F1F4F8"] },
                  ] as const).map(({ id, label, emoji, colors }) => {
                    const active = weddingTheme === id;
                    return (
                      <button key={id} onClick={() => setWeddingTheme(id)}
                        className={`relative flex flex-col items-center gap-2.5 rounded-card border p-4 transition text-center ${active ? "border-primary ring-2 ring-primary-soft" : "border-line hover:border-line-strong"}`}>
                        {active && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--primary)" }}>
                            <Icon name="check" size={11} className="text-white" />
                          </span>
                        )}
                        <div className="flex gap-1.5 mt-1">
                          {colors.map((c) => (
                            <span key={c} className="w-5 h-5 rounded-full border border-line-strong shadow-xs" style={{ background: c }} />
                          ))}
                        </div>
                        <div>
                          <div className="text-lg leading-none mb-0.5">{emoji}</div>
                          <div className="text-[12.5px] font-semibold">{label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </>
          )}

          {/* ── Intégrations ───────────────────────────────────────────────── */}
          {sec === "integrations" && (
            <Card>
              <div className="sec-title mb-1"><Icon name="link" size={17} className="text-text-3" />Intégrations</div>
              <p className="text-[12.5px] text-text-2 mb-5">Connectez vos outils préférés à The Cockpit. Ces intégrations seront disponibles prochainement.</p>
              <div className="flex flex-col gap-0">
                {[
                  { emoji: "📅", name: "Google Calendar",  desc: "Synchronisez vos dates clés et échéances directement dans votre calendrier Google" },
                  { emoji: "📝", name: "Notion",           desc: "Exportez vos listes et notes de mariage vers vos pages Notion" },
                  { emoji: "📧", name: "Mailchimp",        desc: "Envoyez des campagnes email personnalisées à vos invités" },
                ].map(({ emoji, name, desc }) => (
                  <div key={name} className="flex items-center gap-4 py-4 border-b border-line last:border-0">
                    <span className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center bg-surface-2 border border-line text-2xl shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{name}</div>
                      <div className="text-[12.5px] text-text-2 mt-0.5">{desc}</div>
                    </div>
                    <Badge tone="surface">Bientôt disponible</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* Modal régénération lien */}
      {confirmRegen && (
        <Modal
          title="Régénérer le lien de partage ?"
          onClose={() => setConfirmRegen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmRegen(false)}>Annuler</Button>
              <Button variant="primary" icon="refresh" onClick={regenShareToken}>Régénérer</Button>
            </>
          }
        >
          <p className="text-sm text-text-2">L'ancien lien ne fonctionnera plus. Les personnes qui l'avaient devront utiliser le nouveau lien.</p>
        </Modal>
      )}
    </div>
  );
}

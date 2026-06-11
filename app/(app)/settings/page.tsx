"use client";

import { useState, useEffect } from "react";
import { useStore, useToast, useTheme } from "@/components/providers";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Field, Input, Select, Avatar, Modal } from "@/components/ui";
import { PageHead } from "@/components/shell";

const ACCESS: Record<string, { label: string; tone: any }> = {
  owner: { label: "Propriétaire", tone: "primary" }, edit: { label: "Édition", tone: "sage" }, read: { label: "Lecture seule", tone: "neutral" },
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button onClick={onClick} role="switch" aria-checked={on} className={`w-[42px] h-6 rounded-full relative transition shrink-0 ${on ? "bg-primary" : "bg-line-strong"}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${on ? "translate-x-[18px]" : ""}`} />
  </button>;
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const { update } = useStore();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("read");
  return (
    <Modal title="Inviter une personne" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" icon="mail" onClick={() => { if (!email.includes("@")) { toast("Email invalide", "err"); return; } update("members", (m) => [...m, { id: Date.now(), name: email.split("@")[0], email, role: role === "edit" ? "Co-organisateur" : "Invité", access: role as any }]); toast("Invitation envoyée"); onClose(); }}>Envoyer l'invitation</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Adresse email"><Input icon="mail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="personne@email.fr" /></Field>
        <Field label="Niveau d'accès"><Select value={role} onChange={setRole} options={[{ value: "read", label: "Lecture seule" }, { value: "edit", label: "Édition complète" }]} /></Field>
        <div className="text-text-2 text-[12.5px] flex gap-2"><Icon name="info" size={15} />La personne recevra un lien pour rejoindre votre espace mariage.</div>
      </div>
    </Modal>
  );
}

export default function SettingsPage() {
  const { state, update } = useStore();
  const toast = useToast();
  const { theme, setTheme, weddingTheme, setWeddingTheme } = useTheme();
  const [sec, setSec] = useState("wedding");
  const [inviting, setInviting] = useState(false);
  const [notif, setNotif] = useState<Record<string, boolean>>({ rsvp: true, payments: true, deadlines: true, weekly: false, vendors: true });
  const w = state.wedding;
  const setW = (k: string, v: string) => update("wedding", (p) => ({ ...p, [k]: v }));
  const SECTIONS = [["wedding", "Mariage", "rings"], ["access", "Accès", "users"], ["notif", "Notifications", "bell"], ["data", "Données", "save"], ["emails", "Emails", "mail"], ["theme", "Apparence", "sun"]];

  // CSV export
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

  // Share token
  function getOrCreateShareToken(): string {
    const existing = localStorage.getItem("jj_share_token");
    if (existing) return existing;
    const token = Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
    localStorage.setItem("jj_share_token", token);
    return token;
  }
  const [shareUrl, setShareUrl] = useState<string>("");
  const [confirmRegen, setConfirmRegen] = useState(false);
  useEffect(() => {
    const token = getOrCreateShareToken();
    setShareUrl(`${window.location.origin}/share/${token}`);
  }, []);
  const regenShareToken = () => {
    const token = Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
    localStorage.setItem("jj_share_token", token);
    setShareUrl(`${window.location.origin}/share/${token}`);
    setConfirmRegen(false);
    toast("Lien de partage régénéré");
  };

  // Email accordion
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12">
      <PageHead title="Paramètres" sub="Gérez votre espace, vos collaborateurs et vos préférences." />

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
        <div className="flex md:flex-col gap-0.5 flex-wrap md:sticky md:top-20">
          {SECTIONS.map(([id, label, icon]) => (
            <button key={id} onClick={() => setSec(id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-[13.5px] font-medium transition ${sec === id ? "bg-primary-soft text-primary-700" : "text-text-2 hover:bg-hover hover:text-text"}`}><Icon name={icon} size={17} />{label}</button>
          ))}
        </div>

        <div>
          {sec === "wedding" && (
            <Card>
              <div className="sec-title mb-[18px]"><Icon name="rings" size={17} className="text-text-3" />Informations du mariage</div>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3"><Field label="Prénom (côté A)"><Input value={w.partnerA} onChange={(e) => setW("partnerA", e.target.value)} /></Field><Field label="Prénom (côté B)"><Input value={w.partnerB} onChange={(e) => setW("partnerB", e.target.value)} /></Field></div>
                <div className="flex gap-3"><Field label="Date du mariage"><Input type="date" value={w.date} onChange={(e) => setW("date", e.target.value)} /></Field><Field label="Thème"><Input value={w.theme} onChange={(e) => setW("theme", e.target.value)} /></Field></div>
                <div className="flex gap-3"><Field label="Lieu"><Input value={w.venue} onChange={(e) => setW("venue", e.target.value)} /></Field><Field label="Ville"><Input value={w.city} onChange={(e) => setW("city", e.target.value)} /></Field></div>
                <div><Button variant="primary" icon="check" onClick={() => { update("wedding", (p) => ({ ...p })); toast("Modifications enregistrées"); }}>Enregistrer</Button></div>
              </div>
            </Card>
          )}

          {sec === "access" && (
            <Card>
              <div className="flex items-center justify-between mb-4"><div className="sec-title"><Icon name="users" size={17} className="text-text-3" />Gestion des accès</div><Button variant="primary" size="sm" icon="plus" onClick={() => setInviting(true)}>Inviter</Button></div>
              {state.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3.5 py-3.5 border-b border-line last:border-0">
                  <Avatar name={m.name} />
                  <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{m.name}</div><div className="text-[12.5px] text-text-2">{m.email} · {m.role}</div></div>
                  <Badge tone={ACCESS[m.access].tone} dot>{ACCESS[m.access].label}</Badge>
                  {m.access !== "owner" && <button className="icon-btn w-8 h-8" onClick={() => { update("members", (l) => l.filter((x) => x.id !== m.id)); toast("Accès révoqué"); }}><Icon name="trash" size={17} /></button>}
                </div>
              ))}
            </Card>
          )}

          {sec === "notif" && (
            <Card>
              <div className="sec-title mb-2"><Icon name="bell" size={17} className="text-text-3" />Notifications email</div>
              {[["rsvp", "Réponses RSVP", "Quand un invité confirme ou décline"], ["payments", "Paiements", "Échéances et retards de paiement"], ["deadlines", "Échéances de tâches", "Rappels J-30, J-15, J-7"], ["vendors", "Prestataires", "Devis reçus et relances"], ["weekly", "Résumé hebdomadaire", "Un point chaque lundi matin"]].map(([k, l, d]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-4 border-b border-line last:border-0">
                  <div><div className="text-sm font-medium">{l}</div><div className="text-[12.5px] text-text-2 mt-0.5">{d}</div></div>
                  <Toggle on={notif[k]} onClick={() => { setNotif((n) => ({ ...n, [k]: !n[k] })); toast("Préférence mise à jour"); }} />
                </div>
              ))}
            </Card>
          )}

          {sec === "data" && (
            <div className="flex flex-col gap-5">
              <Card>
                <div className="sec-title mb-4"><Icon name="save" size={17} className="text-text-3" />Sauvegarde &amp; export</div>
                <div className="flex flex-col gap-3">
                  {/* Real CSV export row */}
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
                  {/* Static entries */}
                  {[["Sauvegarde automatique", "Vos données sont sauvegardées en continu", "check-circle", ""], ["Plan de table PDF", "Document imprimable du placement", "file", "Plan de table exporté"], ["Budget PDF", "Récapitulatif financier détaillé", "wallet", "Budget exporté"]].map(([l, d, ic, msg], i) => (
                    <div key={i} className="flex items-center justify-between gap-4 py-4 border-b border-line last:border-0">
                      <div className="flex items-center gap-3"><span className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center bg-primary-soft text-primary-700"><Icon name={ic} size={18} /></span><div><div className="text-sm font-medium">{l}</div><div className="text-[12.5px] text-text-2">{d}</div></div></div>
                      {msg ? <Button variant="secondary" size="sm" onClick={() => toast(msg)}>Exporter</Button> : <Badge tone="sage" dot>Activée</Badge>}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Share link card */}
              <Card>
                <div className="sec-title mb-1"><Icon name="link" size={17} className="text-text-3" />Lien de partage en lecture seule</div>
                <p className="text-[12.5px] text-text-2 mb-4">Partagez ce lien avec vos témoins ou votre famille pour qu'ils puissent consulter vos préparatifs en lecture seule.</p>
                <div className="flex gap-2 mb-4">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-surface-2 border border-line rounded-md px-3 py-2 text-[12.5px] font-mono text-text-2 focus:outline-none"
                  />
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

          {sec === "emails" && (
            <Card>
              <div className="sec-title mb-1"><Icon name="mail" size={17} className="text-text-3" />Templates d'email Supabase</div>
              <p className="text-[12.5px] text-text-2 mb-5">Ces templates sont utilisés pour les emails d'authentification envoyés par Supabase. Collez-les dans Supabase Dashboard → Authentication → Email Templates.</p>

              {/* Accordion rows */}
              {[
                { key: "confirm", title: "Confirmation d'inscription", desc: "Envoyé lors de la création de compte", path: "emails/confirmation.html" },
                { key: "reset", title: "Réinitialisation de mot de passe", desc: "Envoyé lors d'une demande de reset", path: "emails/reset-password.html" },
                { key: "invite", title: "Invitation d'un collaborateur", desc: "Envoyé lors d'une invitation", path: "emails/invite.html" },
              ].map(({ key, title, desc, path }) => (
                <div key={key} className="border-b border-line last:border-0">
                  <button
                    className="w-full flex items-center gap-3 py-4 text-left"
                    onClick={() => setOpenEmail(openEmail === key ? null : key)}
                  >
                    <span className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center bg-primary-soft text-primary-700 shrink-0"><Icon name="mail" size={16} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{title}</div>
                      <div className="text-[12.5px] text-text-2">{desc}</div>
                    </div>
                    <Icon name={openEmail === key ? "chevron-up" : "chevron-down"} size={16} className="text-text-3 shrink-0" />
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

              {/* Step-by-step guide */}
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
                  <a
                    href="https://sxoocdnedizxlegwshxl.supabase.co/project/default/auth/templates"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11.5px] text-primary-700 hover:underline break-all"
                  >
                    https://sxoocdnedizxlegwshxl.supabase.co/project/default/auth/templates
                  </a>
                </div>
              </div>
            </Card>
          )}

          {sec === "theme" && (
            <>
              <Card>
                <div className="sec-title mb-4"><Icon name="sun" size={17} className="text-text-3" />Mode d&apos;affichage</div>
                <div className="flex gap-3.5">
                  {[["light", "Clair", "sun"], ["dark", "Sombre", "moon"]].map(([id, label, ic]) => (
                    <button key={id} onClick={() => setTheme(id as any)} className={`flex-1 text-center rounded-card border p-6 transition ${theme === id ? "border-primary ring-2 ring-primary-soft" : "border-line hover:border-line-strong"}`}>
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
                    { id: "boheme",    label: "Bohème",     emoji: "🌿", colors: ["#C96E2C", "#7E9A63", "#F4ECDD"] },
                    { id: "classique", label: "Classique",  emoji: "🏛",  colors: ["#1E3A5F", "#C4961A", "#F5F4F2"] },
                    { id: "champetre", label: "Champêtre",  emoji: "🌾", colors: ["#6B8C3E", "#C4A030", "#F3F1E5"] },
                    { id: "romantique",label: "Romantique", emoji: "🌸", colors: ["#B5586E", "#C9A07A", "#FDF4F5"] },
                    { id: "tropical",  label: "Tropical",   emoji: "🏖", colors: ["#1F7A5C", "#E4A83A", "#F1F7F4"] },
                    { id: "moderne",   label: "Moderne",    emoji: "🖤", colors: ["#323232", "#C2A03A", "#F6F6F6"] },
                    { id: "baroque",   label: "Baroque",    emoji: "🏰", colors: ["#7A1C40", "#C4921A", "#F6F1F4"] },
                    { id: "marin",     label: "Marin",      emoji: "🌊", colors: ["#1B4B8C", "#C8A96A", "#F1F4F8"] },
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
        </div>
      </div>

      {inviting && <InviteModal onClose={() => setInviting(false)} />}

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

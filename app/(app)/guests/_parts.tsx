"use client";

// Composants feuilles et helpers de la page Invités, extraits pour alléger
// page.tsx. Présentationnels et sans couplage au store.

import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/icon";
import { Badge, Button, Input } from "@/components/ui";
import type { Guest, Diet } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";

export const RSVP: Record<string, { label: string; tone: any; dot: string }> = {
  yes: { label: "Confirmé", tone: "sage", dot: "var(--sage)" },
  pending: { label: "En attente", tone: "amber", dot: "var(--amber)" },
  declined: { label: "Décliné", tone: "coral", dot: "var(--coral)" },
};

export const DIET_OPTIONS: { value: Diet; label: string; emoji: string }[] = [
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

export function dietLabel(diet: Diet): string {
  const found = DIET_OPTIONS.find((d) => d.value === diet);
  if (found) return found.label;
  // Legacy values
  if (diet === "vegetarien") return "Végétarien";
  if (diet === "sans gluten") return "Sans gluten";
  if (diet === "sans lactose") return "Sans lactose";
  if (diet === "none") return "Standard";
  return diet;
}

export function dietEmoji(diet: Diet): string {
  const found = DIET_OPTIONS.find((d) => d.value === diet);
  if (found) return found.emoji;
  if (diet === "vegetarien") return "🥗";
  if (diet === "none") return "✅";
  return "🍽️";
}

// Chiffre qui pulse quand la valeur change
export function AnimatedCounter({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      className="font-mono text-2xl font-semibold tracking-[-.02em]"
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 20 }}
    >
      {value}
    </motion.span>
  );
}

// Badge RSVP avec flip horizontal au changement
export function FlipBadge({ rsvp }: { rsvp: string }) {
  const info = RSVP[rsvp] ?? RSVP["pending"];
  return (
    <motion.div
      key={rsvp}
      style={{ display: "inline-flex", perspective: 400 }}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Badge tone={info.tone} dot>{info.label}</Badge>
    </motion.div>
  );
}

export function DietPicker({ value, onChange }: { value: Diet; onChange: (v: Diet) => void }) {
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

export function RsvpPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

export function QRModal({ guest, onClose }: { guest: { name: string; rsvpToken?: string }; onClose: () => void }) {
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

// Bouton inline qui ouvre le QRModal
export function QRCodeButton({ guest }: { guest: Guest }) {
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

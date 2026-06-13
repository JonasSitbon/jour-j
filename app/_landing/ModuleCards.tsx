"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TC, GOLD, SAGE, WARM_SOFT, TEXT_DARK, TEXT_MID } from "./tokens";
import { FadeIn, Pill } from "./shared";

// ─── Inline demo previews (lightweight versions used inside the modal) ─────────
// We import them lazily from DemoSection to avoid duplication; since this file
// is also 'use client' that is fine.
import DemoSection from "./DemoSection";

// Re-export the individual demo components by re-using the same ones bundled
// in DemoSection. To keep this file self-contained we inline minimal versions.
// NOTE: If you prefer single-source-of-truth, import the sub-components from
// a shared demos file. For now the modal Previews are the same components
// already rendered inside DemoSection — here we reference them via the
// ORDERED_MODULES.Preview field, which must be React components.

// ─── Because the Preview components are defined inside DemoSection.tsx and not
//     exported individually, we duplicate the minimal versions here.
//     (Alternative: export them from DemoSection and import here.)

import { MiniCheckBurst } from "./shared";

function DemoDates() {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const candidates = [
    { date: "Sam 15 Août 2026", score: 94, weather: "☀️", temp: "28°C", rain: "2%",  note: "Recommandé" },
    { date: "Sam 22 Août 2026", score: 88, weather: "⛅", temp: "25°C", rain: "15%", note: "" },
    { date: "Sam 5 Sept 2026",  score: 71, weather: "🌦", temp: "22°C", rain: "35%", note: "" },
    { date: "Sam 20 Sept 2026", score: 65, weather: "🌧", temp: "18°C", rain: "55%", note: "" },
  ];
  return (
    <div className="space-y-2.5 overflow-auto">
      <div className="text-[9px] flex items-center gap-1" style={{ color: "#9C8672" }}>💡 Cliquez sur une date pour la sélectionner</div>
      {candidates.map((c, i) => (
        <motion.button key={i} onClick={() => setSelected(selected === i ? null : i)}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
          whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
          className="w-full text-left rounded-xl border-2 overflow-hidden transition-colors"
          style={{ borderColor: selected === i ? TC : "transparent" }}>
          <div className="bg-white border border-black/5 rounded-[10px] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{c.weather}</span>
                <div>
                  <div className="text-[10.5px] font-bold" style={{ color: "#1C1208" }}>{c.date}</div>
                  <div className="text-[9px]" style={{ color: "#9C8672" }}>{c.temp} · Pluie {c.rain}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.note && <span className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold" style={{ background: `${TC}20`, color: TC }}>{c.note}</span>}
                <div className="text-[11px] font-bold" style={{ color: c.score >= 85 ? "#22c55e" : c.score >= 70 ? GOLD : "#ef4444" }}>{c.score}/100</div>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F4ECDD" }}>
              <motion.div className="h-full rounded-full"
                style={{ background: c.score >= 85 ? "#22c55e" : c.score >= 70 ? GOLD : "#ef4444" }}
                animate={{ width: hovered === i || selected === i ? `${c.score}%` : "0%" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
            </div>
          </div>
          {selected === i && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="px-3 py-2 flex items-center gap-2" style={{ background: `${TC}12` }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
              <span className="text-[10px] font-semibold" style={{ color: TC }}>Date sélectionnée — parfait !</span>
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

function DemoChecklist() {
  const allItems = [
    { cat: "🌸 Avant le mariage", items: ["Choisir et réserver la salle", "Sélectionner le traiteur", "Réserver le photographe", "Envoyer les faire-part"] },
    { cat: "💍 Cérémonie", items: ["Rédiger les vœux", "Choisir la musique d'entrée", "Préparer les alliances"] },
    { cat: "🎉 Réception", items: ["Valider le menu", "Plan de table finalisé", "Confirmer le DJ"] },
  ];
  const [checked, setChecked] = useState(new Set(["0-0", "0-1"]));
  const [burst, setBurst] = useState<string | null>(null);
  const total = allItems.reduce((a, c) => a + c.items.length, 0);
  const pct = Math.round((checked.size / total) * 100);
  const toggle = (key: string) => {
    if (checked.has(key)) { setChecked(p => { const n = new Set(p); n.delete(key); return n; }); return; }
    setChecked(p => new Set([...p, key]));
    setBurst(key); setTimeout(() => setBurst(null), 600);
  };
  return (
    <div className="space-y-3 overflow-auto">
      <div className="bg-white rounded-xl p-3 border border-black/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold" style={{ color: "#1C1208" }}>{pct}% complété</span>
          <span className="text-[10px]" style={{ color: "#9C8672" }}>{checked.size}/{total} tâches</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F4ECDD" }}>
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TC}, ${GOLD})` }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
        </div>
      </div>
      {allItems.map((cat, ci) => (
        <div key={ci}>
          <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9C8672" }}>{cat.cat}</div>
          <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
            {cat.items.map((item, ii) => {
              const key = `${ci}-${ii}`;
              const done = checked.has(key);
              return (
                <button key={key} onClick={() => toggle(key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 border-b border-black/5 last:border-0 text-left group relative">
                  <MiniCheckBurst active={burst === key} />
                  <motion.div animate={done ? { scale: [1, 0.75, 1.2, 1] } : { scale: 1 }} transition={{ duration: 0.28 }}
                    className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors"
                    style={{ borderColor: done ? TC : "#ddd", background: done ? TC : "transparent" }}>
                    {done && <svg width="7" height="7" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>}
                  </motion.div>
                  <span className={`text-[10.5px] transition-all ${done ? "line-through" : "group-hover:opacity-70"}`}
                    style={{ color: done ? "#bbb" : "#1C1208" }}>{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function DemoBudget() {
  const [cats, setCats] = useState([
    { label: "Traiteur",        amount: 14700, max: 18000, color: TC },
    { label: "Salle / Domaine", amount: 6300,  max: 9000,  color: GOLD },
    { label: "Photographe",     amount: 4200,  max: 5500,  color: SAGE },
    { label: "Musique / DJ",    amount: 2800,  max: 4000,  color: "#3B6EA5" },
    { label: "Fleurs & Déco",   amount: 3500,  max: 5000,  color: "#B5586E" },
  ]);
  const [pulse, setPulse] = useState<number | null>(null);
  const total = cats.reduce((a, c) => a + c.amount, 0);
  const totalMax = cats.reduce((a, c) => a + c.max, 0);
  const addExpense = (i: number) => {
    setCats(p => p.map((c, idx) => idx === i ? { ...c, amount: Math.min(c.amount + Math.round(c.max * 0.04), c.max) } : c));
    setPulse(i); setTimeout(() => setPulse(null), 400);
  };
  return (
    <div className="space-y-3 overflow-auto">
      <div className="bg-white rounded-xl p-3 border border-black/5">
        <div className="text-[9px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#9C8672" }}>Budget total</div>
        <div className="text-xl font-bold" style={{ color: "#1C1208" }}>{total.toLocaleString("fr-FR")} <span className="text-sm font-normal" style={{ color: "#9C8672" }}>/ {totalMax.toLocaleString("fr-FR")} €</span></div>
        <div className="h-2 rounded-full overflow-hidden mt-2" style={{ background: "#F4ECDD" }}>
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TC}, ${GOLD})` }}
            animate={{ width: `${Math.round(total / totalMax * 100)}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>
      <div className="text-[9px] flex items-center gap-1" style={{ color: "#9C8672" }}>💡 Cliquez pour simuler une dépense</div>
      <div className="space-y-1.5">
        {cats.map((c, i) => (
          <motion.button key={i} onClick={() => addExpense(i)}
            animate={pulse === i ? { scale: [1, 1.02, 1] } : {}}
            whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
            className="w-full bg-white rounded-xl px-3 py-2.5 border border-black/5 flex items-center gap-2.5 text-left">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="text-[10.5px] flex-1" style={{ color: "#1C1208" }}>{c.label}</span>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "#F4ECDD" }}>
              <motion.div className="h-full rounded-full" style={{ background: c.color }}
                animate={{ width: `${Math.round(c.amount / c.max * 100)}%` }} transition={{ duration: 0.4 }} />
            </div>
            <span className="text-[10px] font-bold w-16 text-right" style={{ color: "#1C1208" }}>{c.amount.toLocaleString("fr-FR")} €</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function DemoGuests() {
  const [guests, setGuests] = useState([
    { name: "Amélie Martin",  side: "Camille",   rsvp: "yes"     as "yes" | "pending" | "no", diet: "🌿" },
    { name: "Thomas Dupont",  side: "Alexandre", rsvp: "pending" as "yes" | "pending" | "no", diet: "🍽" },
    { name: "Claire Bernard", side: "Camille",   rsvp: "yes"     as "yes" | "pending" | "no", diet: "🌿" },
    { name: "Julien Moreau",  side: "Alexandre", rsvp: "no"      as "yes" | "pending" | "no", diet: "🍽" },
  ]);
  const cycle = { yes: "pending", pending: "no", no: "yes" } as const;
  const styleMap = { yes: "bg-green-100 text-green-700", pending: "bg-amber-100 text-amber-700", no: "bg-red-100 text-red-600" };
  const labelMap = { yes: "Confirmé", pending: "En attente", no: "Décliné" };
  return (
    <div className="space-y-3 overflow-auto">
      <div className="text-[9px]" style={{ color: "#9C8672" }}>💡 Cliquez sur le badge RSVP pour le changer</div>
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        {guests.map((g, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto] px-3 py-2.5 border-b border-black/5 last:border-0 items-center">
            <div>
              <div className="text-[10.5px] font-semibold" style={{ color: "#1C1208" }}>{g.name}</div>
              <div className="text-[8.5px]" style={{ color: "#9C8672" }}>Côté {g.side}</div>
            </div>
            <span className="text-[13px] mr-4">{g.diet}</span>
            <button onClick={() => setGuests(p => p.map((x, idx) => idx === i ? { ...x, rsvp: cycle[x.rsvp] } : x))}
              className={`px-2 py-0.5 rounded-full text-[9px] font-semibold cursor-pointer ${styleMap[g.rsvp]}`}>
              {labelMap[g.rsvp]}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoDayJ() {
  const events = [
    { time: "09:30", label: "Arrivée mariée & famille", icon: "🌸", duration: "45 min", color: "#B5586E" },
    { time: "11:00", label: "Cérémonie civile",          icon: "💍", duration: "30 min", color: TC },
    { time: "12:30", label: "Cocktail & photos",         icon: "🥂", duration: "2h",     color: GOLD },
    { time: "19:00", label: "Dîner de gala",             icon: "🍽", duration: "3h30",   color: SAGE },
    { time: "22:30", label: "Première danse",            icon: "🎵", duration: "5 min",  color: "#3B6EA5" },
    { time: "23:00", label: "Soirée & piste de danse",   icon: "🎉", duration: "3h",     color: "#8a7a6a" },
  ];
  return (
    <div className="space-y-1.5 overflow-auto">
      <div className="text-[11px] font-bold mb-2" style={{ color: "#1C1208" }}>Samedi 15 Août 2026</div>
      {events.map((e, i) => (
        <div key={i} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 border border-black/5">
          <div className="w-[36px] shrink-0 text-[9px] font-mono font-bold text-right" style={{ color: "#9C8672" }}>{e.time}</div>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
          <span className="text-[10px]">{e.icon}</span>
          <div className="flex-1">
            <div className="text-[10px] font-semibold" style={{ color: "#1C1208" }}>{e.label}</div>
            <div className="text-[8.5px]" style={{ color: "#9C8672" }}>{e.duration}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DemoSeating() {
  const [tables, setTables] = useState([
    { id: "T1", name: "Table des Mariés",  color: TC,        guests: ["Camille", "Alexandre", "Mamie Rose", "Papi Jean"] },
    { id: "T2", name: "Famille Camille",   color: SAGE,      guests: ["Marc", "Julie", "Paul", "Sarah"] },
    { id: "T3", name: "Table Amis",        color: "#3B6EA5", guests: ["Thomas", "Léa", "Romain", "Zoé"] },
    { id: "T4", name: "Famille Alexandre", color: GOLD,      guests: ["Henri", "Brigitte", "Nicolas"] },
  ]);
  const [dragging, setDragging] = useState<{ guest: string; from: number } | null>(null);
  const move = (guest: string, from: number, to: number) => {
    if (from === to) return;
    setTables(p => p.map((t, i) => {
      if (i === from) return { ...t, guests: t.guests.filter(g => g !== guest) };
      if (i === to) return { ...t, guests: [...t.guests, guest] };
      return t;
    }));
  };
  return (
    <div className="space-y-3 overflow-auto">
      <div className="text-[9px]" style={{ color: "#9C8672" }}>✦ Glissez un invité vers une autre table</div>
      <div className="grid grid-cols-2 gap-2">
        {tables.map((t, ti) => (
          <div key={t.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (dragging) { move(dragging.guest, dragging.from, ti); setDragging(null); } }}
            className="bg-white rounded-xl p-2.5 border-2 transition-all"
            style={{ borderColor: dragging && dragging.from !== ti ? `${t.color}50` : "rgba(0,0,0,0.05)", minHeight: 80 }}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
              <span className="text-[9px] font-bold truncate" style={{ color: "#1C1208" }}>{t.name}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {t.guests.map((g) => (
                <div key={g} draggable
                  onDragStart={() => setDragging({ guest: g, from: ti })}
                  onDragEnd={() => setDragging(null)}
                  className="px-1.5 py-0.5 rounded-full text-[8px] font-medium cursor-grab select-none"
                  style={{ background: `${t.color}18`, color: t.color }}>
                  {g}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoDashboard() {
  const [checked, setChecked] = useState<number[]>([0]);
  const tasks = ["Confirmer le traiteur", "Envoyer les save-the-dates", "Choisir les musiques", "Réserver le photographe", "Valider le menu"];
  const pct = Math.round((checked.length / tasks.length) * 100);
  const toggle = (i: number) => setChecked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  return (
    <div className="space-y-3 overflow-auto">
      <div className="rounded-xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${TC} 0%, #9B4A1A 100%)` }}>
        <div className="text-[10px] opacity-75 mb-0.5">Camille & Alexandre</div>
        <div className="text-2xl font-bold">J-142</div>
        <div className="text-[10px] opacity-80 mt-0.5">📍 Domaine des Roses · Aix-en-Provence</div>
      </div>
      <div className="bg-white rounded-xl border border-black/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold" style={{ color: "#1C1208" }}>Prochaines tâches</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${TC}15`, color: TC }}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-[#F4ECDD] rounded-full overflow-hidden mb-3">
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TC}, ${GOLD})` }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        </div>
        {tasks.map((task, i) => (
          <button key={i} onClick={() => toggle(i)} className="w-full flex items-center gap-2.5 py-1.5 text-left">
            <div className="w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0"
              style={{ borderColor: checked.includes(i) ? TC : "#ddd", background: checked.includes(i) ? TC : "transparent" }}>
              {checked.includes(i) && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>}
            </div>
            <span className={`text-[10.5px] ${checked.includes(i) ? "line-through text-[#bbb]" : ""}`} style={{ color: checked.includes(i) ? "#bbb" : "#1C1208" }}>{task}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Ordered module data ───────────────────────────────────────────────────────

const ORDERED_MODULES = [
  { id: "dates",     step: "01", emoji: "📅", name: "Dates & Météo",    color: TC,        tagline: "Choisissez la date parfaite",        desc: "Comparez vos dates candidates côte à côte avec la météo prévisionnelle pour votre région. Température, risque de pluie, ensoleillement — un score automatique vous guide vers la meilleure option.", features: ["Météo prévisionnelle par ville", "Score automatique 0-100", "Vue tableau comparatif", "Confirmation et export PDF"], Preview: DemoDates },
  { id: "checklist", step: "02", emoji: "✅", name: "Checklist",         color: SAGE,      tagline: "250+ tâches, rien à oublier",        desc: "Une checklist complète pré-remplie avec plus de 250 tâches organisées par catégorie et horizon temporel. Cochez, réassignez, ajoutez vos propres tâches.", features: ["250+ tâches pré-remplies", "Catégories et délais", "Progression en temps réel", "Assignation aux membres de l'équipe"], Preview: DemoChecklist },
  { id: "budget",    step: "03", emoji: "💰", name: "Budget",            color: GOLD,      tagline: "Dépenses réelles vs prévues",        desc: "Suivez chaque poste budgétaire avec comparaison budget prévu / réel. Comparez avec les moyennes nationales pour 11 catégories de mariage en France.", features: ["11 catégories de dépenses", "Budget réel vs prévu", "Comparaison moyennes nationales", "Alertes dépassement"], Preview: DemoBudget },
  { id: "guests",    step: "04", emoji: "👥", name: "Invités",           color: "#3B6EA5", tagline: "RSVP, régimes, côtés, tables",       desc: "Gérez l'intégralité de votre liste d'invités. Suivez les réponses RSVP, gérez les régimes alimentaires, organisez par côté (A/B) et reliez directement au plan de table.", features: ["Import/export CSV", "Suivi RSVP temps réel", "Régimes et allergies", "Filtres multi-critères"], Preview: DemoGuests },
  { id: "dayj",      step: "05", emoji: "📋", name: "Jour J",            color: "#B5586E", tagline: "Déroulé minute par minute",          desc: "Construisez le programme complet de votre journée à partir de 3 templates (civil, laïc, religieux). Activez le mode EN DIRECT le jour J pour suivre le déroulé en temps réel.", features: ["3 templates de référence", "Mode EN DIRECT le Jour J", "Alertes de timing", "Partage prestataires & témoins"], Preview: DemoDayJ },
  { id: "seating",   step: "06", emoji: "🪑", name: "Plan de table",     color: TC,        tagline: "Drag & drop visuel",                 desc: "Créez votre plan de table avec un éditeur drag & drop. Gérez les contraintes alimentaires, les incompatibilités familiales et imprimez un document professionnel.", features: ["Drag & drop entre tables", "Indicateurs de régimes", "Formes de salle personnalisables", "Export PDF prêt à imprimer"], Preview: DemoSeating },
  { id: "dashboard", step: "07", emoji: "🏠", name: "Tableau de bord",   color: "#6B5744", tagline: "Vue d'ensemble en un coup d'œil",   desc: "Le tableau de bord centralise toutes vos informations clés : compte à rebours, taux de réponse invités, progression budget, prochaines tâches urgentes.", features: ["Compte à rebours Jour J", "Résumé invités et RSVP", "Progression budget", "Tâches urgentes à venir"], Preview: DemoDashboard },
];

// ─── Main component ────────────────────────────────────────────────────────────

export default function ModuleCards() {
  const [active, setActive] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const onWheel = (e: WheelEvent) => { if (cardRef.current?.contains(e.target as Node)) return; close(); };
    const onTouchMove = (e: TouchEvent) => { if (cardRef.current?.contains(e.target as Node)) return; close(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("wheel", onWheel, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("touchmove", onTouchMove);
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [active, close]);

  return (
    <section id="features" className="py-24 px-6" style={{ background: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-14">
          <Pill>Fonctionnalités</Pill>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
            Les modules essentiels,
            <span style={{ color: TC }}> dans l&apos;ordre.</span>
          </h2>
          <p className="mt-4 text-[15px] max-w-md mx-auto" style={{ color: TEXT_MID }}>
            Cliquez sur une carte pour l&apos;explorer en détail.
          </p>
        </FadeIn>

        {/* Cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {ORDERED_MODULES.map((m, i) => (
            <motion.div
              key={m.id}
              layoutId={`module-card-${m.id}`}
              onClick={() => setActive(i)}
              className="relative h-[168px] sm:h-[180px] rounded-2xl flex flex-col justify-between p-5 cursor-pointer select-none"
              style={{ background: "#FFFFFF", border: "1px solid rgba(28,18,8,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              whileHover={{ y: -8, boxShadow: "0 16px 40px rgba(0,0,0,0.12)", borderColor: `${m.color}40` }}
              whileTap={{ scale: 0.97 }}
              transition={{ layout: { type: "spring", stiffness: 260, damping: 26 }, default: { type: "spring", stiffness: 340, damping: 28 } }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: m.color }}>Étape {m.step}</div>
              <div className="text-[28px]">{m.emoji}</div>
              <div>
                <div className="text-[14px] font-bold leading-tight" style={{ color: TEXT_DARK }}>{m.name}</div>
                <div className="text-[11.5px] mt-0.5 leading-snug" style={{ color: TEXT_MID }}>{m.tagline}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expanded overlay */}
      <AnimatePresence>
        {active !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[200]"
              style={{ background: "rgba(5,3,1,0.70)", backdropFilter: "blur(12px)" }}
              onClick={() => setActive(null)}
            />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-8 pointer-events-none">
              <motion.div
                ref={cardRef}
                layoutId={`module-card-${ORDERED_MODULES[active].id}`}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="w-full max-w-[700px] rounded-2xl overflow-hidden pointer-events-auto"
                style={{ background: "#FFFFFF", boxShadow: "0 40px 100px rgba(0,0,0,0.40)", height: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 shrink-0" style={{ borderBottom: "1px solid rgba(28,18,8,0.07)" }}>
                  <div className="text-[32px] leading-none shrink-0">{ORDERED_MODULES[active].emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.18em] mb-0.5" style={{ color: ORDERED_MODULES[active].color }}>Étape {ORDERED_MODULES[active].step}</div>
                    <div className="text-[18px] font-bold tracking-tight leading-tight" style={{ color: TEXT_DARK }}>{ORDERED_MODULES[active].name}</div>
                  </div>
                  <button onClick={close} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px] transition-opacity hover:opacity-60"
                    style={{ background: "rgba(28,18,8,0.06)", color: TEXT_MID }} aria-label="Fermer">✕</button>
                </div>

                {/* Description + features */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.20, duration: 0.20 }}
                  className="px-5 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(28,18,8,0.06)" }}>
                  <p className="text-[12.5px] leading-relaxed mb-2.5 line-clamp-2" style={{ color: TEXT_MID }}>
                    {ORDERED_MODULES[active].desc}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ORDERED_MODULES[active].features.map((f, fi) => (
                      <span key={fi} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={{ background: `${ORDERED_MODULES[active].color}14`, color: ORDERED_MODULES[active].color }}>
                        <span className="text-[7px]">▸</span>{f}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Interactive preview */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26, duration: 0.20 }}
                  className="flex-1 overflow-y-auto p-4" style={{ background: WARM_SOFT, minHeight: 0 }}>
                  {(() => { const Preview = ORDERED_MODULES[active].Preview; return <Preview />; })()}
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

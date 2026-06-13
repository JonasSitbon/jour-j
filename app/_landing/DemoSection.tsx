"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/icon";
import {
  TC, GOLD, SAGE, WARM_SOFT, TEXT_DARK, TEXT_MID, TEXT_LIGHT, BROWN_DARK,
} from "./tokens";
import { FadeIn, Pill, MiniCheckBurst } from "./shared";

// ─── Demo module list ──────────────────────────────────────────────────────────

const DEMO_MODULES = [
  { id: "dashboard", label: "Tableau de bord", emoji: "🏠" },
  { id: "guests",    label: "Invités",          emoji: "👥" },
  { id: "checklist", label: "Checklist",         emoji: "✅" },
  { id: "budget",    label: "Budget",            emoji: "💰" },
  { id: "dayj",      label: "Jour J",            emoji: "📋" },
  { id: "seating",   label: "Plan de table",     emoji: "🪑" },
  { id: "dates",     label: "Dates & Météo",     emoji: "📅" },
];

// ─── Demo sub-components ───────────────────────────────────────────────────────

function DemoDashboard() {
  const [checked, setChecked] = useState<number[]>([0]);
  const [burst, setBurst] = useState<number | null>(null);
  const tasks = ["Confirmer le traiteur", "Envoyer les save-the-dates", "Choisir les musiques cérémonie", "Réserver le photographe", "Valider le menu avec le chef"];
  const pct = Math.round((checked.length / tasks.length) * 100);
  const toggle = (i: number) => {
    if (checked.includes(i)) { setChecked(p => p.filter(x => x !== i)); return; }
    setChecked(p => [...p, i]);
    setBurst(i); setTimeout(() => setBurst(null), 600);
  };
  return (
    <div className="space-y-3 overflow-auto">
      <div className="rounded-xl p-4 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${TC} 0%, #9B4A1A 100%)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />
        <div className="text-[10px] opacity-75 mb-0.5">Camille & Alexandre</div>
        <div className="text-2xl font-bold">J-142</div>
        <div className="text-[10px] opacity-80 mt-0.5">📍 Domaine des Roses · Aix-en-Provence</div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {[`${95 + checked.length} invités`, `${pct}% checklist`, "24 500 €"].map((t, i) => (
            <motion.span key={i} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 0.3 }}
              className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/20">{t}</motion.span>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-black/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold" style={{ color: TEXT_DARK }}>Prochaines tâches</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${TC}15`, color: TC }}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-[#F4ECDD] rounded-full overflow-hidden mb-3">
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TC}, ${GOLD})` }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="text-[9px] mb-2" style={{ color: TEXT_LIGHT }}>👆 Cliquez pour cocher</div>
        {tasks.map((task, i) => (
          <button key={i} onClick={() => toggle(i)} className="w-full flex items-center gap-2.5 py-1.5 text-left group relative">
            <MiniCheckBurst active={burst === i} />
            <motion.div animate={checked.includes(i) ? { scale: [1, 0.75, 1.2, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}
              className="w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors"
              style={{ borderColor: checked.includes(i) ? TC : "#ddd", background: checked.includes(i) ? TC : "transparent" }}>
              {checked.includes(i) && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>}
            </motion.div>
            <span className={`text-[10.5px] transition-all ${checked.includes(i) ? "line-through text-[#bbb]" : "group-hover:opacity-70"}`} style={{ color: checked.includes(i) ? "#bbb" : TEXT_DARK }}>{task}</span>
          </button>
        ))}
        {pct === 100 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-2 text-center text-[11px] font-semibold py-1.5 rounded-lg"
            style={{ background: `${SAGE}20`, color: SAGE }}>
            🎉 Checklist complète !
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DemoGuests() {
  const [guests, setGuests] = useState([
    { name: "Amélie Martin",  side: "Camille",    rsvp: "yes"     as "yes" | "pending" | "no", diet: "🌿" },
    { name: "Thomas Dupont",  side: "Alexandre",  rsvp: "pending" as "yes" | "pending" | "no", diet: "🍽" },
    { name: "Claire Bernard", side: "Camille",    rsvp: "yes"     as "yes" | "pending" | "no", diet: "🌿" },
    { name: "Julien Moreau",  side: "Alexandre",  rsvp: "no"      as "yes" | "pending" | "no", diet: "🍽" },
    { name: "Sophie Laurent", side: "Camille",    rsvp: "yes"     as "yes" | "pending" | "no", diet: "🥗" },
    { name: "Luc Girard",     side: "Alexandre",  rsvp: "pending" as "yes" | "pending" | "no", diet: "🍽" },
  ]);
  const [flip, setFlip] = useState<number | null>(null);
  const cycle = { yes: "pending", pending: "no", no: "yes" } as const;
  const style = { yes: "bg-green-100 text-green-700", pending: "bg-amber-100 text-amber-700", no: "bg-red-100 text-red-600" };
  const label = { yes: "Confirmé", pending: "En attente", no: "Décliné" };
  const toggleRsvp = (i: number) => {
    setGuests(p => p.map((g, idx) => idx === i ? { ...g, rsvp: cycle[g.rsvp] } : g));
    setFlip(i); setTimeout(() => setFlip(null), 400);
  };
  const yes = guests.filter(g => g.rsvp === "yes").length;
  const pending = guests.filter(g => g.rsvp === "pending").length;
  const no = guests.filter(g => g.rsvp === "no").length;
  return (
    <div className="space-y-3 overflow-auto">
      <div className="flex gap-2 flex-wrap">
        {[{ l: `✓ ${yes} confirmés`, c: "bg-green-50 text-green-700" }, { l: `⏳ ${pending} en attente`, c: "bg-amber-50 text-amber-700" }, { l: `✗ ${no} déclinés`, c: "bg-red-50 text-red-600" }].map((s, i) => (
          <motion.span key={i} layout className={`${s.c} px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-current/10`}>{s.l}</motion.span>
        ))}
      </div>
      <div className="text-[9px] flex items-center gap-1" style={{ color: TEXT_LIGHT }}>💡 Cliquez sur le badge RSVP pour le changer</div>
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-0 px-3 py-2 border-b text-[9px] font-semibold uppercase tracking-wide" style={{ background: WARM_SOFT, borderColor: "rgba(201,110,44,0.08)", color: TEXT_LIGHT }}>
          <span>Invité</span><span className="mr-4">Régime</span><span>RSVP</span>
        </div>
        {guests.map((g, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto] px-3 py-2.5 border-b border-black/5 last:border-0 items-center">
            <div>
              <div className="text-[10.5px] font-semibold" style={{ color: TEXT_DARK }}>{g.name}</div>
              <div className="text-[8.5px]" style={{ color: TEXT_LIGHT }}>Côté {g.side}</div>
            </div>
            <span className="text-[13px] mr-4">{g.diet}</span>
            <motion.button onClick={() => toggleRsvp(i)}
              animate={flip === i ? { rotateY: [0, 90, 0] } : {}}
              transition={{ duration: 0.3 }}
              className={`px-2 py-0.5 rounded-full text-[9px] font-semibold cursor-pointer ${style[g.rsvp]}`}>
              {label[g.rsvp]}
            </motion.button>
          </div>
        ))}
      </div>
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
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: TEXT_LIGHT }}>Budget total</div>
            <div className="text-xl font-bold" style={{ color: TEXT_DARK }}>{total.toLocaleString("fr-FR")} <span className="text-sm font-normal" style={{ color: TEXT_LIGHT }}>/ {totalMax.toLocaleString("fr-FR")} €</span></div>
          </div>
          <div className="text-right">
            <div className="text-[9px]" style={{ color: TEXT_LIGHT }}>Restant</div>
            <div className="text-sm font-bold text-green-600">{(totalMax - total).toLocaleString("fr-FR")} €</div>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: WARM_SOFT }}>
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TC}, ${GOLD})` }}
            animate={{ width: `${Math.round(total / totalMax * 100)}%` }} transition={{ duration: 0.5 }} />
        </div>
        <div className="text-[9px] mt-1" style={{ color: TEXT_LIGHT }}>{Math.round(total / totalMax * 100)}% engagé</div>
      </div>
      <div className="text-[9px] flex items-center gap-1" style={{ color: TEXT_LIGHT }}>💡 Cliquez sur une catégorie pour simuler une dépense</div>
      <div className="space-y-1.5">
        {cats.map((c, i) => (
          <motion.button key={i} onClick={() => addExpense(i)}
            animate={pulse === i ? { scale: [1, 1.02, 1] } : {}}
            whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
            className="w-full bg-white rounded-xl px-3 py-2.5 border border-black/5 flex items-center gap-2.5 text-left group transition-colors hover:border-current/20">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="text-[10.5px] flex-1 group-hover:opacity-70 transition-opacity" style={{ color: TEXT_DARK }}>{c.label}</span>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: WARM_SOFT }}>
              <motion.div className="h-full rounded-full" style={{ background: c.color }}
                animate={{ width: `${Math.round(c.amount / c.max * 100)}%` }} transition={{ duration: 0.4 }} />
            </div>
            <span className="text-[10px] font-bold w-16 text-right" style={{ color: TEXT_DARK }}>{c.amount.toLocaleString("fr-FR")} €</span>
          </motion.button>
        ))}
      </div>
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
          <span className="text-[11px] font-bold" style={{ color: TEXT_DARK }}>{pct}% complété</span>
          <span className="text-[10px]" style={{ color: TEXT_LIGHT }}>{checked.size}/{total} tâches</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: WARM_SOFT }}>
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TC}, ${GOLD})` }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
        </div>
        {pct === 100 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-1.5 text-center text-[10px] font-semibold" style={{ color: SAGE }}>🎉 Checklist complète !</motion.div>
        )}
      </div>
      {allItems.map((cat, ci) => (
        <div key={ci}>
          <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: TEXT_LIGHT }}>{cat.cat}</div>
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
                    style={{ color: done ? "#bbb" : TEXT_DARK }}>{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function DemoDayJ() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const events = [
    { time: "09:30", label: "Arrivée mariée & famille",  icon: "🌸", duration: "45 min", color: "#B5586E", detail: "Arrivée des parents et témoins. Accueil par le Maître d'hôtel. Photos préparatifs." },
    { time: "11:00", label: "Cérémonie civile",           icon: "💍", duration: "30 min", color: TC,        detail: "Signature des registres, lecture des vœux, échange des alliances. Photos officielles." },
    { time: "12:30", label: "Cocktail & photos",          icon: "🥂", duration: "2h",     color: GOLD,      detail: "Jardins du domaine. Canapés traiteur, photobooth, séance couple en parallèle." },
    { time: "19:00", label: "Dîner de gala",              icon: "🍽", duration: "3h30",   color: SAGE,      detail: "Menu 5 plats. Discours des témoins. Animation musicale entre les plats." },
    { time: "22:30", label: "Première danse",             icon: "🎵", duration: "5 min",  color: "#3B6EA5", detail: "Ouverture du bal. Entrée des parents pour le second slow." },
    { time: "23:00", label: "Soirée & piste de danse",    icon: "🎉", duration: "3h",     color: "#8a7a6a", detail: "DJ set. Bar à cocktails. Pièce montée à minuit." },
  ];
  return (
    <div className="space-y-2 overflow-auto">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] font-bold" style={{ color: TEXT_DARK }}>Samedi 15 Août 2026</div>
        <button onClick={() => setLiveMode(!liveMode)}
          className="px-2.5 py-1 rounded-full text-[9px] font-semibold text-white transition-all"
          style={{ background: liveMode ? SAGE : TC }}>
          {liveMode ? "● EN DIRECT" : "Mode EN DIRECT"}
        </button>
      </div>
      <div className="text-[9px] flex items-center gap-1 mb-2" style={{ color: TEXT_LIGHT }}>💡 Cliquez sur un événement pour les détails</div>
      <div className="relative">
        <div className="absolute left-[41px] top-3 bottom-3 w-[2px]" style={{ background: `linear-gradient(to bottom, transparent, ${TC}30, transparent)` }} />
        {events.map((e, i) => (
          <div key={i} className="mb-1">
            <button onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-start gap-2.5 text-left group">
              <div className="w-[38px] shrink-0 text-[9px] font-mono font-bold pt-2 text-right" style={{ color: TEXT_LIGHT }}>{e.time}</div>
              <div className="w-2.5 h-2.5 rounded-full border-2 border-white shrink-0 mt-2 z-10 shadow-sm transition-transform group-hover:scale-110"
                style={{ background: liveMode && i === 2 ? "#22c55e" : e.color }} />
              <div className="flex-1 bg-white rounded-xl px-2.5 py-2 border border-black/5 group-hover:border-[#C96E2C]/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]">{e.icon}</span>
                    <span className="text-[10px] font-semibold" style={{ color: TEXT_DARK }}>{e.label}</span>
                    {liveMode && i === 2 && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                  </div>
                  <motion.span animate={{ rotate: expanded === i ? 180 : 0 }} transition={{ duration: 0.2 }}
                    className="text-[10px]" style={{ color: TEXT_LIGHT }}>▾</motion.span>
                </div>
                <div className="text-[8.5px]" style={{ color: TEXT_LIGHT }}>{e.duration}</div>
              </div>
            </button>
            <AnimatePresence>
              {expanded === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                  className="ml-[55px] overflow-hidden">
                  <div className="bg-white/60 rounded-b-xl border border-t-0 border-black/5 px-3 py-2 mb-1">
                    <p className="text-[10px] leading-relaxed" style={{ color: TEXT_MID }}>{e.detail}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
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
  const [hint, setHint] = useState("✦ Glissez un invité vers une autre table");
  const move = (guest: string, from: number, to: number) => {
    if (from === to) return;
    setTables(p => p.map((t, i) => {
      if (i === from) return { ...t, guests: t.guests.filter(g => g !== guest) };
      if (i === to) return { ...t, guests: [...t.guests, guest] };
      return t;
    }));
    setHint(`✓ ${guest} → ${tables[to].name}`);
    setTimeout(() => setHint("✦ Glissez un invité vers une autre table"), 2000);
  };
  return (
    <div className="space-y-3 overflow-auto">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold" style={{ color: TEXT_DARK }}>{tables.reduce((a, t) => a + t.guests.length, 0)} invités placés</div>
        <span className="px-2 py-0.5 rounded-md text-[9px] bg-green-100 text-green-700">4 tables ✓</span>
      </div>
      <div className="text-[9px] px-2 py-1.5 rounded-lg" style={{ background: `${TC}10`, color: TEXT_MID }}>{hint}</div>
      <div className="grid grid-cols-2 gap-2">
        {tables.map((t, ti) => (
          <div key={t.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (dragging) { move(dragging.guest, dragging.from, ti); setDragging(null); } }}
            className="bg-white rounded-xl p-2.5 border-2 transition-all"
            style={{ borderColor: dragging && dragging.from !== ti ? `${t.color}50` : "rgba(0,0,0,0.05)", minHeight: 80 }}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
              <span className="text-[9px] font-bold truncate" style={{ color: TEXT_DARK }}>{t.name}</span>
              <span className="ml-auto text-[8px]" style={{ color: TEXT_LIGHT }}>{t.guests.length}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <AnimatePresence>
                {t.guests.map((g) => (
                  <motion.div key={g} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    draggable onDragStart={() => setDragging({ guest: g, from: ti })} onDragEnd={() => setDragging(null)}
                    className="px-1.5 py-0.5 rounded-full text-[8px] font-medium cursor-grab active:cursor-grabbing select-none"
                    style={{ background: `${t.color}18`, color: t.color }}>
                    {g}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <div className="text-[9px] flex items-center gap-1" style={{ color: TEXT_LIGHT }}>💡 Cliquez sur une date pour la sélectionner</div>
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
                  <div className="text-[10.5px] font-bold" style={{ color: TEXT_DARK }}>{c.date}</div>
                  <div className="text-[9px]" style={{ color: TEXT_LIGHT }}>{c.temp} · Pluie {c.rain}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.note && <span className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold" style={{ background: `${TC}20`, color: TC }}>{c.note}</span>}
                <div className="text-[11px] font-bold" style={{ color: c.score >= 85 ? "#22c55e" : c.score >= 70 ? GOLD : "#ef4444" }}>{c.score}/100</div>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: WARM_SOFT }}>
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

// ─── Main InteractiveDemo export ───────────────────────────────────────────────

export default function InteractiveDemo() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const content: Record<string, React.ReactNode> = {
    dashboard: <DemoDashboard />,
    guests:    <DemoGuests />,
    checklist: <DemoChecklist />,
    budget:    <DemoBudget />,
    dayj:      <DemoDayJ />,
    seating:   <DemoSeating />,
    dates:     <DemoDates />,
  };

  return (
    <section id="demo" className="py-24 px-4 sm:px-6" style={{ background: WARM_SOFT }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-14">
          <Pill>Démo interactive</Pill>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
            Essayez l&apos;app, maintenant.
          </h2>
          <p className="mt-3 text-[15px] max-w-xl mx-auto leading-relaxed" style={{ color: TEXT_MID }}>
            Tout est cliquable, tout est vrai. Pas une vidéo — une vraie démonstration interactive.
          </p>
        </FadeIn>

        <motion.div ref={ref}
          initial={{ opacity: 0, y: 48 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 32px 80px rgba(56,47,35,0.18), 0 8px 24px rgba(56,47,35,0.08)", border: "1px solid rgba(201,110,44,0.15)" }}>

          {/* Browser chrome */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#F0E8D8", borderBottom: "1px solid rgba(201,110,44,0.12)" }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FFB3AE]" />
              <div className="w-3 h-3 rounded-full bg-[#FFD180]" />
              <div className="w-3 h-3 rounded-full bg-[#A8D5A2]" />
            </div>
            <div className="flex-1 mx-3 bg-white/80 rounded-lg px-3 py-1.5 text-center border border-black/8">
              <span className="text-[11px] font-mono" style={{ color: TEXT_LIGHT }}>app.the-cockpit.fr/dashboard</span>
            </div>
          </div>

          {/* App shell: sidebar + content */}
          <div className="flex" style={{ background: "#FFFFFF", height: 540 }}>

            {/* Sidebar */}
            <div className="w-44 shrink-0 flex flex-col border-r overflow-hidden" style={{ background: WARM_SOFT, borderColor: "rgba(201,110,44,0.1)" }}>
              <div className="px-3 py-2.5 border-b flex items-center gap-2 shrink-0" style={{ borderColor: "rgba(201,110,44,0.08)" }}>
                <div style={{ color: TC }}><Logo size={18} /></div>
                <span className="text-[12px] font-semibold" style={{ color: BROWN_DARK }}>Jour J</span>
              </div>
              <div className="mx-2.5 mt-2.5 mb-1 rounded-lg p-2.5 text-white text-[9px] shrink-0"
                style={{ background: `linear-gradient(135deg, ${TC}, #9B4A1A)` }}>
                <div className="font-semibold">Camille & Alexandre</div>
                <div className="opacity-70 mt-0.5">J-142 · Été 2026</div>
              </div>
              <nav className="flex-1 overflow-y-auto py-1.5 px-1.5 relative">
                {DEMO_MODULES.map((m) => (
                  <button key={m.id} onClick={() => setActiveModule(m.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 text-left transition-all relative"
                    style={{ background: activeModule === m.id ? `${TC}14` : "transparent", color: activeModule === m.id ? TC : TEXT_MID }}>
                    {activeModule === m.id && (
                      <motion.div layoutId="sidebar-pill"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: `${TC}14` }}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                    <span className="text-[11px] relative z-10">{m.emoji}</span>
                    <span className="text-[10px] font-medium truncate relative z-10">{m.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Topbar */}
              <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b"
                style={{ background: "#FDFAF5", borderColor: "rgba(201,110,44,0.08)" }}>
                <AnimatePresence mode="wait">
                  <motion.div key={activeModule}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18 }}
                    className="text-[12px] font-semibold" style={{ color: TEXT_DARK }}>
                    {DEMO_MODULES.find(m => m.id === activeModule)?.emoji}{" "}
                    {DEMO_MODULES.find(m => m.id === activeModule)?.label}
                  </motion.div>
                </AnimatePresence>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ background: TC }}>C</div>
              </div>

              {/* Module */}
              <div className="flex-1 overflow-hidden p-4" style={{ background: WARM_SOFT }}>
                <AnimatePresence mode="wait">
                  <motion.div key={activeModule}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="h-full overflow-auto">
                    {content[activeModule]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick-access pills below */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {DEMO_MODULES.map((m) => (
            <button key={m.id} onClick={() => setActiveModule(m.id)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{ background: activeModule === m.id ? TC : "rgba(201,110,44,0.1)", color: activeModule === m.id ? "white" : TEXT_MID }}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

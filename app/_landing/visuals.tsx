"use client";

// Blocs visuels présentationnels de la landing (maquettes, décor, helpers).
// Sans état applicatif — extraits de page.tsx pour l'alléger.

import { motion } from "framer-motion";
import { TC, GOLD, WARM_SOFT, TEXT_LIGHT } from "./tokens";

export function Ic({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    wallet: "M21 12V7H5a2 2 0 0 1 0-4h14v4M21 12H16a2 2 0 0 0 0 4h5v-4zM3 5v14a2 2 0 0 0 2 2h16v-4",
    calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
    check: "M20 6L9 17l-5-5",
    rings: "M12 8a4 4 0 0 1 4 4M8 12a4 4 0 0 1 4-4M8 12a4 4 0 0 0 4 4M16 12a4 4 0 0 1-4 4",
    music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    sparkle: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
    gift: "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
    key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
    card: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM1 10h22",
    arrow: "M5 12h14M12 5l7 7-7 7",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    check2: "M20 6L9 17l-5-5",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || paths.grid} />
    </svg>
  );
}

// ─── App Mockup: Dashboard ──────────────────────────────────────────────────────

export function MockDashboard() {
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] min-w-0 w-full select-none">
      {/* Hero card */}
      <div className="rounded-lg p-4 mb-4 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${TC} 0%, #9B4A1A 100%)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }} />
        <div className="text-[11px] opacity-75 font-medium mb-1">Camille &amp; Alexandre</div>
        <div className="text-3xl font-bold tracking-tight">J-142</div>
        <div className="text-[11px] opacity-80 mt-0.5">📍 Domaine des Roses · Aix-en-Provence</div>
        <div className="mt-3 flex gap-2">
          {["Été 2026", "147 invités", "24 500 €"].map((t, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/20 backdrop-blur">{t}</span>
          ))}
        </div>
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Invités", val: "147", sub: "12 en attente", color: TC },
          { label: "Checklist", val: "68%", sub: "32 tâches", color: "#6B8C3E" },
          { label: "Budget", val: "70%", sub: "24 500 €", color: GOLD },
          { label: "Prestataires", val: "8/12", sub: "confirmés", color: "#3B6EA5" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-2.5 text-center border border-black/5">
            <div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[9px] font-semibold text-[#382F23]">{s.label}</div>
            <div className="text-[8px] text-[#8a7a6a] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
      {/* Checklist preview */}
      <div className="bg-white rounded-lg p-3 border border-black/5">
        <div className="text-[10px] font-semibold text-[#8a7a6a] uppercase tracking-wide mb-2">Prochaines tâches</div>
        {[
          { t: "Confirmer le traiteur", done: true },
          { t: "Envoyer save-the-dates", done: false },
          { t: "Choisir les musiques cérémonie", done: false },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${item.done ? "border-transparent" : "border-[#ddd]"}`}
              style={{ background: item.done ? TC : "transparent" }}>
              {item.done && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>}
            </div>
            <span className={`text-[10px] ${item.done ? "line-through text-[#aaa]" : "text-[#382F23]"}`}>{item.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Mockup: Guests ────────────────────────────────────────────────────────

export function MockGuests() {
  const guests = [
    { name: "Amélie Martin", side: "A", rsvp: "yes", diet: "🌿", table: "T1" },
    { name: "Thomas Dupont", side: "B", rsvp: "pending", diet: "🍽", table: "—" },
    { name: "Claire Bernard", side: "A", rsvp: "yes", diet: "🌿", table: "T3" },
    { name: "Julien Moreau", side: "B", rsvp: "no", diet: "🍽", table: "—" },
    { name: "Sophie Laurent", side: "A", rsvp: "yes", diet: "🥗", table: "T2" },
  ];
  const rsvpStyle: Record<string, string> = {
    yes: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    no: "bg-red-100 text-red-600",
  };
  const rsvpLabel: Record<string, string> = { yes: "Confirmé", pending: "En attente", no: "Décliné" };
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] select-none">
      {/* Stats */}
      <div className="flex gap-2 mb-3">
        {[{ l: "147 invités", c: "bg-white" }, { l: "✓ 98 confirmés", c: "bg-green-50" }, { l: "⏳ 35 en attente", c: "bg-amber-50" }, { l: "✗ 14 déclinés", c: "bg-red-50" }].map((s, i) => (
          <span key={i} className={`${s.c} px-2 py-1 rounded-md text-[9px] font-semibold border border-black/5`}>{s.l}</span>
        ))}
      </div>
      {/* Search bar */}
      <div className="bg-white border border-black/10 rounded-lg px-3 py-2 text-[10px] text-[#aaa] mb-3 flex items-center gap-2">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        Rechercher un invité…
      </div>
      {/* Table */}
      <div className="bg-white rounded-lg border border-black/5 overflow-hidden">
        <div className="grid grid-cols-[2fr_auto_auto_auto] gap-0">
          <div className="col-span-4 grid grid-cols-[2fr_auto_auto_auto] px-3 py-1.5 bg-[#F4ECDD] text-[8px] font-semibold text-[#8a7a6a] uppercase tracking-wide border-b border-black/5">
            <span>Invité</span><span>RSVP</span><span>Régime</span><span>Table</span>
          </div>
          {guests.map((g, i) => (
            <div key={i} className="col-span-4 grid grid-cols-[2fr_auto_auto_auto] px-3 py-2 border-b border-black/5 last:border-0 items-center gap-2">
              <div>
                <div className="text-[10px] font-semibold">{g.name}</div>
                <div className="text-[8px] text-[#8a7a6a]">Côté {g.side === "A" ? "Camille" : "Alexandre"}</div>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-semibold ${rsvpStyle[g.rsvp]}`}>{rsvpLabel[g.rsvp]}</span>
              <span className="text-[12px]">{g.diet}</span>
              <span className="text-[9px] font-mono text-[#8a7a6a]">{g.table}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App Mockup: Budget ────────────────────────────────────────────────────────

export function MockBudget() {
  const cats = [
    { label: "Traiteur", pct: 42, amount: "14 700€", color: TC },
    { label: "Salle / Domaine", pct: 18, amount: "6 300€", color: GOLD },
    { label: "Photographe", pct: 12, amount: "4 200€", color: "#6B8C3E" },
    { label: "Musique / DJ", pct: 8, amount: "2 800€", color: "#3B6EA5" },
    { label: "Fleurs & Déco", pct: 10, amount: "3 500€", color: "#B5586E" },
    { label: "Autres", pct: 10, amount: "3 000€", color: "#8a7a6a" },
  ];
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] select-none">
      {/* Total */}
      <div className="bg-white rounded-lg p-3 mb-3 border border-black/5">
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-[9px] text-[#8a7a6a] font-semibold uppercase tracking-wide">Budget total</div>
            <div className="text-xl font-bold">24 500 <span className="text-sm font-semibold text-[#8a7a6a]">/ 35 000€</span></div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-[#8a7a6a]">Restant</div>
            <div className="text-sm font-bold text-green-600">10 500€</div>
          </div>
        </div>
        <div className="h-2 bg-[#F4ECDD] rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${TC}, ${GOLD})` }}
            initial={{ width: "0%" }} whileInView={{ width: "70%" }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }} />
        </div>
        <div className="text-[9px] text-[#8a7a6a] mt-1">70% engagé</div>
      </div>
      {/* Categories */}
      <div className="flex flex-col gap-1.5">
        {cats.map((c, i) => (
          <div key={i} className="bg-white rounded-lg px-3 py-2 border border-black/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="text-[10px] flex-1">{c.label}</span>
            <div className="w-16 h-1.5 bg-[#F4ECDD] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: c.color }}
                initial={{ width: 0 }} whileInView={{ width: `${c.pct}%` }} viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <span className="text-[9px] font-semibold text-[#8a7a6a] w-10 text-right">{c.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Mockup: Jour J ───────────────────────────────────────────────────────

export function MockDayJ() {
  const events = [
    { time: "09:30", label: "Arrivée mariée & famille", icon: "🌸", duration: "45 min", color: "#B5586E" },
    { time: "11:00", label: "Cérémonie civile", icon: "💍", duration: "30 min", color: TC },
    { time: "12:30", label: "Cocktail & photos", icon: "🥂", duration: "2h", color: GOLD },
    { time: "19:00", label: "Dîner de gala", icon: "🍽", duration: "3h30", color: "#6B8C3E" },
    { time: "22:30", label: "Première danse", icon: "🎵", duration: "5 min", color: "#3B6EA5" },
    { time: "23:00", label: "Soirée & piste de danse", icon: "🎉", duration: "3h", color: "#8a7a6a" },
  ];
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold">Samedi 15 Août 2026</div>
        <span className="px-2 py-0.5 rounded-full text-[8px] font-semibold text-white" style={{ background: TC }}>EN DIRECT</span>
      </div>
      <div className="flex flex-col gap-0 relative">
        <div className="absolute left-[42px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        {events.map((e, i) => (
          <div key={i} className="flex items-start gap-3 py-2 relative">
            <div className="w-[38px] shrink-0 text-[9px] font-mono font-bold text-[#8a7a6a] pt-1 text-right">{e.time}</div>
            <div className="w-3 h-3 rounded-full border-2 border-white shrink-0 mt-1 z-10 shadow-sm" style={{ background: e.color }} />
            <div className="flex-1 bg-white rounded-lg px-2.5 py-2 border border-black/5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px]">{e.icon}</span>
                <span className="text-[10px] font-semibold truncate">{e.label}</span>
              </div>
              <div className="text-[8px] text-[#8a7a6a] mt-0.5">{e.duration}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Mockup: Plan de table ─────────────────────────────────────────────────

export function MockSeating() {
  const tables = [
    { id: "T1", name: "Table des Mariés", color: TC, guests: ["Camille", "Alexandre", "Mamie", "Papi", "Lola"] },
    { id: "T2", name: "Table Famille A", color: "#6B8C3E", guests: ["Marc", "Julie", "Paul", "Sarah"] },
    { id: "T3", name: "Table Amis", color: "#3B6EA5", guests: ["Thomas", "Emma", "Léa", "Romain", "Zoé", "Hugo"] },
    { id: "T4", name: "Table Famille B", color: GOLD, guests: ["Henri", "Brigitte", "Nicolas", "Aline"] },
  ];
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold">Plan de table • 147 invités placés</div>
        <div className="flex gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[8px] bg-white border border-black/10">17 tables</span>
          <span className="px-2 py-0.5 rounded-md text-[8px] bg-green-100 text-green-700 border border-green-200">Tous placés ✓</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tables.map((t) => (
          <div key={t.id} className="bg-white rounded-lg p-2.5 border border-black/5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
              <span className="text-[9px] font-bold truncate">{t.name}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {t.guests.map((g) => (
                <span key={g} className="px-1.5 py-0.5 rounded-full text-[8px] font-medium" style={{ background: `${t.color}20`, color: t.color }}>{g}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Visual seating hint */}
      <div className="mt-3 flex items-center gap-2 text-[9px] text-[#8a7a6a]">
        <span>✦</span>
        <span>Glissez-déposez les invités entre les tables</span>
      </div>
    </div>
  );
}

// ─── App Mockup: Dates ────────────────────────────────────────────────────────

export function MockDates() {
  const candidates = [
    { date: "Sam 15 Août", score: 94, weather: "☀️", temp: "28°", rain: "2%", note: "Recommandé" },
    { date: "Sam 22 Août", score: 88, weather: "⛅", temp: "25°", rain: "15%", note: "" },
    { date: "Sam 6 Sept", score: 71, weather: "🌦", temp: "22°", rain: "35%", note: "" },
  ];
  return (
    <div className="bg-[#F4ECDD] rounded-xl p-4 text-[#382F23] select-none">
      <div className="text-[10px] font-bold mb-3">Comparaison des dates candidates</div>
      <div className="flex flex-col gap-2">
        {candidates.map((c, i) => (
          <div key={i} className={`bg-white rounded-lg px-3 py-2.5 border flex items-center gap-3 ${i === 0 ? `border-[${TC}] ring-1 ring-[${TC}]/30` : "border-black/5"}`}>
            <div className="text-lg">{c.weather}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold">{c.date}</span>
                {c.note && <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold text-white" style={{ background: TC }}>{c.note}</span>}
              </div>
              <div className="text-[8px] text-[#8a7a6a] mt-0.5">{c.temp} · {c.rain} de pluie · Aix-en-Provence</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: c.score >= 90 ? "#6B8C3E" : c.score >= 75 ? GOLD : TC }}>{c.score}</div>
              <div className="text-[8px] text-[#8a7a6a]">score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Frame (Light) ─────────────────────────────────────────────────────────

export function AppFrame({ children, url = "the-cockpit.fr/dashboard" }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(201,110,44,0.15)",
        boxShadow: "0 20px 60px rgba(56,47,35,0.12), 0 4px 16px rgba(56,47,35,0.08)",
      }}>
      {/* Topbar claire */}
      <div style={{ background: WARM_SOFT, borderBottom: "1px solid rgba(201,110,44,0.12)", padding: "10px 16px" }}
        className="flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFB3AE]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFD180]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#A8D5A2]" />
        </div>
        <div style={{ background: "rgba(201,110,44,0.1)", borderRadius: 6, padding: "3px 12px" }}
          className="flex-1 mx-2 text-center">
          <span style={{ fontSize: 10, color: TEXT_LIGHT, fontFamily: "monospace" }}>{url}</span>
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

// ─── Floating badge ────────────────────────────────────────────────────────────

export function FloatingBadge({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
      className={`absolute z-10 bg-white rounded-xl border px-3 py-2.5 text-[#382F23] ${className}`}
      style={{ boxShadow: "0 8px 24px rgba(56,47,35,0.12)", borderColor: "rgba(201,110,44,0.12)" }}
    >
      {children}
    </motion.div>
  );
}


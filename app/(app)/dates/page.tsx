"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore, useToast } from "@/components/providers";
import { fmt } from "@/lib/format";
import { Icon } from "@/components/icon";
import { Card, Badge, Button, Ring, Drawer, Field, Input } from "@/components/ui";
import { PageHead } from "@/components/shell";
import type { DateCandidate, Holiday } from "@/lib/types";
import { createClient } from "@/lib/supabase";
import { getWeddingId } from "@/lib/db";
import { seedDefaultDateCandidates } from "@/lib/seed";
import { geocodeCity, fetchDateWeather, fetchMonthlyWeather } from "@/lib/weather";
import { PageTutorial } from "@/components/tutorial";
import { ScrollReveal } from "@/components/scroll-reveal";
import { exportDatesPDF } from "@/lib/pdf-dates";

const COUNTRIES = [
  { code: "FR", flag: "🇫🇷", label: "France" },
  { code: "CH", flag: "🇨🇭", label: "Suisse" },
  { code: "BE", flag: "🇧🇪", label: "Belgique" },
  { code: "IT", flag: "🇮🇹", label: "Italie" },
  { code: "ES", flag: "🇪🇸", label: "Espagne" },
  { code: "DE", flag: "🇩🇪", label: "Allemagne" },
  { code: "LU", flag: "🇱🇺", label: "Luxembourg" },
];

const HOL_FR: Record<string, string> = {
  "New Year's Day": "Jour de l'An",
  "Epiphany": "Épiphanie",
  "Berchtold's Day": "Lendemain du Jour de l'An",
  "Good Friday": "Vendredi Saint",
  "Holy Saturday": "Samedi Saint",
  "Easter Sunday": "Dimanche de Pâques",
  "Easter Monday": "Lundi de Pâques",
  "Labour Day": "Fête du Travail",
  "Ascension Day": "Ascension",
  "Whit Sunday": "Dimanche de Pentecôte",
  "Whit Monday": "Lundi de Pentecôte",
  "Corpus Christi": "Fête-Dieu",
  "Swiss National Day": "Fête nationale suisse",
  "National Day": "Fête nationale",
  "Assumption Day": "Assomption",
  "Federal Day of Thanksgiving": "Jeûne fédéral",
  "All Saints' Day": "Toussaint",
  "All Souls' Day": "Fête des Morts",
  "Immaculate Conception": "Immaculée Conception",
  "Christmas Day": "Noël",
  "St. Stephen's Day": "Saint-Étienne",
  "St. Berchtold's Day": "Lendemain du Jour de l'An",
  "Victory in Europe Day": "Victoire 1945",
  "Bastille Day": "Fête nationale (14 juillet)",
  "Armistice Day": "Armistice",
  "Liberation Day": "Fête de la Libération",
  "Republic Day": "Fête de la République",
  "Unity Day": "Fête de l'Unité nationale",
  "Christmas Eve": "Veille de Noël",
  "New Year's Eve": "Saint-Sylvestre",
  "Reformation Day": "Fête de la Réformation",
  "German Unity Day": "Fête de l'Unité allemande",
  "Day of German Unity": "Fête de l'Unité allemande",
  "Grand Duke's Birthday": "Anniversaire du Grand-Duc",
  "Europe Day": "Fête de l'Europe",
};

const toFr = (name: string) => HOL_FR[name] ?? name;

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const scoreOf = (d: DateCandidate) => Math.round(d.weather * 0.45 + d.availability * 0.4 + (d.longWeekend ? 8 : 0) + 7);

function AddDateDrawer({ onClose, weddingDate }: { onClose: () => void; weddingDate: string }) {
  const { state, update } = useStore();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: "",
    city: state.weatherCity || state.wedding.city,
    availability: "80",
    longWeekend: false,
  });
  const [weatherPreview, setWeatherPreview] = useState<{ temp: number; rain: number; sun: number; cityLabel: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  // Fetch weather preview when date + city are both set
  const previewWeather = async () => {
    if (!form.date || !form.city.trim()) return;
    setPreviewing(true);
    try {
      const geo = await geocodeCity(form.city.trim());
      if (!geo) return;
      const dw = await fetchDateWeather(geo.lat, geo.lon, form.date);
      const cityLabel = [geo.name, geo.admin1, geo.country].filter(Boolean).join(", ");
      setWeatherPreview({ ...dw, cityLabel });
    } catch {
      // silently ignore preview errors
    } finally {
      setPreviewing(false);
    }
  };

  const save = async () => {
    if (!form.date) { toast("La date est obligatoire", "err"); return; }
    if (state.dateCandidates.some((d) => d.date === form.date)) { toast("Cette date est déjà candidate", "err"); return; }
    setSaving(true);

    const wId = getWeddingId();
    let weather = 75, sun = 7, rain = 10, temp = 20;
    let lat: number | null = null, lon: number | null = null;
    let resolvedCity = form.city.trim();

    if (resolvedCity) {
      try {
        const geo = await geocodeCity(resolvedCity);
        if (geo) {
          lat = geo.lat; lon = geo.lon;
          resolvedCity = [geo.name, geo.admin1, geo.country].filter(Boolean).join(", ");
          const dw = await fetchDateWeather(geo.lat, geo.lon, form.date);
          sun = dw.sun; rain = dw.rain; temp = dw.temp; weather = dw.sun;
        }
      } catch {
        // Fall back to monthly estimates
        const month = new Date(form.date + "T00:00:00").getMonth();
        const wm = state.weatherByMonth[month];
        if (wm) { weather = wm.sun; sun = Math.round(wm.sun / 10); rain = wm.rain; temp = wm.temp; }
      }
    } else {
      const month = new Date(form.date + "T00:00:00").getMonth();
      const wm = state.weatherByMonth[month];
      if (wm) { weather = wm.sun; sun = Math.round(wm.sun / 10); rain = wm.rain; temp = wm.temp; }
    }

    const newCand: DateCandidate = {
      id: Math.floor(Date.now() / 1000) % 2000000000,
      date: form.date, weather, sun, rain, temp,
      holidays: 0, longWeekend: form.longWeekend ? 1 : 0,
      availability: parseInt(form.availability) || 80,
      best: 0, city: resolvedCity, lat, lon,
    };

    if (wId) {
      await createClient().from("date_candidates").insert({
        ...newCand, long_weekend: newCand.longWeekend, wedding_id: wId,
      });
    }
    update("dateCandidates", (l) => [...l, newCand]);
    toast("Date candidate ajoutée · " + (lat ? resolvedCity.split(",")[0] : "données estimées"));
    setSaving(false);
    onClose();
  };

  return (
    <Drawer title="Nouvelle date candidate" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><div className="flex-1" /><Button variant="primary" icon="check" onClick={save} disabled={saving}>{saving ? "Chargement météo…" : "Ajouter"}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Date candidate *">
          <Input type="date" value={form.date}
            onChange={(e) => { setForm((f) => ({ ...f, date: e.target.value })); setWeatherPreview(null); }}
            onBlur={previewWeather} min={weddingDate} />
        </Field>

        <Field label="Ville / lieu du mariage" hint="Détermine la météo réelle pour cette date et cette ville">
          <Input value={form.city}
            onChange={(e) => { setForm((f) => ({ ...f, city: e.target.value })); setWeatherPreview(null); }}
            onBlur={previewWeather}
            placeholder="Paris, Annecy, Marseille…" />
        </Field>

        {/* Weather preview */}
        {previewing && (
          <div className="flex items-center gap-2 text-[12.5px] text-text-2 px-3 py-2.5 rounded-lg bg-surface-2">
            <Icon name="refresh" size={13} className="animate-spin text-text-3" />Récupération des données météo…
          </div>
        )}
        {weatherPreview && !previewing && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sage-soft/60 border border-sage/30">
            <Icon name="sun" size={18} className="text-sage shrink-0" />
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-sage">{weatherPreview.cityLabel.split(",")[0]} · données réelles (5 ans)</div>
              <div className="text-[11.5px] text-text-2 mt-0.5">
                {weatherPreview.temp}°C moy · {weatherPreview.rain}% risque pluie · {weatherPreview.sun}% ensoleillement
              </div>
            </div>
          </div>
        )}

        <Field label={`Disponibilité estimée : ${form.availability}%`} hint="Estimation de la disponibilité du lieu et des prestataires">
          <input type="range" min={0} max={100} value={form.availability}
            onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
            className="w-full accent-primary" />
        </Field>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.longWeekend}
            onChange={(e) => setForm((f) => ({ ...f, longWeekend: e.target.checked }))}
            className="w-4 h-4 accent-primary" />
          <div>
            <div className="text-sm font-medium">Pont / long week-end</div>
            <div className="text-[12.5px] text-text-2">Cochez si cette date crée un pont ou un long week-end</div>
          </div>
        </label>
      </div>
    </Drawer>
  );
}

export default function DatesPage() {
  const { state, update, reloadAll } = useStore();
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);
  const [adding, setAdding] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Calendar nav — declared early so country useEffect can depend on ym.y
  const wd = new Date(state.wedding.date + "T00:00:00");
  const [ym, setYm] = useState({ y: wd.getFullYear(), m: wd.getMonth() });
  const [selDate, setSelDate] = useState(state.wedding.date);
  const nav = (dir: number) => setYm((p) => { let m = p.m + dir, y = p.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });

  // Country holidays
  const [activeCountries, setActiveCountries] = useState<string[]>(["FR"]);
  const [countryHols, setCountryHols] = useState<(Holiday & { country: string })[]>([]);
  const [loadingHols, setLoadingHols] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);

  useEffect(() => {
    if (activeCountries.length === 0) { setCountryHols([]); return; }
    const years = [ym.y, ym.y + 1];
    setLoadingHols(true);
    Promise.all(
      activeCountries.flatMap((code) =>
        years.map((y) =>
          fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/${code}`)
            .then((r) => r.json())
            .then((list: any[]) =>
              list.map((h) => ({ date: h.date as string, label: toFr(h.name as string), country: code }))
            )
            .catch(() => [] as (Holiday & { country: string })[])
        )
      )
    ).then((results) => {
      setCountryHols(results.flat());
    }).finally(() => setLoadingHols(false));
  }, [activeCountries, ym.y]);

  const allHolidays = useMemo(
    () => [...state.holidays, ...countryHols],
    [state.holidays, countryHols]
  );

  const toggleCountry = (code: string) => {
    setActiveCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // City / weather refresh (global monthly chart)
  const [cityInput, setCityInput] = useState(state.weatherCity || state.wedding.city);
  const [refreshing, setRefreshing] = useState(false);

  const handleWeatherSearch = async () => {
    const q = cityInput.trim();
    if (!q || refreshing) return;
    setRefreshing(true);
    try {
      const geo = await geocodeCity(q);
      if (!geo) { toast("Ville non trouvée — essayez un nom plus précis", "err"); return; }
      const weather = await fetchMonthlyWeather(geo.lat, geo.lon);
      const label = [geo.name, geo.admin1, geo.country].filter(Boolean).join(", ");
      update("weatherByMonth", weather);
      update("weatherCity", label);
      setCityInput(label);
      toast("Météo mensuelle actualisée · " + geo.name);
    } catch {
      toast("Impossible de récupérer la météo — vérifiez votre connexion", "err");
    } finally {
      setRefreshing(false);
    }
  };

  const initDates = async () => {
    const wId = getWeddingId();
    if (!wId) return;
    setSeeding(true);
    await seedDefaultDateCandidates(createClient(), wId, state.wedding.date);
    await reloadAll();
    setSeeding(false);
  };

  const removeDate = (id: number) => {
    update("dateCandidates", (l) => l.filter((d) => d.id !== id));
    if (state.selectedDate === id) update("selectedDate", state.dateCandidates.find((d) => d.id !== id)?.id ?? 0);
    toast("Date candidate supprimée");
  };

  const maxWeather = state.weatherByMonth.length ? Math.max(...state.weatherByMonth.map((w) => w.sun)) : 100;
  const best = state.dateCandidates.length > 0
    ? state.dateCandidates.reduce((a, b) => scoreOf(b) > scoreOf(a) ? b : a)
    : null;

  const first = new Date(ym.y, ym.m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const iso = (d: number) => `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const weatherLabel = state.weatherCity || state.wedding.city || "votre région";
  const endYear = new Date().getFullYear() - 1;
  const isRealData = !!state.weatherCity;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 md:px-8 py-6 md:py-8 pb-28 md:pb-12" onClick={() => setShowCountryMenu(false)}>
      <PageHead title="Sélecteur de dates" sub="Comparez vos dates selon la météo réelle historique, les disponibilités et les jours fériés."
        actions={<>
          {/* Country holiday toggle */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowCountryMenu((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium border transition ${showCountryMenu ? "bg-primary-soft border-primary text-primary-700" : "border-line text-text-2 hover:border-primary/40 hover:text-text"}`}
            >
              <Icon name="flag" size={14} />
              Pays
              {activeCountries.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold leading-none">
                  {activeCountries.length}
                </span>
              )}
              {loadingHols && <Icon name="refresh" size={12} className="animate-spin ml-1" />}
            </button>
            {showCountryMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-line rounded-xl shadow-lg p-2 min-w-[180px]">
                <div className="text-[11px] text-text-3 px-2 pb-1.5 font-semibold uppercase tracking-wide">Jours fériés par pays</div>
                {COUNTRIES.map((c) => (
                  <button key={c.code}
                    onClick={() => toggleCountry(c.code)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition ${activeCountries.includes(c.code) ? "bg-primary-soft text-primary-700 font-medium" : "text-text-2 hover:bg-hover"}`}
                  >
                    <span>{c.flag}</span>
                    <span className="flex-1 text-left">{c.label}</span>
                    {activeCountries.includes(c.code) && <Icon name="check" size={13} className="text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative flex items-center">
              <Icon name="pin" size={14} className="absolute left-3 text-text-3 pointer-events-none" />
              <input className="input pl-9 w-[200px] text-sm" value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleWeatherSearch()}
                placeholder="Ville pour le graphique…" />
            </div>
            <Button variant="secondary" icon={refreshing ? "refresh" : "bars"} onClick={handleWeatherSearch} disabled={refreshing}>
              {refreshing ? "…" : "Graphique"}
            </Button>
          </div>
          <Button variant="secondary" icon="download" onClick={() => exportDatesPDF(state.dateCandidates, state.selectedDate, state.wedding.partnerA, state.wedding.partnerB)} disabled={state.dateCandidates.length === 0}>
            Export PDF
          </Button>
          <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Date candidate</Button>
        </>} />

      <PageTutorial pageId="dates" title="Comment utiliser le sélecteur de dates ?"
        steps={[
          { icon: "plus", title: "Ajoutez vos dates candidates", desc: "Pour chaque date, précisez la ville — Paris, Annecy, Marseille… La météo réelle des 5 dernières années est calculée automatiquement." },
          { icon: "sun", title: "Comparez la météo réelle", desc: "Ensoleillement, risque de pluie (≥5mm) et température sont basés sur les archives Open-Meteo, pas des estimations." },
          { icon: "calendar", title: "Sélectionnez votre date", desc: "Cliquez sur une carte pour la choisir. Cliquez à nouveau pour désélectionner. Vous pouvez laisser toutes les dates en attente." },
        ]} />

      <div className="flex gap-1 mb-4">
        <button onClick={() => setViewMode("cards")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === "cards" ? "bg-primary text-white" : "hover:bg-hover text-text-2"}`}>
          <Icon name="grid" size={14} className="inline mr-1.5" />Cartes
        </button>
        <button onClick={() => setViewMode("table")} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === "table" ? "bg-primary text-white" : "hover:bg-hover text-text-2"}`}>
          <Icon name="table" size={14} className="inline mr-1.5" />Tableau
        </button>
      </div>

      <ScrollReveal delay={0}>
      <div className="flex items-center justify-between mb-4"><div className="sec-title"><Icon name="star" size={17} className="text-text-3" />Dates candidates</div></div>

      {/* Nudge: candidates exist but none selected */}
      {state.dateCandidates.length > 0 && !state.dateCandidates.some((d) => d.id === state.selectedDate) && (
        <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-md border border-primary/30 bg-primary-softer mb-5">
          <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 bg-primary-soft text-primary-700"><Icon name="calendar" size={18} /></span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-primary-700">Aucune date sélectionnée</div>
            <div className="text-[12.5px] text-text-2">Cliquez sur une date candidate pour la définir comme date officielle. Vous pouvez aussi laisser en attente.</div>
          </div>
        </div>
      )}

      {state.dateCandidates.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-soft flex items-center justify-center">
            <Icon name="calendar" size={26} className="text-[var(--gold-ink)]" />
          </div>
          <div>
            <div className="font-semibold text-lg mb-1">Aucune date candidate</div>
            <p className="text-text-2 text-[14px] max-w-sm">Ajoutez 2–3 dates pour les comparer. Chaque date peut avoir sa propre ville (Paris, Annecy, Marseille…).</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" icon="plus" onClick={() => setAdding(true)}>Ajouter manuellement</Button>
            <Button variant="primary" icon="sparkle" onClick={initDates} disabled={seeding}>
              {seeding ? "Initialisation…" : "Initialiser avec 3 dates"}
            </Button>
          </div>
        </div>
      ) : null}

      </ScrollReveal>

      <ScrollReveal delay={0.05}>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4 mb-6">
          {state.dateCandidates.map((d) => {
            const dt = new Date(d.date + "T00:00:00");
            const sc = scoreOf(d);
            const isBest = best !== null && d.id === best.id;
            const isSelected = d.id === state.selectedDate;
            const hasRealWeather = d.lat != null;

            return (
              <Card key={d.id} hover pad={false}
                onClick={() => {
                  setSelDate(d.date);
                  if (isSelected) {
                    update("selectedDate", 0);
                    toast("Sélection annulée");
                  } else {
                    update("selectedDate", d.id);
                    toast("Date sélectionnée : " + fmt.date(d.date));
                  }
                }}
                className={`group ${isSelected ? "border-sage ring-2 ring-sage-soft" : isBest ? "border-primary ring-2 ring-primary-soft" : ""}`}>
                <div className="p-[18px] pb-3.5 relative">
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {isSelected && <Badge tone="sage" icon="check">Choisie</Badge>}
                    {isBest && !isSelected && <Badge tone="primary" icon="sparkle">Meilleur choix</Badge>}
                  </div>
                  {/* Delete button — appears on card hover */}
                  <button onClick={(e) => { e.stopPropagation(); removeDate(d.id); }}
                    className="absolute bottom-3 right-3 icon-btn w-6 h-6 opacity-0 group-hover:opacity-100 text-text-3 hover:text-coral transition-opacity"
                    title="Supprimer cette date">
                    <Icon name="x" size={14} />
                  </button>
                  <div className="text-[12.5px] text-text-2 capitalize">{dt.toLocaleDateString("fr-FR", { weekday: "long" })}</div>
                  <div className="text-[19px] font-semibold tracking-[-.01em]">{dt.getDate()} {MONTHS[dt.getMonth()].toLowerCase()} {dt.getFullYear()}</div>
                  <div className="flex items-center gap-2.5 mt-3">
                    <Ring value={sc} size={56} stroke={6}><span className="font-mono font-semibold text-sm">{sc}</span></Ring>
                    <div className="text-[12.5px] text-text-2">Score global<br /><b className="text-text">{sc >= 85 ? "Excellent" : sc >= 70 ? "Très bon" : "Correct"}</b></div>
                  </div>
                </div>

                <div className="px-[18px] pb-[18px] flex flex-col gap-2.5">
                  {/* City badge if set */}
                  {d.city && (
                    <div className="flex items-center gap-1.5 text-[11.5px] text-text-2 pb-2 border-b border-line">
                      <Icon name="pin" size={12} className="text-text-3" />
                      <span className="truncate">{d.city.split(",")[0]}</span>
                      {hasRealWeather && (
                        <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sage-soft text-sage text-[10px] font-medium">
                          <Icon name="check" size={9} />réel
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  {[
                    ["sun", "Ensoleillement", `${d.weather}%`],
                    ["droplet", "Risque de pluie", `${d.rain}%`],
                    ["temp", "Température moy.", `${d.temp}°C`],
                    ["star", "Disponibilité", `${d.availability}%`],
                    ["flag", "Pont / week-end", d.longWeekend ? "Oui" : "Non"],
                  ].map(([ic, l, v]) => (
                    <div key={l} className="flex items-center gap-2.5 text-[12.5px]">
                      <span className="text-text-2 flex-1 flex items-center gap-1.5"><Icon name={ic} size={14} className="text-text-3" />{l}</span>
                      <span className="font-mono font-semibold whitespace-nowrap">{v}</span>
                    </div>
                  ))}

                  {hasRealWeather && (
                    <div className="text-[10.5px] text-text-3 text-center pt-1 border-t border-line">
                      5 ans d'historique · Open-Meteo
                    </div>
                  )}
                </div>

                {/* Deselect hint on selected card */}
                {isSelected && (
                  <div className="px-[18px] pb-3 text-[11px] text-text-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    Cliquez pour désélectionner
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── Table view ─────────────────────────────────────────────────────── */
        <Card pad={false} className="mb-6 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line">
                {["Date", "Ville", "Score", "☀", "🌧", "🌡", "Dispo", "Statut", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-text-3 uppercase tracking-wide whitespace-nowrap first:rounded-tl-xl last:rounded-tr-xl">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.dateCandidates.map((d) => {
                const sc = scoreOf(d);
                const isBest = best !== null && d.id === best.id;
                const isSelected = d.id === state.selectedDate;
                const dt = new Date(d.date + "T00:00:00");

                let rowCls = "border-b border-line last:border-0 cursor-pointer transition-colors hover:bg-hover";
                if (isSelected) rowCls += " bg-sage-soft";
                else if (isBest) rowCls += " bg-primary-softer";

                return (
                  <tr key={d.id} className={rowCls}
                    onClick={() => {
                      setSelDate(d.date);
                      if (isSelected) {
                        update("selectedDate", 0);
                        toast("Sélection annulée");
                      } else {
                        update("selectedDate", d.id);
                        toast("Date sélectionnée : " + fmt.date(d.date));
                      }
                    }}>
                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold">{dt.getDate()} {MONTHS[dt.getMonth()].toLowerCase()} {dt.getFullYear()}</div>
                      <div className="text-[11px] text-text-3 capitalize">{dt.toLocaleDateString("fr-FR", { weekday: "long" })}</div>
                    </td>
                    {/* Ville */}
                    <td className="px-4 py-3 text-text-2 max-w-[140px]">
                      <span className="truncate block">{d.city ? d.city.split(",")[0] : "—"}</span>
                    </td>
                    {/* Score */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full font-mono font-semibold text-[12px] ${sc >= 85 ? "bg-sage-soft text-sage" : sc >= 70 ? "bg-amber-soft text-[var(--gold-ink)]" : "bg-surface-3 text-text-2"}`}>
                        {sc}
                      </span>
                    </td>
                    {/* Sun */}
                    <td className="px-4 py-3 text-center font-mono text-text-2">{d.weather}%</td>
                    {/* Rain */}
                    <td className={`px-4 py-3 text-center font-mono ${d.rain > 30 ? "text-coral font-semibold" : "text-text-2"}`}>{d.rain}%</td>
                    {/* Temp */}
                    <td className="px-4 py-3 text-center font-mono text-text-2">{d.temp}°C</td>
                    {/* Dispo */}
                    <td className="px-4 py-3 text-center font-mono text-text-2">{d.availability}%</td>
                    {/* Statut */}
                    <td className="px-4 py-3 text-center">
                      {isSelected ? (
                        <Badge tone="sage" icon="check">Choisie ✓</Badge>
                      ) : isBest ? (
                        <Badge tone="primary" icon="sparkle">Meilleur</Badge>
                      ) : (
                        <span className="text-text-3">—</span>
                      )}
                    </td>
                    {/* Delete */}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeDate(d.id); }}
                        className="icon-btn w-6 h-6 text-text-3 hover:text-coral transition-colors"
                        title="Supprimer cette date">
                        <Icon name="x" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      </ScrollReveal>

      <ScrollReveal delay={0.1}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="sec-title">{MONTHS[ym.m]} {ym.y}</div>
            <div className="flex gap-1">
              <button className="icon-btn w-8 h-8" onClick={() => nav(-1)}><Icon name="chevronL" size={18} /></button>
              <button className="icon-btn w-8 h-8" onClick={() => nav(1)}><Icon name="chevronR" size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DOW.map((d) => <div key={d} className="text-[11px] font-semibold text-text-3 text-center py-1.5 uppercase">{d}</div>)}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const dateStr = iso(d); const dow = new Date(ym.y, ym.m, d).getDay(); const weekend = dow === 0 || dow === 6;
              const hol = allHolidays.find((h) => h.date === dateStr);
              const cand = state.dateCandidates.find((c) => c.date === dateStr);
              const isSel = selDate === dateStr;
              let cls = "hover:bg-hover";
              if (isSel) cls = "bg-primary text-white font-semibold";
              else if (cand) cls = "bg-primary-soft text-primary-700 font-semibold border border-primary";
              else if (hol) cls = "bg-coral-soft text-coral";
              else if (weekend) cls = "bg-surface-3";
              return (
                <div key={i} title={hol ? hol.label : cand ? `Date candidate${cand.city ? " · " + cand.city.split(",")[0] : ""}` : ""}
                  onClick={() => { setSelDate(dateStr); if (cand) { update("selectedDate", cand.id === state.selectedDate ? 0 : cand.id); toast(cand.id === state.selectedDate ? "Sélection annulée" : "Date sélectionnée : " + fmt.date(dateStr)); } }}
                  className={`aspect-square rounded-[9px] flex flex-col items-center justify-center text-[13px] cursor-pointer transition ${cls}`}>
                  {d}{(cand || hol) && <span className="w-[5px] h-[5px] rounded-full bg-current mt-0.5" />}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <div className="sec-title"><Icon name="bars" size={17} className="text-text-3" />Météo mensuelle — {weatherLabel}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  {isRealData ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sage-soft text-sage text-[11px] font-medium">
                        <Icon name="check" size={11} />Données réelles
                      </span>
                      <span className="text-[11px] text-text-3">Open-Meteo · {endYear - 2}–{endYear}</span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-soft text-[var(--gold-ink)] text-[11px] font-medium">
                      <Icon name="info" size={11} />Données estimées
                    </span>
                  )}
                </div>
              </div>
              <button onClick={handleWeatherSearch} disabled={refreshing}
                className="icon-btn w-8 h-8 shrink-0 text-text-3 hover:text-primary disabled:opacity-40"
                title="Actualiser les données météo">
                <Icon name="refresh" size={16} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex items-end gap-1.5 h-40 pt-2.5">
              {state.weatherByMonth.map((wm, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex justify-center" title={`${wm.sun}% soleil · ${wm.temp}°C · ${wm.rain}% pluie`}>
                    <div className={`w-full max-w-[26px] rounded-t-[5px] transition-[height] duration-500 ${i === ym.m ? "" : "opacity-35"}`}
                      style={{ height: `${wm.sun / maxWeather * 130}px`, background: "linear-gradient(var(--gold), var(--amber))" }} />
                  </div>
                  <span className={`text-[10.5px] font-mono ${i === ym.m ? "text-primary font-semibold" : "text-text-3"}`}>{wm.m}</span>
                </div>
              ))}
            </div>

            {state.weatherByMonth[ym.m] && (
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
                {[
                  ["sun", "Ensoleillement", `${state.weatherByMonth[ym.m].sun}%`],
                  ["droplet", "Risque pluie", `${state.weatherByMonth[ym.m].rain}%`],
                  ["temp", "Température", `${state.weatherByMonth[ym.m].temp}°C`],
                ].map(([ic, l, v]) => (
                  <div key={l} className="flex flex-col items-center gap-1 text-center">
                    <Icon name={ic} size={15} className="text-text-3" />
                    <span className="font-mono font-semibold text-[15px]">{v}</span>
                    <span className="text-[11px] text-text-3">{l}</span>
                  </div>
                ))}
              </div>
            )}

            {!isRealData && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-soft/60 border border-amber-200">
                <Icon name="info" size={14} className="text-[var(--gold-ink)] shrink-0 mt-0.5" />
                <div className="text-[12px] text-[var(--gold-ink)]">
                  Entrez votre ville dans la barre de recherche et cliquez &ldquo;Graphique&rdquo; pour voir les vraies moyennes historiques. Pour des données précises à une date, précisez la ville lors de l'ajout d'une date candidate.
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="sec-title mb-4"><Icon name="flag" size={17} className="text-text-3" />Jours fériés &amp; événements à éviter</div>
            {allHolidays.length === 0 ? (
              <div className="text-[13px] text-text-3 py-3 text-center">
                Activez au moins un pays pour voir les jours fériés.
              </div>
            ) : (
              <div className="flex flex-col max-h-[320px] overflow-y-auto">
                {[...allHolidays]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .filter((h, i, arr) => arr.findIndex((x) => x.date === h.date && x.label === h.label) === i)
                  .map((h) => {
                    const ctry = "country" in h ? COUNTRIES.find((c) => c.code === (h as any).country) : null;
                    return (
                      <div key={h.date + h.label} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
                        <span className="flex items-center gap-2.5">
                          <span className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center bg-coral-soft text-coral text-[15px]">
                            {ctry ? ctry.flag : <Icon name="flag" size={15} />}
                          </span>
                          <span className="text-[13px]">{h.label}</span>
                        </span>
                        <span className="font-mono text-text-2 text-[13px] shrink-0 ml-2">{fmt.dateShort(h.date)}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </div>
      </div>

      </ScrollReveal>

      {adding && <AddDateDrawer onClose={() => setAdding(false)} weddingDate={state.wedding.date} />}
    </div>
  );
}

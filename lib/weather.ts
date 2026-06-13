import type { WeatherMonth } from "./types";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export interface GeoResult {
  name: string;
  admin1: string;
  country: string;
  lat: number;
  lon: number;
}

export async function geocodeCity(query: string): Promise<GeoResult | null> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.results?.length) return null;
  const r = data.results[0];
  return {
    name: r.name as string,
    admin1: (r.admin1 as string) ?? "",
    country: (r.country as string) ?? "",
    lat: r.latitude as number,
    lon: r.longitude as number,
  };
}

// Fetches real historical weather for a specific calendar date (±4 days window, last 5 years).
// One API call covers all 5 years of that month, then we filter to the target day.
export async function fetchDateWeather(
  lat: number, lon: number, dateStr: string
): Promise<{ sun: number; rain: number; temp: number }> {
  const parts = dateStr.split("-");
  const mm = parts[1];
  const dd = parseInt(parts[2]);
  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 4;
  const lastDay = new Date(endYear, parseInt(mm), 0).getDate();

  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startYear}-${mm}-01` +
    `&end_date=${endYear}-${mm}-${String(lastDay).padStart(2, "0")}` +
    `&daily=temperature_2m_mean,precipitation_sum,sunshine_duration` +
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json();

  const times: string[] = data.daily?.time ?? [];
  const temps: (number | null)[] = data.daily?.temperature_2m_mean ?? [];
  const precips: (number | null)[] = data.daily?.precipitation_sum ?? [];
  const sunshine: (number | null)[] = data.daily?.sunshine_duration ?? [];

  let tempSum = 0, tempCount = 0, sunSum = 0, sunCount = 0, rainyDays = 0, precipDays = 0;
  const WINDOW = 4; // ±4 days for statistical robustness

  for (let i = 0; i < times.length; i++) {
    const d = parseInt(times[i].split("-")[2]);
    if (Math.abs(d - dd) > WINDOW) continue;
    if (temps[i] != null) { tempSum += temps[i]!; tempCount++; }
    if (sunshine[i] != null) { sunSum += sunshine[i]!; sunCount++; }
    if (precips[i] != null) { precipDays++; if (precips[i]! >= 5) rainyDays++; }
  }

  return {
    temp: tempCount ? Math.round(tempSum / tempCount) : 0,
    sun: sunCount ? Math.min(100, Math.round((sunSum / sunCount) / (12 * 3600) * 100)) : 0,
    rain: precipDays ? Math.round((rainyDays / precipDays) * 100) : 0,
  };
}

// Fetches real monthly weather averages from Open-Meteo archive (last 3 full years).
// Returns 12 months Jan-Dec with: temp (°C mean), rain (% rainy days), sun (% of 12h ref).
export async function fetchMonthlyWeather(lat: number, lon: number): Promise<WeatherMonth[]> {
  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 2;
  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startYear}-01-01&end_date=${endYear}-12-31` +
    `&daily=temperature_2m_mean,precipitation_sum,sunshine_duration` +
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json();

  type Acc = { temps: number[]; rainyDays: number; sunSecs: number; days: number };
  const acc: Acc[] = Array.from({ length: 12 }, () => ({
    temps: [], rainyDays: 0, sunSecs: 0, days: 0,
  }));

  const times: string[] = data.daily?.time ?? [];
  const temps: (number | null)[] = data.daily?.temperature_2m_mean ?? [];
  const precips: (number | null)[] = data.daily?.precipitation_sum ?? [];
  const sunshine: (number | null)[] = data.daily?.sunshine_duration ?? [];

  for (let i = 0; i < times.length; i++) {
    const m = new Date(times[i] + "T00:00:00").getMonth();
    acc[m].days++;
    if (temps[i] != null) acc[m].temps.push(temps[i]!);
    if (precips[i] != null && precips[i]! >= 5) acc[m].rainyDays++;
    if (sunshine[i] != null) acc[m].sunSecs += sunshine[i]!;
  }

  return acc.map((mb, i) => ({
    m: MONTHS[i],
    temp: mb.temps.length
      ? Math.round(mb.temps.reduce((a, b) => a + b) / mb.temps.length)
      : 0,
    rain: mb.days ? Math.round((mb.rainyDays / mb.days) * 100) : 0,
    sun: mb.days
      ? Math.min(100, Math.round((mb.sunSecs / (mb.days * 12 * 3600)) * 100))
      : 0,
  }));
}

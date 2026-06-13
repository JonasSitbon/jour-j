"use client";

import { useState, useRef, useCallback } from "react";
import { Icon } from "@/components/icon";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  type: string;
  category: string;
}

interface VenueResult {
  displayName: string;
  venueName: string;
  city: string;
  lat: number;
  lon: number;
}

function extractCity(addr: NominatimResult["address"]): string {
  return addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
}

function extractVenueName(result: NominatimResult): string {
  const parts = result.display_name.split(",");
  // First part is usually the venue/place name
  return parts[0]?.trim() || result.display_name;
}

interface VenueAutocompleteProps {
  venue: string;
  city: string;
  onVenueChange: (v: string) => void;
  onCityChange: (c: string) => void;
  onSelect?: (result: VenueResult) => void;
}

export function VenueAutocomplete({ venue, city, onVenueChange, onCityChange, onSelect }: VenueAutocompleteProps) {
  const [query, setQuery] = useState(venue || "");
  const [results, setResults] = useState<VenueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=fr,be,ch,mc&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "fr", "User-Agent": "TheCockpit/1.0 Wedding App" }
      });
      const data: NominatimResult[] = await res.json();
      setResults(data.map((r) => ({
        displayName: r.display_name,
        venueName: extractVenueName(r),
        city: extractCity(r.address),
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
      })));
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onVenueChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (r: VenueResult) => {
    setQuery(r.venueName);
    onVenueChange(r.venueName);
    onCityChange(r.city);
    setOpen(false);
    onSelect?.(r);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Icon name="map" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" />
        <input
          className="input pl-9 pr-8"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Nom du lieu ou domaine…"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <>
          <div className="fixed inset-0 z-[49]" onClick={() => setOpen(false)} />
          <div className="absolute z-[50] top-full mt-1.5 left-0 right-0 bg-surface border border-line rounded-xl shadow-lg overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-hover flex flex-col gap-0.5 border-b border-line last:border-0 transition"
              >
                <span className="text-[13.5px] font-medium text-text leading-tight">{r.venueName}</span>
                <span className="text-[11.5px] text-text-3 truncate">{r.displayName}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

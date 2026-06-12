"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, useToast } from "@/components/providers";
import { Card, Badge, Button, Drawer, Field } from "@/components/ui";
import { Icon } from "@/components/icon";
import { PageHead } from "@/components/shell";
import {
  getWeddingId,
  loadSongs,
  addSong,
  updateSong,
  deleteSong,
} from "@/lib/db";
import { exportMusicPDF } from "@/lib/pdf-music";
import type { Song, SongMoment } from "@/lib/types";

// ── Moment config ──────────────────────────────────────────────────────────

const MOMENT_ORDER: SongMoment[] = [
  "entree-cortege",
  "entree-marie",
  "entree-mariee",
  "sortie",
  "cocktail",
  "premiere-danse",
  "danse-parents",
  "diner",
  "soiree",
  "autre",
];

const MOMENT_LABELS: Record<SongMoment, string> = {
  "entree-cortege": "Entrée du cortège",
  "entree-marie": "Entrée du marié",
  "entree-mariee": "Entrée de la mariée",
  sortie: "Sortie des mariés",
  cocktail: "Cocktail",
  "premiere-danse": "Première danse",
  "danse-parents": "Danse des parents",
  diner: "Dîner",
  soiree: "Soirée / piste",
  autre: "Autre",
};

const MOMENT_COLORS: Record<SongMoment, string> = {
  "entree-cortege": "var(--primary)",
  "entree-marie": "var(--gold)",
  "entree-mariee": "var(--coral)",
  sortie: "#B07A2C",
  cocktail: "var(--sage)",
  "premiere-danse": "#C96E2C",
  "danse-parents": "#7E9A63",
  diner: "#6B8FB5",
  soiree: "#A06C9A",
  autre: "#9C9C9C",
};

const MOMENT_PLACEHOLDERS: Partial<Record<SongMoment, string>> = {
  "premiere-danse": "Perfect - Ed Sheeran",
  "entree-mariee": "A Thousand Years - Christina Perri",
  sortie: "Can't Help Falling in Love - Elvis",
};

const MOMENT_OPTIONS = MOMENT_ORDER.map((m) => ({
  value: m,
  label: MOMENT_LABELS[m],
}));

// ── Preset playlist ────────────────────────────────────────────────────────

type PresetSong = Omit<Song, "id" | "weddingId" | "createdAt">;

const PRESET_SONGS: PresetSong[] = [
  {
    moment: "entree-cortege",
    title: "Canon in D",
    artist: "Johann Pachelbel",
    duration: "4:20",
    link: "",
    note: "Classique intemporel pour l'arrivée du cortège",
    approved: false,
  },
  {
    moment: "entree-mariee",
    title: "A Thousand Years",
    artist: "Christina Perri",
    duration: "4:45",
    link: "",
    note: "Idéal pour l'entrée de la mariée",
    approved: false,
  },
  {
    moment: "entree-marie",
    title: "Married Life",
    artist: "Michael Giacchino (OST Up)",
    duration: "3:55",
    link: "",
    note: "Émouvant et plein de tendresse",
    approved: false,
  },
  {
    moment: "premiere-danse",
    title: "Perfect",
    artist: "Ed Sheeran",
    duration: "4:23",
    link: "",
    note: "La première danse par excellence",
    approved: false,
  },
  {
    moment: "sortie",
    title: "Can't Help Falling in Love",
    artist: "Elvis Presley",
    duration: "3:00",
    link: "",
    note: "Sortie romantique sous les confettis",
    approved: false,
  },
  {
    moment: "cocktail",
    title: "La Vie en Rose",
    artist: "Édith Piaf",
    duration: "3:07",
    link: "",
    note: "Ambiance chic et française pour le cocktail",
    approved: false,
  },
  {
    moment: "danse-parents",
    title: "La Tendresse",
    artist: "Bourvil",
    duration: "2:58",
    link: "",
    note: "Danse touchante avec les parents",
    approved: false,
  },
  {
    moment: "soiree",
    title: "September",
    artist: "Earth, Wind & Fire",
    duration: "3:35",
    link: "",
    note: "Lance parfaitement la soirée dansante",
    approved: false,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function parseDurationToSeconds(d: string): number {
  const parts = d.split(":").map(Number);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  if (parts.length === 3)
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  return 0;
}

function formatTotalDuration(songs: Song[]): string {
  const total = songs.reduce(
    (s, song) => s + parseDurationToSeconds(song.duration || "0:00"),
    0
  );
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m} min`;
}

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

// ── Empty form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  moment: "premiere-danse" as SongMoment,
  title: "",
  artist: "",
  duration: "",
  link: "",
  note: "",
  approved: false,
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function MusicPage() {
  const { state } = useStore();
  const toast = useToast();

  const [songs, setSongs] = useState<Song[]>([]);
  const [weddingId, setWeddingId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [defaultMoment, setDefaultMoment] = useState<SongMoment | null>(null);

  // Search (filter existing songs)
  const [search, setSearch] = useState("");

  // iTunes API search (add drawer)
  const [apiQuery, setApiQuery] = useState("");
  const [apiResults, setApiResults] = useState<{ trackName: string; artistName: string; artworkUrl60?: string; trackTimeMillis?: number }[]>([]);
  const [apiSearching, setApiSearching] = useState(false);

  const searchItunes = async () => {
    const q = apiQuery.trim();
    if (!q) return;
    setApiSearching(true);
    setApiResults([]);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=10&country=fr`
      );
      const json = await res.json();
      setApiResults(json.results ?? []);
    } catch {
      // silently ignore
    } finally {
      setApiSearching(false);
    }
  };

  const selectTrack = (r: { trackName: string; artistName: string; trackTimeMillis?: number }) => {
    const ms = r.trackTimeMillis;
    const duration = ms
      ? `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`
      : "";
    setForm((f) => ({ ...f, title: r.trackName, artist: r.artistName, duration }));
    setApiResults([]);
    setApiQuery("");
  };

  // ── Load ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const wId = getWeddingId();
    if (!wId) {
      setMounted(true);
      return;
    }
    setWeddingId(wId);
    setSyncing(true);
    loadSongs(wId)
      .then(setSongs)
      .finally(() => {
        setSyncing(false);
        setMounted(true);
      });
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      const ai = MOMENT_ORDER.indexOf(a.moment);
      const bi = MOMENT_ORDER.indexOf(b.moment);
      if (ai !== bi) return ai - bi;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [songs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sortedSongs;
    const q = search.toLowerCase();
    return sortedSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        MOMENT_LABELS[s.moment].toLowerCase().includes(q)
    );
  }, [sortedSongs, search]);

  const approvedCount = useMemo(
    () => songs.filter((s) => s.approved).length,
    [songs]
  );

  const momentsCovered = useMemo(
    () => new Set(songs.map((s) => s.moment)).size,
    [songs]
  );

  const totalDuration = useMemo(() => formatTotalDuration(songs), [songs]);

  const groupedByMoment = useMemo(() => {
    const map = new Map<SongMoment, Song[]>();
    for (const m of MOMENT_ORDER) {
      const list = filtered.filter((s) => s.moment === m);
      map.set(m, list);
    }
    return map;
  }, [filtered]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openAdd(moment?: SongMoment) {
    setEditingSong(null);
    setForm({
      ...EMPTY_FORM,
      moment: moment ?? "premiere-danse",
    });
    setDefaultMoment(moment ?? null);
    setDrawerOpen(true);
  }

  function openEdit(s: Song) {
    setEditingSong(s);
    setForm({
      moment: s.moment,
      title: s.title,
      artist: s.artist,
      duration: s.duration,
      link: s.link,
      note: s.note,
      approved: s.approved,
    });
    setDefaultMoment(null);
    setDrawerOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !weddingId) return;
    setSyncing(true);
    try {
      const payload = {
        moment: form.moment,
        title: form.title.trim(),
        artist: form.artist.trim(),
        duration: form.duration.trim(),
        link: form.link.trim(),
        note: form.note.trim(),
        approved: form.approved,
      };

      if (editingSong) {
        setDrawerOpen(false);
        setSongs((prev) =>
          prev.map((s) => (s.id === editingSong.id ? { ...s, ...payload } : s))
        );
        await updateSong(editingSong.id, payload);
        toast("Chanson modifiée");
      } else {
        const created = await addSong(weddingId, payload);
        setSongs((prev) => [...prev, created]);
        setDrawerOpen(false);
        toast("Chanson ajoutée");
      }
    } catch {
      toast("Erreur lors de la sauvegarde", "err");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Supprimer cette chanson ?")) return;
    setSongs((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteSong(id);
      toast("Chanson supprimée");
    } catch {
      toast("Erreur lors de la suppression", "err");
    }
  }

  async function toggleApproved(s: Song) {
    const newVal = !s.approved;
    setSongs((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, approved: newVal } : x))
    );
    await updateSong(s.id, { approved: newVal });
  }

  async function handleAddPresets() {
    if (!weddingId) return;
    setSyncing(true);
    try {
      const created = await Promise.all(
        PRESET_SONGS.map((s) => addSong(weddingId, s))
      );
      setSongs((prev) => [...prev, ...created]);
      toast(`${created.length} chansons ajoutées`);
    } catch {
      toast("Erreur lors de l'ajout des suggestions", "err");
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
          title="Musique & playlist"
          sub="Organisez les musiques de votre mariage"
        />
        <Card className="!p-0 mt-6">
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "var(--primary-soft)" }}
            >
              <Icon name="music" size={24} className="text-primary" />
            </div>
            <p className="text-[14px] text-text-2">
              Sélectionnez un mariage pour gérer la playlist.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const partnerA = state.wedding.partnerA;
  const partnerB = state.wedding.partnerB;

  const subLine = `${songs.length} morceau${songs.length !== 1 ? "x" : ""} · ${approvedCount} approuvé${approvedCount !== 1 ? "s" : ""} · ${momentsCovered} moment${momentsCovered !== 1 ? "s" : ""}`;

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      <PageHead
        title="Musique & playlist"
        sub={
          <span className="flex items-center gap-2">
            {subLine}
            {syncing && (
              <span className="flex items-center gap-1.5 text-[12px] text-text-3">
                <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Synchronisation…
              </span>
            )}
          </span>
        }
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            <Button
              variant="secondary"
              icon="sparkle"
              size="sm"
              onClick={handleAddPresets}
              disabled={syncing}
            >
              Playlist type
            </Button>
            {songs.length > 0 && (
              <Button
                variant="secondary"
                icon="download"
                size="sm"
                onClick={() => exportMusicPDF(songs, partnerA, partnerB)}
              >
                Export PDF
              </Button>
            )}
            <Button variant="primary" icon="plus" onClick={() => openAdd()}>
              Ajouter
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="flex gap-3 flex-wrap mb-6">
        <StatPill label="Morceaux" value={songs.length} />
        <StatPill
          label="Approuvés"
          value={approvedCount}
          accent="var(--sage)"
        />
        <StatPill
          label="Durée totale"
          value={songs.length > 0 ? totalDuration : "—"}
          accent="var(--primary)"
        />
        <StatPill
          label="Moments couverts"
          value={`${momentsCovered} / ${MOMENT_ORDER.length}`}
          accent="var(--gold)"
        />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Icon
          name="search"
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
        />
        <input
          className="input pl-9 !h-9 !text-[13px]"
          placeholder="Rechercher un titre, artiste, moment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text transition-colors"
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>

      {/* Empty state */}
      {songs.length === 0 ? (
        <Card className="!p-0">
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "var(--primary-soft)" }}
            >
              <Icon name="music" size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-text mb-1">
                Votre playlist est vide
              </p>
              <p className="text-[13px] text-text-2">
                Commencez par ajouter votre première danse !
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                variant="secondary"
                icon="sparkle"
                onClick={handleAddPresets}
              >
                Ajouter une playlist type
              </Button>
              <Button variant="primary" icon="plus" onClick={() => openAdd()}>
                Ajouter une chanson
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {MOMENT_ORDER.map((moment) => {
            const list = groupedByMoment.get(moment) ?? [];
            if (list.length === 0 && search) return null;

            return (
              <MomentSection
                key={moment}
                moment={moment}
                songs={list}
                onAdd={() => openAdd(moment)}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleApproved={toggleApproved}
              />
            );
          })}
        </div>
      )}

      {/* Add/Edit Drawer */}
      {drawerOpen && (
        <Drawer
          title={editingSong ? "Modifier la chanson" : "Ajouter une chanson"}
          onClose={() => { setDrawerOpen(false); setApiResults([]); setApiQuery(""); }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setDrawerOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                icon="save"
                onClick={handleSave}
                disabled={!form.title.trim() || syncing}
              >
                {editingSong ? "Enregistrer" : "Ajouter"}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            {/* iTunes search — only when adding */}
            {!editingSong && (
              <div className="flex flex-col gap-2">
                <Field label="Rechercher un titre ou un artiste" hint="Sélectionnez un résultat pour remplir automatiquement">
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      value={apiQuery}
                      onChange={(e) => setApiQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchItunes()}
                      placeholder="La Vie en Rose, Édith Piaf…"
                    />
                    <button
                      type="button"
                      onClick={searchItunes}
                      disabled={apiSearching || !apiQuery.trim()}
                      className="px-3 rounded-lg border border-line text-text-2 hover:border-primary/50 hover:text-text transition disabled:opacity-40 flex items-center"
                    >
                      {apiSearching
                        ? <Icon name="refresh" size={15} className="animate-spin" />
                        : <Icon name="search" size={15} />}
                    </button>
                  </div>
                </Field>
                {apiResults.length > 0 && (
                  <div className="rounded-lg border border-line overflow-hidden max-h-52 overflow-y-auto">
                    {apiResults.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectTrack(r)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-hover transition-colors border-b border-line last:border-0"
                      >
                        {r.artworkUrl60 && (
                          <img src={r.artworkUrl60} alt="" className="w-9 h-9 rounded-[6px] object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium truncate text-text">{r.trackName}</div>
                          <div className="text-[11.5px] text-text-2 truncate">{r.artistName}</div>
                        </div>
                        <Icon name="plus" size={13} className="text-text-3 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="h-px bg-line" />
              </div>
            )}

            <Field label="Moment *">
              <select
                className="input"
                value={form.moment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, moment: e.target.value as SongMoment }))
                }
              >
                {MOMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Titre *">
              <input
                className="input"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder={
                  MOMENT_PLACEHOLDERS[form.moment] ?? "Ex : La Vie en Rose"
                }
                autoFocus
              />
            </Field>

            <Field label="Artiste">
              <input
                className="input"
                value={form.artist}
                onChange={(e) =>
                  setForm((f) => ({ ...f, artist: e.target.value }))
                }
                placeholder="Ex : Édith Piaf"
              />
            </Field>

            <Field label="Durée" hint='Format "3:45" ou "1:02:30"'>
              <input
                className="input"
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration: e.target.value }))
                }
                placeholder="3:45"
              />
            </Field>

            <Field label="Lien (optionnel)" hint="YouTube, Spotify, Deezer…">
              <input
                className="input"
                type="url"
                value={form.link}
                onChange={(e) =>
                  setForm((f) => ({ ...f, link: e.target.value }))
                }
                placeholder="https://..."
              />
            </Field>

            <Field label="Note">
              <textarea
                className="input !h-auto py-3 leading-relaxed resize-y"
                rows={3}
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
                placeholder="Pourquoi cette chanson ? Instructions pour le DJ…"
              />
            </Field>

            <label className="flex items-center gap-3 cursor-pointer group pt-1">
              <input
                type="checkbox"
                checked={form.approved}
                onChange={(e) =>
                  setForm((f) => ({ ...f, approved: e.target.checked }))
                }
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: "var(--sage)" }}
              />
              <span className="text-[14px] font-medium text-text group-hover:text-primary transition">
                Approuvée
              </span>
              {form.approved && (
                <span
                  className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--sage-soft, #EAF0E3)",
                    color: "var(--sage)",
                  }}
                >
                  Approuvée
                </span>
              )}
            </label>
          </div>
        </Drawer>
      )}
    </div>
  );
}

// ── MomentSection ──────────────────────────────────────────────────────────

function MomentSection({
  moment,
  songs,
  onAdd,
  onEdit,
  onDelete,
  onToggleApproved,
}: {
  moment: SongMoment;
  songs: Song[];
  onAdd: () => void;
  onEdit: (s: Song) => void;
  onDelete: (id: number) => void;
  onToggleApproved: (s: Song) => void;
}) {
  const color = MOMENT_COLORS[moment];
  const label = MOMENT_LABELS[moment];
  const approvedInSection = songs.filter((s) => s.approved).length;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <h2 className="text-[15px] font-semibold text-text">{label}</h2>
        {songs.length > 0 && (
          <span className="text-[12px] text-text-3">
            {songs.length} titre{songs.length > 1 ? "s" : ""}
            {approvedInSection > 0 && ` · ${approvedInSection} approuvé${approvedInSection > 1 ? "s" : ""}`}
          </span>
        )}
        <div className="flex-1 h-px bg-line" />
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-[12px] text-text-3 hover:text-primary transition-colors"
        >
          <Icon name="plus" size={13} />
          Ajouter
        </button>
      </div>

      {/* Song list */}
      {songs.length === 0 ? (
        <button
          onClick={onAdd}
          className="w-full border border-dashed border-line rounded-card px-4 py-3 text-[13px] text-text-3 hover:border-primary/40 hover:text-primary/70 transition-colors flex items-center gap-2"
        >
          <Icon name="plus" size={14} />
          Ajouter une chanson pour «&nbsp;{label}&nbsp;»
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {songs.map((song) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <SongRow
                  song={song}
                  color={color}
                  onEdit={() => onEdit(song)}
                  onDelete={() => onDelete(song.id)}
                  onToggleApproved={() => onToggleApproved(song)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── SongRow ────────────────────────────────────────────────────────────────

function SongRow({
  song,
  color,
  onEdit,
  onDelete,
  onToggleApproved,
}: {
  song: Song;
  color: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleApproved: () => void;
}) {
  return (
    <Card className="!p-0 overflow-hidden group">
      <div className="flex items-center gap-3 px-4 py-3 min-w-0">
        {/* Color dot */}
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div
            className={`text-[14px] truncate ${song.approved ? "font-semibold text-text" : "font-medium text-text"}`}
          >
            {song.title}
          </div>
          {song.artist && (
            <div className="text-[12px] text-text-2 truncate">{song.artist}</div>
          )}
        </div>

        {/* Duration badge */}
        {song.duration && (
          <span className="text-[11px] text-text-3 bg-surface-2 border border-line rounded px-2 py-0.5 font-mono shrink-0 hidden sm:block">
            {song.duration}
          </span>
        )}

        {/* Link icon */}
        {song.link && (
          <a
            href={song.link}
            target="_blank"
            rel="noopener noreferrer"
            title="Écouter"
            className="icon-btn w-7 h-7 text-text-3 hover:text-primary transition-colors shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="link" size={14} />
          </a>
        )}

        {/* Approve toggle */}
        <button
          title={song.approved ? "Retirer l'approbation" : "Approuver"}
          onClick={onToggleApproved}
          className={`icon-btn w-7 h-7 shrink-0 transition-colors ${
            song.approved ? "text-sage" : "text-text-3 hover:text-sage"
          }`}
        >
          <Icon name="check" size={15} strokeWidth={song.approved ? 2.5 : 1.7} />
        </button>

        {/* Edit */}
        <button
          title="Modifier"
          onClick={onEdit}
          className="icon-btn w-7 h-7 text-text-3 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Icon name="edit" size={14} />
        </button>

        {/* Delete */}
        <button
          title="Supprimer"
          onClick={onDelete}
          className="icon-btn w-7 h-7 text-text-3 hover:text-coral transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        >
          <Icon name="trash" size={14} />
        </button>
      </div>

      {/* Note */}
      {song.note && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-[11.5px] text-text-3 leading-relaxed line-clamp-1 italic">
            {song.note}
          </p>
        </div>
      )}
    </Card>
  );
}

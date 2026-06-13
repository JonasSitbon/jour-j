-- ============================================================
-- JOUR J — Migration 9 : Moodboard (palettes + cards)
-- ============================================================

-- ── 1. Colonnes supplémentaires sur wedding ──────────────────
ALTER TABLE public.wedding
  ADD COLUMN IF NOT EXISTS selected_style   TEXT,
  ADD COLUMN IF NOT EXISTS custom_style_note TEXT;

-- ── 2. Table palettes de couleurs ────────────────────────────
CREATE TABLE IF NOT EXISTS public.moodboard_palettes (
  id         BIGSERIAL   PRIMARY KEY,
  wedding_id BIGINT      NOT NULL REFERENCES public.wedding(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL DEFAULT 'Ma palette',
  colors     JSONB       NOT NULL DEFAULT '[]',
  is_primary BOOLEAN     NOT NULL DEFAULT false,
  order_idx  INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.moodboard_palettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "palettes_access" ON public.moodboard_palettes
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- ── 3. Table cards d'inspiration ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.moodboard_cards (
  id         BIGSERIAL   PRIMARY KEY,
  wedding_id BIGINT      NOT NULL REFERENCES public.wedding(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  url        TEXT,
  note       TEXT,
  tag        TEXT        NOT NULL DEFAULT 'autre',
  color      TEXT        NOT NULL DEFAULT '#C96E2C',
  pinned     BOOLEAN     NOT NULL DEFAULT false,
  order_idx  INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.moodboard_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cards_access" ON public.moodboard_cards
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

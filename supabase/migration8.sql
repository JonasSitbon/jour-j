-- JOUR J — Migration 8 : Journal de bord
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          BIGSERIAL   PRIMARY KEY,
  wedding_id  BIGINT      NOT NULL REFERENCES public.wedding(id) ON DELETE CASCADE,
  title       TEXT,
  text        TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'general'
              CHECK (category IN ('general','invites','budget','prestataires','logistique','idees')),
  pinned      BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_access" ON public.journal_entries
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

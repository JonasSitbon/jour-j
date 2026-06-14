-- migration17_trial_and_analytics.sql
-- Système d'essai 7 jours + tracking analytics

-- ── 1. Colonne trial_ends_at sur profiles ────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ── 2. Trigger : initialise trial_ends_at à J+7 sur INSERT ──────────────────
CREATE OR REPLACE FUNCTION public.set_trial_ends_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_trial_ends_at ON public.profiles;
CREATE TRIGGER trigger_set_trial_ends_at
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_trial_ends_at();

-- Backfill : comptes existants sans trial_ends_at → essai considéré expiré
-- (ils ont déjà accès via l'ancienne logique, on ne coupe rien)
UPDATE public.profiles
  SET trial_ends_at = created_at + INTERVAL '7 days'
  WHERE trial_ends_at IS NULL;

-- ── 3. Table analytics_events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name  TEXT        NOT NULL,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  path        TEXT,
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. RLS analytics_events ──────────────────────────────────────────────────
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can insert analytics" ON public.analytics_events;
CREATE POLICY "anyone can insert analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "super_admin can read analytics" ON public.analytics_events;
CREATE POLICY "super_admin can read analytics"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_type = 'super_admin'
    )
  );

-- ── 5. Index performances ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analytics_event_name_created
  ON public.analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_created
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id
  ON public.analytics_events (user_id);

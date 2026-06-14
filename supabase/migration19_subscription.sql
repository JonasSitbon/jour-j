-- migration19_subscription.sql
-- Statut d'abonnement sur les profils

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_subscribed  BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscribed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan           TEXT        CHECK (plan IN ('couple_monthly', 'couple_annual', 'planner_monthly', 'planner_annual'));

-- Index pour filtrage admin
CREATE INDEX IF NOT EXISTS idx_profiles_subscription
  ON public.profiles (is_subscribed, trial_ends_at);

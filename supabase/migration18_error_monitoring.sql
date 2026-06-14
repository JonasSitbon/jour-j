-- migration18_error_monitoring.sql
-- Table de logs d'erreurs applicatives

CREATE TABLE IF NOT EXISTS public.error_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  level       TEXT        NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  message     TEXT        NOT NULL,
  stack       TEXT,
  path        TEXT,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata    JSONB       DEFAULT '{}',
  notified    BOOLEAN     DEFAULT false,
  resolved    BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes admin (tri par date, filtrage par niveau)
CREATE INDEX IF NOT EXISTS idx_error_logs_level_created
  ON public.error_logs (level, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_created
  ON public.error_logs (created_at DESC);

-- RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- N'importe qui peut insérer (erreurs anon incluses, aucune donnée sensible)
DROP POLICY IF EXISTS "anyone can insert error logs" ON public.error_logs;
CREATE POLICY "anyone can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

-- Seul super_admin peut lire et mettre à jour
DROP POLICY IF EXISTS "super_admin can read error logs" ON public.error_logs;
CREATE POLICY "super_admin can read error logs"
  ON public.error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_type = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "super_admin can update error logs" ON public.error_logs;
CREATE POLICY "super_admin can update error logs"
  ON public.error_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_type = 'super_admin'
    )
  );

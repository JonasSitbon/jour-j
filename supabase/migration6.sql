-- Migration 6 : Lien de partage en lecture seule
-- Ajouter un token de partage unique par mariage

ALTER TABLE wedding
  ADD COLUMN IF NOT EXISTS share_token text;

-- Générer des tokens pour les mariages existants
UPDATE wedding SET share_token = encode(gen_random_bytes(12), 'base64')
  WHERE share_token IS NULL;

-- Rendre non-null
ALTER TABLE wedding
  ALTER COLUMN share_token SET DEFAULT encode(gen_random_bytes(12), 'base64');

-- Index unique pour la recherche par token
CREATE UNIQUE INDEX IF NOT EXISTS wedding_share_token_idx ON wedding(share_token);

-- ================================================================
-- Politiques RLS pour la page de partage publique
-- ================================================================

-- Permettre à un utilisateur anonyme de lire le mariage via son share_token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wedding' AND policyname = 'wedding_share_select'
  ) THEN
    CREATE POLICY wedding_share_select ON wedding
      FOR SELECT TO anon
      USING (share_token IS NOT NULL);
  END IF;
END $$;

-- Permettre à un utilisateur anonyme de lire les invités d'un mariage partagé
-- (joint via wedding_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'guests_share_select'
  ) THEN
    CREATE POLICY guests_share_select ON guests
      FOR SELECT TO anon
      USING (EXISTS (
        SELECT 1 FROM wedding w WHERE w.id = guests.wedding_id AND w.share_token IS NOT NULL
      ));
  END IF;
END $$;

-- Permettre de lire les prestataires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vendors' AND policyname = 'vendors_share_select'
  ) THEN
    CREATE POLICY vendors_share_select ON vendors
      FOR SELECT TO anon
      USING (EXISTS (
        SELECT 1 FROM wedding w WHERE w.id = vendors.wedding_id AND w.share_token IS NOT NULL
      ));
  END IF;
END $$;

-- Permettre de lire les tâches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_share_select'
  ) THEN
    CREATE POLICY tasks_share_select ON tasks
      FOR SELECT TO anon
      USING (EXISTS (
        SELECT 1 FROM wedding w WHERE w.id = tasks.wedding_id AND w.share_token IS NOT NULL
      ));
  END IF;
END $$;

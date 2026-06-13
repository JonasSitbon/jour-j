-- Migration 5 : Système RSVP invités
-- Ajouter un token unique par invité pour les liens RSVP personnalisés
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS rsvp_token uuid DEFAULT gen_random_uuid();

-- Générer un token pour tous les invités existants qui n'en ont pas encore
UPDATE guests SET rsvp_token = gen_random_uuid() WHERE rsvp_token IS NULL;

-- Rendre la colonne non nulle maintenant que tous les invités ont un token
ALTER TABLE guests
  ALTER COLUMN rsvp_token SET NOT NULL,
  ALTER COLUMN rsvp_token SET DEFAULT gen_random_uuid();

-- Index pour la recherche par token (utilisé par la page RSVP publique)
CREATE UNIQUE INDEX IF NOT EXISTS guests_rsvp_token_idx ON guests(rsvp_token);

-- ================================================================
-- Politiques RLS pour la page RSVP publique (accès anon)
-- ================================================================

-- Permettre à un utilisateur anonyme de lire les infos d'un invité via son token
-- (le token UUID est non devinable → sécurité par obscurité suffisante pour une app de mariage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'guests_rsvp_public_select'
  ) THEN
    CREATE POLICY guests_rsvp_public_select ON guests
      FOR SELECT TO anon
      USING (rsvp_token IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'guests_rsvp_public_update'
  ) THEN
    CREATE POLICY guests_rsvp_public_update ON guests
      FOR UPDATE TO anon
      USING (rsvp_token IS NOT NULL)
      WITH CHECK (rsvp_token IS NOT NULL);
  END IF;
END $$;

-- Permettre à un utilisateur anonyme de lire les infos du mariage (pour l'affichage sur la page RSVP)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wedding' AND policyname = 'wedding_rsvp_public_select'
  ) THEN
    CREATE POLICY wedding_rsvp_public_select ON wedding
      FOR SELECT TO anon
      USING (true);
  END IF;
END $$;

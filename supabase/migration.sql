-- ============================================================
-- JOUR J — Migration auth + isolation par utilisateur
-- Colle ce fichier dans l'éditeur SQL de Supabase et exécute-le.
-- ============================================================

-- 1. Ajouter user_id à la table wedding
ALTER TABLE wedding ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS wedding_user_id_idx ON wedding(user_id);

-- 2. Ajouter wedding_id à toutes les tables de données
ALTER TABLE guests          ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;
ALTER TABLE seating_tables  ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;
ALTER TABLE vendors         ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;
ALTER TABLE budget_posts    ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;
ALTER TABLE contributions   ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;
ALTER TABLE payments        ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;
ALTER TABLE tasks           ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;
ALTER TABLE day_j           ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;
ALTER TABLE date_candidates ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;
ALTER TABLE members         ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;
ALTER TABLE notifications   ADD COLUMN IF NOT EXISTS wedding_id bigint REFERENCES wedding(id) ON DELETE CASCADE;

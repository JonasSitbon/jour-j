-- ============================================================
-- JOUR J — Migration 3 : météo par ville par date candidate
-- Colle ce fichier dans l'éditeur SQL de Supabase et exécute-le.
-- ============================================================

-- Chaque date candidate peut avoir sa propre ville (Paris, Annecy, Marseille…)
-- lat/lon stockés pour éviter de re-géocoder à chaque rechargement
ALTER TABLE date_candidates
  ADD COLUMN IF NOT EXISTS city text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS lat  double precision,
  ADD COLUMN IF NOT EXISTS lon  double precision;

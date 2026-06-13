-- ============================================================
-- JOUR J — Migration 2 : météo personnalisée par mariage
-- Colle ce fichier dans l'éditeur SQL de Supabase et exécute-le.
-- ============================================================

-- Stocker la météo réelle (données Open-Meteo) par mariage
ALTER TABLE wedding
  ADD COLUMN IF NOT EXISTS weather_json  jsonb,
  ADD COLUMN IF NOT EXISTS weather_city  text NOT NULL DEFAULT '';

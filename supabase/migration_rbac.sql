-- ─── RBAC — Role-Based Access Control migration ─────────────────────────────
-- Run this migration in Supabase SQL editor to extend the wedding access system
-- with named collaborator roles and custom per-collaborator page permissions.

-- ─── Extend wedding_access ────────────────────────────────────────────────────

-- role_name: named collaborator role (coordinateur, dj, traiteur, photographe, lecteur, admin, owner)
ALTER TABLE wedding_access ADD COLUMN IF NOT EXISTS role_name TEXT DEFAULT 'lecteur';

-- custom_permissions: optional JSON array of page IDs allowed for this specific collaborator
-- When NULL, the defaults for the role_name (stored in admin_role_permissions) are used.
ALTER TABLE wedding_access ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT NULL;

-- display_name: optional friendly name for the collaborator (e.g. "Marie Photographe")
ALTER TABLE wedding_access ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL;

-- ─── Admin role permissions table ─────────────────────────────────────────────
-- Stores the configurable default page permissions per role name.
-- Updated from the admin UI (app/admin/roles/page.tsx) — currently stored in localStorage,
-- but this table enables server-side persistence in the future.

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  id          SERIAL PRIMARY KEY,
  role_name   TEXT NOT NULL UNIQUE,
  allowed_pages JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seed default permissions ─────────────────────────────────────────────────

INSERT INTO admin_role_permissions (role_name, allowed_pages) VALUES
  ('owner',        '["dashboard","dates","checklist","timeline","dayj","ceremony","music","guests","vendors","gifts","contacts","budget","payments","journal","moodboard","settings"]'),
  ('admin',        '["dashboard","dates","checklist","timeline","dayj","ceremony","music","guests","vendors","gifts","contacts","budget","payments","journal","moodboard"]'),
  ('coordinateur', '["dashboard","dayj","guests","vendors","checklist","timeline","ceremony"]'),
  ('dj',           '["music","dayj","ceremony"]'),
  ('traiteur',     '["guests","budget","dayj"]'),
  ('photographe',  '["dayj","ceremony","music","timeline"]'),
  ('lecteur',      '["dashboard","dayj"]')
ON CONFLICT (role_name) DO NOTHING;

-- ─── RLS policies (if RLS is enabled on wedding_access) ──────────────────────

-- Allow owners/admins to read all accesses for their wedding
-- (Adjust to match your existing RLS setup)
-- CREATE POLICY "wedding_access_select" ON wedding_access
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM wedding_access wa2
--       WHERE wa2.wedding_id = wedding_access.wedding_id
--         AND wa2.user_id = auth.uid()
--         AND wa2.role IN ('owner', 'admin')
--     )
--   );

-- ─── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_wedding_access_role_name ON wedding_access (role_name);

-- ============================================================
-- JOUR J — Migration 7 : Profils · Multi-mariage · Accès & rôles
-- Colle ce fichier dans Supabase SQL Editor et exécute-le.
-- ============================================================

-- ── 1. Table profiles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name   TEXT,
  last_name    TEXT,
  avatar_url   TEXT,
  account_type TEXT        NOT NULL DEFAULT 'couple'
                           CHECK (account_type IN ('couple', 'planner', 'super_admin')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own_select" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Super-admin peut lire tous les profils
CREATE POLICY "profiles_superadmin_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.account_type = 'super_admin'
    )
  );
CREATE POLICY "profiles_superadmin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.account_type = 'super_admin'
    )
  );

-- ── 2. Trigger : création automatique du profil à l'inscription ──────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  full_name TEXT;
  fname TEXT;
  lname TEXT;
BEGIN
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  fname := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    CASE WHEN full_name != '' THEN split_part(full_name, ' ', 1) ELSE NULL END
  );
  lname := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    CASE
      WHEN full_name != '' AND position(' ' in full_name) > 0
      THEN substring(full_name from position(' ' in full_name) + 1)
      ELSE NULL
    END
  );
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, account_type)
  VALUES (NEW.id, fname, lname, NEW.raw_user_meta_data->>'avatar_url', 'couple')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. Colonnes supplémentaires sur wedding ───────────────────────────────────
ALTER TABLE public.wedding
  ADD COLUMN IF NOT EXISTS name        TEXT,
  ADD COLUMN IF NOT EXISTS cover_color TEXT DEFAULT '#C96E2C';

-- ── 4. Supprimer le contrainte UNIQUE sur wedding.user_id (multi-mariage) ────
DROP INDEX IF EXISTS wedding_user_id_idx;

-- ── 5. Table wedding_access (partage d'un mariage) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.wedding_access (
  id          BIGSERIAL   PRIMARY KEY,
  wedding_id  BIGINT      NOT NULL REFERENCES public.wedding(id)   ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id)       ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'viewer'
                          CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by  UUID        REFERENCES auth.users(id),
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(wedding_id, user_id)
);

ALTER TABLE public.wedding_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_select_participant" ON public.wedding_access
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wa_select_owner" ON public.wedding_access
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.wedding w WHERE w.id = wedding_id AND w.user_id = auth.uid())
  );
CREATE POLICY "wa_insert_owner" ON public.wedding_access
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.wedding w WHERE w.id = wedding_id AND w.user_id = auth.uid())
  );
CREATE POLICY "wa_delete" ON public.wedding_access
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.wedding w WHERE w.id = wedding_id AND w.user_id = auth.uid())
  );
CREATE POLICY "wa_update_owner" ON public.wedding_access
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.wedding w WHERE w.id = wedding_id AND w.user_id = auth.uid())
  );

-- ── 6. Fonction helper : l'utilisateur a-t-il accès à ce mariage ? ──────────
CREATE OR REPLACE FUNCTION public.has_wedding_access(w_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN
    EXISTS (SELECT 1 FROM public.wedding   WHERE id = w_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.wedding_access WHERE wedding_id = w_id AND user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── 7. Mise à jour RLS : wedding ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users own wedding"        ON public.wedding;
DROP POLICY IF EXISTS "Users manage own wedding" ON public.wedding;

CREATE POLICY "wedding_owner_all" ON public.wedding
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wedding_shared_select" ON public.wedding
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.wedding_access wa WHERE wa.wedding_id = id AND wa.user_id = auth.uid())
  );

-- Super-admin voit tout
CREATE POLICY "wedding_superadmin" ON public.wedding
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin')
  );

-- ── 8. Mise à jour RLS : tables de données (accès via has_wedding_access) ────
-- guests
DROP POLICY IF EXISTS "Users manage guests"          ON public.guests;
DROP POLICY IF EXISTS "wedding_owner"                ON public.guests;
CREATE POLICY "guests_access" ON public.guests
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- seating_tables
DROP POLICY IF EXISTS "Users manage seating_tables"  ON public.seating_tables;
DROP POLICY IF EXISTS "wedding_owner"                ON public.seating_tables;
CREATE POLICY "tables_access" ON public.seating_tables
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- vendors
DROP POLICY IF EXISTS "Users manage vendors"         ON public.vendors;
DROP POLICY IF EXISTS "wedding_owner"                ON public.vendors;
CREATE POLICY "vendors_access" ON public.vendors
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- budget_posts
DROP POLICY IF EXISTS "Users manage budget_posts"    ON public.budget_posts;
DROP POLICY IF EXISTS "wedding_owner"                ON public.budget_posts;
CREATE POLICY "budget_access" ON public.budget_posts
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- contributions
DROP POLICY IF EXISTS "Users manage contributions"   ON public.contributions;
DROP POLICY IF EXISTS "wedding_owner"                ON public.contributions;
CREATE POLICY "contributions_access" ON public.contributions
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- payments
DROP POLICY IF EXISTS "Users manage payments"        ON public.payments;
DROP POLICY IF EXISTS "wedding_owner"                ON public.payments;
CREATE POLICY "payments_access" ON public.payments
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- tasks
DROP POLICY IF EXISTS "Users manage tasks"           ON public.tasks;
DROP POLICY IF EXISTS "wedding_owner"                ON public.tasks;
CREATE POLICY "tasks_access" ON public.tasks
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- day_j
DROP POLICY IF EXISTS "Users manage day_j"           ON public.day_j;
DROP POLICY IF EXISTS "wedding_owner"                ON public.day_j;
CREATE POLICY "dayj_access" ON public.day_j
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- date_candidates
DROP POLICY IF EXISTS "Users manage date_candidates" ON public.date_candidates;
DROP POLICY IF EXISTS "wedding_owner"                ON public.date_candidates;
CREATE POLICY "dates_access" ON public.date_candidates
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- members
DROP POLICY IF EXISTS "Users manage members"         ON public.members;
DROP POLICY IF EXISTS "wedding_owner"                ON public.members;
CREATE POLICY "members_access" ON public.members
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

-- notifications
DROP POLICY IF EXISTS "Users manage notifications"   ON public.notifications;
DROP POLICY IF EXISTS "wedding_owner"                ON public.notifications;
CREATE POLICY "notifs_access" ON public.notifications
  FOR ALL TO authenticated
  USING  (public.has_wedding_access(wedding_id))
  WITH CHECK (public.has_wedding_access(wedding_id));

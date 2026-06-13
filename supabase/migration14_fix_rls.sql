-- ============================================================
-- Migration 14 : Fix infinite recursion in RLS policies
-- ============================================================
-- CAUSE : Les policies sur profiles et wedding_access se
-- référencent mutuellement via des sous-requêtes, créant une
-- récursion infinie lors de chaque accès à ces tables.
--
-- FIX : Utiliser des fonctions SECURITY DEFINER qui bypassent
-- le RLS lors de leur exécution interne.
-- ============================================================

-- ── 1. Fonction sécurisée : vérifier si l'utilisateur est propriétaire d'un mariage
CREATE OR REPLACE FUNCTION public.owns_wedding(w_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.wedding
    WHERE id = w_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── 2. Fonction sécurisée : vérifier si l'utilisateur est super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND account_type = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── 3. Fix : wedding_access policies (causaient la boucle via wedding)
DROP POLICY IF EXISTS "wa_select_owner"  ON public.wedding_access;
DROP POLICY IF EXISTS "wa_insert_owner"  ON public.wedding_access;
DROP POLICY IF EXISTS "wa_delete"        ON public.wedding_access;
DROP POLICY IF EXISTS "wa_update_owner"  ON public.wedding_access;

CREATE POLICY "wa_select_owner" ON public.wedding_access
  FOR SELECT TO authenticated
  USING (public.owns_wedding(wedding_id));

CREATE POLICY "wa_insert_owner" ON public.wedding_access
  FOR INSERT TO authenticated
  WITH CHECK (public.owns_wedding(wedding_id));

CREATE POLICY "wa_delete" ON public.wedding_access
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.owns_wedding(wedding_id));

CREATE POLICY "wa_update_owner" ON public.wedding_access
  FOR UPDATE TO authenticated
  USING (public.owns_wedding(wedding_id));

-- ── 4. Fix : profiles superadmin policies (causaient la boucle sur profiles)
DROP POLICY IF EXISTS "profiles_superadmin_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_superadmin_update" ON public.profiles;

CREATE POLICY "profiles_superadmin_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "profiles_superadmin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_super_admin());

-- ── 5. Fix : wedding superadmin policy (utiliser la fonction sécurisée)
DROP POLICY IF EXISTS "wedding_superadmin" ON public.wedding;

CREATE POLICY "wedding_superadmin" ON public.wedding
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

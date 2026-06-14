-- migration22_admin_wedding_access.sql
-- Correctif : Super-admin peut lire wedding_access de n'importe quel utilisateur
-- (sans cela, la fiche CRM ne montrait aucun mariage pour les clients invités comme collaborateurs)

-- ── 1. Politique super-admin sur wedding_access ────────────────────────────────
DROP POLICY IF EXISTS "wa_superadmin_select" ON public.wedding_access;

CREATE POLICY "wa_superadmin_select" ON public.wedding_access
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_type = 'super_admin'
    )
  );

-- ── 2. S'assurer que la politique wedding_superadmin existe bien ────────────────
-- (déjà créée dans migration7 mais on la recrée au cas où)
DROP POLICY IF EXISTS "wedding_superadmin" ON public.wedding;

CREATE POLICY "wedding_superadmin" ON public.wedding
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_type = 'super_admin'
    )
  );

-- ── 3. crm_tasks : super-admin peut lire les tâches de tous les utilisateurs ───
-- (nécessaire pour la fiche CRM si migration21 a été appliquée)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'crm_tasks'
  ) THEN
    EXECUTE $policy$
      DROP POLICY IF EXISTS "crm_tasks_superadmin" ON public.crm_tasks;
      CREATE POLICY "crm_tasks_superadmin" ON public.crm_tasks
        FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin'))
        WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin'));
    $policy$;
  END IF;
END $$;

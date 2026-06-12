-- ============================================================
-- Migration 15 : CORRECTIF DE SÉCURITÉ RLS
-- Colle ce fichier dans Supabase > SQL Editor et exécute-le
-- AVANT de déployer le code qui l'accompagne.
-- ============================================================
-- PROBLÈMES CORRIGÉS :
--  1. Les policies anon "rsvp_token IS NOT NULL" / "share_token
--     IS NOT NULL" / "USING (true)" étaient toujours vraies :
--     toute personne non connectée pouvait lire (et modifier !)
--     les tables guests, wedding, vendors et tasks de TOUS les
--     mariages. → Remplacées par des fonctions RPC qui exigent
--     le token exact et ne renvoient que les colonnes utiles.
--  2. Tout collaborateur (même "viewer") avait un accès FOR ALL
--     (écriture + suppression) via has_wedding_access().
--     → Lecture pour tous les membres acceptés, écriture
--     réservée aux rôles owner/admin/editor.
--  3. Nettoyage des anciennes policies de rls.sql dont la
--     sous-requête scalaire plantait en multi-mariage.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SUPPRESSION DES POLICIES ANON (la fuite de données)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "guests_rsvp_public_select"  ON public.guests;
DROP POLICY IF EXISTS "guests_rsvp_public_update"  ON public.guests;
DROP POLICY IF EXISTS "guests_share_select"        ON public.guests;
DROP POLICY IF EXISTS "wedding_rsvp_public_select" ON public.wedding;
DROP POLICY IF EXISTS "wedding_share_select"       ON public.wedding;
DROP POLICY IF EXISTS "vendors_share_select"       ON public.vendors;
DROP POLICY IF EXISTS "tasks_share_select"         ON public.tasks;

-- ────────────────────────────────────────────────────────────
-- 2. FONCTIONS D'ACCÈS (durcies : accepted_at requis, rôle
--    vérifié pour l'écriture, search_path verrouillé)
-- ────────────────────────────────────────────────────────────

-- Lecture : propriétaire OU collaborateur ayant accepté l'invitation
CREATE OR REPLACE FUNCTION public.has_wedding_access(w_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN
    EXISTS (SELECT 1 FROM public.wedding
            WHERE id = w_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.wedding_access
               WHERE wedding_id = w_id
                 AND user_id = auth.uid()
                 AND accepted_at IS NOT NULL);
END;
$$;

-- Écriture : propriétaire OU collaborateur accepté avec un rôle éditeur
CREATE OR REPLACE FUNCTION public.can_edit_wedding(w_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN
    EXISTS (SELECT 1 FROM public.wedding
            WHERE id = w_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.wedding_access
               WHERE wedding_id = w_id
                 AND user_id = auth.uid()
                 AND accepted_at IS NOT NULL
                 AND role IN ('owner', 'admin', 'editor'));
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. RPC PUBLIQUES PAR TOKEN (remplacent les policies anon)
-- ────────────────────────────────────────────────────────────

-- Page RSVP : infos de l'invité + du mariage, via token exact
CREATE OR REPLACE FUNCTION public.get_rsvp_info(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_token  UUID;
  v_result JSONB;
BEGIN
  BEGIN
    v_token := p_token::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
  END;

  SELECT jsonb_build_object(
    'guest', jsonb_build_object(
      'id', g.id, 'name', g.name, 'rsvp', g.rsvp,
      'diet', g.diet, 'note', g.note
    ),
    'wedding', jsonb_build_object(
      'partner_a', w.partner_a, 'partner_b', w.partner_b,
      'date', w.date, 'venue', w.venue, 'city', w.city
    )
  )
  INTO v_result
  FROM public.guests g
  JOIN public.wedding w ON w.id = g.wedding_id
  WHERE g.rsvp_token = v_token;

  RETURN v_result; -- NULL si token inconnu
END;
$$;

-- Page RSVP : enregistrement de la réponse (colonnes limitées + validation)
CREATE OR REPLACE FUNCTION public.submit_rsvp(
  p_token TEXT, p_rsvp TEXT, p_diet TEXT, p_note TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_token UUID;
  v_count INT;
BEGIN
  BEGIN
    v_token := p_token::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN FALSE;
  END;

  IF p_rsvp NOT IN ('yes', 'pending', 'declined') THEN
    RETURN FALSE;
  END IF;
  IF p_diet IS NULL OR p_diet NOT IN
     ('none', 'vegetarien', 'vegan', 'sans gluten', 'sans lactose', 'other') THEN
    p_diet := 'none';
  END IF;

  UPDATE public.guests
  SET rsvp = p_rsvp,
      diet = p_diet,
      note = LEFT(COALESCE(p_note, ''), 500)
  WHERE rsvp_token = v_token;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

-- Page de partage : vue lecture seule agrégée, via token exact
CREATE OR REPLACE FUNCTION public.get_share_data(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wid     BIGINT;
  v_wedding JSONB;
BEGIN
  SELECT id,
         jsonb_build_object(
           'partner_a', partner_a, 'partner_b', partner_b,
           'date', date, 'venue', venue, 'city', city,
           'theme', theme, 'guest_target', guest_target
         )
  INTO v_wid, v_wedding
  FROM public.wedding
  WHERE share_token = p_token;

  IF v_wid IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'wedding', v_wedding,
    'guests', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'rsvp', rsvp, 'side', side, 'diet', diet))
      FROM public.guests WHERE wedding_id = v_wid), '[]'::jsonb),
    'vendors', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id, 'cat', cat, 'name', name, 'status', status, 'total', total))
      FROM public.vendors WHERE wedding_id = v_wid), '[]'::jsonb),
    'tasks', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id, 'title', title, 'cat', cat, 'due', due, 'done', done, 'who', who))
      FROM public.tasks WHERE wedding_id = v_wid), '[]'::jsonb),
    'ceremony', public.get_share_ceremony(v_wid)
  );
END;
$$;

-- Sous-fonction : programme cérémonie (table absente si migration11
-- pas encore exécutée → renvoie simplement un tableau vide)
CREATE OR REPLACE FUNCTION public.get_share_ceremony(v_wid BIGINT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF to_regclass('public.ceremony_events') IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  EXECUTE
    'SELECT COALESCE(jsonb_agg(jsonb_build_object(
       ''id'', id, ''order_idx'', order_idx, ''category'', category, ''title'', title,
       ''duration_min'', duration_min, ''who'', who, ''music'', music)
       ORDER BY order_idx), ''[]''::jsonb)
     FROM public.ceremony_events WHERE wedding_id = $1'
  INTO v_result USING v_wid;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_rsvp_info(TEXT)                    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_rsvp(TEXT, TEXT, TEXT, TEXT)    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_share_data(TEXT)                   FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rsvp_info(TEXT)                 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_rsvp(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_share_data(TEXT)                TO anon, authenticated;

-- Sous-fonction interne uniquement : personne ne doit pouvoir l'appeler
-- directement avec un wedding_id arbitraire (seul get_share_data, qui
-- s'exécute en tant que propriétaire, y a accès)
REVOKE ALL ON FUNCTION public.get_share_ceremony(BIGINT) FROM PUBLIC, anon, authenticated;

-- ────────────────────────────────────────────────────────────
-- 4. TABLES DE DONNÉES : lecture membres / écriture éditeurs
--    On purge TOUTES les policies existantes de chaque table
--    (3 générations se chevauchent) et on recrée l'état cible.
--    Les tables absentes (migrations 8-13 pas encore exécutées)
--    sont ignorées avec un NOTICE — relance ce fichier après
--    les avoir créées, il est idempotent.
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  t   TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'guests', 'seating_tables', 'vendors', 'budget_posts', 'contributions',
    'payments', 'tasks', 'day_j', 'date_candidates', 'members', 'notifications',
    'journal_entries', 'moodboard_palettes', 'moodboard_cards', 'gifts',
    'ceremony_events', 'songs', 'key_contacts'
  ] LOOP
    -- Table absente → on saute (et on le signale)
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'Table public.% absente — ignorée (exécute la migration correspondante puis relance ce fichier)', t;
      CONTINUE;
    END IF;

    -- Purge de toutes les policies existantes sur la table
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Lecture : tout membre du mariage (owner + collaborateurs acceptés)
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
       USING (public.has_wedding_access(wedding_id))',
      t || '_select_members', t);

    -- Écriture : owner / admin / editor uniquement
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
       WITH CHECK (public.can_edit_wedding(wedding_id))',
      t || '_insert_editors', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
       USING (public.can_edit_wedding(wedding_id))
       WITH CHECK (public.can_edit_wedding(wedding_id))',
      t || '_update_editors', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
       USING (public.can_edit_wedding(wedding_id))',
      t || '_delete_editors', t);
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- 5. TABLE wedding : nettoyage des doublons hérités de rls.sql
--    + mise à jour autorisée aux collaborateurs éditeurs
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "wedding_select" ON public.wedding;
DROP POLICY IF EXISTS "wedding_insert" ON public.wedding;
DROP POLICY IF EXISTS "wedding_update" ON public.wedding;
DROP POLICY IF EXISTS "wedding_delete" ON public.wedding;

-- Lecture partagée : recréée sur la fonction durcie (accepted_at requis)
DROP POLICY IF EXISTS "wedding_shared_select" ON public.wedding;
CREATE POLICY "wedding_shared_select" ON public.wedding
  FOR SELECT TO authenticated
  USING (public.has_wedding_access(id));

-- Les admin/editor peuvent modifier la fiche mariage
-- (date, lieu, budget total… utilisés par syncKey), mais ni
-- la créer, ni la supprimer (réservé au owner via wedding_owner_all)
DROP POLICY IF EXISTS "wedding_shared_update" ON public.wedding;
CREATE POLICY "wedding_shared_update" ON public.wedding
  FOR UPDATE TO authenticated
  USING (public.can_edit_wedding(id))
  WITH CHECK (public.can_edit_wedding(id));

-- ────────────────────────────────────────────────────────────
-- 6. VÉRIFICATION (à lire après exécution)
-- ────────────────────────────────────────────────────────────
-- Aucune policy ne doit rester pour le rôle anon :
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public' AND roles::text LIKE '%anon%';
-- → Ce SELECT doit renvoyer 0 ligne.

-- ============================================================
-- Migration 16 : Invitations collaborateurs fonctionnelles
--                + message RSVP séparé de la note privée
-- Colle ce fichier dans Supabase > SQL Editor et exécute-le
-- AVANT de déployer le code qui l'accompagne.
-- ============================================================
-- 1. Le flux d'invitation était cassé de bout en bout :
--    insertion d'un email dans une colonne UUID, et accepted_at
--    jamais rempli. → Invitations par email avec token unique,
--    page /invite/[token] et RPC d'acceptation.
-- 2. guests.note servait à la fois de note privée des mariés
--    ("Relancer") et de message de l'invité sur la page RSVP :
--    l'invité voyait la note privée le concernant.
--    → Colonne rsvp_message dédiée.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. wedding_access : invitations par email + token
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.wedding_access ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.wedding_access ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.wedding_access
  ADD COLUMN IF NOT EXISTS invite_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS wedding_access_invite_token_idx
  ON public.wedding_access(invite_token);

-- Une ligne doit cibler un compte OU un email
ALTER TABLE public.wedding_access DROP CONSTRAINT IF EXISTS wedding_access_target_check;
ALTER TABLE public.wedding_access
  ADD CONSTRAINT wedding_access_target_check
  CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Pas deux invitations en attente pour le même email sur le même mariage
CREATE UNIQUE INDEX IF NOT EXISTS wedding_access_pending_email_idx
  ON public.wedding_access(wedding_id, lower(email))
  WHERE user_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- 2. RPC : infos d'une invitation (page /invite/[token],
--    accessible avant connexion — ne révèle que le minimum)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_invite_info(p_token TEXT)
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
    'wedding', jsonb_build_object(
      'partner_a', w.partner_a, 'partner_b', w.partner_b,
      'date', w.date, 'city', w.city
    ),
    'role', wa.role,
    'email', wa.email,
    'accepted', wa.accepted_at IS NOT NULL,
    'inviter', NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), '')
  )
  INTO v_result
  FROM public.wedding_access wa
  JOIN public.wedding w ON w.id = wa.wedding_id
  LEFT JOIN public.profiles p ON p.id = wa.invited_by
  WHERE wa.invite_token = v_token;

  RETURN v_result; -- NULL si token inconnu
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. RPC : acceptation d'une invitation (connecté uniquement)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_wedding_invite(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_token UUID;
  v_uid   UUID := auth.uid();
  v_row   public.wedding_access%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;
  BEGIN
    v_token := p_token::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
  END;

  SELECT * INTO v_row FROM public.wedding_access WHERE invite_token = v_token;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Invitation déjà liée à un autre compte → refus
  IF v_row.user_id IS NOT NULL AND v_row.user_id <> v_uid THEN
    RETURN NULL;
  END IF;

  -- Le propriétaire clique sur son propre lien → on nettoie, accès déjà total
  IF EXISTS (SELECT 1 FROM public.wedding WHERE id = v_row.wedding_id AND user_id = v_uid) THEN
    DELETE FROM public.wedding_access WHERE id = v_row.id;
    RETURN jsonb_build_object('wedding_id', v_row.wedding_id);
  END IF;

  -- Déjà membre via une autre ligne → fusion (le nouveau rôle gagne)
  IF EXISTS (SELECT 1 FROM public.wedding_access
             WHERE wedding_id = v_row.wedding_id AND user_id = v_uid AND id <> v_row.id) THEN
    UPDATE public.wedding_access
    SET role = v_row.role, accepted_at = COALESCE(accepted_at, NOW())
    WHERE wedding_id = v_row.wedding_id AND user_id = v_uid;
    DELETE FROM public.wedding_access WHERE id = v_row.id;
  ELSE
    UPDATE public.wedding_access
    SET user_id = v_uid, accepted_at = COALESCE(accepted_at, NOW())
    WHERE id = v_row.id;
  END IF;

  RETURN jsonb_build_object('wedding_id', v_row.wedding_id);
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 4. RPC : liste réelle des membres + invitations en attente
--    (la page Paramètres affichait la table de démo "members")
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_wedding_members(p_wedding_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.has_wedding_access(p_wedding_id) THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'owner', (
      SELECT jsonb_build_object(
        'name', NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''),
        'email', u.email
      )
      FROM public.wedding w
      LEFT JOIN public.profiles p ON p.id = w.user_id
      LEFT JOIN auth.users u ON u.id = w.user_id
      WHERE w.id = p_wedding_id
    ),
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', wa.id,
        'role', wa.role,
        'email', COALESCE(u.email, wa.email),
        'name', NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''),
        'accepted', wa.accepted_at IS NOT NULL,
        -- Le lien d'invitation n'est montré qu'aux éditeurs, et
        -- seulement tant que l'invitation est en attente
        'invite_token', CASE
          WHEN wa.accepted_at IS NULL AND public.can_edit_wedding(p_wedding_id)
          THEN wa.invite_token::text ELSE NULL END
      ) ORDER BY wa.invited_at)
      FROM public.wedding_access wa
      LEFT JOIN public.profiles p ON p.id = wa.user_id
      LEFT JOIN auth.users u ON u.id = wa.user_id
      WHERE wa.wedding_id = p_wedding_id
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_invite_info(TEXT)        FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_wedding_invite(TEXT)  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_wedding_members(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_info(TEXT)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_wedding_invite(TEXT)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_wedding_members(BIGINT) TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 5. Message RSVP séparé de la note privée des mariés
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS rsvp_message TEXT NOT NULL DEFAULT '';

-- get_rsvp_info : renvoie le message de l'invité, plus jamais la note privée
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
      'diet', g.diet, 'message', g.rsvp_message
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

  RETURN v_result;
END;
$$;

-- submit_rsvp : écrit dans rsvp_message, ne touche plus à note
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
      rsvp_message = LEFT(COALESCE(p_note, ''), 500)
  WHERE rsvp_token = v_token;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

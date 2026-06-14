-- migration20_crm.sql
-- CRM : champs contact sur profiles + table crm_events

-- ── 1. Champs contact sur profiles ──────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email       TEXT,
  ADD COLUMN IF NOT EXISTS phone       TEXT,
  ADD COLUMN IF NOT EXISTS company     TEXT,
  ADD COLUMN IF NOT EXISTS crm_tags    TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS crm_notes   TEXT;

-- Synchroniser l'email depuis auth.users pour les comptes existants
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Trigger pour synchroniser l'email au moment de l'INSERT d'un profil
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.email := (SELECT email FROM auth.users WHERE id = NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_email ON public.profiles;
CREATE TRIGGER trg_sync_profile_email
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- ── 2. Table crm_events (activité manuelle + auto) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type   TEXT        NOT NULL CHECK (event_type IN (
    'signup', 'trial_start', 'trial_expired', 'subscription', 'plan_change',
    'email_sent', 'admin_note', 'wedding_created', 'profile_updated',
    'role_change', 'account_type_change', 'login', 'password_reset'
  )),
  title        TEXT        NOT NULL,
  description  TEXT,
  metadata     JSONB       DEFAULT '{}',
  performed_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_events_user_created
  ON public.crm_events (user_id, created_at DESC);

-- RLS : INSERT super_admin, SELECT super_admin
ALTER TABLE public.crm_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin select crm_events" ON public.crm_events;
CREATE POLICY "super_admin select crm_events" ON public.crm_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin'));

DROP POLICY IF EXISTS "super_admin insert crm_events" ON public.crm_events;
CREATE POLICY "super_admin insert crm_events" ON public.crm_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin'));

DROP POLICY IF EXISTS "super_admin update crm_events" ON public.crm_events;
CREATE POLICY "super_admin update crm_events" ON public.crm_events FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin'));

DROP POLICY IF EXISTS "super_admin delete crm_events" ON public.crm_events;
CREATE POLICY "super_admin delete crm_events" ON public.crm_events FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin'));

-- ── 3. Trigger : crm_event automatique à l'inscription ──────────────────────
CREATE OR REPLACE FUNCTION public.crm_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.crm_events (user_id, event_type, title, description)
  VALUES (NEW.id, 'signup', 'Inscription', 'Création du compte ' || COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_on_signup ON public.profiles;
CREATE TRIGGER trg_crm_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.crm_on_signup();

-- ── 4. Trigger : crm_event sur changement d'abonnement ──────────────────────
CREATE OR REPLACE FUNCTION public.crm_on_subscription_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.is_subscribed IS DISTINCT FROM NEW.is_subscribed THEN
    INSERT INTO public.crm_events (user_id, event_type, title, description, metadata)
    VALUES (
      NEW.id,
      CASE WHEN NEW.is_subscribed THEN 'subscription' ELSE 'plan_change' END,
      CASE WHEN NEW.is_subscribed THEN 'Abonnement activé' ELSE 'Abonnement désactivé' END,
      'Plan : ' || COALESCE(NEW.plan, 'non défini'),
      jsonb_build_object('plan', NEW.plan, 'is_subscribed', NEW.is_subscribed)
    );
  END IF;
  IF OLD.account_type IS DISTINCT FROM NEW.account_type THEN
    INSERT INTO public.crm_events (user_id, event_type, title, description, metadata)
    VALUES (
      NEW.id, 'account_type_change',
      'Type de compte modifié',
      OLD.account_type || ' → ' || NEW.account_type,
      jsonb_build_object('from', OLD.account_type, 'to', NEW.account_type)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_subscription ON public.profiles;
CREATE TRIGGER trg_crm_subscription
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.crm_on_subscription_change();

-- Backfill : créer l'événement signup pour les profils existants (sans doublon)
INSERT INTO public.crm_events (user_id, event_type, title, description, created_at)
SELECT p.id, 'signup', 'Inscription', 'Compte créé', p.created_at
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_events e WHERE e.user_id = p.id AND e.event_type = 'signup'
);

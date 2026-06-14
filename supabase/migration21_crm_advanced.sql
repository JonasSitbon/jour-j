-- migration21_crm_advanced.sql
-- Pipeline, tâches, factures CRM

-- ── 1. Pipeline stage sur profiles ──────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'prospect'
    CHECK (pipeline_stage IN ('prospect','trial','qualified','offer_sent','negotiation','won','churned','lost'));

-- Mettre à jour le stage selon l'état actuel
UPDATE public.profiles SET pipeline_stage =
  CASE
    WHEN is_subscribed = true THEN 'won'
    WHEN trial_ends_at IS NOT NULL AND trial_ends_at > NOW() THEN 'trial'
    WHEN trial_ends_at IS NOT NULL AND trial_ends_at <= NOW() AND is_subscribed = false THEN 'churned'
    ELSE 'prospect'
  END;

-- Trigger : pipeline_stage auto sur changement subscription
CREATE OR REPLACE FUNCTION public.crm_update_pipeline_stage()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.is_subscribed = true AND OLD.is_subscribed = false THEN
    NEW.pipeline_stage := 'won';
  ELSIF NEW.is_subscribed = false AND OLD.is_subscribed = true THEN
    NEW.pipeline_stage := 'churned';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_pipeline ON public.profiles;
CREATE TRIGGER trg_crm_pipeline
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.crm_update_pipeline_stage();

-- ── 2. Tâches CRM ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  task_type    TEXT        NOT NULL DEFAULT 'task'
    CHECK (task_type IN ('call','email','meeting','task','follow_up','demo')),
  due_date     DATE,
  priority     TEXT        NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','urgent')),
  completed    BOOLEAN     NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_user ON public.crm_tasks (user_id, completed, due_date);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due  ON public.crm_tasks (due_date) WHERE completed = false;

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin crm_tasks" ON public.crm_tasks FOR ALL
  USING   (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin'));

-- ── 3. Factures / Comptabilité ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_invoices (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT        UNIQUE,
  amount_cents   INT         NOT NULL CHECK (amount_cents > 0),
  currency       TEXT        NOT NULL DEFAULT 'EUR',
  plan           TEXT,
  billing_period TEXT        CHECK (billing_period IN ('monthly','annual')),
  status         TEXT        NOT NULL DEFAULT 'paid'
    CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  invoice_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  due_date       DATE,
  paid_at        TIMESTAMPTZ,
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Numéro de facture auto : JJ-2025-0001
CREATE OR REPLACE FUNCTION public.crm_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  yr  TEXT := TO_CHAR(NOW(), 'YYYY');
  seq INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INT)), 0) + 1
  INTO seq FROM public.crm_invoices WHERE invoice_number LIKE 'JJ-' || yr || '-%';
  NEW.invoice_number := 'JJ-' || yr || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_number ON public.crm_invoices;
CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON public.crm_invoices
  FOR EACH ROW WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION public.crm_invoice_number();

-- Générer une facture automatiquement quand un abonnement est activé
CREATE OR REPLACE FUNCTION public.crm_on_subscription_invoice()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  amt INT;
  per TEXT;
BEGIN
  IF NEW.is_subscribed = true AND OLD.is_subscribed = false AND NEW.plan IS NOT NULL THEN
    amt := CASE NEW.plan
      WHEN 'couple_monthly'  THEN 300
      WHEN 'couple_annual'   THEN 3000
      WHEN 'planner_monthly' THEN 1200
      WHEN 'planner_annual'  THEN 12000
      ELSE 0
    END;
    per := CASE WHEN NEW.plan LIKE '%annual%' THEN 'annual' ELSE 'monthly' END;
    IF amt > 0 THEN
      INSERT INTO public.crm_invoices (user_id, amount_cents, plan, billing_period, status, paid_at)
      VALUES (NEW.id, amt, NEW.plan, per, 'paid', NOW());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_invoice ON public.profiles;
CREATE TRIGGER trg_crm_invoice
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.crm_on_subscription_invoice();

ALTER TABLE public.crm_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin crm_invoices" ON public.crm_invoices FOR ALL
  USING   (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'super_admin'));

-- ── 4. Index idx_crm_events sur event_type pour filtres rapides ─────────────
CREATE INDEX IF NOT EXISTS idx_crm_events_type ON public.crm_events (user_id, event_type);

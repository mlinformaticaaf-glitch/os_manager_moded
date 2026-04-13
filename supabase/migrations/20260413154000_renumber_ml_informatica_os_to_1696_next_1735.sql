-- Corrective migration: ML Informatica OS numbering
-- Renumber existing service orders starting at 1696
-- and force next OS number to 1735.

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS os_initial_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS os_next_number INTEGER DEFAULT 1;

DO $$
DECLARE
  target_user RECORD;
BEGIN
  FOR target_user IN
    SELECT cs.user_id
    FROM public.company_settings cs
    WHERE lower(replace(coalesce(cs.name, ''), ' ', '')) LIKE 'mlinformatica%'
       OR lower(replace(coalesce(cs.name, ''), ' ', '')) LIKE 'mlinformática%'
  LOOP
    -- Renumber existing orders in chronological order from 1696
    WITH ordered_service_orders AS (
      SELECT
        so.id,
        1695 + ROW_NUMBER() OVER (ORDER BY so.created_at, so.id) AS new_order_number
      FROM public.service_orders so
      WHERE so.user_id = target_user.user_id
    )
    UPDATE public.service_orders so
    SET order_number = ordered_service_orders.new_order_number
    FROM ordered_service_orders
    WHERE so.id = ordered_service_orders.id;

    -- Keep company sequence settings aligned with requested values
    UPDATE public.company_settings cs
    SET
      os_initial_number = 1696,
      os_next_number = 1735,
      onboarding_completed = true
    WHERE cs.user_id = target_user.user_id;
  END LOOP;
END $$;

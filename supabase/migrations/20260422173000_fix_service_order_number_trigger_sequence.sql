-- ============================================================
-- Fix service order numbering after custom OS sequence changes.
--
-- Root cause:
-- service_orders.order_number was created as SERIAL. PostgreSQL fills
-- SERIAL defaults before BEFORE INSERT triggers run, so the trigger saw
-- a non-null number and skipped company_settings.os_next_number.
--
-- Fix:
-- 1. Remove the old SERIAL/default source from order_number.
-- 2. Make get_next_os_number lock company_settings and never return a
--    number lower than the current MAX(order_number) + 1.
-- 3. Keep manual/imported numbers from putting os_next_number behind.
-- ============================================================

ALTER TABLE public.service_orders
ALTER COLUMN order_number DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.get_next_os_number(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings_id uuid;
  v_initial_number integer;
  v_configured_next integer;
  v_actual_next integer;
  v_next_number integer;
BEGIN
  SELECT
    id,
    COALESCE(os_initial_number, 1),
    COALESCE(os_next_number, os_initial_number, 1)
  INTO v_settings_id, v_initial_number, v_configured_next
  FROM public.company_settings
  WHERE user_id = p_user_id
  FOR UPDATE;

  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO v_actual_next
  FROM public.service_orders
  WHERE user_id = p_user_id;

  IF v_settings_id IS NULL THEN
    v_next_number := GREATEST(v_actual_next, 1);

    INSERT INTO public.company_settings (
      user_id,
      os_initial_number,
      os_next_number,
      onboarding_completed
    )
    VALUES (
      p_user_id,
      v_next_number,
      v_next_number + 1,
      true
    )
    ON CONFLICT (user_id) DO UPDATE
    SET os_next_number = GREATEST(public.company_settings.os_next_number, EXCLUDED.os_next_number)
    RETURNING id INTO v_settings_id;

    RETURN v_next_number;
  END IF;

  v_next_number := GREATEST(v_configured_next, v_actual_next, v_initial_number);

  UPDATE public.company_settings
  SET os_next_number = v_next_number + 1
  WHERE id = v_settings_id;

  RETURN v_next_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_service_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number <= 0 THEN
    NEW.order_number := public.get_next_os_number(NEW.user_id);
  ELSE
    UPDATE public.company_settings
    SET os_next_number = GREATEST(COALESCE(os_next_number, 1), NEW.order_number + 1)
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_service_order_number_trigger ON public.service_orders;

CREATE TRIGGER set_service_order_number_trigger
BEFORE INSERT ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_service_order_number();

UPDATE public.company_settings cs
SET os_next_number = GREATEST(
  COALESCE(cs.os_next_number, 1),
  COALESCE(cs.os_initial_number, 1),
  sub.max_num + 1
)
FROM (
  SELECT user_id, COALESCE(MAX(order_number), 0) AS max_num
  FROM public.service_orders
  GROUP BY user_id
) sub
WHERE cs.user_id = sub.user_id;

UPDATE public.company_settings
SET os_next_number = GREATEST(
  COALESCE(os_next_number, 1),
  COALESCE(os_initial_number, 1)
)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.service_orders so
  WHERE so.user_id = company_settings.user_id
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.service_orders
    WHERE order_number IS NOT NULL
    GROUP BY user_id, order_number
    HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_service_orders_user_order_number_unique
    ON public.service_orders(user_id, order_number)
    WHERE order_number IS NOT NULL;
  ELSE
    RAISE NOTICE 'Duplicate service order numbers exist; unique index was not created.';
  END IF;
END $$;

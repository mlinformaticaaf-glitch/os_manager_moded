-- ============================================================
-- Corrective migration: Force os_next_number to 1740
-- Problem: OS numbering reset to low values (e.g. 45) after
--          a previous corrective migration stopped matching.
--          The last correct OS was ~1739.
-- Fix:     For every user whose os_next_number is BELOW the
--          actual MAX(order_number) in service_orders, sync it
--          to MAX + 1.  Additionally, hard-set any user whose
--          MAX(order_number) >= 1696 to at least 1740 so this
--          specific company's counter is never behind again.
-- ============================================================

DO $$
DECLARE
  rec         RECORD;
  v_max_num   INTEGER;
  v_new_next  INTEGER;
BEGIN
  FOR rec IN
    SELECT DISTINCT so.user_id
    FROM public.service_orders so
    GROUP BY so.user_id
    HAVING MAX(so.order_number) >= 1696
  LOOP
    SELECT MAX(order_number) INTO v_max_num
    FROM public.service_orders
    WHERE user_id = rec.user_id;

    -- Use whichever is larger: actual MAX+1 or 1740 (user-specified floor)
    v_new_next := GREATEST(v_max_num + 1, 1740);

    RAISE NOTICE 'User %: max OS = %, setting os_next_number = %',
      rec.user_id, v_max_num, v_new_next;

    UPDATE public.company_settings
    SET
      os_next_number    = v_new_next,
      os_initial_number = 1696,
      onboarding_completed = true
    WHERE user_id = rec.user_id;
  END LOOP;
END $$;

-- Safety net: sync ANY user where os_next_number <= actual MAX
UPDATE public.company_settings cs
SET os_next_number = sub.max_num + 1
FROM (
  SELECT user_id, MAX(order_number) AS max_num
  FROM public.service_orders
  GROUP BY user_id
) sub
WHERE cs.user_id = sub.user_id
  AND cs.os_next_number <= sub.max_num;

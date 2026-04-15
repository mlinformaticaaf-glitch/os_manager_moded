-- ============================================================
-- Corrective migration: Fix OS numbering sequence
-- Problem: Orders were generated with low numbers (e.g. 43, 44)
--          instead of continuing from the expected sequence (1738, 1739+).
-- Cause:   company_settings.os_next_number was not correctly updated
--          by previous migrations (name-matching condition failed).
-- Fix:     For every user that has service_orders with mixed numbering
--          (some >= 1696 AND some < 1696), renumber ALL their orders
--          chronologically from 1696 and realign os_next_number.
-- ============================================================

DO $$
DECLARE
  rec          RECORD;
  v_high_max   INTEGER;
  v_low_count  INTEGER;
BEGIN
  -- Find users with a "split" numbering: existing high numbers (>=1696) AND
  -- newly created low numbers (<1696).  These are the broken accounts.
  FOR rec IN
    SELECT DISTINCT so.user_id
    FROM public.service_orders so
    GROUP BY so.user_id
    HAVING MAX(so.order_number) >= 1696
       AND MIN(so.order_number) < 1696
  LOOP
    RAISE NOTICE 'Fixing OS numbering for user_id: %', rec.user_id;

    -- 1. Renumber ALL service_orders for this user chronologically from 1696
    WITH ordered AS (
      SELECT
        id,
        1695 + ROW_NUMBER() OVER (ORDER BY created_at, id) AS new_num
      FROM public.service_orders
      WHERE user_id = rec.user_id
    )
    UPDATE public.service_orders so
    SET order_number = ordered.new_num
    FROM ordered
    WHERE so.id = ordered.id;

    -- 2. Sync company_settings.os_next_number to MAX(order_number) + 1
    UPDATE public.company_settings cs
    SET
      os_initial_number = 1696,
      os_next_number    = (
        SELECT MAX(so.order_number) + 1
        FROM public.service_orders so
        WHERE so.user_id = rec.user_id
      ),
      onboarding_completed = true
    WHERE cs.user_id = rec.user_id;

    -- Log result
    SELECT MAX(order_number) INTO v_high_max
    FROM public.service_orders
    WHERE user_id = rec.user_id;

    RAISE NOTICE 'Done. Last OS number is now %, next will be %.',
      v_high_max, v_high_max + 1;
  END LOOP;

  -- Safety check: also fix any company_settings where os_next_number is
  -- behind the actual max order_number (prevents duplicate numbers).
  UPDATE public.company_settings cs
  SET os_next_number = sub.max_num + 1
  FROM (
    SELECT user_id, MAX(order_number) AS max_num
    FROM public.service_orders
    GROUP BY user_id
  ) sub
  WHERE cs.user_id = sub.user_id
    AND cs.os_next_number <= sub.max_num;

END $$;

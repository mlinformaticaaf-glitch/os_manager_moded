-- ============================================================
-- Renumber service orders that were already created with the old
-- SERIAL sequence after the custom numbering migration.
--
-- Example:
-- If a user already has OS 1696..1740 and a bad OS 0046, this migration
-- moves OS 0046 to 1741 and realigns company_settings.os_next_number.
-- ============================================================

DO $$
DECLARE
  rec RECORD;
  v_new_max integer;
BEGIN
  FOR rec IN
    SELECT
      user_id,
      MAX(order_number) FILTER (WHERE order_number >= 1696) AS high_max,
      COUNT(*) FILTER (WHERE order_number > 0 AND order_number < 1696) AS low_count
    FROM public.service_orders
    GROUP BY user_id
    HAVING MAX(order_number) FILTER (WHERE order_number >= 1696) IS NOT NULL
       AND COUNT(*) FILTER (WHERE order_number > 0 AND order_number < 1696) > 0
  LOOP
    RAISE NOTICE 'Renumbering % low service order(s) for user %. Current high max: %',
      rec.low_count, rec.user_id, rec.high_max;

    WITH low_orders AS (
      SELECT
        id,
        rec.high_max + ROW_NUMBER() OVER (ORDER BY created_at, id) AS new_order_number
      FROM public.service_orders
      WHERE user_id = rec.user_id
        AND order_number > 0
        AND order_number < 1696
    )
    UPDATE public.service_orders so
    SET order_number = low_orders.new_order_number
    FROM low_orders
    WHERE so.id = low_orders.id;

    SELECT MAX(order_number)
    INTO v_new_max
    FROM public.service_orders
    WHERE user_id = rec.user_id;

    UPDATE public.company_settings
    SET
      os_initial_number = 1696,
      os_next_number = v_new_max + 1,
      onboarding_completed = true
    WHERE user_id = rec.user_id;

    RAISE NOTICE 'Done for user %. New max OS: %. Next OS: %',
      rec.user_id, v_new_max, v_new_max + 1;
  END LOOP;
END $$;

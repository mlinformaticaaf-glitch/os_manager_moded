-- Ajuste específico: ML Informática
-- Objetivo: aplicar numeração iniciando em 1696 às OS existentes

DO $$
DECLARE
  target_user RECORD;
BEGIN
  FOR target_user IN
    SELECT cs.user_id
    FROM public.company_settings cs
    WHERE LOWER(cs.name) LIKE 'ml informática%'
       OR LOWER(cs.name) LIKE 'ml informatica%'
  LOOP
    -- Renumera OS existentes em ordem cronológica para iniciar em 1696
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

    -- Atualiza configuração da empresa para manter a sequência correta
    UPDATE public.company_settings cs
    SET
      os_initial_number = 1696,
      os_next_number = COALESCE((
        SELECT MAX(so.order_number) + 1
        FROM public.service_orders so
        WHERE so.user_id = target_user.user_id
      ), 1696),
      onboarding_completed = true
    WHERE cs.user_id = target_user.user_id;
  END LOOP;
END $$;

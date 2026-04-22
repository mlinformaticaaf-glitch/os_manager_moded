-- Harden RLS policies so legacy user_id rows and newer company_id rows are both isolated.

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.can_access_user_company(row_user_id UUID, row_company_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      row_user_id = auth.uid()
      OR (
        row_company_id IS NOT NULL
        AND row_company_id = public.get_my_company_id()
      )
    )
$$;

ALTER TABLE IF EXISTS public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.status_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.manual_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Manage clients" ON public.clients;
DROP POLICY IF EXISTS "Manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Manage products" ON public.products;
DROP POLICY IF EXISTS "Manage services" ON public.services;
DROP POLICY IF EXISTS "Manage equipment" ON public.equipment;
DROP POLICY IF EXISTS "Manage orders" ON public.service_orders;
DROP POLICY IF EXISTS "Manage order items" ON public.service_order_items;
DROP POLICY IF EXISTS "Manage purchases" ON public.purchases;
DROP POLICY IF EXISTS "Manage purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Manage sales" ON public.sales;
DROP POLICY IF EXISTS "Manage sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Manage transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Manage status settings" ON public.status_settings;
DROP POLICY IF EXISTS "Manage logs" ON public.service_order_logs;
DROP POLICY IF EXISTS "Qualquer usuário autenticado pode ler manuais" ON public.manuals;
DROP POLICY IF EXISTS "Qualquer usuário autenticado pode ler passos" ON public.manual_steps;
DROP POLICY IF EXISTS "Apenas administradores podem inserir/editar manuais" ON public.manuals;
DROP POLICY IF EXISTS "Apenas administradores podem inserir/editar passos" ON public.manual_steps;

CREATE POLICY "Hardened manage company settings"
ON public.company_settings
FOR ALL
USING (public.can_access_user_company(user_id, NULL))
WITH CHECK (public.can_access_user_company(user_id, NULL));

CREATE POLICY "Hardened manage clients"
ON public.clients
FOR ALL
USING (public.can_access_user_company(user_id, company_id))
WITH CHECK (public.can_access_user_company(user_id, company_id));

CREATE POLICY "Hardened manage suppliers"
ON public.suppliers
FOR ALL
USING (public.can_access_user_company(user_id, company_id))
WITH CHECK (public.can_access_user_company(user_id, company_id));

CREATE POLICY "Hardened manage products"
ON public.products
FOR ALL
USING (public.can_access_user_company(user_id, company_id))
WITH CHECK (public.can_access_user_company(user_id, company_id));

CREATE POLICY "Hardened manage services"
ON public.services
FOR ALL
USING (public.can_access_user_company(user_id, company_id))
WITH CHECK (public.can_access_user_company(user_id, company_id));

CREATE POLICY "Hardened manage equipment"
ON public.equipment
FOR ALL
USING (public.can_access_user_company(user_id, NULL))
WITH CHECK (public.can_access_user_company(user_id, NULL));

CREATE POLICY "Hardened manage service orders"
ON public.service_orders
FOR ALL
USING (public.can_access_user_company(user_id, company_id))
WITH CHECK (public.can_access_user_company(user_id, company_id));

CREATE POLICY "Hardened manage service order items"
ON public.service_order_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.service_orders so
    WHERE so.id = service_order_items.service_order_id
      AND public.can_access_user_company(so.user_id, so.company_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_orders so
    WHERE so.id = service_order_items.service_order_id
      AND public.can_access_user_company(so.user_id, so.company_id)
  )
);

CREATE POLICY "Hardened manage purchases"
ON public.purchases
FOR ALL
USING (public.can_access_user_company(user_id, company_id))
WITH CHECK (public.can_access_user_company(user_id, company_id));

CREATE POLICY "Hardened manage purchase items"
ON public.purchase_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.id = purchase_items.purchase_id
      AND public.can_access_user_company(p.user_id, p.company_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.id = purchase_items.purchase_id
      AND public.can_access_user_company(p.user_id, p.company_id)
  )
);

CREATE POLICY "Hardened manage sales"
ON public.sales
FOR ALL
USING (public.can_access_user_company(user_id, company_id))
WITH CHECK (public.can_access_user_company(user_id, company_id));

CREATE POLICY "Hardened manage sale items"
ON public.sale_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_items.sale_id
      AND public.can_access_user_company(s.user_id, s.company_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales s
    WHERE s.id = sale_items.sale_id
      AND public.can_access_user_company(s.user_id, s.company_id)
  )
);

CREATE POLICY "Hardened manage financial transactions"
ON public.financial_transactions
FOR ALL
USING (public.can_access_user_company(user_id, company_id))
WITH CHECK (public.can_access_user_company(user_id, company_id));

CREATE POLICY "Hardened manage status settings"
ON public.status_settings
FOR ALL
USING (public.can_access_user_company(user_id, NULL))
WITH CHECK (public.can_access_user_company(user_id, NULL));

CREATE POLICY "Hardened manage service order logs"
ON public.service_order_logs
FOR ALL
USING (public.can_access_user_company(user_id, NULL))
WITH CHECK (public.can_access_user_company(user_id, NULL));

CREATE POLICY "Hardened manage manuals"
ON public.manuals
FOR ALL
USING (created_by = auth.uid() OR company_id = public.get_my_company_id())
WITH CHECK (created_by = auth.uid() OR company_id = public.get_my_company_id());

CREATE POLICY "Hardened manage manual steps"
ON public.manual_steps
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.manuals m
    WHERE m.id = manual_steps.manual_id
      AND (m.created_by = auth.uid() OR m.company_id = public.get_my_company_id())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.manuals m
    WHERE m.id = manual_steps.manual_id
      AND (m.created_by = auth.uid() OR m.company_id = public.get_my_company_id())
  )
);


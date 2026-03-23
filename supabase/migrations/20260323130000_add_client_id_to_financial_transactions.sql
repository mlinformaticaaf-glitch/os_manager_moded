-- Migration to add client_id to financial_transactions
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Enable RLS for the new column (it should be covered by existing policies if they check company_id, but good to be explicit if needed)
-- Given the existing policy: CREATE POLICY "Company select financial_transactions" ON public.financial_transactions FOR SELECT USING (company_id = public.get_my_company_id());
-- It should already be safe.

-- Update the view or triggers if they rely on specific columns (checked handle_service_order_finance, it doesn't use * for insert)

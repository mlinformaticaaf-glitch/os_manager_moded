
-- 1. Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT,
    logo_url TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    subscription_status TEXT DEFAULT 'trialing', -- 'active', 'past_due', 'canceled', 'trialing'
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create profiles table (to link users to companies)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin', -- 'admin', 'editor', 'viewer'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    plan_type TEXT DEFAULT 'free',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Add company_id to core tables
DO $$
BEGIN
    -- Clients
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'company_id') THEN
        ALTER TABLE public.clients ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- Products
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'company_id') THEN
        ALTER TABLE public.products ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- Services
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'company_id') THEN
        ALTER TABLE public.services ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- Service Orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'company_id') THEN
        ALTER TABLE public.service_orders ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- Financial Transactions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_transactions' AND column_name = 'company_id') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- Suppliers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'company_id') THEN
        ALTER TABLE public.suppliers ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- Purchases
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'company_id') THEN
        ALTER TABLE public.purchases ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- Sales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'company_id') THEN
        ALTER TABLE public.sales ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- Manuals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manuals' AND column_name = 'company_id') THEN
        ALTER TABLE public.manuals ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
END $$;

-- 6. Trigger for profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger to sync updated_at
CREATE TRIGGER tr_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Policies for profiles (users can read only their own company data)
-- This is where the magic happens for multi-tenancy.
-- We must define that auth.uid() can only access rows where company_id = (select company_id from profiles where id = auth.uid())

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their company" ON public.companies FOR SELECT USING (id IN (SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE USING (id IN (SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid() AND role = 'admin'));

-- 9. Helper function to get current user company_id
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10. Update RLS policies for all multi-tenant tables
-- Clientes
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

CREATE POLICY "Company select clients" ON public.clients FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "Company insert clients" ON public.clients FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "Company update clients" ON public.clients FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "Company delete clients" ON public.clients FOR DELETE USING (company_id = public.get_my_company_id());

-- Produtos
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

CREATE POLICY "Company select products" ON public.products FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "Company insert products" ON public.products FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "Company update products" ON public.products FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "Company delete products" ON public.products FOR DELETE USING (company_id = public.get_my_company_id());

-- Ordens de Serviço
DROP POLICY IF EXISTS "Users can view their own service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Users can create their own service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Users can update their own service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Users can delete their own service orders" ON public.service_orders;

CREATE POLICY "Company select service_orders" ON public.service_orders FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "Company insert service_orders" ON public.service_orders FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "Company update service_orders" ON public.service_orders FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "Company delete service_orders" ON public.service_orders FOR DELETE USING (company_id = public.get_my_company_id());

-- Financeiro
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.financial_transactions;

CREATE POLICY "Company select financial_transactions" ON public.financial_transactions FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "Company insert financial_transactions" ON public.financial_transactions FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "Company update financial_transactions" ON public.financial_transactions FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "Company delete financial_transactions" ON public.financial_transactions FOR DELETE USING (company_id = public.get_my_company_id());


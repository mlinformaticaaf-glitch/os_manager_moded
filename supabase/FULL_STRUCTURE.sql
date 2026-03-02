-- Consolidação de Estrutura do Banco de Dados OS Manager
-- Este script recria todas as tabelas, funções, triggers e políticas RLS.

-- 1. Funções de Utilidade
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Tabela de Configurações da Empresa (Company Settings)
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo_url TEXT,
  warranty_terms TEXT,
  footer_message TEXT,
  pix_key TEXT,
  pix_key_type TEXT,
  pix_beneficiary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage company settings" ON public.company_settings FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Tabela de Clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code INTEGER,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage clients" ON public.clients FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_name ON public.clients(name);

-- 4. Tabela de Fornecedores
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code INTEGER,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage suppliers" ON public.suppliers FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Tabela de Produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  category TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  profit_margin NUMERIC GENERATED ALWAYS AS (CASE WHEN cost_price > 0 THEN ((sale_price - cost_price) / cost_price) * 100 ELSE 0 END) STORED,
  stock_quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'un',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage products" ON public.products FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Tabela de Serviços
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT,
  sequential_code INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  estimated_time TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage services" ON public.services FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Tabela de Tipos de Equipamento
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code INTEGER,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage equipment" ON public.equipment FOR ALL USING (auth.uid() = user_id);

-- 8. Tabela de Ordens de Serviço
CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  order_number SERIAL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  equipment TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  accessories TEXT,
  reported_issue TEXT NOT NULL,
  diagnosis TEXT,
  solution TEXT,
  internal_notes TEXT,
  device_password TEXT,
  warranty_until DATE,
  estimated_completion DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  total_services DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_products DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  stock_deducted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage orders" ON public.service_orders FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Tabela de Itens da Ordem de Serviço
CREATE TABLE public.service_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage order items" ON public.service_order_items FOR ALL USING (EXISTS (SELECT 1 FROM public.service_orders WHERE id = service_order_items.service_order_id AND user_id = auth.uid()));

-- 10. Tabela de Compras
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  purchase_number SERIAL,
  invoice_number TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  shipping NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage purchases" ON public.purchases FOR ALL USING (auth.uid() = user_id);

-- 11. Tabela de Itens de Compra
CREATE TABLE public.purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage purchase items" ON public.purchase_items FOR ALL USING (EXISTS (SELECT 1 FROM public.purchases WHERE id = purchase_items.purchase_id AND user_id = auth.uid()));

-- 12. Tabela de Transações Financeiras
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  reference_id UUID,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage transactions" ON public.financial_transactions FOR ALL USING (auth.uid() = user_id);

-- 13. Tabela de Configurações de Status (Kanban)
CREATE TABLE public.status_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status_key TEXT NOT NULL,
  custom_label TEXT,
  custom_short_label TEXT,
  color TEXT,
  bg_color TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.status_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage status settings" ON public.status_settings FOR ALL USING (auth.uid() = user_id);

-- 14. Tabela de Logs de OS (Audit)
CREATE TABLE public.service_order_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.service_order_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage logs" ON public.service_order_logs FOR ALL USING (user_id = auth.uid());

-- 15. Tabelas de Boletos
CREATE TABLE IF NOT EXISTS public.boletos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  issuer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  barcode TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage boletos" ON public.boletos FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.boleto_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boleto_id UUID NOT NULL REFERENCES public.boletos(id) ON DELETE CASCADE,
  paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_paid NUMERIC NOT NULL,
  receipt_url TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.boleto_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage boleto payments" ON public.boleto_payments FOR ALL USING (EXISTS (SELECT 1 FROM public.boletos WHERE id = boleto_payments.boleto_id AND user_id = auth.uid()));

-- 16. Funções de Sequenciamento
CREATE OR REPLACE FUNCTION public.get_next_code(p_table TEXT, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_code INTEGER;
BEGIN
  EXECUTE format('SELECT COALESCE(MAX(code), 0) + 1 FROM public.%I WHERE user_id = $1', p_table)
  INTO next_code
  USING p_user_id;
  RETURN next_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for sequence codes
CREATE OR REPLACE FUNCTION public.trigger_set_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := public.get_next_code(TG_TABLE_NAME, NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_client_code BEFORE INSERT ON public.clients FOR EACH ROW EXECUTE FUNCTION public.trigger_set_code();
CREATE TRIGGER set_supplier_code BEFORE INSERT ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.trigger_set_code();
CREATE TRIGGER set_product_code BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.trigger_set_code();
CREATE TRIGGER set_equipment_code BEFORE INSERT ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.trigger_set_code();

-- 17. Triggers de Business Logic

-- Função para Log de Status
CREATE OR REPLACE FUNCTION public.log_service_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.service_order_logs (service_order_id, user_id, old_status, new_status)
        VALUES (NEW.id, NEW.user_id, CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_service_order_status AFTER INSERT OR UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.log_service_order_status_change();

-- Função para Estoque
CREATE OR REPLACE FUNCTION public.handle_service_order_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') AND NOT NEW.stock_deducted) THEN
        UPDATE public.products p
        SET stock_quantity = p.stock_quantity - item.quantity
        FROM public.service_order_items item
        WHERE item.service_order_id = NEW.id 
          AND item.type = 'product' 
          AND item.product_id = p.id;
        NEW.stock_deducted := true;
    ELSIF (NEW.status = 'cancelled' AND OLD.status = 'delivered' AND NEW.stock_deducted) THEN
        UPDATE public.products p
        SET stock_quantity = p.stock_quantity + item.quantity
        FROM public.service_order_items item
        WHERE item.service_order_id = NEW.id 
          AND item.type = 'product' 
          AND item.product_id = p.id;
        NEW.stock_deducted := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_service_order_stock BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.handle_service_order_stock();

-- Função para Financeiro
CREATE OR REPLACE FUNCTION public.handle_service_order_finance()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status IN ('delivered', 'completed')) AND (OLD.status NOT IN ('delivered', 'completed')) THEN
        INSERT INTO public.financial_transactions (user_id, type, category, reference_id, description, amount, status, payment_method, due_date, paid_date)
        VALUES (
            NEW.user_id, 
            'income', 
            'service_order', 
            NEW.id, 
            'OS ' || NEW.order_number, 
            NEW.total, 
            CASE WHEN NEW.payment_status = 'paid' THEN 'paid' ELSE 'pending' END,
            NEW.payment_method,
            NEW.delivered_at::date,
            CASE WHEN NEW.payment_status = 'paid' THEN COALESCE(NEW.delivered_at, now()) ELSE NULL END
        )
        ON CONFLICT (reference_id) DO UPDATE 
        SET amount = EXCLUDED.amount, 
            status = EXCLUDED.status,
            payment_method = EXCLUDED.payment_method;
    ELSIF (NEW.status = 'cancelled') AND (OLD.status IN ('delivered', 'completed')) THEN
        UPDATE public.financial_transactions SET status = 'cancelled' WHERE reference_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_transactions_reference ON public.financial_transactions(reference_id) WHERE reference_id IS NOT NULL;
CREATE TRIGGER trg_handle_service_order_finance AFTER UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.handle_service_order_finance();

-- ==============================================================================
-- PASSOS PÓS-MIGRAÇÃO (Executar APÓS transferir os dados)
-- ==============================================================================

-- 18. Sincronização de Sequências (Ajusta o próximo número de OS e Compra)
-- SELECT setval('public.service_orders_order_number_seq', (SELECT MAX(order_number) FROM public.service_orders));
-- SELECT setval('public.purchases_purchase_number_seq', (SELECT MAX(purchase_number) FROM public.purchases));

-- 19. Buckets de Storage (Criar manualmente no Dashboard do Supabase)
-- Crie os seguintes buckets na aba "Storage":
-- 'logos' (Público)
-- 'boletos' (Privado)
-- 'payment-receipts' (Privado)

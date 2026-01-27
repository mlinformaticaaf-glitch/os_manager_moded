-- Add sequential code columns to tables that don't have them
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS code integer;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS code integer;

-- Add sequential code columns to products and services (they have text fields, we'll add integer ones)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS code integer;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS sequential_code integer;

-- Function to get next client code
CREATE OR REPLACE FUNCTION public.get_next_client_code(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_code integer;
BEGIN
  SELECT COALESCE(MAX(code), 0) + 1 INTO next_code
  FROM clients
  WHERE user_id = p_user_id;
  
  RETURN next_code;
END;
$$;

-- Function to get next supplier code
CREATE OR REPLACE FUNCTION public.get_next_supplier_code(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_code integer;
BEGIN
  SELECT COALESCE(MAX(code), 0) + 1 INTO next_code
  FROM suppliers
  WHERE user_id = p_user_id;
  
  RETURN next_code;
END;
$$;

-- Function to get next product code
CREATE OR REPLACE FUNCTION public.get_next_product_code(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_code integer;
BEGIN
  SELECT COALESCE(MAX(code), 0) + 1 INTO next_code
  FROM products
  WHERE user_id = p_user_id;
  
  RETURN next_code;
END;
$$;

-- Function to get next service code
CREATE OR REPLACE FUNCTION public.get_next_service_code(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_code integer;
BEGIN
  SELECT COALESCE(MAX(sequential_code), 0) + 1 INTO next_code
  FROM services
  WHERE user_id = p_user_id;
  
  RETURN next_code;
END;
$$;

-- Trigger function for clients
CREATE OR REPLACE FUNCTION public.set_client_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := public.get_next_client_code(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for suppliers
CREATE OR REPLACE FUNCTION public.set_supplier_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := public.get_next_supplier_code(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for products
CREATE OR REPLACE FUNCTION public.set_product_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := public.get_next_product_code(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for services
CREATE OR REPLACE FUNCTION public.set_service_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.sequential_code IS NULL THEN
    NEW.sequential_code := public.get_next_service_code(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS set_client_code_trigger ON public.clients;
CREATE TRIGGER set_client_code_trigger
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_client_code();

DROP TRIGGER IF EXISTS set_supplier_code_trigger ON public.suppliers;
CREATE TRIGGER set_supplier_code_trigger
  BEFORE INSERT ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_supplier_code();

DROP TRIGGER IF EXISTS set_product_code_trigger ON public.products;
CREATE TRIGGER set_product_code_trigger
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_code();

DROP TRIGGER IF EXISTS set_service_code_trigger ON public.services;
CREATE TRIGGER set_service_code_trigger
  BEFORE INSERT ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.set_service_code();

-- Update existing records with sequential codes
WITH numbered_clients AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM clients
  WHERE code IS NULL
)
UPDATE clients c
SET code = nc.rn
FROM numbered_clients nc
WHERE c.id = nc.id;

WITH numbered_suppliers AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM suppliers
  WHERE code IS NULL
)
UPDATE suppliers s
SET code = ns.rn
FROM numbered_suppliers ns
WHERE s.id = ns.id;

WITH numbered_products AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM products
  WHERE code IS NULL
)
UPDATE products p
SET code = np.rn
FROM numbered_products np
WHERE p.id = np.id;

WITH numbered_services AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM services
  WHERE sequential_code IS NULL
)
UPDATE services s
SET sequential_code = ns.rn
FROM numbered_services ns
WHERE s.id = ns.id;
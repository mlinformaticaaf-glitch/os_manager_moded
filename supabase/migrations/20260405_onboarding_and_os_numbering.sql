-- Migration: Onboarding and Service Order Numbering per Company
-- Description: Add onboarding tracking and configurable OS initial numbering

-- 1. Add new columns to company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS os_initial_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS os_next_number INTEGER DEFAULT 1;

-- 2. Function to calculate next OS number based on company settings
CREATE OR REPLACE FUNCTION public.get_next_os_number(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_number integer;
  v_settings_id uuid;
BEGIN
  -- Get current next_number from company_settings
  SELECT id, os_next_number INTO v_settings_id, v_next_number
  FROM company_settings
  WHERE user_id = p_user_id;
  
  IF v_settings_id IS NULL THEN
    -- If no settings, default to 1
    RETURN 1;
  END IF;
  
  -- Increment and update the next_number
  UPDATE company_settings
  SET os_next_number = os_next_number + 1
  WHERE id = v_settings_id;
  
  RETURN v_next_number;
END;
$$;

-- 3. Trigger function to auto-set order_number on service_orders insert
CREATE OR REPLACE FUNCTION public.set_service_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set if not already provided
  IF NEW.order_number IS NULL OR NEW.order_number = 0 THEN
    NEW.order_number := public.get_next_os_number(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create or replace the trigger for service orders
DROP TRIGGER IF EXISTS set_service_order_number_trigger ON public.service_orders;
CREATE TRIGGER set_service_order_number_trigger
BEFORE INSERT ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_service_order_number();

-- 5. Backfill existing companies: set initial and next numbers
-- For each user, calculate the max order_number already used
DO $$
DECLARE
  rec RECORD;
  v_max_order_number integer;
BEGIN
  FOR rec IN 
    SELECT DISTINCT cs.id, cs.user_id, cs.os_initial_number
    FROM company_settings cs
    WHERE cs.os_initial_number IS NULL OR cs.os_initial_number = 1
  LOOP
    -- Get the maximum order_number for this user
    SELECT COALESCE(MAX(order_number), 0) INTO v_max_order_number
    FROM service_orders
    WHERE user_id = rec.user_id;
    
    -- If there are existing orders, set initial to 1 and next to max+1
    -- If no orders, keep initial at 1 and next at 1
    UPDATE company_settings
    SET 
      os_initial_number = CASE 
        WHEN v_max_order_number > 0 THEN 1 
        ELSE 1 
      END,
      os_next_number = v_max_order_number + 1
    WHERE id = rec.id;
  END LOOP;
END $$;

-- 6. Ensure all existing service_orders have numbers
-- (they should from SERIAL, but this ensures consistency)
UPDATE company_settings
SET os_next_number = (
  SELECT COALESCE(MAX(order_number), 0) + 1
  FROM service_orders
  WHERE service_orders.user_id = company_settings.user_id
)
WHERE os_next_number <= (
  SELECT COALESCE(MAX(order_number), 0)
  FROM service_orders
  WHERE service_orders.user_id = company_settings.user_id
);

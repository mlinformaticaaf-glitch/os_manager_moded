-- Add equipment_id column to service_orders table
ALTER TABLE public.service_orders
ADD COLUMN IF NOT EXISTS equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_orders_equipment_id ON public.service_orders(equipment_id);
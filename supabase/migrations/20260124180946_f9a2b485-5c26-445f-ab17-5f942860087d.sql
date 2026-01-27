-- Add column to track if stock was already deducted for this OS
ALTER TABLE public.service_orders 
ADD COLUMN stock_deducted BOOLEAN NOT NULL DEFAULT false;
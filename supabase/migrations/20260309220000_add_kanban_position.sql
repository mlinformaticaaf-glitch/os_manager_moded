-- Add kanban_position to service_orders table with epoch as default to maintain creation order
ALTER TABLE public.service_orders ADD COLUMN kanban_position DOUBLE PRECISION DEFAULT EXTRACT(EPOCH FROM now());

-- Update existing orders to have a position based on their creation date
UPDATE public.service_orders SET kanban_position = EXTRACT(EPOCH FROM created_at);

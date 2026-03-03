-- Migration: Fix financial transaction descriptions for service_order category
-- Reformats old descriptions like "OS 1" or "OS 12" to the standard format "OS 0001/2026"

UPDATE public.financial_transactions ft
SET description = 
  'OS ' ||
  LPAD(so.order_number::text, 4, '0') ||
  '/' ||
  EXTRACT(YEAR FROM so.created_at)::text
FROM public.service_orders so
WHERE ft.reference_id = so.id
  AND ft.category = 'service_order'
  AND ft.description !~ '^OS \d{4}/\d{4}$';  -- Only update if NOT already in correct format

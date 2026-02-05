-- Drop boleto_payments table first (has FK reference to boletos)
DROP TABLE IF EXISTS public.boleto_payments;

-- Drop boletos table
DROP TABLE IF EXISTS public.boletos;

-- Drop storage bucket for boletos (if it exists, policy will be removed with table)
DELETE FROM storage.buckets WHERE id = 'boletos';
DELETE FROM storage.buckets WHERE id = 'payment-receipts';
-- Fix existing sales category mismatch
UPDATE public.financial_transactions
SET category = 'sales'
WHERE category = 'sale';

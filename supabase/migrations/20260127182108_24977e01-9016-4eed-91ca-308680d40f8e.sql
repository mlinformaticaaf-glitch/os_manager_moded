-- Remove SKU column from products table
ALTER TABLE public.products DROP COLUMN IF EXISTS sku;

-- Update existing products to have sequential codes if they don't have one
UPDATE public.products 
SET code = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM public.products
  WHERE code IS NULL
) as subquery
WHERE public.products.id = subquery.id;
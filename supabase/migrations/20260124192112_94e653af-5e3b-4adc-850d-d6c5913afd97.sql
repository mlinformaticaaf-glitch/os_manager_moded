-- Add Pix key fields to company_settings
ALTER TABLE public.company_settings
ADD COLUMN pix_key TEXT,
ADD COLUMN pix_key_type TEXT,
ADD COLUMN pix_beneficiary TEXT;
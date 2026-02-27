
ALTER TABLE public.status_settings 
ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT 'text-gray-700',
ADD COLUMN IF NOT EXISTS bg_color text NOT NULL DEFAULT 'bg-gray-100';

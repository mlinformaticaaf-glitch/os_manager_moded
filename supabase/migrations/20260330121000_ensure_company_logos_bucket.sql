-- Ensure company logos bucket exists in every environment
INSERT INTO storage.buckets (id, name, public)
SELECT 'company-logos', 'company-logos', true
WHERE NOT EXISTS (
  SELECT 1
  FROM storage.buckets
  WHERE id = 'company-logos'
);

-- Recreate policies to keep behavior consistent even if environments drifted
DROP POLICY IF EXISTS "Users can view company logos" ON storage.objects;
CREATE POLICY "Users can view company logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Users can upload their own logo" ON storage.objects;
CREATE POLICY "Users can upload their own logo"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own logo" ON storage.objects;
CREATE POLICY "Users can update their own logo"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own logo" ON storage.objects;
CREATE POLICY "Users can delete their own logo"
ON storage.objects
FOR DELETE
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

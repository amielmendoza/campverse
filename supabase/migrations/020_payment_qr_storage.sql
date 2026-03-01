-- Create payment-qr storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr', 'payment-qr', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read QR images (public bucket)
CREATE POLICY "payment_qr_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-qr');

-- Authenticated users can upload QR images
CREATE POLICY "payment_qr_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-qr'
    AND (SELECT auth.uid()) IS NOT NULL
  );

-- Uploaders can update their own files
CREATE POLICY "payment_qr_update_owner" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'payment-qr'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND (SELECT auth.uid()) IS NOT NULL
  );

-- Uploaders can delete their own files
CREATE POLICY "payment_qr_delete_owner" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-qr'
    AND (SELECT auth.uid()) IS NOT NULL
  );

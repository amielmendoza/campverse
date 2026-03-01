-- Create storage bucket for booking receipt uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-receipts', 'booking-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view receipts (public bucket)
CREATE POLICY "Public read access for booking receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'booking-receipts');

-- Authenticated users can upload receipts
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'booking-receipts');

-- Users can update their own receipt uploads
CREATE POLICY "Users can update own receipts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'booking-receipts' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.bookings WHERE user_id = auth.uid()
  ));

-- Users can delete their own receipt uploads
CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'booking-receipts' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.bookings WHERE user_id = auth.uid()
  ));

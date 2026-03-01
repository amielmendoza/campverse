-- Add receipt_url column to bookings for payment proof uploads
ALTER TABLE public.bookings
  ADD COLUMN receipt_url TEXT DEFAULT NULL;

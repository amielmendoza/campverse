-- Add booking-related fields to locations
ALTER TABLE public.locations
  ADD COLUMN price_per_night NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN payment_qr_url TEXT DEFAULT NULL;

ALTER TABLE public.locations
  ADD CONSTRAINT locations_price_per_night_positive
    CHECK (price_per_night IS NULL OR price_per_night > 0);

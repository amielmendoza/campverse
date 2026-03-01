-- Store what rates the camper selected when booking
-- Each selection: {label: string, price: number, per: 'night'|'stay', quantity: number}
ALTER TABLE public.bookings
  ADD COLUMN rate_selections JSONB DEFAULT NULL;

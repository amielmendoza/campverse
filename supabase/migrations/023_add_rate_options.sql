-- Add configurable rate options to locations (replaces single price_per_night)
-- Each rate option: {label: string, price: number, per: 'night'|'stay'}
ALTER TABLE public.locations
  ADD COLUMN rate_options JSONB DEFAULT NULL;

COMMENT ON COLUMN public.locations.rate_options IS
  'Array of {label, price, per} objects defining configurable pricing';

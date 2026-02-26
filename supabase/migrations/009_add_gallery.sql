-- Add gallery column for multiple camp photos per location
ALTER TABLE public.locations ADD COLUMN gallery jsonb DEFAULT '[]'::jsonb;

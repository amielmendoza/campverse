-- Step 1: Add a temporary jsonb column
ALTER TABLE public.locations ADD COLUMN amenities_new jsonb DEFAULT '[]'::jsonb;

-- Step 2: Populate it from the old text[] column
UPDATE public.locations
SET amenities_new = COALESCE(
  (SELECT jsonb_agg(jsonb_build_object('name', elem, 'image_url', ''))
   FROM unnest(amenities) AS elem),
  '[]'::jsonb
);

-- Step 3: Drop the old column and rename the new one
ALTER TABLE public.locations DROP COLUMN amenities;
ALTER TABLE public.locations RENAME COLUMN amenities_new TO amenities;

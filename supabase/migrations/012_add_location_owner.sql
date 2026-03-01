-- Add owner_id to locations (single owner per location)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update the UPDATE policy to allow both admins and owners
DROP POLICY IF EXISTS "locations_update_admin" ON public.locations;
CREATE POLICY "locations_update_admin_or_owner" ON public.locations
  FOR UPDATE USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    )
  );

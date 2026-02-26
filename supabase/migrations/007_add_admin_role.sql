-- Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;

-- Allow admins to INSERT locations
CREATE POLICY "locations_insert_admin" ON public.locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    )
  );

-- Allow admins to UPDATE locations
CREATE POLICY "locations_update_admin" ON public.locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    )
  );

-- Allow admins to DELETE locations
CREATE POLICY "locations_delete_admin" ON public.locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    )
  );

-- Allow admins to see ALL locations (including inactive ones)
-- Drop the old select policy first, then create a new one
DROP POLICY "locations_select_active" ON public.locations;

CREATE POLICY "locations_select" ON public.locations
  FOR SELECT USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    )
  );

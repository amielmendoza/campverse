-- Add last_read_at to track when a member last viewed chat
ALTER TABLE public.location_memberships
  ADD COLUMN last_read_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- Allow members to update their own last_read_at
CREATE POLICY "memberships_update_own_read" ON public.location_memberships
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

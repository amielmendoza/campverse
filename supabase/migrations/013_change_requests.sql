-- Change requests table for owner edit approvals
CREATE TABLE public.location_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.location_change_requests ENABLE ROW LEVEL SECURITY;

-- Owners can insert requests for their own locations
CREATE POLICY "change_requests_insert_owner" ON public.location_change_requests
  FOR INSERT WITH CHECK (
    submitted_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.locations
      WHERE id = location_id AND owner_id = (SELECT auth.uid())
    )
  );

-- Owners can read their own requests, admins can read all
CREATE POLICY "change_requests_select" ON public.location_change_requests
  FOR SELECT USING (
    submitted_by = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

-- Admins can update (approve/reject)
CREATE POLICY "change_requests_update_admin" ON public.location_change_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

-- Revert location UPDATE policy to admin-only (owners go through change requests now)
DROP POLICY IF EXISTS "locations_update_admin_or_owner" ON public.locations;
CREATE POLICY "locations_update_admin" ON public.locations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

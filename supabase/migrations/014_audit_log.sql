-- Location audit log: tracks all location changes
CREATE TABLE public.location_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  action TEXT NOT NULL,  -- 'created' | 'updated' | 'deleted' | 'change_approved' | 'change_rejected'
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  changes JSONB,
  change_request_id UUID REFERENCES public.location_change_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.location_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit entries
CREATE POLICY "audit_log_select_admin" ON public.location_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

-- Authenticated users can insert (hooks write audit entries)
CREATE POLICY "audit_log_insert_authenticated" ON public.location_audit_log
  FOR INSERT WITH CHECK (
    actor_id = (SELECT auth.uid())
  );

-- Index for efficient queries
CREATE INDEX idx_audit_log_location_created ON public.location_audit_log (location_id, created_at DESC);
CREATE INDEX idx_audit_log_created ON public.location_audit_log (created_at DESC);

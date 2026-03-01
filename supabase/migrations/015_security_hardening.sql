-- ============================================================
-- Security hardening: fix missing RLS policies and constraints
-- ============================================================

-- 1. Deny DELETE on location_change_requests (no one should delete requests)
CREATE POLICY "change_requests_delete_deny" ON public.location_change_requests
  FOR DELETE USING (false);

-- 2. Deny UPDATE on location_audit_log (audit trail is immutable)
CREATE POLICY "audit_log_update_deny" ON public.location_audit_log
  FOR UPDATE USING (false);

-- 3. Deny DELETE on location_audit_log (audit trail is immutable)
CREATE POLICY "audit_log_delete_deny" ON public.location_audit_log
  FOR DELETE USING (false);

-- 4. Restrict audit log INSERT to admins only (prevent log poisoning)
DROP POLICY IF EXISTS "audit_log_insert_authenticated" ON public.location_audit_log;
CREATE POLICY "audit_log_insert_admin" ON public.location_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

-- 5. Constrain change_request INSERT: status must be 'pending'
--    Drop and recreate the INSERT policy with status check
DROP POLICY IF EXISTS "change_requests_insert_owner" ON public.location_change_requests;
CREATE POLICY "change_requests_insert_owner" ON public.location_change_requests
  FOR INSERT WITH CHECK (
    submitted_by = (SELECT auth.uid())
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.locations
      WHERE id = location_id AND owner_id = (SELECT auth.uid())
    )
  );

-- 6. Add CHECK constraint on coordinates in locations table
ALTER TABLE public.locations
  ADD CONSTRAINT locations_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  ADD CONSTRAINT locations_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- 7. Add length constraints on text fields
ALTER TABLE public.locations
  ADD CONSTRAINT locations_name_length CHECK (char_length(name) <= 255),
  ADD CONSTRAINT locations_description_length CHECK (description IS NULL OR char_length(description) <= 5000),
  ADD CONSTRAINT locations_rules_length CHECK (rules IS NULL OR char_length(rules) <= 5000),
  ADD CONSTRAINT locations_region_length CHECK (region IS NULL OR char_length(region) <= 255);

-- 8. Add length constraint on change request admin notes
ALTER TABLE public.location_change_requests
  ADD CONSTRAINT change_requests_admin_note_length CHECK (admin_note IS NULL OR char_length(admin_note) <= 1000);

-- 9. Add length constraint on messages
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_length CHECK (char_length(content) <= 2000);

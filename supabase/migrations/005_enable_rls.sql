ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- LOCATIONS
CREATE POLICY "locations_select_active" ON public.locations
  FOR SELECT USING (is_active = true);

-- MEMBERSHIPS
CREATE POLICY "memberships_select_all" ON public.location_memberships
  FOR SELECT USING (true);

CREATE POLICY "memberships_insert_own" ON public.location_memberships
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "memberships_delete_own" ON public.location_memberships
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- MESSAGES
CREATE POLICY "messages_select_members" ON public.messages
  FOR SELECT USING (
    location_id IN (
      SELECT location_id FROM public.location_memberships
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "messages_insert_members" ON public.messages
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND location_id IN (
      SELECT location_id FROM public.location_memberships
      WHERE user_id = (SELECT auth.uid())
    )
  );

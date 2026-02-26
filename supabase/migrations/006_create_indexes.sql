CREATE INDEX idx_messages_location_created ON public.messages (location_id, created_at DESC);
CREATE INDEX idx_location_memberships_user_id ON public.location_memberships (user_id);
CREATE INDEX idx_location_memberships_location_id ON public.location_memberships (location_id);
CREATE INDEX idx_locations_slug ON public.locations (slug);

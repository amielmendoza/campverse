CREATE TABLE public.location_memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, location_id)
);

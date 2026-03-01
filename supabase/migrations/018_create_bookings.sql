-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  owner_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT bookings_dates_valid CHECK (check_out > check_in),
  CONSTRAINT bookings_guests_positive CHECK (guests > 0),
  CONSTRAINT bookings_total_positive CHECK (total_price > 0),
  CONSTRAINT bookings_status_valid CHECK (
    status IN ('pending_payment', 'pending_confirmation', 'confirmed', 'completed', 'cancelled', 'rejected')
  )
);

CREATE INDEX idx_bookings_location_id ON public.bookings(location_id);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Campers can see their own bookings
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Location owners can see bookings for their locations
CREATE POLICY "bookings_select_owner" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.locations
      WHERE id = bookings.location_id AND owner_id = (SELECT auth.uid())
    )
  );

-- Admins can see all bookings
CREATE POLICY "bookings_select_admin" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

-- Authenticated users can create bookings (must be their own user_id, status must be pending_payment)
CREATE POLICY "bookings_insert_own" ON public.bookings
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'pending_payment'
  );

-- Campers can update their own bookings (cancel or mark paid)
CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- Location owners can update bookings for their locations (confirm/reject)
CREATE POLICY "bookings_update_owner" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.locations
      WHERE id = bookings.location_id AND owner_id = (SELECT auth.uid())
    )
  );

-- Admins can update any booking
CREATE POLICY "bookings_update_admin" ON public.bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

-- No one can delete bookings (soft status changes only)
CREATE POLICY "bookings_delete_deny" ON public.bookings
  FOR DELETE USING (false);

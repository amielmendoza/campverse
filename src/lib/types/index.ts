import type { Database } from './database'

export type { Database } from './database'
export type { AmenityItem } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type LocationMembership = Database['public']['Tables']['location_memberships']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingStatus = Booking['status']

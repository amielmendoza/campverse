export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AmenityItem {
  name: string
  image_url: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
          is_admin: boolean
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          latitude: number | null
          longitude: number | null
          region: string | null
          amenities: AmenityItem[] | null
          gallery: string[] | null
          capacity: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          amenities?: AmenityItem[] | null
          gallery?: string[] | null
          capacity?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          amenities?: AmenityItem[] | null
          gallery?: string[] | null
          capacity?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      location_memberships: {
        Row: {
          id: string
          user_id: string
          location_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          location_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          location_id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'location_memberships_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'location_memberships_location_id_fkey'
            columns: ['location_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          id: string
          location_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_location_id_fkey'
            columns: ['location_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

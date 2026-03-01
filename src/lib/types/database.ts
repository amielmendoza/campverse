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
          rules: string | null
          owner_id: string | null
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
          rules?: string | null
          owner_id?: string | null
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
          rules?: string | null
          owner_id?: string | null
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
          last_read_at: string
        }
        Insert: {
          id?: string
          user_id: string
          location_id: string
          joined_at?: string
          last_read_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          location_id?: string
          joined_at?: string
          last_read_at?: string
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
      location_change_requests: {
        Row: {
          id: string
          location_id: string
          submitted_by: string
          changes: Record<string, unknown>
          status: 'pending' | 'approved' | 'rejected'
          admin_note: string | null
          reviewed_by: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          location_id: string
          submitted_by: string
          changes: Record<string, unknown>
          status?: string
          admin_note?: string | null
          reviewed_by?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          location_id?: string
          submitted_by?: string
          changes?: Record<string, unknown>
          status?: string
          admin_note?: string | null
          reviewed_by?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'location_change_requests_location_id_fkey'
            columns: ['location_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'location_change_requests_submitted_by_fkey'
            columns: ['submitted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      location_audit_log: {
        Row: {
          id: string
          location_id: string | null
          location_name: string
          action: 'created' | 'updated' | 'deleted' | 'change_approved' | 'change_rejected'
          actor_id: string
          changes: Record<string, unknown> | null
          change_request_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id?: string | null
          location_name: string
          action: string
          actor_id: string
          changes?: Record<string, unknown> | null
          change_request_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string | null
          location_name?: string
          action?: string
          actor_id?: string
          changes?: Record<string, unknown> | null
          change_request_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'location_audit_log_location_id_fkey'
            columns: ['location_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'location_audit_log_actor_id_fkey'
            columns: ['actor_id']
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

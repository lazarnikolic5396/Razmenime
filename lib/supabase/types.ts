export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          location_id: string | null
          user_role: 'user' | 'organization' | 'admin' | 'family'
          is_active: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location_id?: string | null
          user_role?: 'user' | 'organization' | 'admin' | 'family'
          is_active?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location_id?: string | null
          user_role?: 'user' | 'organization' | 'admin' | 'family'
          is_active?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          address: string
          city: string
          region: string | null
          postal_code: string | null
          country: string
          latitude: number
          longitude: number
          created_at: string
        }
        Insert: {
          id?: string
          address: string
          city: string
          region?: string | null
          postal_code?: string | null
          country: string
          latitude: number
          longitude: number
          created_at?: string
        }
        Update: {
          id?: string
          address?: string
          city?: string
          region?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number
          longitude?: number
          created_at?: string
        }
      }
      ads: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category_id: string
          location_id: string
          image_urls: string[]
          status: 'active' | 'inactive' | 'deleted' | 'removed_by_admin'
          condition: 'odlično' | 'dobro' | 'solidno'
          removed_reason: string | null
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          category_id: string
          location_id: string
          image_urls?: string[]
          status?: 'active' | 'inactive' | 'deleted' | 'removed_by_admin'
          condition: 'odlično' | 'dobro' | 'solidno'
          removed_reason?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          category_id?: string
          location_id?: string
          image_urls?: string[]
          status?: 'active' | 'inactive' | 'deleted' | 'removed_by_admin'
          condition?: 'odlično' | 'dobro' | 'solidno'
          removed_reason?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          participant_1_id: string
          participant_2_id: string
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_1_id: string
          participant_2_id: string
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participant_1_id?: string
          participant_2_id?: string
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          attachment_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          attachment_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          attachment_url?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      ad_requests: {
        Row: {
          id: string
          ad_id: string
          requester_id: string
          conversation_id: string
          created_at: string
        }
        Insert: {
          id?: string
          ad_id: string
          requester_id: string
          conversation_id: string
          created_at?: string
        }
        Update: {
          id?: string
          ad_id?: string
          requester_id?: string
          conversation_id?: string
          created_at?: string
        }
      }
      family_request_contacts: {
        Row: {
          id: string
          request_id: string
          requester_id: string
          helper_id: string
          conversation_id: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          requester_id: string
          helper_id: string
          conversation_id: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          requester_id?: string
          helper_id?: string
          conversation_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'user' | 'organization' | 'admin' | 'family'
      ad_status: 'active' | 'inactive' | 'deleted' | 'removed_by_admin'
      condition: 'odlično' | 'dobro' | 'solidno'
    }
  }
}


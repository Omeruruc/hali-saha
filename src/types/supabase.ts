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
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'customer'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'customer'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'customer'
          created_at?: string
        }
      }
      cities: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      fields: {
        Row: {
          id: number
          owner_id: string
          city_id: number
          name: string
          location: string
          description: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: number
          owner_id: string
          city_id: number
          name: string
          location: string
          description: string
          image_url?: string
          created_at?: string
        }
        Update: {
          id?: number
          owner_id?: string
          city_id?: number
          name?: string
          location?: string
          description?: string
          image_url?: string
          created_at?: string
        }
      }
      availabilities: {
        Row: {
          id: number
          field_id: number
          date: string
          start_time: string
          end_time: string
          price: number
          deposit_amount: number
          is_reserved: boolean
        }
        Insert: {
          id?: number
          field_id: number
          date: string
          start_time: string
          end_time: string
          price: number
          deposit_amount: number
          is_reserved?: boolean
        }
        Update: {
          id?: number
          field_id?: number
          date?: string
          start_time?: string
          end_time?: string
          price?: number
          deposit_amount?: number
          is_reserved?: boolean
        }
      }
      reservations: {
        Row: {
          id: number
          customer_id: string
          availability_id: number
          deposit_paid: boolean
          reservation_time: string
        }
        Insert: {
          id?: number
          customer_id: string
          availability_id: number
          deposit_paid?: boolean
          reservation_time?: string
        }
        Update: {
          id?: number
          customer_id?: string
          availability_id?: number
          deposit_paid?: boolean
          reservation_time?: string
        }
      }
    }
  }
}
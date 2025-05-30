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
      addresses: {
        Row: {
          id: string
          client_id: string
          type: 'SHIPPING' | 'BILLING'
          name: string
          line1: string
          line2: string | null
          city: string
          postcode: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          type: 'SHIPPING' | 'BILLING'
          name: string
          line1: string
          line2?: string | null
          city: string
          postcode: string
          country: string
          is_default?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          type?: 'SHIPPING' | 'BILLING'
          name?: string
          line1?: string
          line2?: string | null
          city?: string
          postcode?: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
}

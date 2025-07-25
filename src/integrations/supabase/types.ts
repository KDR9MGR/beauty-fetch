export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          current_data: Json | null
          description: string | null
          id: string
          internal_notes: string | null
          merchant_id: string
          priority: string | null
          proposed_data: Json | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          store_id: string | null
          survey_data: Json
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          current_data?: Json | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          merchant_id: string
          priority?: string | null
          proposed_data?: Json | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          store_id?: string | null
          survey_data: Json
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          current_data?: Json | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          merchant_id?: string
          priority?: string | null
          proposed_data?: Json | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          store_id?: string | null
          survey_data?: Json
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_survey_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          questions: Json
          request_type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          questions: Json
          request_type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json
          request_type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_survey_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_survey_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          updated_at: string | null
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string | null
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_store_availability"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          created_at: string | null
          id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          id?: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_store_availability"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          name: string
          slug: string
          sort_order: number | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tracking: {
        Row: {
          calculated_at: string | null
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: string
          notes: string | null
          order_id: string
          paid_at: string | null
          payment_status: string | null
          store_id: string
        }
        Insert: {
          calculated_at?: string | null
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          paid_at?: string | null
          payment_status?: string | null
          store_id: string
        }
        Update: {
          calculated_at?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          paid_at?: string | null
          payment_status?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_tracking_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_tracking_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_messages: {
        Row: {
          archived_at: string | null
          content: string
          created_at: string | null
          customer_id: string
          id: string
          is_archived: boolean | null
          message_type: string | null
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          content: string
          created_at?: string | null
          customer_id: string
          id?: string
          is_archived?: boolean | null
          message_type?: string | null
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          content?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          is_archived?: boolean | null
          message_type?: string | null
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_announcements: {
        Row: {
          background_color: string | null
          created_at: string | null
          created_by: string | null
          display_priority: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          message: string
          start_date: string | null
          target_audience: string | null
          text_color: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string | null
          created_by?: string | null
          display_priority?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          start_date?: string | null
          target_audience?: string | null
          text_color?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          created_at?: string | null
          created_by?: string | null
          display_priority?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          start_date?: string | null
          target_audience?: string | null
          text_color?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_applications: {
        Row: {
          address: Json | null
          admin_notes: string | null
          created_at: string | null
          date_of_birth: string
          driver_license_number: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          last_name: string
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_year: number | null
        }
        Insert: {
          address?: Json | null
          admin_notes?: string | null
          created_at?: string | null
          date_of_birth: string
          driver_license_number: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id?: string
          last_name: string
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: number | null
        }
        Update: {
          address?: Json | null
          admin_notes?: string | null
          created_at?: string | null
          date_of_birth?: string
          driver_license_number?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_applications: {
        Row: {
          admin_notes: string | null
          business_address: Json
          business_description: string | null
          business_license_number: string | null
          business_name: string
          business_type: string | null
          contact_person_first_name: string
          contact_person_last_name: string
          created_at: string | null
          email: string
          estimated_monthly_revenue: number | null
          id: string
          phone: string
          previous_experience: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          business_address: Json
          business_description?: string | null
          business_license_number?: string | null
          business_name: string
          business_type?: string | null
          contact_person_first_name: string
          contact_person_last_name: string
          created_at?: string | null
          email: string
          estimated_monthly_revenue?: number | null
          id?: string
          phone: string
          previous_experience?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          business_address?: Json
          business_description?: string | null
          business_license_number?: string | null
          business_name?: string
          business_type?: string | null
          contact_person_first_name?: string
          contact_person_last_name?: string
          created_at?: string | null
          email?: string
          estimated_monthly_revenue?: number | null
          id?: string
          phone?: string
          previous_experience?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_messages: {
        Row: {
          archived_at: string | null
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message: string
          message_type: string | null
          priority: string | null
          recipient_id: string
          related_id: string | null
          sender_id: string
          status: string | null
          store_id: string | null
          subject: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message: string
          message_type?: string | null
          priority?: string | null
          recipient_id: string
          related_id?: string | null
          sender_id: string
          status?: string | null
          store_id?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          priority?: string | null
          recipient_id?: string
          related_id?: string | null
          sender_id?: string
          status?: string | null
          store_id?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_store_updates: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          current_data: Json | null
          id: string
          merchant_id: string
          proposed_data: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          store_id: string
          update_type: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          current_data?: Json | null
          id?: string
          merchant_id: string
          proposed_data: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          store_id: string
          update_type: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          current_data?: Json | null
          id?: string
          merchant_id?: string
          proposed_data?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          store_id?: string
          update_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_store_updates_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_store_updates_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_store_updates_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_store_updates_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_store_updates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_store_updates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      message_replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_id: string
          sender_id: string | null
          sender_type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_id: string
          sender_id?: string | null
          sender_type: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_id?: string
          sender_id?: string | null
          sender_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_replies_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_replies_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          related_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      order_cost_breakdown: {
        Row: {
          cost_breakdown: Json | null
          created_at: string | null
          delivery_cost: number
          gross_profit: number
          id: string
          item_cost: number
          net_profit: number
          order_id: string
          payment_processing_fee: number
          platform_fee: number
          store_commission: number
          updated_at: string | null
        }
        Insert: {
          cost_breakdown?: Json | null
          created_at?: string | null
          delivery_cost?: number
          gross_profit?: number
          id?: string
          item_cost?: number
          net_profit?: number
          order_id: string
          payment_processing_fee?: number
          platform_fee?: number
          store_commission?: number
          updated_at?: string | null
        }
        Update: {
          cost_breakdown?: Json | null
          created_at?: string | null
          delivery_cost?: number
          gross_profit?: number
          id?: string
          item_cost?: number
          net_profit?: number
          order_id?: string
          payment_processing_fee?: number
          platform_fee?: number
          store_commission?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_cost_breakdown_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_fraud_assessment: {
        Row: {
          automated_decision: string | null
          created_at: string | null
          final_decision: string | null
          id: string
          manual_review_required: boolean | null
          order_id: string
          reviewed_by: string | null
          reviewer_notes: string | null
          risk_factors: Json | null
          risk_level: string | null
          risk_score: number | null
          updated_at: string | null
        }
        Insert: {
          automated_decision?: string | null
          created_at?: string | null
          final_decision?: string | null
          id?: string
          manual_review_required?: boolean | null
          order_id: string
          reviewed_by?: string | null
          reviewer_notes?: string | null
          risk_factors?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          updated_at?: string | null
        }
        Update: {
          automated_decision?: string | null
          created_at?: string | null
          final_decision?: string | null
          id?: string
          manual_review_required?: boolean | null
          order_id?: string
          reviewed_by?: string | null
          reviewer_notes?: string | null
          risk_factors?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_fraud_assessment_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fraud_assessment_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fraud_assessment_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          store_id: string
          total: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          store_id: string
          total: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
          store_id?: string
          total?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_store_availability"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          automated: boolean | null
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string
          old_status: string | null
          order_id: string
        }
        Insert: {
          automated?: boolean | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          order_id: string
        }
        Update: {
          automated?: boolean | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          billing_address: Json | null
          created_at: string | null
          currency: string | null
          customer_id: string
          discount_amount: number | null
          fraud_risk_level: string | null
          id: string
          is_archived: boolean | null
          notes: string | null
          order_number: string
          shipping_address: Json | null
          shipping_amount: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          billing_address?: Json | null
          created_at?: string | null
          currency?: string | null
          customer_id: string
          discount_amount?: number | null
          fraud_risk_level?: string | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          order_number: string
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          billing_address?: Json | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string
          discount_amount?: number | null
          fraud_risk_level?: string | null
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          order_number?: string
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string | null
          expiry_month: number | null
          expiry_year: number | null
          id: string
          is_default: boolean | null
          last_four: string
          stripe_payment_method_id: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          is_default?: boolean | null
          last_four: string
          stripe_payment_method_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          is_default?: boolean | null
          last_four?: string
          stripe_payment_method_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_store_availability"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_store_availability"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string | null
          compare_price: number | null
          created_at: string | null
          id: string
          image_url: string | null
          inventory_quantity: number | null
          position: number | null
          price: number | null
          product_id: string
          sku: string | null
          title: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          compare_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          inventory_quantity?: number | null
          position?: number | null
          price?: number | null
          product_id: string
          sku?: string | null
          title: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          compare_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          inventory_quantity?: number | null
          position?: number | null
          price?: number | null
          product_id?: string
          sku?: string | null
          title?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_store_availability"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string
          compare_price: number | null
          continue_selling_when_out_of_stock: boolean | null
          cost_per_item: number | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          featured: boolean | null
          id: string
          images: string[] | null
          inventory_quantity: number | null
          margin_percentage: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          price: number
          short_description: string | null
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"] | null
          store_id: string
          tags: string[] | null
          track_inventory: boolean | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          category_id: string
          compare_price?: number | null
          continue_selling_when_out_of_stock?: boolean | null
          cost_per_item?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          inventory_quantity?: number | null
          margin_percentage?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          price: number
          short_description?: string | null
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"] | null
          store_id: string
          tags?: string[] | null
          track_inventory?: boolean | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string
          compare_price?: number | null
          continue_selling_when_out_of_stock?: boolean | null
          cost_per_item?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          inventory_quantity?: number | null
          margin_percentage?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          price?: number
          short_description?: string | null
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"] | null
          store_id?: string
          tags?: string[] | null
          track_inventory?: boolean | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blocked_at: string | null
          blocked_reason: string | null
          created_at: string | null
          email: string | null
          email_verified: boolean | null
          email_verified_at: string | null
          first_name: string | null
          id: string
          is_blocked: boolean | null
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: string | null
          updated_at: string | null
          verification_email_sent_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          first_name?: string | null
          id: string
          is_blocked?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
          updated_at?: string | null
          verification_email_sent_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          first_name?: string | null
          id?: string
          is_blocked?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
          updated_at?: string | null
          verification_email_sent_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string | null
          customer_id: string
          id: string
          images: string[] | null
          is_approved: boolean | null
          is_verified: boolean | null
          order_id: string | null
          product_id: string | null
          rating: number
          store_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_verified?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating: number
          store_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_verified?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating?: number
          store_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_store_availability"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_analytics: {
        Row: {
          average_order_value: number | null
          created_at: string | null
          date: string
          id: string
          store_id: string
          total_commission: number | null
          total_orders: number | null
          total_revenue: number | null
          unique_customers: number | null
          updated_at: string | null
        }
        Insert: {
          average_order_value?: number | null
          created_at?: string | null
          date: string
          id?: string
          store_id: string
          total_commission?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          unique_customers?: number | null
          updated_at?: string | null
        }
        Update: {
          average_order_value?: number | null
          created_at?: string | null
          date?: string
          id?: string
          store_id?: string
          total_commission?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          unique_customers?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          store_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          store_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_commissions: {
        Row: {
          commission_rate: number
          commission_type: string | null
          created_at: string | null
          effective_from: string
          effective_until: string | null
          flat_fee: number | null
          id: string
          is_active: boolean | null
          notes: string | null
          store_id: string
          tiered_rates: Json | null
          updated_at: string | null
        }
        Insert: {
          commission_rate?: number
          commission_type?: string | null
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          flat_fee?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          store_id: string
          tiered_rates?: Json | null
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          commission_type?: string | null
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          flat_fee?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          store_id?: string
          tiered_rates?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_hours: {
        Row: {
          close_time: string | null
          created_at: string | null
          day_of_week: number
          id: string
          is_closed: boolean | null
          open_time: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          close_time?: string | null
          created_at?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          open_time?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          close_time?: string | null
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          open_time?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_hours_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_hours_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_managers: {
        Row: {
          created_at: string | null
          hired_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          permissions: Json | null
          role: string | null
          salary: number | null
          store_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hired_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          permissions?: Json | null
          role?: string | null
          salary?: number | null
          store_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hired_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          permissions?: Json | null
          role?: string | null
          salary?: number | null
          store_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_managers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_managers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_managers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_managers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          cost_price: number | null
          created_at: string | null
          id: string
          inventory_quantity: number | null
          is_available: boolean | null
          price: number
          product_id: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          cost_price?: number | null
          created_at?: string | null
          id?: string
          inventory_quantity?: number | null
          is_available?: boolean | null
          price: number
          product_id: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          cost_price?: number | null
          created_at?: string | null
          id?: string
          inventory_quantity?: number | null
          is_available?: boolean | null
          price?: number
          product_id?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_store_availability"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "store_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_analytics_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: Json | null
          business_hours: Json | null
          commission_rate: number | null
          contact_info: Json | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          featured: boolean | null
          id: string
          logo_url: string | null
          monthly_revenue: number | null
          name: string
          owner_id: string
          phone: string | null
          rating: number | null
          slug: string
          status: Database["public"]["Enums"]["store_status"] | null
          total_orders: number | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          business_hours?: Json | null
          commission_rate?: number | null
          contact_info?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          featured?: boolean | null
          id?: string
          logo_url?: string | null
          monthly_revenue?: number | null
          name: string
          owner_id: string
          phone?: string | null
          rating?: number | null
          slug: string
          status?: Database["public"]["Enums"]["store_status"] | null
          total_orders?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          business_hours?: Json | null
          commission_rate?: number | null
          contact_info?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          featured?: boolean | null
          id?: string
          logo_url?: string | null
          monthly_revenue?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          rating?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["store_status"] | null
          total_orders?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      system_audit_log: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action_description: string | null
          action_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_description?: string | null
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_description?: string | null
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          company: string | null
          country: string
          created_at: string | null
          first_name: string | null
          id: string
          is_default: boolean | null
          label: string | null
          last_name: string | null
          phone: string | null
          postal_code: string
          state: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          company?: string | null
          country: string
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          last_name?: string | null
          phone?: string | null
          postal_code: string
          state: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          company?: string | null
          country?: string
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string
          state?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_status: {
        Row: {
          account_status: string | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          created_at: string | null
          id: string
          is_blocked: boolean | null
          last_login_attempt: string | null
          login_attempts: number | null
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_status?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          created_at?: string | null
          id?: string
          is_blocked?: boolean | null
          last_login_attempt?: string | null
          login_attempts?: number | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_status?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          created_at?: string | null
          id?: string
          is_blocked?: boolean | null
          last_login_attempt?: string | null
          login_attempts?: number | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_status_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_status_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_store_availability"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      product_store_availability: {
        Row: {
          available_stores: number | null
          avg_price: number | null
          base_price: number | null
          max_price: number | null
          min_price: number | null
          product_id: string | null
          product_name: string | null
          slug: string | null
          total_inventory: number | null
        }
        Relationships: []
      }
      store_analytics_summary: {
        Row: {
          average_order_value: number | null
          commission_rate: number | null
          id: string | null
          monthly_orders: number | null
          monthly_revenue: number | null
          name: string | null
          total_commission: number | null
          total_orders: number | null
          total_revenue: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
      user_order_summary: {
        Row: {
          average_order_value: number | null
          email: string | null
          first_name: string | null
          id: string | null
          is_blocked: boolean | null
          last_name: string | null
          last_order_date: string | null
          monthly_orders: number | null
          status: string | null
          total_orders: number | null
          total_spent: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      approval_status:
        | "pending"
        | "in_review"
        | "approved"
        | "rejected"
        | "needs_info"
      approval_type: "merchant" | "driver"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_status: "active" | "inactive" | "out_of_stock"
      store_status: "active" | "inactive" | "pending"
      user_role: "customer" | "store_owner" | "admin" | "driver"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      approval_status: [
        "pending",
        "in_review",
        "approved",
        "rejected",
        "needs_info",
      ],
      approval_type: ["merchant", "driver"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_status: ["active", "inactive", "out_of_stock"],
      store_status: ["active", "inactive", "pending"],
      user_role: ["customer", "store_owner", "admin", "driver"],
    },
  },
} as const

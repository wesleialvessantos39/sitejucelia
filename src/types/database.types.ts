// /src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'user';
          phone: string | null;
          crea: string | null;
          status: 'active' | 'suspended' | 'inactive';
          active: boolean;
          last_login: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user';
          phone?: string | null;
          crea?: string | null;
          status?: 'active' | 'suspended' | 'inactive';
          active?: boolean;
          last_login?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'user';
          phone?: string | null;
          crea?: string | null;
          status?: 'active' | 'suspended' | 'inactive';
          active?: boolean;
          last_login?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          category: string;
          category_label: string;
          description: string;
          image_url: string;
          video_url: string | null;
          video_title: string | null;
          location: string;
          year: string | null;
          area: string | null;
          status: string;
          services_executed: string[] | null;
          has_video: boolean;
          featured: boolean;
          order_index: number;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          category: string;
          category_label: string;
          description: string;
          image_url: string;
          video_url?: string | null;
          video_title?: string | null;
          location: string;
          year?: string | null;
          area?: string | null;
          status?: string;
          services_executed?: string[] | null;
          has_video?: boolean;
          featured?: boolean;
          order_index?: number;
          created_by?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          category?: string;
          category_label?: string;
          description?: string;
          image_url?: string;
          video_url?: string | null;
          video_title?: string | null;
          location?: string;
          year?: string | null;
          area?: string | null;
          status?: string;
          services_executed?: string[] | null;
          has_video?: boolean;
          featured?: boolean;
          order_index?: number;
          created_by?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_images: {
        Row: {
          id: string;
          project_id: string;
          image_url: string;
          caption: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          image_url: string;
          caption?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          image_url?: string;
          caption?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_images_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          category: string;
          summary: string;
          content: string;
          cover_url: string | null;
          author: string;
          published: boolean;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          category: string;
          summary: string;
          content: string;
          cover_url?: string | null;
          author?: string;
          published?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          category?: string;
          summary?: string;
          content?: string;
          cover_url?: string | null;
          author?: string;
          published?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string | null;
          message: string;
          status: 'new' | 'read' | 'replied' | 'archived';
          priority: 'low' | 'normal' | 'high' | 'urgent';
          origin: string;
          notes: string | null;
          assigned_to: string | null;
          answered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject?: string | null;
          message: string;
          status?: 'new' | 'read' | 'replied' | 'archived';
          priority?: 'low' | 'normal' | 'high' | 'urgent';
          origin?: string;
          notes?: string | null;
          assigned_to?: string | null;
          answered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string | null;
          message?: string;
          status?: 'new' | 'read' | 'replied' | 'archived';
          priority?: 'low' | 'normal' | 'high' | 'urgent';
          origin?: string;
          notes?: string | null;
          assigned_to?: string | null;
          answered_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      technical_documents: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          category: string;
          document_type: string;
          file_name: string;
          file_path: string;
          file_url: string;
          mime_type: string;
          file_size: number;
          thumbnail_url: string | null;
          is_published: boolean;
          is_featured: boolean;
          order_index: number;
          downloads_count: number;
          created_by: string | null;
          updated_by: string | null;
          published_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string;
          category?: string;
          document_type?: string;
          file_name: string;
          file_path: string;
          file_url: string;
          mime_type?: string;
          file_size?: number;
          thumbnail_url?: string | null;
          is_published?: boolean;
          is_featured?: boolean;
          order_index?: number;
          downloads_count?: number;
          created_by?: string | null;
          updated_by?: string | null;
          published_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          category?: string;
          document_type?: string;
          file_name?: string;
          file_path?: string;
          file_url?: string;
          mime_type?: string;
          file_size?: number;
          thumbnail_url?: string | null;
          is_published?: boolean;
          is_featured?: boolean;
          order_index?: number;
          downloads_count?: number;
          created_by?: string | null;
          updated_by?: string | null;
          published_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_domains: {
        Row: {
          id: string;
          domain: string;
          normalized_domain: string;
          label: string;
          description: string | null;
          is_active: boolean;
          is_primary: boolean;
          ssl_status: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain: string;
          normalized_domain: string;
          label: string;
          description?: string | null;
          is_active?: boolean;
          is_primary?: boolean;
          ssl_status?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain?: string;
          normalized_domain?: string;
          label?: string;
          description?: string | null;
          is_active?: boolean;
          is_primary?: boolean;
          ssl_status?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      site_visit_stats: {
        Row: {
          id: string;
          visit_date: string;
          page_path: string;
          views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visit_date?: string;
          page_path: string;
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          visit_date?: string;
          page_path?: string;
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      system_backups: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          backup_name: string;
          backup_type: 'manual' | 'scheduled';
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'file_missing' | 'verification_required' | 'deleted' | 'restoring' | 'restored';
          file_id: string | null;
          file_name: string | null;
          file_size: number | null;
          storage_provider: 'google_drive' | 'local_export';
          metadata: Json;
          error_message: string | null;
          completed_at: string | null;
          idempotency_key: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          backup_name: string;
          backup_type?: 'manual' | 'scheduled';
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'file_missing' | 'verification_required' | 'deleted' | 'restoring' | 'restored';
          file_id?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          storage_provider?: 'google_drive' | 'local_export';
          metadata?: Json;
          error_message?: string | null;
          completed_at?: string | null;
          idempotency_key?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          backup_name?: string;
          backup_type?: 'manual' | 'scheduled';
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'file_missing' | 'verification_required' | 'deleted' | 'restoring' | 'restored';
          file_id?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          storage_provider?: 'google_drive' | 'local_export';
          metadata?: Json;
          error_message?: string | null;
          completed_at?: string | null;
          idempotency_key?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "system_backups_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      google_drive_connections: {
        Row: {
          id: string;
          provider: string;
          connected_by: string | null;
          connected_by_email: string | null;
          account_email: string;
          drive_folder_id: string;
          drive_folder_name: string;
          is_active: boolean;
          status: 'connected' | 'disconnected' | 'reconnect_required' | 'error';
          refresh_token_encrypted: string;
          error_message: string | null;
          last_verified_at: string | null;
          connected_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider?: string;
          connected_by?: string | null;
          connected_by_email?: string | null;
          account_email: string;
          drive_folder_id: string;
          drive_folder_name?: string;
          is_active?: boolean;
          status: 'connected' | 'disconnected' | 'reconnect_required' | 'error';
          refresh_token_encrypted: string;
          error_message?: string | null;
          last_verified_at?: string | null;
          connected_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          connected_by?: string | null;
          connected_by_email?: string | null;
          account_email?: string;
          drive_folder_id?: string;
          drive_folder_name?: string;
          is_active?: boolean;
          status?: 'connected' | 'disconnected' | 'reconnect_required' | 'error';
          refresh_token_encrypted?: string;
          error_message?: string | null;
          last_verified_at?: string | null;
          connected_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "google_drive_connections_connected_by_fkey";
            columns: ["connected_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      google_oauth_states: {
        Row: {
          id: string;
          state_hash: string;
          user_id: string;
          user_email: string | null;
          origin: string;
          created_at: string;
          expires_at: string;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          state_hash: string;
          user_id: string;
          user_email?: string | null;
          origin: string;
          created_at?: string;
          expires_at: string;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          state_hash?: string;
          user_id?: string;
          user_email?: string | null;
          origin?: string;
          created_at?: string;
          expires_at?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "google_oauth_states_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      consume_google_oauth_state: {
        Args: {
          p_state_hash: string;
        };
        Returns: {
          user_id: string;
          user_email: string;
          origin: string;
        }[];
      };
      switch_active_google_drive_connection: {
        Args: {
          p_connected_by: string;
          p_connected_by_email: string;
          p_account_email: string;
          p_drive_folder_id: string;
          p_drive_folder_name: string;
          p_refresh_token_encrypted: string;
        };
        Returns: Database['public']['Tables']['google_drive_connections']['Row'];
      };
      increment_page_view: {
        Args: {
          p_page_path: string;
          p_visit_date?: string;
        };
        Returns: number;
      };
      delete_site_visit_stats_by_period: {
        Args: {
          p_start_date: string;
          p_end_date: string;
          p_page_path?: string;
        };
        Returns: Json;
      };
      check_site_visit_stats_integrity: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

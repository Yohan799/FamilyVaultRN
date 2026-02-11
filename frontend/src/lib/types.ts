export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_controls: {
        Row: {
          access_level: string
          granted_at: string
          id: string
          nominee_id: string
          resource_id: string
          resource_type: string
          user_id: string
        }
        Insert: {
          access_level: string
          granted_at?: string
          id?: string
          nominee_id: string
          resource_id: string
          resource_type: string
          user_id: string
        }
        Update: {
          access_level?: string
          granted_at?: string
          id?: string
          nominee_id?: string
          resource_id?: string
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      backups: {
        Row: {
          backup_type: string
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          backup_type: string
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          backup_type?: string
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          icon: string | null
          icon_bg_color: string | null
          id: string
          is_custom: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          icon_bg_color?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          icon_bg_color?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          platform?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category_id: string | null
          deleted_at: string | null
          download_count: number | null
          external_source: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          folder_id: string | null
          id: string
          subcategory_id: string | null
          updated_at: string
          uploaded_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          deleted_at?: string | null
          download_count?: number | null
          external_source?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          folder_id?: string | null
          id?: string
          subcategory_id?: string | null
          updated_at?: string
          uploaded_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          deleted_at?: string | null
          download_count?: number | null
          external_source?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          folder_id?: string | null
          id?: string
          subcategory_id?: string | null
          updated_at?: string
          uploaded_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          folder_type: string | null
          icon: string | null
          icon_bg_color: string | null
          id: string
          name: string
          parent_folder_id: string | null
          subcategory_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          folder_type?: string | null
          icon?: string | null
          icon_bg_color?: string | null
          id?: string
          name: string
          parent_folder_id?: string | null
          subcategory_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          folder_type?: string | null
          icon?: string | null
          icon_bg_color?: string | null
          id?: string
          name?: string
          parent_folder_id?: string | null
          subcategory_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inactivity_alerts: {
        Row: {
          alert_stage: string
          created_at: string
          custom_message: string | null
          id: string
          inactive_days: number
          recipient_email: string | null
          recipient_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          alert_stage: string
          created_at?: string
          custom_message?: string | null
          id?: string
          inactive_days: number
          recipient_email?: string | null
          recipient_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          alert_stage?: string
          created_at?: string
          custom_message?: string | null
          id?: string
          inactive_days?: number
          recipient_email?: string | null
          recipient_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inactivity_triggers: {
        Row: {
          created_at: string
          custom_message: string | null
          email_enabled: boolean | null
          emergency_access_granted: boolean | null
          emergency_granted_at: string | null
          id: string
          inactive_days_threshold: number | null
          is_active: boolean | null
          last_activity_at: string | null
          sms_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_message?: string | null
          email_enabled?: boolean | null
          emergency_access_granted?: boolean | null
          emergency_granted_at?: string | null
          id?: string
          inactive_days_threshold?: number | null
          is_active?: boolean | null
          last_activity_at?: string | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_message?: string | null
          email_enabled?: boolean | null
          emergency_access_granted?: boolean | null
          emergency_granted_at?: string | null
          id?: string
          inactive_days_threshold?: number | null
          is_active?: boolean | null
          last_activity_at?: string | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nominees: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          relation: string | null
          status: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          relation?: string | null
          status?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          relation?: string | null
          status?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          nominee_email: string
          otp_code: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          nominee_email: string
          otp_code: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          nominee_email?: string
          otp_code?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      password_reset_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_hash: string
          reset_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_hash: string
          reset_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          reset_token?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          additional_emails: Json | null
          app_lock_type: string | null
          app_pin_hash: string | null
          auto_lock_minutes: number | null
          backup_frequency: string | null
          biometric_enabled: boolean | null
          created_at: string
          date_of_birth: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          id: string
          last_login: string | null
          phone: string | null
          profile_image_url: string | null
          push_notifications_enabled: boolean | null
          two_factor_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          additional_emails?: Json | null
          app_lock_type?: string | null
          app_pin_hash?: string | null
          auto_lock_minutes?: number | null
          backup_frequency?: string | null
          biometric_enabled?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          last_login?: string | null
          phone?: string | null
          profile_image_url?: string | null
          push_notifications_enabled?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          additional_emails?: Json | null
          app_lock_type?: string | null
          app_pin_hash?: string | null
          auto_lock_minutes?: number | null
          backup_frequency?: string | null
          biometric_enabled?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          phone?: string | null
          profile_image_url?: string | null
          push_notifications_enabled?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      quick_actions: {
        Row: {
          action_key: string
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_custom: boolean | null
          is_enabled: boolean | null
          route: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_key: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          is_enabled?: boolean | null
          route?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_key?: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          is_enabled?: boolean | null
          route?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signup_verification_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          deleted_at: string | null
          icon: string | null
          icon_bg_color: string | null
          id: string
          is_custom: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          icon_bg_color?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          icon_bg_color?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_capsules: {
        Row: {
          attachment_url: string | null
          created_at: string
          deleted_at: string | null
          id: string
          message: string
          phone: string | null
          recipient_email: string
          release_date: string
          released_at: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          message: string
          phone?: string | null
          recipient_email: string
          release_date: string
          released_at?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string
          phone?: string | null
          recipient_email?: string
          release_date?: string
          released_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      two_fa_verifications: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp_code: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp_code: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_name: string
          device_type: string
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_active_at: string
          location: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name: string
          device_type: string
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active_at?: string
          location?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string
          device_type?: string
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active_at?: string
          location?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          nominee_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          nominee_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          nominee_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_tokens_nominee_id_fkey"
            columns: ["nominee_id"]
            isOneToOne: false
            referencedRelation: "nominees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_user_nominee: {
        Args: { _nominee_id: string; _user_id: string }
        Returns: boolean
      }
      soft_delete_category: {
        Args: { _category_id: string; _user_id: string }
        Returns: boolean
      }
      soft_delete_document: {
        Args: { _document_id: string; _user_id: string }
        Returns: boolean
      }
      soft_delete_nominee: {
        Args: { _nominee_id: string; _user_id: string }
        Returns: boolean
      }
      soft_delete_subcategory: {
        Args: {
          _category_id: string
          _subcategory_id: string
          _user_id: string
        }
        Returns: boolean
      }
      soft_delete_time_capsule: {
        Args: { _capsule_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

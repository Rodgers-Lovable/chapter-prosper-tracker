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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string | null
          id: string
          leader_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          leader_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          leader_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          file_url: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          paid_at: string | null
          trade_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          file_url?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          paid_at?: string | null
          trade_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          file_url?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          paid_at?: string | null
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          chapter_id: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          updated_at?: string | null
          user_id: string
          value?: number
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          metric_type?: Database["public"]["Enums"]["metric_type"]
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_history: {
        Row: {
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          recipient_count: number | null
          recipient_type: string
          scheduled_for: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          subject: string
        }
        Insert: {
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          recipient_count?: number | null
          recipient_type: string
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          recipient_count?: number | null
          recipient_type?: string
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_history_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_description: string | null
          business_name: string | null
          chapter_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          business_description?: string | null
          business_name?: string | null
          chapter_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          business_description?: string | null
          business_name?: string | null
          chapter_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      reports_history: {
        Row: {
          created_at: string | null
          date_range: Json | null
          file_name: string
          file_size: string | null
          format: string
          generated_by: string | null
          id: string
          report_period: string
          report_type: string
        }
        Insert: {
          created_at?: string | null
          date_range?: Json | null
          file_name: string
          file_size?: string | null
          format: string
          generated_by?: string | null
          id?: string
          report_period: string
          report_type: string
        }
        Update: {
          created_at?: string | null
          date_range?: Json | null
          file_name?: string
          file_size?: string | null
          format?: string
          generated_by?: string | null
          id?: string
          report_period?: string
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_history_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          amount: number
          beneficiary_member_id: string | null
          chapter_id: string
          created_at: string | null
          description: string | null
          id: string
          mpesa_reference: string | null
          source_member_id: string | null
          status: Database["public"]["Enums"]["trade_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          beneficiary_member_id?: string | null
          chapter_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          mpesa_reference?: string | null
          source_member_id?: string | null
          status?: Database["public"]["Enums"]["trade_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          beneficiary_member_id?: string | null
          chapter_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          mpesa_reference?: string | null
          source_member_id?: string | null
          status?: Database["public"]["Enums"]["trade_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      notification_stats: {
        Row: {
          month: string | null
          notification_type: string | null
          total_recipients: number | null
          total_sent: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_chapter: { Args: { user_uuid: string }; Returns: string }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      metric_type:
        | "participation"
        | "learning"
        | "activity"
        | "networking"
        | "trade"
      trade_status: "pending" | "paid" | "invoiced" | "failed"
      user_role: "member" | "chapter_leader" | "administrator"
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
      metric_type: [
        "participation",
        "learning",
        "activity",
        "networking",
        "trade",
      ],
      trade_status: ["pending", "paid", "invoiced", "failed"],
      user_role: ["member", "chapter_leader", "administrator"],
    },
  },
} as const

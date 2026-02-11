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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      offer_applications: {
        Row: {
          created_at: string
          id: string
          offer_id: string | null
          order_number: string
          price_euros: number
          status: Database["public"]["Enums"]["order_status"]
          supplier_id: string | null
          term: string
          units: number
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id?: string | null
          order_number?: string
          price_euros: number
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id?: string | null
          term: string
          units: number
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string | null
          order_number?: string
          price_euros?: number
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id?: string | null
          term?: string
          units?: number
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_applications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_applications_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_lines: {
        Row: {
          confirmed_price: number | null
          confirmed_units: number | null
          created_at: string
          deadline: string | null
          id: string
          material_code: string
          material_description: string
          offer_id: string
          reference_price: number | null
          requested_units: number
          updated_at: string
        }
        Insert: {
          confirmed_price?: number | null
          confirmed_units?: number | null
          created_at?: string
          deadline?: string | null
          id?: string
          material_code: string
          material_description: string
          offer_id: string
          reference_price?: number | null
          requested_units: number
          updated_at?: string
        }
        Update: {
          confirmed_price?: number | null
          confirmed_units?: number | null
          created_at?: string
          deadline?: string | null
          id?: string
          material_code?: string
          material_description?: string
          offer_id?: string
          reference_price?: number | null
          requested_units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_lines_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          deadline: string | null
          description: string
          id: string
          minimum_units: number
          offer_number: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          minimum_units?: number
          offer_number: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          minimum_units?: number
          offer_number?: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: []
      }
      order_confirmations: {
        Row: {
          confirmed_at: string
          created_at: string
          id: string
          offer_application_id: string
          offer_id: string | null
          price_euros: number
          supplier_id: string
          term: string
          units: number
        }
        Insert: {
          confirmed_at?: string
          created_at?: string
          id?: string
          offer_application_id: string
          offer_id?: string | null
          price_euros: number
          supplier_id: string
          term: string
          units: number
        }
        Update: {
          confirmed_at?: string
          created_at?: string
          id?: string
          offer_application_id?: string
          offer_id?: string | null
          price_euros?: number
          supplier_id?: string
          term?: string
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_confirmations_offer_application_id_fkey"
            columns: ["offer_application_id"]
            isOneToOne: false
            referencedRelation: "offer_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      order_line_confirmations: {
        Row: {
          article_code: string
          confirmed_price: number
          confirmed_term: string
          confirmed_units: number
          created_at: string
          id: string
          offer_application_id: string
          order_line_id: string
        }
        Insert: {
          article_code: string
          confirmed_price: number
          confirmed_term: string
          confirmed_units: number
          created_at?: string
          id?: string
          offer_application_id: string
          order_line_id: string
        }
        Update: {
          article_code?: string
          confirmed_price?: number
          confirmed_term?: string
          confirmed_units?: number
          created_at?: string
          id?: string
          offer_application_id?: string
          order_line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_line_confirmations_offer_application_id_fkey"
            columns: ["offer_application_id"]
            isOneToOne: false
            referencedRelation: "offer_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_line_confirmations_order_line_id_fkey"
            columns: ["order_line_id"]
            isOneToOne: false
            referencedRelation: "order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lines: {
        Row: {
          article_code: string
          created_at: string
          description: string
          id: string
          offer_application_id: string
          requested_price: number | null
          requested_term: string | null
          requested_units: number
        }
        Insert: {
          article_code: string
          created_at?: string
          description: string
          id?: string
          offer_application_id: string
          requested_price?: number | null
          requested_term?: string | null
          requested_units: number
        }
        Update: {
          article_code?: string
          created_at?: string
          description?: string
          id?: string
          offer_application_id?: string
          requested_price?: number | null
          requested_term?: string | null
          requested_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_offer_application_id_fkey"
            columns: ["offer_application_id"]
            isOneToOne: false
            referencedRelation: "offer_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_users: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          invitation_token: string | null
          last_name: string
          position: string | null
          supplier_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          last_name: string
          position?: string | null
          supplier_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          last_name?: string
          position?: string | null
          supplier_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_users_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          average_billing: number | null
          created_at: string
          family: string
          id: string
          logo_url: string | null
          name: string
          order_advance_days: number | null
          privileges: boolean
          supplier_code: string | null
          updated_at: string
        }
        Insert: {
          average_billing?: number | null
          created_at?: string
          family: string
          id?: string
          logo_url?: string | null
          name: string
          order_advance_days?: number | null
          privileges?: boolean
          supplier_code?: string | null
          updated_at?: string
        }
        Update: {
          average_billing?: number | null
          created_at?: string
          family?: string
          id?: string
          logo_url?: string | null
          name?: string
          order_advance_days?: number | null
          privileges?: boolean
          supplier_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_supplier_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "supplier"
      offer_status: "abierta" | "aplicada" | "aceptada" | "rechazada"
      order_status: "pendiente" | "confirmado"
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
      app_role: ["admin", "supplier"],
      offer_status: ["abierta", "aplicada", "aceptada", "rechazada"],
      order_status: ["pendiente", "confirmado"],
    },
  },
} as const

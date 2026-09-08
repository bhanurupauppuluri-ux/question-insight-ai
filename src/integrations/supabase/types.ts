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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      exam_sets: {
        Row: {
          coverage_percent: number | null
          created_at: string
          id: string
          raw_text: string | null
          rubric_text: string | null
          source_type: string
          status: string
          subject: string | null
          summary: string | null
          syllabus_text: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coverage_percent?: number | null
          created_at?: string
          id?: string
          raw_text?: string | null
          rubric_text?: string | null
          source_type?: string
          status?: string
          subject?: string | null
          summary?: string | null
          syllabus_text?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coverage_percent?: number | null
          created_at?: string
          id?: string
          raw_text?: string | null
          rubric_text?: string | null
          source_type?: string
          status?: string
          subject?: string | null
          summary?: string | null
          syllabus_text?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          ambiguity_score: number | null
          bias_flag: boolean
          bloom_level: string | null
          created_at: string
          difficulty: string | null
          exam_set_id: string
          expected_minutes: number | null
          id: string
          marks: number | null
          number_label: string | null
          position: number
          quality_notes: string | null
          rubric_criterion: string | null
          rubric_notes: string | null
          rubric_score: number | null
          text: string
          topic: string | null
          user_id: string
        }
        Insert: {
          ambiguity_score?: number | null
          bias_flag?: boolean
          bloom_level?: string | null
          created_at?: string
          difficulty?: string | null
          exam_set_id: string
          expected_minutes?: number | null
          id?: string
          marks?: number | null
          number_label?: string | null
          position?: number
          quality_notes?: string | null
          rubric_criterion?: string | null
          rubric_notes?: string | null
          rubric_score?: number | null
          text: string
          topic?: string | null
          user_id: string
        }
        Update: {
          ambiguity_score?: number | null
          bias_flag?: boolean
          bloom_level?: string | null
          created_at?: string
          difficulty?: string | null
          exam_set_id?: string
          expected_minutes?: number | null
          id?: string
          marks?: number | null
          number_label?: string | null
          position?: number
          quality_notes?: string | null
          rubric_criterion?: string | null
          rubric_notes?: string | null
          rubric_score?: number | null
          text?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_set_id_fkey"
            columns: ["exam_set_id"]
            isOneToOne: false
            referencedRelation: "exam_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_topics: {
        Row: {
          covered: boolean
          created_at: string
          exam_set_id: string
          id: string
          name: string
          question_count: number
          user_id: string
        }
        Insert: {
          covered?: boolean
          created_at?: string
          exam_set_id: string
          id?: string
          name: string
          question_count?: number
          user_id: string
        }
        Update: {
          covered?: boolean
          created_at?: string
          exam_set_id?: string
          id?: string
          name?: string
          question_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_topics_exam_set_id_fkey"
            columns: ["exam_set_id"]
            isOneToOne: false
            referencedRelation: "exam_sets"
            referencedColumns: ["id"]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

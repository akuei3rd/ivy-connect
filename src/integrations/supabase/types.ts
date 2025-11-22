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
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          match_id: string
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id: string
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          invited_by: string
          joined_at: string | null
          permissions: string[] | null
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          invited_by: string
          joined_at?: string | null
          permissions?: string[] | null
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          invited_by?: string
          joined_at?: string | null
          permissions?: string[] | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      hiring_sessions: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          job_id: string | null
          max_candidates: number | null
          session_date: string
          slot_duration_minutes: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          job_id?: string | null
          max_candidates?: number | null
          session_date: string
          slot_duration_minutes?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          job_id?: string | null
          max_candidates?: number | null
          session_date?: string
          slot_duration_minutes?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hiring_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          cover_letter: string | null
          created_at: string | null
          id: string
          interview_scheduled: boolean | null
          job_id: string
          notes: string | null
          rating: number | null
          resume_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          interview_scheduled?: boolean | null
          job_id: string
          notes?: string | null
          rating?: number | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          interview_scheduled?: boolean | null
          job_id?: string
          notes?: string | null
          rating?: number | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          company_id: string
          created_at: string | null
          description: string
          id: string
          job_type: string | null
          location: string | null
          posted_by: string
          requirements: string[] | null
          salary_range: string | null
          seniority_level: string | null
          skills: string[] | null
          status: string | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description: string
          id?: string
          job_type?: string | null
          location?: string | null
          posted_by: string
          requirements?: string[] | null
          salary_range?: string | null
          seniority_level?: string | null
          skills?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string
          id?: string
          job_type?: string | null
          location?: string | null
          posted_by?: string
          requirements?: string[] | null
          salary_range?: string | null
          seniority_level?: string | null
          skills?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          room_id: string
          status: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          room_id: string
          status?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          room_id?: string
          status?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reposts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class_year: number
          created_at: string | null
          email: string
          full_name: string
          id: string
          interests: string[] | null
          major: string
          school: Database["public"]["Enums"]["ivy_school"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          class_year: number
          created_at?: string | null
          email: string
          full_name: string
          id: string
          interests?: string[] | null
          major: string
          school: Database["public"]["Enums"]["ivy_school"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          class_year?: number
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          interests?: string[] | null
          major?: string
          school?: Database["public"]["Enums"]["ivy_school"]
          updated_at?: string | null
        }
        Relationships: []
      }
      queue: {
        Row: {
          class_year_filter: number[] | null
          created_at: string | null
          id: string
          major_filter: string[] | null
          school_filter: Database["public"]["Enums"]["ivy_school"][] | null
          status: string | null
          user_id: string
        }
        Insert: {
          class_year_filter?: number[] | null
          created_at?: string | null
          id?: string
          major_filter?: string[] | null
          school_filter?: Database["public"]["Enums"]["ivy_school"][] | null
          status?: string | null
          user_id: string
        }
        Update: {
          class_year_filter?: number[] | null
          created_at?: string | null
          id?: string
          major_filter?: string[] | null
          school_filter?: Database["public"]["Enums"]["ivy_school"][] | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          match_id: string | null
          reason: string | null
          reported_user_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          reason?: string | null
          reported_user_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          reason?: string | null
          reported_user_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      session_registrations: {
        Row: {
          cover_letter: string | null
          id: string
          registered_at: string | null
          resume_url: string
          reviewed_at: string | null
          session_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          id?: string
          registered_at?: string | null
          resume_url: string
          reviewed_at?: string | null
          session_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          id?: string
          registered_at?: string | null
          resume_url?: string
          reviewed_at?: string | null
          session_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "hiring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_time_slots: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          registration_id: string
          room_name: string | null
          room_url: string | null
          session_id: string
          start_time: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          registration_id: string
          room_name?: string | null
          room_url?: string | null
          session_id: string
          start_time: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          registration_id?: string
          room_name?: string | null
          room_url?: string | null
          session_id?: string
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_time_slots_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "session_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_time_slots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "hiring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ivy_school:
        | "Princeton University"
        | "Harvard University"
        | "Yale University"
        | "Columbia University"
        | "Cornell University"
        | "Dartmouth College"
        | "Brown University"
        | "University of Pennsylvania"
      user_role: "student" | "employer" | "admin"
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
      ivy_school: [
        "Princeton University",
        "Harvard University",
        "Yale University",
        "Columbia University",
        "Cornell University",
        "Dartmouth College",
        "Brown University",
        "University of Pennsylvania",
      ],
      user_role: ["student", "employer", "admin"],
    },
  },
} as const

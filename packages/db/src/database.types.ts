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
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      ai_content_reports: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          reason: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          reason: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          reason?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_reports_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "ai_learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credit_ledger: {
        Row: {
          created_at: string
          delta: number
          entry_type: string
          id: string
          operation_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          entry_type: string
          id?: string
          operation_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          entry_type?: string
          id?: string
          operation_key?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_credit_reservations: {
        Row: {
          amount: number
          created_at: string
          id: string
          operation_key: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          operation_key: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          operation_key?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_credit_wallets: {
        Row: {
          available: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_generation_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_generation_jobs: {
        Row: {
          attempt_count: number
          error_code: string | null
          finished_at: string | null
          id: string
          idempotency_key: string
          queued_at: string
          resource_id: string
          resource_type: string
          stage: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          error_code?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key: string
          queued_at?: string
          resource_id: string
          resource_type: string
          stage?: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          error_code?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string
          queued_at?: string
          resource_id?: string
          resource_type?: string
          stage?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_learning_conversations: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          message: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          message: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          message?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "ai_learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_lessons: {
        Row: {
          content: Json | null
          created_at: string
          generation_started_at: string | null
          id: string
          module_id: string
          objectives: string[]
          position: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          generation_started_at?: string | null
          id?: string
          module_id: string
          objectives?: string[]
          position: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          generation_started_at?: string | null
          id?: string
          module_id?: string
          objectives?: string[]
          position?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "ai_learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_modules: {
        Row: {
          description: string
          estimated_minutes: number
          id: string
          objectives: string[]
          path_id: string
          position: number
          tags: string[]
          title: string
        }
        Insert: {
          description?: string
          estimated_minutes?: number
          id?: string
          objectives?: string[]
          path_id: string
          position: number
          tags?: string[]
          title: string
        }
        Update: {
          description?: string
          estimated_minutes?: number
          id?: string
          objectives?: string[]
          path_id?: string
          position?: number
          tags?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_modules_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "ai_learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_paths: {
        Row: {
          category: string
          created_at: string
          description: string
          estimated_minutes: number
          goal: string
          hours_per_week: number
          id: string
          level: string
          objectives: string[]
          preferred_language: string
          prerequisites: string[]
          prompt_version: number
          request_id: string
          status: string
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          estimated_minutes?: number
          goal: string
          hours_per_week: number
          id?: string
          level: string
          objectives?: string[]
          preferred_language?: string
          prerequisites?: string[]
          prompt_version?: number
          request_id: string
          status?: string
          title: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          estimated_minutes?: number
          goal?: string
          hours_per_week?: number
          id?: string
          level?: string
          objectives?: string[]
          preferred_language?: string
          prerequisites?: string[]
          prompt_version?: number
          request_id?: string
          status?: string
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_learning_progress: {
        Row: {
          completed_at: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "ai_learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_lesson_code_variants: {
        Row: {
          code_content: string
          created_at: string
          explanation: string
          generation_version: number
          id: string
          language: string
          lesson_id: string
        }
        Insert: {
          code_content: string
          created_at?: string
          explanation: string
          generation_version?: number
          id?: string
          language: string
          lesson_id: string
        }
        Update: {
          code_content?: string
          created_at?: string
          explanation?: string
          generation_version?: number
          id?: string
          language?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_lesson_code_variants_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "ai_learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_module_awards: {
        Row: {
          awarded_at: string
          id: string
          module_id: string | null
          points: number
          policy_version: string
          solve_id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          id?: string
          module_id?: string | null
          points: number
          policy_version?: string
          solve_id: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          id?: string
          module_id?: string | null
          points?: number
          policy_version?: string
          solve_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_module_awards_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "ai_learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_module_awards_solve_id_fkey"
            columns: ["solve_id"]
            isOneToOne: false
            referencedRelation: "solves"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommended_problems: {
        Row: {
          module_id: string
          position: number
          problem_id: string
        }
        Insert: {
          module_id: string
          position: number
          problem_id: string
        }
        Update: {
          module_id?: string
          position?: number
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommended_problems_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "ai_learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommended_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily: {
        Row: {
          chakra_earned: number
          day: string
          difficulty_breakdown: Json
          provider: string
          solves_count: number
          topic_breakdown: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          chakra_earned?: number
          day: string
          difficulty_breakdown?: Json
          provider: string
          solves_count?: number
          topic_breakdown?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          chakra_earned?: number
          day?: string
          difficulty_breakdown?: Json
          provider?: string
          solves_count?: number
          topic_breakdown?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_profiles: {
        Row: {
          onboarding_completed_at: string | null
          user_id: string
        }
        Insert: {
          onboarding_completed_at?: string | null
          user_id: string
        }
        Update: {
          onboarding_completed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          object_id: string | null
          object_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          object_id?: string | null
          object_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          object_id?: string | null
          object_type?: string
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          created_at: string
          current_end: string | null
          current_start: string | null
          id: string
          paid_count: number
          plan_id: string
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_end?: string | null
          current_start?: string | null
          id: string
          paid_count?: number
          plan_id: string
          status?: string
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_end?: string | null
          current_start?: string | null
          id?: string
          paid_count?: number
          plan_id?: string
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          problem_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          problem_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          problem_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_problems: {
        Row: {
          category: string
          comparator: string
          constraints: Json | null
          created_at: string
          difficulty: string
          id: string
          is_pro: boolean
          number: number | null
          pool: string
          signature: Json | null
          slug: string
          source: string
          source_ref: string | null
          source_url: string | null
          statement_md: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          comparator?: string
          constraints?: Json | null
          created_at?: string
          difficulty: string
          id?: string
          is_pro?: boolean
          number?: number | null
          pool?: string
          signature?: Json | null
          slug: string
          source?: string
          source_ref?: string | null
          source_url?: string | null
          statement_md?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          comparator?: string
          constraints?: Json | null
          created_at?: string
          difficulty?: string
          id?: string
          is_pro?: boolean
          number?: number | null
          pool?: string
          signature?: Json | null
          slug?: string
          source?: string
          source_ref?: string | null
          source_url?: string | null
          statement_md?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chakra_awards: {
        Row: {
          awarded_at: string
          difficulty_snapshot: Json
          id: string
          points: number
          policy_id: string
          problem_id: string
          solve_id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          difficulty_snapshot: Json
          id?: string
          points: number
          policy_id: string
          problem_id: string
          solve_id: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          difficulty_snapshot?: Json
          id?: string
          points?: number
          policy_id?: string
          problem_id?: string
          solve_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chakra_awards_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "chakra_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chakra_awards_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chakra_awards_solve_id_fkey"
            columns: ["solve_id"]
            isOneToOne: true
            referencedRelation: "solves"
            referencedColumns: ["id"]
          },
        ]
      }
      chakra_balance_cache: {
        Row: {
          balance: number
          refreshed_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          refreshed_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          refreshed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chakra_ledger: {
        Row: {
          actor_id: string | null
          award_id: string | null
          created_at: string
          delta: number
          entry_type: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          award_id?: string | null
          created_at?: string
          delta: number
          entry_type: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          award_id?: string | null
          created_at?: string
          delta?: number
          entry_type?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chakra_ledger_award_id_fkey"
            columns: ["award_id"]
            isOneToOne: false
            referencedRelation: "chakra_awards"
            referencedColumns: ["id"]
          },
        ]
      }
      chakra_policies: {
        Row: {
          approved_by: string | null
          cf_brackets: Json
          created_at: string
          effective_at: string
          id: string
          lc_difficulty_points: Json
          leetcode_awards_enabled: boolean
          status: string
          version: string
        }
        Insert: {
          approved_by?: string | null
          cf_brackets: Json
          created_at?: string
          effective_at: string
          id?: string
          lc_difficulty_points?: Json
          leetcode_awards_enabled?: boolean
          status: string
          version: string
        }
        Update: {
          approved_by?: string | null
          cf_brackets?: Json
          created_at?: string
          effective_at?: string
          id?: string
          lc_difficulty_points?: Json
          leetcode_awards_enabled?: boolean
          status?: string
          version?: string
        }
        Relationships: []
      }
      coding_profiles: {
        Row: {
          platform: string
          user_id: string
          username: string
          username_normalized: string | null
          verified_at: string
        }
        Insert: {
          platform: string
          user_id: string
          username: string
          username_normalized?: string | null
          verified_at?: string
        }
        Update: {
          platform?: string
          user_id?: string
          username?: string
          username_normalized?: string | null
          verified_at?: string
        }
        Relationships: []
      }
      coin_credit_exchanges: {
        Row: {
          coins: number
          created_at: string
          credits: number
          id: string
          operation_key: string
          user_id: string
        }
        Insert: {
          coins: number
          created_at?: string
          credits: number
          id?: string
          operation_key: string
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          credits?: number
          id?: string
          operation_key?: string
          user_id?: string
        }
        Relationships: []
      }
      college_aliases: {
        Row: {
          college_id: string
          created_at: string
          id: string
          normalized_alias: string
        }
        Insert: {
          college_id: string
          created_at?: string
          id?: string
          normalized_alias: string
        }
        Update: {
          college_id?: string
          created_at?: string
          id?: string
          normalized_alias?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_aliases_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      college_requests: {
        Row: {
          city: string
          college_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          id: string
          name: string
          normalized_name: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string
          status: string
          user_id: string
          website: string | null
        }
        Insert: {
          city: string
          college_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          id?: string
          name: string
          normalized_name: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state: string
          status?: string
          user_id: string
          website?: string | null
        }
        Update: {
          city?: string
          college_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          id?: string
          name?: string
          normalized_name?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string
          status?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "college_requests_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          acronym: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          normalized_name: string
          slug: string
          source: string | null
          source_ref: string | null
          source_updated_at: string | null
          state: string | null
          status: string
        }
        Insert: {
          acronym?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          normalized_name: string
          slug: string
          source?: string | null
          source_ref?: string | null
          source_updated_at?: string | null
          state?: string | null
          status?: string
        }
        Update: {
          acronym?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          normalized_name?: string
          slug?: string
          source?: string | null
          source_ref?: string | null
          source_updated_at?: string | null
          state?: string | null
          status?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      contest_events: {
        Row: {
          ends_at: string
          external_id: string
          fetched_at: string
          id: string
          provider: string
          starts_at: string
          title: string
          url: string
        }
        Insert: {
          ends_at: string
          external_id: string
          fetched_at?: string
          id?: string
          provider: string
          starts_at: string
          title: string
          url: string
        }
        Update: {
          ends_at?: string
          external_id?: string
          fetched_at?: string
          id?: string
          provider?: string
          starts_at?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      contest_subscriptions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_subscriptions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contest_events"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_problems: {
        Row: {
          date: string
          problem_id: string
        }
        Insert: {
          date: string
          problem_id: string
        }
        Update: {
          date?: string
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      editorials: {
        Row: {
          body_md: string
          problem_id: string
          solutions: Json
        }
        Insert: {
          body_md: string
          problem_id: string
          solutions?: Json
        }
        Update: {
          body_md?: string
          problem_id?: string
          solutions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "editorials_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: true
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          pro_until: string | null
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          pro_until?: string | null
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          pro_until?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hints: {
        Row: {
          body_md: string
          position: number
          problem_id: string
        }
        Insert: {
          body_md: string
          position: number
          problem_id: string
        }
        Update: {
          body_md?: string
          position?: number
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hints_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_answer_requests: {
        Row: {
          id: string
          question_id: string
          requested_at: string
          user_id: string
        }
        Insert: {
          id?: string
          question_id: string
          requested_at?: string
          user_id: string
        }
        Update: {
          id?: string
          question_id?: string
          requested_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_answer_requests_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_category_questions: {
        Row: {
          category_slug: string
          position: number
          question_id: string
        }
        Insert: {
          category_slug: string
          position: number
          question_id: string
        }
        Update: {
          category_slug?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_category_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_companies: {
        Row: {
          description: string
          name: string
          position: number
          published: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          description?: string
          name: string
          position?: number
          published?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          description?: string
          name?: string
          position?: number
          published?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_items: {
        Row: {
          answer_md: string | null
          companies: string[]
          created_at: string
          id: string
          kind: string
          question: string
          roles: string[]
          source_id: string | null
          source_table: string | null
        }
        Insert: {
          answer_md?: string | null
          companies?: string[]
          created_at?: string
          id?: string
          kind: string
          question: string
          roles?: string[]
          source_id?: string | null
          source_table?: string | null
        }
        Update: {
          answer_md?: string | null
          companies?: string[]
          created_at?: string
          id?: string
          kind?: string
          question?: string
          roles?: string[]
          source_id?: string | null
          source_table?: string | null
        }
        Relationships: []
      }
      interview_playlist_videos: {
        Row: {
          playlist_slug: string
          position: number
          question_id: string
        }
        Insert: {
          playlist_slug: string
          position: number
          question_id: string
        }
        Update: {
          playlist_slug?: string
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_playlist_videos_playlist_slug_fkey"
            columns: ["playlist_slug"]
            isOneToOne: false
            referencedRelation: "interview_playlists"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "interview_playlist_videos_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_playlists: {
        Row: {
          creator: string
          group_slug: string
          position: number
          slug: string
          source_url: string
          thumbnail_url: string
          title: string
        }
        Insert: {
          creator: string
          group_slug: string
          position: number
          slug: string
          source_url: string
          thumbnail_url: string
          title: string
        }
        Update: {
          creator?: string
          group_slug?: string
          position?: number
          slug?: string
          source_url?: string
          thumbnail_url?: string
          title?: string
        }
        Relationships: []
      }
      interview_question_content: {
        Row: {
          answer_code: string | null
          answer_text: string | null
          article_url: string | null
          question_id: string
          video_url: string | null
        }
        Insert: {
          answer_code?: string | null
          answer_text?: string | null
          article_url?: string | null
          question_id: string
          video_url?: string | null
        }
        Update: {
          answer_code?: string | null
          answer_text?: string | null
          article_url?: string | null
          question_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_question_content_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          difficulty: string | null
          id: string
          popularity: string | null
          published: boolean
          source: string
          tags: string[]
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          difficulty?: string | null
          id: string
          popularity?: string | null
          published?: boolean
          source: string
          tags?: string[]
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          difficulty?: string | null
          id?: string
          popularity?: string | null
          published?: boolean
          source?: string
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      interview_role_questions: {
        Row: {
          position: number
          question_id: string
          role_slug: string
        }
        Insert: {
          position: number
          question_id: string
          role_slug: string
        }
        Update: {
          position?: number
          question_id?: string
          role_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_role_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_role_questions_role_slug_fkey"
            columns: ["role_slug"]
            isOneToOne: false
            referencedRelation: "interview_roles"
            referencedColumns: ["slug"]
          },
        ]
      }
      interview_roles: {
        Row: {
          group_name: string
          position: number
          question_count: number
          slug: string
          source_url: string
          title: string
        }
        Insert: {
          group_name: string
          position: number
          question_count: number
          slug: string
          source_url: string
          title: string
        }
        Update: {
          group_name?: string
          position?: number
          question_count?: number
          slug?: string
          source_url?: string
          title?: string
        }
        Relationships: []
      }
      interview_sheet_questions: {
        Row: {
          company_slug: string
          position: number
          question_id: string
          source_url: string | null
        }
        Insert: {
          company_slug: string
          position: number
          question_id: string
          source_url?: string | null
        }
        Update: {
          company_slug?: string
          position?: number
          question_id?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_sheet_questions_company_slug_fkey"
            columns: ["company_slug"]
            isOneToOne: false
            referencedRelation: "interview_companies"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "interview_sheet_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_technical_questions: {
        Row: {
          position: number
          question_id: string
          sheet_slug: string
        }
        Insert: {
          position: number
          question_id: string
          sheet_slug: string
        }
        Update: {
          position?: number
          question_id?: string
          sheet_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_technical_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_technical_questions_sheet_slug_fkey"
            columns: ["sheet_slug"]
            isOneToOne: false
            referencedRelation: "interview_technical_sheets"
            referencedColumns: ["slug"]
          },
        ]
      }
      interview_technical_sheets: {
        Row: {
          group_name: string
          position: number
          question_count: number
          slug: string
          source_url: string
          title: string
        }
        Insert: {
          group_name: string
          position: number
          question_count: number
          slug: string
          source_url: string
          title: string
        }
        Update: {
          group_name?: string
          position?: number
          question_count?: number
          slug?: string
          source_url?: string
          title?: string
        }
        Relationships: []
      }
      interview_user_questions: {
        Row: {
          bookmarked: boolean
          completed: boolean
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bookmarked?: boolean
          completed?: boolean
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bookmarked?: boolean
          completed?: boolean
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_user_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_locks: {
        Row: {
          attempts: number
          job_key: string
          locked_until: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          job_key: string
          locked_until: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          job_key?: string
          locked_until?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          eligible_count: number
          id: string
          rank: number
          score: number
          secondary_sort: Json
          snapshot_id: string
          subject_id: string
          subject_type: string
        }
        Insert: {
          eligible_count?: number
          id?: string
          rank: number
          score: number
          secondary_sort?: Json
          snapshot_id: string
          subject_id: string
          subject_type: string
        }
        Update: {
          eligible_count?: number
          id?: string
          rank?: number
          score?: number
          secondary_sort?: Json
          snapshot_id?: string
          subject_id?: string
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          computed_at: string
          generation: number
          id: string
          metric: string
          period_end: string | null
          period_start: string | null
          policy_version: string | null
          scope: string
        }
        Insert: {
          computed_at?: string
          generation?: number
          id?: string
          metric: string
          period_end?: string | null
          period_start?: string | null
          policy_version?: string | null
          scope: string
        }
        Update: {
          computed_at?: string
          generation?: number
          id?: string
          metric?: string
          period_end?: string | null
          period_start?: string | null
          policy_version?: string | null
          scope?: string
        }
        Relationships: []
      }
      list_items: {
        Row: {
          added_at: string
          list_id: string
          position: number
          problem_id: string
        }
        Insert: {
          added_at?: string
          list_id: string
          position?: number
          problem_id: string
        }
        Update: {
          added_at?: string
          list_id?: string
          position?: number
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          competitive: boolean
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          reviewed_by: string | null
          role: string
          society_id: string
          status: string
          user_id: string
        }
        Insert: {
          competitive?: boolean
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          reviewed_by?: string | null
          role?: string
          society_id: string
          status?: string
          user_id: string
        }
        Update: {
          competitive?: boolean
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          reviewed_by?: string | null
          role?: string
          society_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          created_at: string
          id: string
          problem_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          problem_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          problem_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      outbox_events: {
        Row: {
          aggregate_id: string
          event_type: string
          id: string
          occurred_at: string
          payload: Json
          processed_at: string | null
        }
        Insert: {
          aggregate_id: string
          event_type: string
          id?: string
          occurred_at?: string
          payload: Json
          processed_at?: string | null
        }
        Update: {
          aggregate_id?: string
          event_type?: string
          id?: string
          occurred_at?: string
          payload?: Json
          processed_at?: string | null
        }
        Relationships: []
      }
      patterns: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          granted_at: string
          granted_by: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      problem_companies: {
        Row: {
          company_id: string
          frequency: number
          problem_id: string
          timeframe: string
        }
        Insert: {
          company_id: string
          frequency?: number
          problem_id: string
          timeframe: string
        }
        Update: {
          company_id?: string
          frequency?: number
          problem_id?: string
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_companies_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_languages: {
        Row: {
          harness_code: string
          lang: string
          max_total_ms: number
          memory_kb: number
          problem_id: string
          starter_code: string
          time_limit_ms: number
        }
        Insert: {
          harness_code: string
          lang: string
          max_total_ms: number
          memory_kb: number
          problem_id: string
          starter_code: string
          time_limit_ms: number
        }
        Update: {
          harness_code?: string
          lang?: string
          max_total_ms?: number
          memory_kb?: number
          problem_id?: string
          starter_code?: string
          time_limit_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "problem_languages_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_patterns: {
        Row: {
          pattern_id: string
          problem_id: string
        }
        Insert: {
          pattern_id: string
          problem_id: string
        }
        Update: {
          pattern_id?: string
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_patterns_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_patterns_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_tags: {
        Row: {
          problem_id: string
          tag_id: string
        }
        Insert: {
          problem_id: string
          tag_id: string
        }
        Update: {
          problem_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_tags_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          active: boolean
          cf_rating: number | null
          external_problem_id: string
          id: string
          last_synced_at: string | null
          lc_difficulty: string | null
          provider: string
          tags: string[]
          title: string
          url: string
        }
        Insert: {
          active?: boolean
          cf_rating?: number | null
          external_problem_id: string
          id?: string
          last_synced_at?: string | null
          lc_difficulty?: string | null
          provider: string
          tags?: string[]
          title: string
          url: string
        }
        Update: {
          active?: boolean
          cf_rating?: number | null
          external_problem_id?: string
          id?: string
          last_synced_at?: string | null
          lc_difficulty?: string | null
          provider?: string
          tags?: string[]
          title?: string
          url?: string
        }
        Relationships: []
      }
      profile_verification_challenges: {
        Row: {
          attempt_count: number
          created_at: string
          expires_at: string
          platform: string
          token_hash: string
          user_id: string
          username: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          expires_at: string
          platform: string
          token_hash: string
          user_id: string
          username: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          expires_at?: string
          platform?: string
          token_hash?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      profile_verification_events: {
        Row: {
          created_at: string
          event: string
          id: number
          platform: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: never
          platform: string
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: never
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academic_year: string | null
          avatar_url: string | null
          bio: string
          chakra_activated_at: string
          college_id: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          github_url: string | null
          id: string
          is_public: boolean
          linkedin_url: string | null
          onboarding_completed_at: string | null
          onboarding_step: number
          preferences: Json
          updated_at: string
          username: string | null
          website_url: string | null
          x_url: string | null
        }
        Insert: {
          academic_year?: string | null
          avatar_url?: string | null
          bio?: string
          chakra_activated_at?: string
          college_id?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          github_url?: string | null
          id: string
          is_public?: boolean
          linkedin_url?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number
          preferences?: Json
          updated_at?: string
          username?: string | null
          website_url?: string | null
          x_url?: string | null
        }
        Update: {
          academic_year?: string | null
          avatar_url?: string | null
          bio?: string
          chakra_activated_at?: string
          college_id?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          github_url?: string | null
          id?: string
          is_public?: boolean
          linkedin_url?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number
          preferences?: Json
          updated_at?: string
          username?: string | null
          website_url?: string | null
          x_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_rating_history: {
        Row: {
          contest_at: string
          contest_id: string
          contest_name: string | null
          contest_rank: number | null
          id: string
          provider: string
          rating_after: number
          rating_before: number | null
          user_id: string
        }
        Insert: {
          contest_at: string
          contest_id: string
          contest_name?: string | null
          contest_rank?: number | null
          id?: string
          provider: string
          rating_after: number
          rating_before?: number | null
          user_id: string
        }
        Update: {
          contest_at?: string
          contest_id?: string
          contest_name?: string | null
          contest_rank?: number | null
          id?: string
          provider?: string
          rating_after?: number
          rating_before?: number | null
          user_id?: string
        }
        Relationships: []
      }
      provider_snapshots: {
        Row: {
          history_complete: boolean
          last_synced_at: string | null
          profile: Json
          provider: string
          submissions_complete: boolean
          summary: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          history_complete?: boolean
          last_synced_at?: string | null
          profile?: Json
          provider: string
          submissions_complete?: boolean
          summary?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          history_complete?: boolean
          last_synced_at?: string | null
          profile?: Json
          provider?: string
          submissions_complete?: boolean
          summary?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_submissions: {
        Row: {
          contest_id: number | null
          fetched_at: string
          id: string
          language: string | null
          memory_bytes: number | null
          participant_type: string | null
          problem_id: string | null
          provider: string
          provider_submission_id: string
          relative_time_seconds: number | null
          runtime_ms: number | null
          submitted_at: string
          user_id: string
          verdict: string
        }
        Insert: {
          contest_id?: number | null
          fetched_at?: string
          id?: string
          language?: string | null
          memory_bytes?: number | null
          participant_type?: string | null
          problem_id?: string | null
          provider: string
          provider_submission_id: string
          relative_time_seconds?: number | null
          runtime_ms?: number | null
          submitted_at: string
          user_id: string
          verdict: string
        }
        Update: {
          contest_id?: number | null
          fetched_at?: string
          id?: string
          language?: string | null
          memory_bytes?: number | null
          participant_type?: string | null
          problem_id?: string | null
          provider?: string
          provider_submission_id?: string
          relative_time_seconds?: number | null
          runtime_ms?: number | null
          submitted_at?: string
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_sync_cursors: {
        Row: {
          cursor: Json | null
          id: string
          last_success_at: string | null
          provider: string
          stream: string
          user_id: string
        }
        Insert: {
          cursor?: Json | null
          id?: string
          last_success_at?: string | null
          provider: string
          stream: string
          user_id: string
        }
        Update: {
          cursor?: Json | null
          id?: string
          last_success_at?: string | null
          provider?: string
          stream?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_sync_runs: {
        Row: {
          coding_profile_user_id: string
          created_at: string
          cursor: Json | null
          error_code: string | null
          finished_at: string | null
          id: string
          job_type: string
          provider: string
          started_at: string | null
          status: string
        }
        Insert: {
          coding_profile_user_id: string
          created_at?: string
          cursor?: Json | null
          error_code?: string | null
          finished_at?: string | null
          id?: string
          job_type: string
          provider: string
          started_at?: string | null
          status: string
        }
        Update: {
          coding_profile_user_id?: string
          created_at?: string
          cursor?: Json | null
          error_code?: string | null
          finished_at?: string | null
          id?: string
          job_type?: string
          provider?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_sync_runs_coding_profile_user_id_provider_fkey"
            columns: ["coding_profile_user_id", "provider"]
            isOneToOne: false
            referencedRelation: "coding_profiles"
            referencedColumns: ["user_id", "platform"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          answer_index: number
          id: string
          options: Json
          position: number
          question: string
          topic_id: string
          why: string | null
        }
        Insert: {
          answer_index: number
          id?: string
          options: Json
          position: number
          question: string
          topic_id: string
          why?: string | null
        }
        Update: {
          answer_index?: number
          id?: string
          options?: Json
          position?: number
          question?: string
          topic_id?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_layers: {
        Row: {
          id: string
          name: string
          position: number
          track_id: string
        }
        Insert: {
          id?: string
          name: string
          position: number
          track_id: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_layers_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_collaborators: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          role: string
          sheet_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          role?: string
          sheet_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          role?: string
          sheet_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_collaborators_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "training_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_follows: {
        Row: {
          created_at: string
          id: string
          sheet_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sheet_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          sheet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_follows_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "training_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      societies: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          college_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          join_policy: string
          logo_url: string | null
          name: string
          slug: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          college_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          join_policy?: string
          logo_url?: string | null
          name: string
          slug: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          college_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          join_policy?: string
          logo_url?: string | null
          name?: string
          slug?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "societies_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      society_activity_policies: {
        Row: {
          maximum_inactive_days: number
          minimum_weekly_solves: number
          society_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          maximum_inactive_days?: number
          minimum_weekly_solves?: number
          society_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          maximum_inactive_days?: number
          minimum_weekly_solves?: number
          society_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "society_activity_policies_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: true
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      society_analytics_daily: {
        Row: {
          active_members: number
          chakra: number
          day: string
          eligible_members: number
          society_id: string
          solves: number
          updated_at: string
        }
        Insert: {
          active_members?: number
          chakra?: number
          day: string
          eligible_members?: number
          society_id: string
          solves?: number
          updated_at?: string
        }
        Update: {
          active_members?: number
          chakra?: number
          day?: string
          eligible_members?: number
          society_id?: string
          solves?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_analytics_daily_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      society_announcement_revisions: {
        Row: {
          announcement_id: string
          changed_at: string
          editor_id: string | null
          id: string
          old_body: string
          old_title: string
        }
        Insert: {
          announcement_id: string
          changed_at?: string
          editor_id?: string | null
          id?: string
          old_body: string
          old_title: string
        }
        Update: {
          announcement_id?: string
          changed_at?: string
          editor_id?: string | null
          id?: string
          old_body?: string
          old_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_announcement_revisions_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "society_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      society_announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          pinned: boolean
          published_at: string
          society_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          pinned?: boolean
          published_at?: string
          society_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          published_at?: string
          society_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_announcements_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      society_applications: {
        Row: {
          applicant_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          evidence_path: string | null
          id: string
          society_id: string
          status: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          evidence_path?: string | null
          id?: string
          society_id: string
          status?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          evidence_path?: string | null
          id?: string
          society_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_applications_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      society_contest_editors: {
        Row: {
          assigned_by: string
          contest_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          contest_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          contest_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_contest_editors_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "society_contests"
            referencedColumns: ["id"]
          },
        ]
      }
      society_contest_final_standings: {
        Row: {
          contest_id: string
          finalized_at: string
          standings: Json
        }
        Insert: {
          contest_id: string
          finalized_at?: string
          standings: Json
        }
        Update: {
          contest_id?: string
          finalized_at?: string
          standings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "society_contest_final_standings_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: true
            referencedRelation: "society_contests"
            referencedColumns: ["id"]
          },
        ]
      }
      society_contest_problems: {
        Row: {
          catalog_problem_id: string | null
          contest_id: string
          difficulty: string | null
          evaluation: string
          id: string
          label: string
          position: number
          score: number
          source: string
          statement: string | null
          tags: string[]
          title: string
          url: string | null
        }
        Insert: {
          catalog_problem_id?: string | null
          contest_id: string
          difficulty?: string | null
          evaluation?: string
          id?: string
          label: string
          position?: number
          score?: number
          source: string
          statement?: string | null
          tags?: string[]
          title: string
          url?: string | null
        }
        Update: {
          catalog_problem_id?: string | null
          contest_id?: string
          difficulty?: string | null
          evaluation?: string
          id?: string
          label?: string
          position?: number
          score?: number
          source?: string
          statement?: string | null
          tags?: string[]
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "society_contest_problems_catalog_problem_id_fkey"
            columns: ["catalog_problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "society_contest_problems_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "society_contests"
            referencedColumns: ["id"]
          },
        ]
      }
      society_contest_registrations: {
        Row: {
          cf_handle: string | null
          contest_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          cf_handle?: string | null
          contest_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          cf_handle?: string | null
          contest_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_contest_registrations_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "society_contests"
            referencedColumns: ["id"]
          },
        ]
      }
      society_contest_submissions: {
        Row: {
          contest_id: string
          created_at: string
          evaluation: string
          id: string
          problem_id: string
          proof_url: string | null
          provider_submission_id: string | null
          submitted_at: string
          user_id: string
          verdict: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          contest_id: string
          created_at?: string
          evaluation?: string
          id?: string
          problem_id: string
          proof_url?: string | null
          provider_submission_id?: string | null
          submitted_at?: string
          user_id: string
          verdict?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          contest_id?: string
          created_at?: string
          evaluation?: string
          id?: string
          problem_id?: string
          proof_url?: string | null
          provider_submission_id?: string | null
          submitted_at?: string
          user_id?: string
          verdict?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "society_contest_submissions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "society_contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "society_contest_submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "society_contest_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      society_contest_sync_state: {
        Row: {
          complete: boolean
          contest_id: string
          last_synced_at: string | null
          next_from: number
          updated_at: string
          user_id: string
        }
        Insert: {
          complete?: boolean
          contest_id: string
          last_synced_at?: string | null
          next_from?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          complete?: boolean
          contest_id?: string
          last_synced_at?: string | null
          next_from?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_contest_sync_state_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "society_contests"
            referencedColumns: ["id"]
          },
        ]
      }
      society_contests: {
        Row: {
          cf_verified_only: boolean
          created_at: string
          created_by: string
          description: string
          ends_at: string
          finalized_at: string | null
          freeze_at: string | null
          id: string
          instructions: string
          registration_deadline: string
          scoring: string
          society_id: string
          starts_at: string
          state: string
          title: string
          updated_at: string
          visibility: string
          wrong_penalty_minutes: number
        }
        Insert: {
          cf_verified_only?: boolean
          created_at?: string
          created_by: string
          description?: string
          ends_at: string
          finalized_at?: string | null
          freeze_at?: string | null
          id?: string
          instructions?: string
          registration_deadline: string
          scoring?: string
          society_id: string
          starts_at: string
          state?: string
          title: string
          updated_at?: string
          visibility?: string
          wrong_penalty_minutes?: number
        }
        Update: {
          cf_verified_only?: boolean
          created_at?: string
          created_by?: string
          description?: string
          ends_at?: string
          finalized_at?: string | null
          freeze_at?: string | null
          id?: string
          instructions?: string
          registration_deadline?: string
          scoring?: string
          society_id?: string
          starts_at?: string
          state?: string
          title?: string
          updated_at?: string
          visibility?: string
          wrong_penalty_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "society_contests_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      society_email_outbox: {
        Row: {
          attempts: number
          body: string
          created_at: string
          href: string
          id: string
          last_error: string | null
          locked_until: string | null
          next_attempt_at: string
          notification_id: string
          provider_id: string | null
          recipient_email: string
          recipient_id: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          attempts?: number
          body?: string
          created_at?: string
          href: string
          id?: string
          last_error?: string | null
          locked_until?: string | null
          next_attempt_at?: string
          notification_id: string
          provider_id?: string | null
          recipient_email: string
          recipient_id: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          attempts?: number
          body?: string
          created_at?: string
          href?: string
          id?: string
          last_error?: string | null
          locked_until?: string | null
          next_attempt_at?: string
          notification_id?: string
          provider_id?: string | null
          recipient_email?: string
          recipient_id?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_email_outbox_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: true
            referencedRelation: "society_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      society_email_preferences: {
        Row: {
          contest_updates: boolean
          society_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          contest_updates?: boolean
          society_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          contest_updates?: boolean
          society_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      society_invites: {
        Row: {
          created_at: string
          society_id: string
          token: string
        }
        Insert: {
          created_at?: string
          society_id: string
          token?: string
        }
        Update: {
          created_at?: string
          society_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_invites_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: true
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      society_moderator_permissions: {
        Row: {
          manage_contests: boolean
          manage_members: boolean
          membership_id: string
          review_requests: boolean
          updated_at: string
          updated_by: string | null
          view_activity: boolean
        }
        Insert: {
          manage_contests?: boolean
          manage_members?: boolean
          membership_id: string
          review_requests?: boolean
          updated_at?: string
          updated_by?: string | null
          view_activity?: boolean
        }
        Update: {
          manage_contests?: boolean
          manage_members?: boolean
          membership_id?: string
          review_requests?: boolean
          updated_at?: string
          updated_by?: string | null
          view_activity?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "society_moderator_permissions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      society_notifications: {
        Row: {
          body: string | null
          created_at: string
          event_key: string
          href: string
          id: string
          kind: string
          read_at: string | null
          recipient_id: string
          society_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          event_key: string
          href: string
          id?: string
          kind: string
          read_at?: string | null
          recipient_id: string
          society_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          event_key?: string
          href?: string
          id?: string
          kind?: string
          read_at?: string | null
          recipient_id?: string
          society_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_notifications_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      society_warnings: {
        Row: {
          acknowledged_at: string | null
          admin_id: string
          created_at: string
          explanation: string | null
          id: string
          member_id: string
          message: string
          reason: string
          society_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          admin_id: string
          created_at?: string
          explanation?: string | null
          id?: string
          member_id: string
          message: string
          reason: string
          society_id: string
        }
        Update: {
          acknowledged_at?: string | null
          admin_id?: string
          created_at?: string
          explanation?: string | null
          id?: string
          member_id?: string
          message?: string
          reason?: string
          society_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_warnings_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      solves: {
        Row: {
          created_at: string
          first_accepted_at: string
          id: string
          problem_id: string
          proof_status: string
          proof_submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_accepted_at: string
          id?: string
          problem_id: string
          proof_status: string
          proof_submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_accepted_at?: string
          id?: string
          problem_id?: string
          proof_status?: string
          proof_submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solves_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      study_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          question_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          question_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          question_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_notes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "workspace_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plan_items: {
        Row: {
          module: string | null
          plan_id: string
          position: number
          problem_id: string
        }
        Insert: {
          module?: string | null
          plan_id: string
          position: number
          problem_id: string
        }
        Update: {
          module?: string | null
          plan_id?: string
          position?: number
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plan_items_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          id: string
          is_pro: boolean
          name: string
          position: number
          slug: string
          summary: string | null
        }
        Insert: {
          id?: string
          is_pro?: boolean
          name: string
          position?: number
          slug: string
          summary?: string | null
        }
        Update: {
          id?: string
          is_pro?: boolean
          name?: string
          position?: number
          slug?: string
          summary?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          code: string
          context: string
          created_at: string
          id: string
          lang: string
          memory_kb: number | null
          mode: string
          problem_id: string
          results: Json | null
          runtime_ms: number | null
          status: string
          user_id: string
          verdict: string | null
        }
        Insert: {
          code: string
          context?: string
          created_at?: string
          id?: string
          lang: string
          memory_kb?: number | null
          mode: string
          problem_id: string
          results?: Json | null
          runtime_ms?: number | null
          status?: string
          user_id: string
          verdict?: string | null
        }
        Update: {
          code?: string
          context?: string
          created_at?: string
          id?: string
          lang?: string
          memory_kb?: number | null
          mode?: string
          problem_id?: string
          results?: Json | null
          runtime_ms?: number | null
          status?: string
          user_id?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_jobs: {
        Row: {
          attempts: number
          created_at: string
          cursor: Json
          error_code: string | null
          id: string
          lease_token: string | null
          leased_until: string | null
          provider: string
          run_after: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          cursor?: Json
          error_code?: string | null
          id?: string
          lease_token?: string | null
          leased_until?: string | null
          provider: string
          run_after?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          cursor?: Json
          error_code?: string | null
          id?: string
          lease_token?: string | null
          leased_until?: string | null
          provider?: string
          run_after?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      test_cases: {
        Row: {
          expected_output: Json
          explain_md: string | null
          id: string
          input: Json
          is_hidden: boolean
          position: number
          problem_id: string
        }
        Insert: {
          expected_output: Json
          explain_md?: string | null
          id?: string
          input: Json
          is_hidden?: boolean
          position: number
          problem_id: string
        }
        Update: {
          expected_output?: Json
          explain_md?: string | null
          id?: string
          input?: Json
          is_hidden?: boolean
          position?: number
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_problems: {
        Row: {
          position: number
          problem_id: string
          topic_id: string
        }
        Insert: {
          position: number
          problem_id: string
          topic_id: string
        }
        Update: {
          position?: number
          problem_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_problems_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          free_ratio: number
          icon_url: string | null
          id: string
          layer_id: string
          lesson_path: string | null
          name: string
          position: number
          slug: string
        }
        Insert: {
          free_ratio?: number
          icon_url?: string | null
          id?: string
          layer_id: string
          lesson_path?: string | null
          name: string
          position: number
          slug: string
        }
        Update: {
          free_ratio?: number
          icon_url?: string | null
          id?: string
          layer_id?: string
          lesson_path?: string | null
          name?: string
          position?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "roadmap_layers"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          slug: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          slug: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          slug?: string
          status?: string
        }
        Relationships: []
      }
      training_items: {
        Row: {
          id: string
          position: number
          problem_id: string
          training_list_id: string
        }
        Insert: {
          id?: string
          position: number
          problem_id: string
          training_list_id: string
        }
        Update: {
          id?: string
          position?: number
          problem_id?: string
          training_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_items_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_items_training_list_id_fkey"
            columns: ["training_list_id"]
            isOneToOne: false
            referencedRelation: "training_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      training_lists: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          source_url: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          source_url?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          source_url?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      user_problem_status: {
        Row: {
          problem_id: string
          solved_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          problem_id: string
          solved_at?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          problem_id?: string
          solved_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_problem_status_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "catalog_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      user_topic_progress: {
        Row: {
          completed_at: string | null
          lesson_read_at: string | null
          quiz_passed_at: string | null
          topic_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          lesson_read_at?: string | null
          quiz_passed_at?: string | null
          topic_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          lesson_read_at?: string | null
          quiz_passed_at?: string | null
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          feature: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          feature: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          feature?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      workspace_questions: {
        Row: {
          created_at: string
          custom_tags: string[]
          id: string
          last_reviewed_at: string | null
          problem_id: string
          starred: boolean
          study_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_tags?: string[]
          id?: string
          last_reviewed_at?: string | null
          problem_id: string
          starred?: boolean
          study_status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          custom_tags?: string[]
          id?: string
          last_reviewed_at?: string | null
          problem_id?: string
          starred?: boolean
          study_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_questions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_society_warning: {
        Args: { p_explanation?: string; p_warning: string }
        Returns: undefined
      }
      add_sheet_problem: {
        Args: { p_problem: string; p_sheet: string }
        Returns: undefined
      }
      add_society_contest_problem: {
        Args: {
          p_contest: string
          p_difficulty: string
          p_label: string
          p_score: number
          p_source: string
          p_statement: string
          p_tags: string[]
          p_title: string
          p_url: string
        }
        Returns: string
      }
      apply_billing_cycle: {
        Args: {
          p_end: string
          p_paid_count: number
          p_start: string
          p_status: string
          p_subscription: string
        }
        Returns: Json
      }
      apply_to_society: { Args: { p_society_id: string }; Returns: string }
      award_pending_cf_solves: { Args: { p_user_id: string }; Returns: number }
      can_edit_sheet: { Args: { p_sheet: string }; Returns: boolean }
      can_read_sheet: { Args: { p_sheet: string }; Returns: boolean }
      claim_society_contest_submission: {
        Args: { p_problem: string; p_proof_url: string }
        Returns: string
      }
      claim_society_email_batch: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          body: string
          created_at: string
          href: string
          id: string
          last_error: string | null
          locked_until: string | null
          next_attempt_at: string
          notification_id: string
          provider_id: string | null
          recipient_email: string
          recipient_id: string
          sent_at: string | null
          status: string
          subject: string
        }[]
        SetofOptions: {
          from: "*"
          to: "society_email_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_symm_module_award: { Args: { p_module: string }; Returns: number }
      claim_verified_profile: {
        Args: {
          p_platform: string
          p_token_hash: string
          p_user: string
          p_username: string
        }
        Returns: string
      }
      community_review_queue: { Args: never; Returns: Json }
      consume_challenge_attempt: {
        Args: {
          p_platform: string
          p_token_hash: string
          p_user: string
          p_username: string
        }
        Returns: Json
      }
      contest_can_edit: { Args: { p_contest: string }; Returns: boolean }
      contest_problem_visible: { Args: { p_contest: string }; Returns: boolean }
      contest_subscription_counts: {
        Args: { p_events: string[] }
        Returns: {
          event_id: string
          subscribers: number
        }[]
      }
      create_owned_challenge: {
        Args: {
          p_platform: string
          p_token_hash: string
          p_user: string
          p_username: string
        }
        Returns: string
      }
      create_society_contest: {
        Args: {
          p_description: string
          p_ends_at: string
          p_freeze_at?: string
          p_instructions: string
          p_registration_deadline: string
          p_scoring: string
          p_society: string
          p_starts_at: string
          p_title: string
          p_visibility: string
          p_wrong_penalty: number
        }
        Returns: string
      }
      delete_society_announcement: {
        Args: { p_announcement: string; p_society: string }
        Returns: undefined
      }
      delete_society_contest: {
        Args: { p_contest: string }
        Returns: undefined
      }
      enqueue_due_profile_syncs: { Args: { p_limit?: number }; Returns: number }
      ensure_ai_credit_wallet: { Args: { p_user: string }; Returns: number }
      exchange_coins_for_ai_credits: {
        Args: { p_coins: number; p_operation_key: string; p_user: string }
        Returns: Json
      }
      finish_ai_credit_reservation: {
        Args: { p_operation_key: string; p_succeeded: boolean; p_user: string }
        Returns: Json
      }
      get_my_portfolio_summary: { Args: never; Returns: Json }
      get_public_leaderboard_labels: {
        Args: { p_user_ids: string[] }
        Returns: {
          id: string
          label: string
        }[]
      }
      get_public_portfolio: { Args: { p_username: string }; Returns: Json }
      get_public_profile: {
        Args: { p_username: string }
        Returns: {
          avatar_url: string
          coding_profiles: Json
          created_at: string
          display_name: string
          username: string
        }[]
      }
      get_society_invite: { Args: { p_society: string }; Returns: string }
      has_pro_entitlement: { Args: never; Returns: boolean }
      ingest_cf_page: {
        Args: { p_job_id: string; p_lease_token: string; p_submissions: Json }
        Returns: number
      }
      ingest_society_cf_submissions: {
        Args: {
          p_contest: string
          p_handle: string
          p_submissions: Json
          p_user: string
        }
        Returns: number
      }
      invite_sheet_member: {
        Args: { p_role?: string; p_sheet: string; p_username: string }
        Returns: string
      }
      is_platform_admin: { Args: never; Returns: boolean }
      join_society_invite: { Args: { p_token: string }; Returns: string }
      lease_sync_job: {
        Args: never
        Returns: {
          attempts: number
          created_at: string
          cursor: Json
          error_code: string | null
          id: string
          lease_token: string | null
          leased_until: string | null
          provider: string
          run_after: string
          status: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "sync_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_society_membership_requests: {
        Args: { p_slug: string }
        Returns: {
          applicant_name: string
          id: string
          requested_at: string
        }[]
      }
      mark_society_notifications_read: {
        Args: { p_ids?: string[] }
        Returns: number
      }
      pending_sheet_invitations: {
        Args: never
        Returns: {
          id: string
          role: string
          sheet_id: string
          title: string
        }[]
      }
      preview_society_invite: { Args: { p_token: string }; Returns: Json }
      public_society_members: {
        Args: { p_offset?: number; p_society: string }
        Returns: {
          display_name: string
          joined_at: string
          role: string
          username: string
        }[]
      }
      public_society_summary: {
        Args: { p_societies: string[] }
        Returns: {
          average_cf_rating: number
          eligible_members: number
          id: string
          members: number
        }[]
      }
      publish_society_announcement: {
        Args: {
          p_body: string
          p_pinned?: boolean
          p_society: string
          p_title: string
        }
        Returns: string
      }
      queue_symm_credit_path: {
        Args: { p_input: Json; p_user: string }
        Returns: Json
      }
      read_leaderboard: {
        Args: {
          p_college?: string
          p_country?: string
          p_limit?: number
          p_metric?: string
          p_offset?: number
          p_scope?: string
          p_society?: string
        }
        Returns: Json
      }
      read_society_admin: { Args: { p_society: string }; Returns: Json }
      read_society_contest: { Args: { p_contest: string }; Returns: Json }
      read_society_contest_standings: {
        Args: { p_contest: string }
        Returns: Json
      }
      read_society_contests: { Args: { p_society: string }; Returns: Json }
      read_society_workspace: { Args: { p_society: string }; Returns: Json }
      read_verified_solve_leaderboard: {
        Args: {
          p_college?: string
          p_limit?: number
          p_offset?: number
          p_period: string
          p_society?: string
        }
        Returns: Json
      }
      register_society: {
        Args: {
          p_college: string
          p_description: string
          p_evidence: string
          p_name: string
          p_slug: string
        }
        Returns: string
      }
      register_society_contest: {
        Args: { p_contest: string }
        Returns: undefined
      }
      remove_society_contest_problem: {
        Args: { p_problem: string }
        Returns: undefined
      }
      remove_society_member: {
        Args: { p_membership: string }
        Returns: undefined
      }
      reorder_society_contest_problems: {
        Args: { p_contest: string; p_items: Json }
        Returns: undefined
      }
      request_college: {
        Args: {
          p_city: string
          p_name: string
          p_state: string
          p_website?: string
        }
        Returns: string
      }
      request_provider_sync: { Args: { p_provider: string }; Returns: string }
      reserve_ai_credits: {
        Args: { p_amount: number; p_operation_key: string; p_user: string }
        Returns: Json
      }
      reserve_symm_generation: { Args: { p_kind: string }; Returns: boolean }
      respond_sheet_invitation: {
        Args: { p_accept: boolean; p_invite: string }
        Returns: undefined
      }
      review_community_request: {
        Args: {
          p_approve: boolean
          p_college?: string
          p_id: string
          p_kind: string
          p_reason?: string
        }
        Returns: undefined
      }
      review_society_membership: {
        Args: { p_decision: string; p_membership_id: string }
        Returns: boolean
      }
      save_onboarding: {
        Args: {
          p_academic_year: string
          p_college_id: string
          p_display_name: string
          p_step: number
        }
        Returns: {
          academic_year: string | null
          avatar_url: string | null
          bio: string
          chakra_activated_at: string
          college_id: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          github_url: string | null
          id: string
          is_public: boolean
          linkedin_url: string | null
          onboarding_completed_at: string | null
          onboarding_step: number
          preferences: Json
          updated_at: string
          username: string | null
          website_url: string | null
          x_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      search_colleges: {
        Args: { p_query: string }
        Returns: {
          city: string
          id: string
          name: string
          state: string
        }[]
      }
      search_society_leaderboard: {
        Args: {
          p_college: string
          p_country: string
          p_limit: number
          p_metric: string
          p_offset: number
          p_search: string
          p_society: string
        }
        Returns: Json
      }
      send_society_warning: {
        Args: {
          p_member: string
          p_message: string
          p_reason: string
          p_society: string
        }
        Returns: string
      }
      set_leaderboard_college: {
        Args: { p_college: string }
        Returns: undefined
      }
      set_society_contest_editor: {
        Args: { p_approved: boolean; p_contest: string; p_user: string }
        Returns: undefined
      }
      set_society_contest_state: {
        Args: { p_contest: string; p_state: string }
        Returns: undefined
      }
      set_society_moderator: {
        Args: {
          p_manage_contests?: boolean
          p_manage_members?: boolean
          p_membership: string
          p_promote: boolean
          p_review_requests?: boolean
          p_view_activity?: boolean
        }
        Returns: undefined
      }
      set_society_policy: {
        Args: {
          p_inactive_days: number
          p_join_policy: string
          p_society: string
          p_weekly_solves: number
        }
        Returns: undefined
      }
      sheet_follower_counts: {
        Args: { p_sheets: string[] }
        Returns: {
          followers: number
          sheet_id: string
        }[]
      }
      society_can: {
        Args: { p_action: string; p_society: string }
        Returns: boolean
      }
      subscribe_to_contest: { Args: { p_event: string }; Returns: undefined }
      sync_society_codeforces_submissions: {
        Args: { p_contest: string }
        Returns: number
      }
      update_society_contest: {
        Args: {
          p_contest: string
          p_description: string
          p_ends_at: string
          p_freeze_at: string
          p_instructions: string
          p_registration_deadline: string
          p_scoring: string
          p_starts_at: string
          p_title: string
          p_visibility: string
          p_wrong_penalty: number
        }
        Returns: undefined
      }
      verify_society_contest_submission: {
        Args: { p_accept: boolean; p_submission: string }
        Returns: undefined
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

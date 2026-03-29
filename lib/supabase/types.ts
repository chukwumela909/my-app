export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: "admin" | "super_admin";
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role?: "admin" | "super_admin";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role?: "admin" | "super_admin";
          created_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          admission_number: string;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          current_class_id: string;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admission_number: string;
          first_name: string;
          middle_name?: string | null;
          last_name: string;
          current_class_id: string;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admission_number?: string;
          first_name?: string;
          middle_name?: string | null;
          last_name?: string;
          current_class_id?: string;
          photo_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_current_class_id_fkey";
            columns: ["current_class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          id: string;
          name: string;
          level: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          level: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          level?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      results: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          session: string;
          term: string;
          ca_score: number;
          exam_score: number;
          total: number;
          grade: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id: string;
          session: string;
          term: string;
          ca_score: number;
          exam_score: number;
          total: number;
          grade: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject_id?: string;
          session?: string;
          term?: string;
          ca_score?: number;
          exam_score?: number;
          total?: number;
          grade?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "results_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "results_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      access_tokens: {
        Row: {
          id: string;
          student_id: string;
          pin_hash: string;
          usage_limit: number;
          used_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          pin_hash: string;
          usage_limit?: number;
          used_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          pin_hash?: string;
          usage_limit?: number;
          used_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "access_tokens_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

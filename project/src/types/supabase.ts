export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      interviews: {
        Row: {
          id: string;
          user_id: string;
          difficulty: string;
          duration: number;
          score: number | null;
          feedback: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          difficulty: string;
          duration: number;
          score?: number | null;
          feedback?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          difficulty?: string;
          duration?: number;
          score?: number | null;
          feedback?: any | null;
          created_at?: string;
        };
      };
    };
  };
}
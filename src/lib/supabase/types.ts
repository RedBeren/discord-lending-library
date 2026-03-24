export type Database = {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          discord_id: string;
          discord_username: string;
        };
        Insert: {
          id: string;
          discord_id: string;
          discord_username: string;
        };
        Update: {
          discord_username?: string;
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          title: string;
          author: string;
          isbn_13: string | null;
          cover_url: string | null;
          avg_rating: number | null;
          description: string | null;
          year_published: number | null;
          google_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          author: string;
          isbn_13?: string | null;
          cover_url?: string | null;
          avg_rating?: number | null;
          description?: string | null;
          year_published?: number | null;
          google_id?: string | null;
        };
        Update: {
          title?: string;
          author?: string;
          isbn_13?: string | null;
          cover_url?: string | null;
          avg_rating?: number | null;
          description?: string | null;
          year_published?: number | null;
          google_id?: string | null;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          book_id: string;
          offered_by: string;
          status: "available" | "claimed" | "completed";
          created_at: string;
          pickup_notes: string | null;
        };
        Insert: {
          id?: string;
          book_id: string;
          offered_by: string;
          status?: "available" | "claimed" | "completed";
          created_at?: string;
          pickup_notes?: string | null;
        };
        Update: {
          status?: "available" | "claimed" | "completed";
          pickup_notes?: string | null;
        };
        Relationships: [];
      };
      claims: {
        Row: {
          id: string;
          listing_id: string;
          claimant_member_id: string;
          claimed_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          claimant_member_id: string;
          claimed_at?: string;
        };
        Update: {
          claimed_at?: string;
        };
        Relationships: [];
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
};

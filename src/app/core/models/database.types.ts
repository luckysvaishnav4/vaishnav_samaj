export interface Database {
  public: {
    Tables: {
      community_admins: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['community_admins']['Insert']>;
        Relationships: [];
      };
      community_profiles: {
        Row: {
          id: string;
          display_name: string;
          gender: 'Man' | 'Woman' | 'Prefer not to say';
          date_of_birth: string;
          gotra: string;
          city: string;
          education: string | null;
          profession: string | null;
          about: string | null;
          family_information: string | null;
          lifestyle: string | null;
          photo_path: string | null;
          visibility: 'private' | 'community';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          gender: 'Man' | 'Woman' | 'Prefer not to say';
          date_of_birth: string;
          gotra: string;
          city: string;
          education?: string | null;
          profession?: string | null;
          about?: string | null;
          family_information?: string | null;
          lifestyle?: string | null;
          photo_path?: string | null;
          visibility?: 'private' | 'community';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['community_profiles']['Insert']>;
        Relationships: [];
      };
      profile_contacts: {
        Row: { profile_id: string; email: string | null; phone: string | null; updated_at: string };
        Insert: { profile_id: string; email?: string | null; phone?: string | null; updated_at?: string };
        Update: Partial<Database['public']['Tables']['profile_contacts']['Insert']>;
        Relationships: [];
      };
      interest_requests: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          message: string | null;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          responded_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['interest_requests']['Insert']>;
        Relationships: [];
      };
      community_events: {
        Row: {
          id: string;
          title: string;
          description: string;
          starts_at: string;
          venue: string;
          category: string;
          image_url: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          starts_at: string;
          venue?: string;
          category?: string;
          image_url?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['community_events']['Insert']>;
        Relationships: [];
      };
      community_announcements: {
        Row: {
          id: string;
          title: string;
          summary: string;
          published_at: string;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary?: string;
          published_at?: string;
          is_published?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['community_announcements']['Insert']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_community_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

// Mirrors `supabase gen types` output for the public schema. Regenerate with npm run db:types.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      household_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          expires_at: string;
          household_id: string;
          id: string;
          invited_by: string | null;
          revoked_at: string | null;
          token_hash: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      household_members: {
        Row: { household_id: string; joined_at: string; role: string; user_id: string };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'household_members_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      households: {
        Row: { created_at: string; created_by: string | null; id: string; name: string; updated_at: string };
        Insert: never;
        Update: { name?: string };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          display_name: string;
          id: string;
          locale: string;
          timezone: string;
          updated_at: string;
        };
        Insert: never;
        Update: { avatar_path?: string | null; display_name?: string; locale?: string; timezone?: string };
        Relationships: [];
      };
      recipe_categories: {
        Row: { created_at: string; household_id: string; id: string; name: string };
        Insert: { household_id: string; id?: string; name: string };
        Update: { name?: string };
        Relationships: [];
      };
      recipe_category_links: {
        Row: { category_id: string; household_id: string; recipe_id: string };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'recipe_category_links_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'recipe_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_category_links_recipe_id_household_id_fkey';
            columns: ['recipe_id', 'household_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id', 'household_id'];
          },
        ];
      };
      recipe_ingredients: {
        Row: {
          household_id: string;
          id: string;
          name: string;
          optional: boolean;
          original_text: string;
          position: number;
          quantity: number | null;
          recipe_id: string;
          scalable: boolean;
          unit: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'recipe_ingredients_recipe_id_household_id_fkey';
            columns: ['recipe_id', 'household_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id', 'household_id'];
          },
        ];
      };
      recipe_steps: {
        Row: {
          body: string;
          household_id: string;
          id: string;
          position: number;
          recipe_id: string;
          timer_minutes: number | null;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'recipe_steps_recipe_id_household_id_fkey';
            columns: ['recipe_id', 'household_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id', 'household_id'];
          },
        ];
      };
      recipe_user_state: {
        Row: {
          favorite: boolean;
          rating: number | null;
          recipe_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: { favorite?: boolean; rating?: number | null; recipe_id: string; user_id?: string };
        Update: { favorite?: boolean; rating?: number | null };
        Relationships: [];
      };
      recipes: {
        Row: {
          active_minutes: number | null;
          archived_at: string | null;
          base_servings: number;
          created_at: string;
          created_by: string | null;
          description: string | null;
          difficulty: string | null;
          freezing_notes: string | null;
          household_id: string;
          id: string;
          notes: string | null;
          passive_minutes: number | null;
          photo_path: string | null;
          reheating_notes: string | null;
          source_author: string | null;
          source_url: string | null;
          storage_notes: string | null;
          tags: string[];
          title: string;
          total_minutes: number | null;
          updated_at: string;
        };
        Insert: never;
        Update: { archived_at?: string | null; photo_path?: string | null };
        Relationships: [];
      };
      user_dietary_preferences: {
        Row: {
          created_at: string;
          custom_label: string | null;
          id: string;
          kind: string;
          preset_key: string | null;
          user_id: string;
        };
        Insert: {
          custom_label?: string | null;
          id?: string;
          kind: string;
          preset_key?: string | null;
          user_id?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      accept_household_invitation: { Args: { p_token: string }; Returns: string };
      create_household: { Args: { p_name: string }; Returns: string };
      create_household_invitation: {
        Args: { p_household_id: string };
        Returns: { expires_at: string; invitation_id: string; token: string }[];
      };
      delete_household: { Args: { p_household_id: string }; Returns: undefined };
      get_invitation_preview: {
        Args: { p_token: string };
        Returns: {
          already_member: boolean;
          household_name: string;
          invited_by_name: string | null;
          status: string;
        }[];
      };
      is_household_member: { Args: { p_household_id: string }; Returns: boolean };
      is_household_owner: { Args: { p_household_id: string }; Returns: boolean };
      leave_household: { Args: { p_household_id: string }; Returns: undefined };
      remove_household_member: { Args: { p_household_id: string; p_user_id: string }; Returns: undefined };
      save_recipe: { Args: { p_recipe: Json }; Returns: string };
      revoke_household_invitation: { Args: { p_invitation_id: string }; Returns: undefined };
      shares_household_with: { Args: { p_user_id: string }; Returns: boolean };
      transfer_household_ownership: {
        Args: { p_household_id: string; p_new_owner: string };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/auth';

export interface ProfileUpdateData {
  full_name?: string;
  business_name?: string;
  business_description?: string;
  phone?: string;
}

export const profileService = {
  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
};
import { supabase } from '@/integrations/supabase/client';

export type TradeStatus = 'pending' | 'paid' | 'invoiced' | 'cancelled' | 'failed';

export interface Trade {
  id?: string;
  user_id: string;
  chapter_id: string;
  amount: number;
  source_member_id?: string;
  beneficiary_member_id?: string;
  description?: string;
  status: TradeStatus;
  mpesa_reference?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TradeWithProfiles extends Trade {
  source_member?: {
    full_name: string;
    business_name: string;
  };
  beneficiary_member?: {
    full_name: string;
    business_name: string;
  };
}

export const tradesService = {
  async createTrade(trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Trade | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .insert([{ ...trade, status: 'pending' }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getUserTrades(userId: string): Promise<{ data: TradeWithProfiles[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          source_member:profiles!left(full_name, business_name),
          beneficiary_member:profiles!left(full_name, business_name)
        `)
        .or(`user_id.eq.${userId},source_member_id.eq.${userId},beneficiary_member_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async updateTradeStatus(tradeId: string, status: TradeStatus, mpesaReference?: string): Promise<{ data: Trade | null; error: any }> {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (mpesaReference) {
        updateData.mpesa_reference = mpesaReference;
      }

      const { data, error } = await supabase
        .from('trades')
        .update(updateData)
        .eq('id', tradeId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getChapterMembers(chapterId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, business_name')
        .eq('chapter_id', chapterId)
        .eq('role', 'member');

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
};
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
      // First get trades without joins to avoid complex join issues
      const { data: tradesData, error } = await supabase
        .from('trades')
        .select('*')
        .or(`user_id.eq.${userId},source_member_id.eq.${userId},beneficiary_member_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error };
      if (!tradesData) return { data: [], error: null };

      // Get all unique profile IDs that we need to fetch
      const profileIds = new Set<string>();
      tradesData.forEach(trade => {
        if (trade.source_member_id) profileIds.add(trade.source_member_id);
        if (trade.beneficiary_member_id) profileIds.add(trade.beneficiary_member_id);
      });

      // Fetch profiles if we have any IDs
      let profilesMap: Record<string, { full_name: string; business_name: string }> = {};
      if (profileIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, business_name')
          .in('id', Array.from(profileIds));

        if (profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = {
              full_name: profile.full_name || '',
              business_name: profile.business_name || ''
            };
            return acc;
          }, {} as Record<string, { full_name: string; business_name: string }>);
        }
      }

      // Combine trades with profile data
      const tradesWithProfiles: TradeWithProfiles[] = tradesData.map(trade => ({
        ...trade,
        source_member: trade.source_member_id ? profilesMap[trade.source_member_id] : undefined,
        beneficiary_member: trade.beneficiary_member_id ? profilesMap[trade.beneficiary_member_id] : undefined
      }));

      return { data: tradesWithProfiles, error: null };
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
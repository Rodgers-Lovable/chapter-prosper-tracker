import { supabase } from '@/integrations/supabase/client';

export interface AdminMetrics {
  totalMembers: number;
  activeChapters: number;
  totalRevenue: number;
  memberGrowth: number;
  chapterGrowth: number;
  revenueGrowth: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  dailyActiveUsers: number;
  metricsSubmitted: number;
  reportsGenerated: number;
}

export interface UserWithChapter {
  id: string;
  email: string;
  full_name: string | null;
  role: 'member' | 'chapter_leader' | 'administrator';
  chapter_id: string | null;
  business_name: string | null;
  business_description: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  chapter?: {
    id: string;
    name: string;
  };
}

export interface ChapterWithStats {
  id: string;
  name: string;
  leader_id: string | null;
  created_at: string;
  updated_at: string;
  leader: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  member_count: number;
  total_revenue: number;
  metrics_count: number;
}

export interface TradeWithDetails {
  id: string;
  user_id: string;
  chapter_id: string;
  amount: number;
  description: string | null;
  source_member_id: string | null;
  beneficiary_member_id: string | null;
  status: 'pending' | 'paid' | 'invoiced' | 'failed';
  created_at: string;
  updated_at: string;
  mpesa_reference: string | null;
  user: {
    full_name: string | null;
    email: string;
  } | null;
  chapter: {
    name: string;
  } | null;
  source_member?: {
    full_name: string | null;
    email: string;
  } | null;
  beneficiary_member?: {
    full_name: string | null;
    email: string;
  } | null;
  invoices: Array<{
    id: string;
    invoice_number: string;
    amount: number;
    issued_at: string;
    paid_at: string | null;
    file_url: string | null;
  }>;
}

export const adminService = {
  // Get system-wide metrics
  async getAdminMetrics(): Promise<AdminMetrics> {
    try {
      // Get total members
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active chapters
      const { count: activeChapters } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true });

      // Get total revenue from trades
      const { data: revenueData } = await supabase
        .from('trades')
        .select('amount')
        .eq('status', 'pending');

      const totalRevenue = revenueData?.reduce((sum, trade) => sum + Number(trade.amount), 0) || 0;

      // Get growth metrics (comparing last 30 days to previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { count: recentMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: previousMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const memberGrowth = previousMembers ? ((recentMembers || 0) / previousMembers) * 100 : 0;

      // Get payment status metrics
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('paid_at');

      const totalInvoices = invoicesData?.length || 0;
      const paidInvoices = invoicesData?.filter(inv => inv.paid_at).length || 0;
      const successfulPayments = totalInvoices ? (paidInvoices / totalInvoices) * 100 : 0;

      // Get recent metrics count
      const { count: metricsSubmitted } = await supabase
        .from('metrics')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      return {
        totalMembers: totalMembers || 0,
        activeChapters: activeChapters || 0,
        totalRevenue,
        memberGrowth,
        chapterGrowth: 2, // Placeholder - could calculate from chapter creation dates
        revenueGrowth: 15.2, // Placeholder - could calculate from trade history
        successfulPayments,
        pendingPayments: 100 - successfulPayments,
        failedPayments: 0.5, // Placeholder
        dailyActiveUsers: Math.floor((totalMembers || 0) * 0.7), // Estimate
        metricsSubmitted: metricsSubmitted || 0,
        reportsGenerated: 89 // Placeholder - would track from report generation
      };
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
      throw error;
    }
  },

  // Get top performing chapters
  async getTopChapters(limit: number = 10): Promise<ChapterWithStats[]> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select(`
          *,
          leader:profiles(id, full_name, email)
        `);

      if (error) throw error;

      // Get member counts and revenue for each chapter
      const chaptersWithStats = await Promise.all(
        (data || []).map(async (chapter) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('chapter_id', chapter.id);

          // Get total revenue
          const { data: trades } = await supabase
            .from('trades')
            .select('amount')
            .eq('chapter_id', chapter.id)
            .eq('status', 'pending');

          const totalRevenue = trades?.reduce((sum, trade) => sum + Number(trade.amount), 0) || 0;

          // Get metrics count
          const { count: metricsCount } = await supabase
            .from('metrics')
            .select('*', { count: 'exact', head: true })
            .eq('chapter_id', chapter.id);

          return {
            ...chapter,
            leader: chapter.leader && chapter.leader.length > 0 ? chapter.leader[0] : null,
            member_count: memberCount || 0,
            total_revenue: totalRevenue,
            metrics_count: metricsCount || 0
          };
        })
      );

      // Sort by revenue and return top performers
      return chaptersWithStats
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top chapters:', error);
      throw error;
    }
  },

  // Get all users with pagination and filters
  async getUsers(page: number = 1, limit: number = 20, filters?: {
    role?: string;
    chapter_id?: string;
    search?: string;
  }): Promise<{ users: UserWithChapter[]; totalCount: number }> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          chapter:chapters(id, name)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.role) {
        query = query.eq('role', filters.role as 'member' | 'chapter_leader' | 'administrator');
      }
      if (filters?.chapter_id) {
        query = query.eq('chapter_id', filters.chapter_id);
      }
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const normalized = (data || []).map((u: any) => ({
        ...u,
        chapter: Array.isArray(u.chapter) ? (u.chapter[0] || null) : u.chapter,
      }));

      return {
        users: normalized as UserWithChapter[],
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Create new user
  async createUser(userData: {
    email: string;
    full_name?: string;
    role: 'member' | 'chapter_leader' | 'administrator';
    chapter_id?: string;
    business_name?: string;
    business_description?: string;
    phone?: string;
  }) {
    try {
      // Call the edge function to create user with service role privileges
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Log the action
      await this.logAdminAction('user_created', {
        target_user_id: data.data.id,
        user_data: userData
      });

      return data.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  async updateUser(userId: string, userData: Partial<UserWithChapter>) {
    try {
      // Prepare update data with timestamp
      const updateData = {
        ...userData,
        updated_at: new Date().toISOString()
      };

      // Remove any undefined/null chapter_id and convert to null for database
      if (updateData.chapter_id === '' || updateData.chapter_id === 'none') {
        updateData.chapter_id = null;
      }

      console.log('Updating user:', userId, 'with data:', updateData);

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('User updated successfully:', data);

      await this.logAdminAction('user_updated', {
        target_user_id: userId,
        updated_fields: userData
      });

      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Get all trades with pagination and filters
  async getTrades(page: number = 1, limit: number = 20, filters?: {
    status?: string;
    chapter_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{ trades: TradeWithDetails[]; totalCount: number }> {
    try {
      let query = supabase
        .from('trades')
        .select(`
          *,
          user:profiles!trades_user_id_fkey(full_name, email),
          chapter:chapters(name),
          source_member:profiles!trades_source_member_id_fkey(full_name, email),
          beneficiary_member:profiles!trades_beneficiary_member_id_fkey(full_name, email),
          invoices(id, invoice_number, amount, issued_at, paid_at, file_url)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status as 'pending' | 'paid' | 'invoiced' | 'failed');
      }
      if (filters?.chapter_id) {
        query = query.eq('chapter_id', filters.chapter_id);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform the data to handle potential query errors
      const transformedTrades = (data || []).map(trade => ({
        ...trade,
        user: Array.isArray(trade.user) ? trade.user[0] || null : trade.user,
        chapter: Array.isArray(trade.chapter) ? trade.chapter[0] || null : trade.chapter,
        source_member: Array.isArray(trade.source_member) ? trade.source_member[0] || null : trade.source_member,
        beneficiary_member: Array.isArray(trade.beneficiary_member) ? trade.beneficiary_member[0] || null : trade.beneficiary_member,
      }));

      return {
        trades: transformedTrades as TradeWithDetails[],
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  },

  // Log admin actions
  async logAdminAction(action: string, metadata?: any) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          table_name: 'admin_actions',
          new_values: metadata,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  },

  // Get audit logs
  async getAuditLogs(page: number = 1, limit: number = 20) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        logs: data || [],
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
};
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/lib/auth";

export interface ChapterStats {
  totalMembers: number;
  avgParticipation: number;
  totalLearningHours: number;
  totalRevenue: number;
  monthlyGrowth: {
    members: number;
    participation: number;
    learningHours: number;
    revenue: number;
  };
}

export interface ChapterMember {
  id: string;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  lastActivity?: string;
  isInactive?: boolean;
  metrics?: {
    participation: number;
    learning: number;
    activity: number;
    networking: number;
    trade: number;
    total: number;
  };
}

export interface ChapterTrade {
  id: string;
  amount: number;
  description: string;
  status: "pending" | "paid" | "invoiced" | "cancelled" | "failed";
  created_at: string;
  user: {
    full_name: string;
    business_name: string;
  };
  source_member?: {
    full_name: string;
    business_name: string;
  };
  beneficiary_member?: {
    full_name: string;
    business_name: string;
  };
  mpesa_reference?: string;
}

export interface ChapterActivity {
  id: string;
  type: "metric" | "trade" | "member_join";
  description: string;
  created_at: string;
  user: {
    full_name: string;
    business_name: string;
  };
  value?: number;
  metric_type?: string;
}

export const chapterLeaderService = {
<<<<<<< HEAD
  async getChapterStats(
    chapterId: string
  ): Promise<{ data: ChapterStats | null; error: any }> {
=======
  async getChapterName(chapterId: string): Promise<{ data: string | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('name')
        .eq('id', chapterId)
        .single();

      if (error) throw error;
      return { data: data?.name || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getChapterStats(chapterId: string): Promise<{ data: ChapterStats | null; error: any }> {
>>>>>>> aca7e4f11c3b5533287b9bc1f92852a616b7a722
    try {
      // Get total members
      const { count: totalMembers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("chapter_id", chapterId);

      // Get current month metrics for the chapter
      const currentMonth = new Date();
      const startOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );
      const startOfLastMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      );
      const endOfLastMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        0
      );

      // Get member counts for growth calculation
      const { count: currentMonthMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('chapter_id', chapterId)
        .gte('created_at', startOfMonth.toISOString());

      const { count: lastMonthMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('chapter_id', chapterId)
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      const { data: currentMetrics } = await supabase
        .from("metrics")
        .select("metric_type, value")
        .eq("chapter_id", chapterId)
        .gte("created_at", startOfMonth.toISOString());

      const { data: lastMonthMetrics } = await supabase
        .from("metrics")
        .select("metric_type, value")
        .eq("chapter_id", chapterId)
        .gte("created_at", startOfLastMonth.toISOString())
        .lte("created_at", endOfLastMonth.toISOString());

      // Calculate aggregated metrics
      const currentTotals = this.aggregateMetrics(currentMetrics || []);
      const lastMonthTotals = this.aggregateMetrics(lastMonthMetrics || []);

      // Get trade data
      const { data: currentTrades } = await supabase
        .from("trades")
        .select("amount, status")
        .eq("chapter_id", chapterId)
        .gte("created_at", startOfMonth.toISOString());

      const { data: lastMonthTrades } = await supabase
        .from("trades")
        .select("amount, status")
        .eq("chapter_id", chapterId)
        .gte("created_at", startOfLastMonth.toISOString())
        .lte("created_at", endOfLastMonth.toISOString());

      const currentRevenue = (currentTrades || [])
        .filter((t) => t.status === "paid")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const lastMonthRevenue = (lastMonthTrades || [])
        .filter((t) => t.status === "paid")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const stats: ChapterStats = {
        totalMembers: totalMembers || 0,
        avgParticipation:
          currentTotals.participation > 0
            ? Math.round(
                (currentTotals.participation / (totalMembers || 1)) * 100
              )
            : 0,
        totalLearningHours: currentTotals.learning,
        totalRevenue: currentRevenue,
        monthlyGrowth: {
<<<<<<< HEAD
          members: 0, // Would need to calculate member growth
          participation:
            currentTotals.participation - lastMonthTotals.participation,
=======
          members: (currentMonthMembers || 0) - (lastMonthMembers || 0),
          participation: currentTotals.participation - lastMonthTotals.participation,
>>>>>>> aca7e4f11c3b5533287b9bc1f92852a616b7a722
          learningHours: currentTotals.learning - lastMonthTotals.learning,
          revenue: currentRevenue - lastMonthRevenue,
        },
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getChapterMembers(
    chapterId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: ChapterMember[] | null; error: any; totalCount: number }> {
    try {
      const offset = (page - 1) * limit;

      // Get members with pagination
      const {
        data: profiles,
        error: profilesError,
        count,
      } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          business_name,
          email,
          phone,
          role,
          created_at
        `,
          { count: "exact" }
        )
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (profilesError) throw profilesError;

      // Get metrics for each member (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const memberIds = profiles?.map((p) => p.id) || [];
      const { data: metrics } = await supabase
        .from("metrics")
        .select("user_id, metric_type, value, created_at")
        .in("user_id", memberIds)
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Aggregate metrics by user
      const memberMetrics = this.aggregateMetricsByUser(metrics || []);

      const members: ChapterMember[] = (profiles || []).map((profile) => ({
        ...profile,
        lastActivity: this.getLastActivity(profile.id, metrics || []),
        isInactive: this.isUserInactive(profile.id, metrics || []),
        metrics: memberMetrics[profile.id] || {
          participation: 0,
          learning: 0,
          activity: 0,
          networking: 0,
          trade: 0,
          total: 0,
        },
      }));

      return { data: members, error: null, totalCount: count || 0 };
    } catch (error) {
      return { data: null, error, totalCount: 0 };
    }
  },

  async getChapterTrades(
    chapterId: string,
    page: number = 1,
    limit: number = 20,
    filters?: any
  ): Promise<{ data: ChapterTrade[] | null; error: any; totalCount: number }> {
    try {
      const offset = (page - 1) * limit;

      let query = supabase
        .from("trades")
        .select(
          `
          id,
          amount,
          description,
          status,
          created_at,
          mpesa_reference,
          user_id,
          source_member_id,
          beneficiary_member_id
        `,
          { count: "exact" }
        )
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const {
        data: trades,
        error,
        count,
      } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      // Get user profiles separately to avoid foreign key issues
      const userIds = [
        ...new Set([
          ...(trades?.map((t) => t.user_id) || []),
          ...(trades?.map((t) => t.source_member_id).filter(Boolean) || []),
          ...(trades?.map((t) => t.beneficiary_member_id).filter(Boolean) ||
            []),
        ]),
      ];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, business_name")
        .in("id", userIds);

      // Map profiles to trades
      const tradesWithProfiles: ChapterTrade[] = (trades || []).map(
        (trade) => ({
          ...trade,
          user: profiles?.find((p) => p.id === trade.user_id) || {
            full_name: "Unknown",
            business_name: "Unknown",
          },
          source_member: trade.source_member_id
            ? profiles?.find((p) => p.id === trade.source_member_id) || {
                full_name: "Unknown",
                business_name: "Unknown",
              }
            : undefined,
          beneficiary_member: trade.beneficiary_member_id
            ? profiles?.find((p) => p.id === trade.beneficiary_member_id) || {
                full_name: "Unknown",
                business_name: "Unknown",
              }
            : undefined,
        })
      );

      return { data: tradesWithProfiles, error: null, totalCount: count || 0 };
    } catch (error) {
      return { data: null, error, totalCount: 0 };
    }
  },

  async getChapterActivity(
    chapterId: string,
    limit: number = 50
  ): Promise<{ data: ChapterActivity[] | null; error: any }> {
    try {
      // Get recent metrics
      const { data: metrics } = await supabase
        .from("metrics")
        .select("id, metric_type, value, created_at, user_id")
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: false })
        .limit(25);

      // Get recent trades
      const { data: trades } = await supabase
        .from("trades")
        .select("id, amount, description, created_at, user_id")
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: false })
        .limit(25);

      // Get user profiles for activities
      const userIds = [
        ...new Set([
          ...(metrics?.map((m) => m.user_id) || []),
          ...(trades?.map((t) => t.user_id) || []),
        ]),
      ];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, business_name")
        .in("id", userIds);

      const activities: ChapterActivity[] = [];

      // Add metric activities
      (metrics || []).forEach((metric) => {
        const user = profiles?.find((p) => p.id === metric.user_id) || {
          full_name: "Unknown",
          business_name: "Unknown",
        };
        activities.push({
          id: metric.id,
          type: "metric",
          description: this.formatMetricActivity(
            metric.metric_type,
            metric.value
          ),
          created_at: metric.created_at,
          user,
          value: Number(metric.value),
          metric_type: metric.metric_type,
        });
      });

      // Add trade activities
      (trades || []).forEach((trade) => {
        const user = profiles?.find((p) => p.id === trade.user_id) || {
          full_name: "Unknown",
          business_name: "Unknown",
        };
        activities.push({
          id: trade.id,
          type: "trade",
          description: `Recorded ${this.formatCurrency(trade.amount)} trade${
            trade.description ? ` - ${trade.description}` : ""
          }`,
          created_at: trade.created_at,
          user,
          value: Number(trade.amount),
        });
      });

      // Sort by date and limit
      activities.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return { data: activities.slice(0, limit), error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async sendMemberReminder(
    userId: string,
    type: "metrics" | "payment" | "general",
    message: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      // This would integrate with email service
      // For now, we'll simulate the functionality
      console.log(`Sending ${type} reminder to user ${userId}: ${message}`);

      // In a real implementation, this would call an edge function to send emails
      const { error } = await supabase.functions.invoke("send-reminder", {
        body: {
          userId,
          type,
          message,
        },
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  async updateMemberStatus(
    userId: string,
    status: "active" | "inactive"
  ): Promise<{ success: boolean; error?: any }> {
    try {
      // Update user status - in a real implementation this might update a status field
      // For now we'll just log it since the inactive status is calculated from activity
      console.log(`Updating user ${userId} status to ${status}`);

      // You could implement this by updating a status field in the profiles table
      // or by triggering some other action

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  async resendMemberInvite(
    userId: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
<<<<<<< HEAD
      // This would resend an invitation email to the user
      console.log(`Resending invite to user ${userId}`);

      // In a real implementation, this would call an edge function to resend invites
      const { error } = await supabase.functions.invoke("resend-invite", {
        body: {
          userId,
        },
=======
      const { data, error } = await supabase.functions.invoke('resend-invite', {
        body: { userId }
>>>>>>> aca7e4f11c3b5533287b9bc1f92852a616b7a722
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error resending invite:', error);
      return { success: false, error };
    }
  },

  async getPendingActions(chapterId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const actions = [];
      
      // Check for inactive members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, created_at')
        .eq('chapter_id', chapterId);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (profiles) {
        const { data: recentMetrics } = await supabase
          .from('metrics')
          .select('user_id')
          .eq('chapter_id', chapterId)
          .gte('created_at', thirtyDaysAgo.toISOString());

        const activeUserIds = new Set(recentMetrics?.map(m => m.user_id) || []);
        const inactiveCount = profiles.filter(p => !activeUserIds.has(p.id)).length;

        if (inactiveCount > 0) {
          actions.push({
            type: 'Members',
            description: `${inactiveCount} inactive member${inactiveCount > 1 ? 's' : ''} need attention`,
            priority: inactiveCount > 5 ? 'high' : 'medium',
            count: inactiveCount
          });
        }
      }

      // Check for pending trades
      const { count: pendingTradesCount } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('chapter_id', chapterId)
        .eq('status', 'pending');

      if (pendingTradesCount && pendingTradesCount > 0) {
        actions.push({
          type: 'Trades',
          description: `${pendingTradesCount} pending trade${pendingTradesCount > 1 ? 's' : ''} to review`,
          priority: 'medium',
          count: pendingTradesCount
        });
      }

      // Check for monthly report (if it's after the 5th of the month)
      const today = new Date();
      if (today.getDate() > 5) {
        actions.push({
          type: 'Reports',
          description: 'Monthly chapter report due',
          priority: 'high',
          count: 1
        });
      }

      return { data: actions, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Helper methods
  aggregateMetrics(metrics: any[]): {
    participation: number;
    learning: number;
    activity: number;
    networking: number;
    trade: number;
  } {
    return metrics.reduce(
      (acc, metric) => {
        acc[metric.metric_type] =
          (acc[metric.metric_type] || 0) + Number(metric.value);
        return acc;
      },
      {
        participation: 0,
        learning: 0,
        activity: 0,
        networking: 0,
        trade: 0,
      }
    );
  },

  aggregateMetricsByUser(metrics: any[]): Record<string, any> {
    const userMetrics: Record<string, any> = {};

    metrics.forEach((metric) => {
      if (!userMetrics[metric.user_id]) {
        userMetrics[metric.user_id] = {
          participation: 0,
          learning: 0,
          activity: 0,
          networking: 0,
          trade: 0,
          total: 0,
        };
      }

      userMetrics[metric.user_id][metric.metric_type] += Number(metric.value);
    });

    // Calculate totals
    Object.keys(userMetrics).forEach((userId) => {
      const user = userMetrics[userId];
      user.total =
        user.participation +
        user.learning +
        user.activity +
        user.networking +
        user.trade;
    });

    return userMetrics;
  },

  getLastActivity(userId: string, metrics: any[]): string | undefined {
    const userMetrics = metrics.filter((m) => m.user_id === userId);
    if (userMetrics.length === 0) return undefined;

    const lastMetric = userMetrics.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    return lastMetric.created_at;
  },

  isUserInactive(userId: string, metrics: any[]): boolean {
    const lastActivity = this.getLastActivity(userId, metrics);
    if (!lastActivity) return true;

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceActivity > 14; // Inactive if no activity in 14 days
  },

  formatMetricActivity(metricType: string, value: number): string {
    const typeMap: Record<string, string> = {
      participation: "participation points",
      learning: "learning hours",
      activity: "activity points",
      networking: "networking points",
      trade: "trade value",
    };

    return `Recorded ${value} ${typeMap[metricType] || metricType}`;
  },

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },
};

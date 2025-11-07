import { supabase } from "@/integrations/supabase/client";

export type MetricType =
  | "participation"
  | "learning"
  | "activity"
  | "networking"
  | "trade";

export interface MetricEntry {
  id?: string;
  user_id: string;
  chapter_id: string;
  metric_type: MetricType;
  value: number;
  description?: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface MetricsSummary {
  participation: number;
  learning: number;
  activity: number;
  networking: number;
  trade: number;
}

export const metricsService = {
  async addMetric(
    metric: Omit<MetricEntry, "id" | "created_at" | "updated_at">
  ): Promise<{ data: MetricEntry | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from("metrics")
        .insert([metric])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getUserMetrics(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: MetricEntry[] | null; error: any }> {
    try {
      let query = supabase
        .from("metrics")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (startDate) {
        query = query.gte("date", startDate);
      }
      if (endDate) {
        query = query.lte("date", endDate);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getMetricsSummary(
    userId: string,
    period: "month" | "quarter" | "year" = "month"
  ): Promise<{ data: MetricsSummary | null; error: any }> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      const { data, error } = await supabase
        .from("metrics")
        .select("metric_type, value")
        .eq("user_id", userId)
        .gte("date", startDate.toISOString().split("T")[0]);

      if (error) return { data: null, error };

      const summary: MetricsSummary = {
        participation: 0,
        learning: 0,
        activity: 0,
        networking: 0,
        trade: 0,
      };

      data?.forEach((metric) => {
        summary[metric.metric_type as MetricType] += Number(metric.value);
      });

      return { data: summary, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getChapterLeaderboard(
    chapterId: string,
    period: "month" | "quarter" | "year" = "month"
  ): Promise<{ data: any[] | null; error: any }> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      const { data, error } = await supabase
        .from("metrics")
        .select(
          `
          user_id,
          metric_type,
          value,
          profiles!inner(full_name, business_name)
        `
        )
        .eq("chapter_id", chapterId)
        .gte("date", startDate.toISOString().split("T")[0]);

      if (error) return { data: null, error };

      // Aggregate metrics by user
      const userMetrics: Record<
        string,
        {
          user_id: string;
          full_name: string;
          business_name: string;
          total: number;
          metrics: MetricsSummary;
        }
      > = {};

      data?.forEach((metric) => {
        if (!userMetrics[metric.user_id]) {
          userMetrics[metric.user_id] = {
            user_id: metric.user_id,
            full_name: (metric.profiles as any).full_name,
            business_name: (metric.profiles as any).business_name,
            total: 0,
            metrics: {
              participation: 0,
              learning: 0,
              activity: 0,
              networking: 0,
              trade: 0,
            },
          };
        }

        const value = Number(metric.value);
        userMetrics[metric.user_id].metrics[metric.metric_type as MetricType] +=
          value;
        userMetrics[metric.user_id].total += value;
      });

      // Convert to array and sort by total
      const leaderboard = Object.values(userMetrics)
        .sort((a, b) => b.total - a.total)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      return { data: leaderboard, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

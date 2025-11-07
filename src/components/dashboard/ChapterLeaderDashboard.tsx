import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Users,
  GraduationCap,
  Activity,
  Network,
  DollarSign,
  Plus,
  TrendingUp,
  Calendar,
  UserCheck,
  AlertCircle as AlertCircleIcon,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  chapterLeaderService,
  ChapterStats,
  ChapterMember,
  ChapterTrade,
  ChapterActivity,
} from "@/lib/services/chapterLeaderService";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const ChapterLeaderDashboard = () => {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for dashboard data
  const [chapterStats, setChapterStats] = useState<ChapterStats | null>(null);
  const [topMembers, setTopMembers] = useState<ChapterMember[]>([]);
  const [recentTrades, setRecentTrades] = useState<ChapterTrade[]>([]);
  const [recentActivity, setRecentActivity] = useState<ChapterActivity[]>([]);
  const [chapterName, setChapterName] = useState<string>("");

  // Fetch chapter data
  useEffect(() => {
    const fetchChapterData = async () => {
      if (!profile?.chapter_id) {
        setError("No chapter assigned to your profile");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch chapter info
        const { data: chapter } = await supabase
          .from("chapters")
          .select("name")
          .eq("id", profile.chapter_id)
          .single();

        if (chapter) setChapterName(chapter.name);

        // Fetch all dashboard data in parallel
        const [statsResult, membersResult, tradesResult, activityResult] =
          await Promise.all([
            chapterLeaderService.getChapterStats(profile.chapter_id),
            chapterLeaderService.getChapterMembers(profile.chapter_id, 1, 10),
            chapterLeaderService.getChapterTrades(profile.chapter_id, 1, 10),
            chapterLeaderService.getChapterActivity(profile.chapter_id, 20),
          ]);

        // Handle stats
        if (statsResult.error)
          throw new Error("Failed to fetch chapter statistics");
        setChapterStats(statsResult.data);

        // Handle members (sorted by total metrics for top performers)
        if (membersResult.error)
          throw new Error("Failed to fetch chapter members");
        const sortedMembers = (membersResult.data || [])
          .filter((member) => member.metrics && member.metrics.total > 0)
          .sort((a, b) => (b.metrics?.total || 0) - (a.metrics?.total || 0))
          .slice(0, 5);
        setTopMembers(sortedMembers);

        // Handle trades
        if (tradesResult.error)
          throw new Error("Failed to fetch chapter trades");
        setRecentTrades(tradesResult.data || []);

        // Handle activity
        if (activityResult.error)
          throw new Error("Failed to fetch chapter activity");
        setRecentActivity(activityResult.data || []);
      } catch (err) {
        console.error("Error fetching chapter data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load chapter data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [profile?.chapter_id]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format change indicators
  const formatChange = (current: number, previous: number) => {
    const change = current - previous;
    const isPositive = change >= 0;
    return {
      value: Math.abs(change),
      isPositive,
      icon: isPositive ? ChevronUp : ChevronDown,
      color: isPositive ? "text-success" : "text-destructive",
    };
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6">
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Prepare chapter metrics data
  const chapterMetrics = [
    {
      title: "Total Members",
      icon: Users,
      value: chapterStats?.totalMembers?.toString() || "0",
      description: "Active members",
      color: "text-primary",
      change: chapterStats?.monthlyGrowth?.members || 0,
      changeType: "members",
    },
    {
      title: "Avg Participation",
      icon: UserCheck,
      value: `${chapterStats?.avgParticipation || 0}%`,
      description: "Member engagement",
      color: "text-participation",
      change: chapterStats?.monthlyGrowth?.participation || 0,
      changeType: "percentage",
    },
    {
      title: "Learning Hours",
      icon: GraduationCap,
      value: chapterStats?.totalLearningHours?.toString() || "0",
      description: "Total this month",
      color: "text-learning",
      change: chapterStats?.monthlyGrowth?.learningHours || 0,
      changeType: "hours",
    },
    {
      title: "Chapter Revenue",
      icon: DollarSign,
      value: formatCurrency(chapterStats?.totalRevenue || 0),
      description: "Business passed",
      color: "text-trade",
      change: chapterStats?.monthlyGrowth?.revenue || 0,
      changeType: "currency",
    },
  ];

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy-blue">
              Chapter Leader Dashboard
            </h2>
            <p className="text-muted-foreground">
              {chapterName || "Your Chapter"} - Overview and Management
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Chapter Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {chapterMetrics.map((metric) => {
            const Icon = metric.icon;
            const change = formatChange(metric.change, 0);
            const ChangeIcon = change.icon;

            return (
              <Card key={metric.title} className="shadow-md border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                  {metric.change !== 0 && (
                    <div className="flex items-center pt-2">
                      <ChangeIcon className={`h-3 w-3 ${change.color} mr-1`} />
                      <span className={`text-xs ${change.color}`}>
                        {metric.changeType === "currency"
                          ? formatCurrency(change.value)
                          : metric.changeType === "percentage"
                          ? `${change.value}%`
                          : metric.changeType === "hours"
                          ? `${change.value} hrs`
                          : change.value}{" "}
                        from last month
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card className="shadow-md border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy-blue">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Performers This Month
              </CardTitle>
              <CardDescription>
                Leading members based on total PLANT metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topMembers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active members with metrics yet</p>
                  <p className="text-sm">
                    Encourage members to log their activities
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topMembers.map((member, index) => {
                    const topMetric = member.metrics
                      ? Object.entries(member.metrics)
                          .filter(([key]) => key !== "total")
                          .sort(
                            ([, a], [, b]) => (b as number) - (a as number)
                          )[0]
                      : null;

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.full_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {member.full_name || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.business_name || "No business name"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium mb-1">
                            Total: {member.metrics?.total || 0} pts
                          </div>
                          {topMetric && (
                            <div className="text-xs text-muted-foreground">
                              Best: {topMetric[0]} ({topMetric[1]})
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card className="shadow-md border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy-blue">
                <DollarSign className="h-5 w-5 text-primary" />
                Recent Trades
              </CardTitle>
              <CardDescription>
                Latest business exchanges in your chapter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTrades.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trades recorded yet</p>
                  <p className="text-sm">
                    Encourage members to log their business
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTrades.slice(0, 5).map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-trade rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">
                            {trade.user.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(trade.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(trade.amount)}
                        </p>
                        <Badge
                          variant={
                            trade.status === "paid"
                              ? "default"
                              : trade.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {trade.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Member Activity Overview */}
        <Card className="shadow-md border-border">
          <CardHeader>
            <CardTitle className="text-navy-blue">
              Recent Chapter Activity
            </CardTitle>
            <CardDescription>
              Latest member activities and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Member activities will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 10).map((activity) => {
                  const getActivityColor = (
                    type: string,
                    metricType?: string
                  ) => {
                    if (type === "trade") return "bg-trade";
                    if (type === "metric") {
                      switch (metricType) {
                        case "participation":
                          return "bg-participation";
                        case "learning":
                          return "bg-learning";
                        case "activity":
                          return "bg-activity";
                        case "networking":
                          return "bg-networking";
                        case "trade":
                          return "bg-trade";
                        default:
                          return "bg-primary";
                      }
                    }
                    return "bg-primary";
                  };

                  const getActivityBadge = (
                    type: string,
                    metricType?: string
                  ) => {
                    if (type === "trade") return "Trade";
                    if (type === "metric") {
                      return (
                        metricType?.charAt(0).toUpperCase() +
                          metricType?.slice(1) || "Metric"
                      );
                    }
                    return "Activity";
                  };

                  return (
                    <div key={activity.id} className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${getActivityColor(
                          activity.type,
                          activity.metric_type
                        )}`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.user.full_name || "Unknown"}{" "}
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(activity.created_at),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getActivityBadge(activity.type, activity.metric_type)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metrics Chart */}
        {topMembers.length > 0 && (
          <Card className="shadow-md border-border">
            <CardHeader>
              <CardTitle className="text-navy-blue">
                Chapter Performance Overview
              </CardTitle>
              <CardDescription>
                Total PLANT metrics by top members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMembers.slice(0, 10)}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <XAxis
                      dataKey="full_name"
                      stroke="hsl(var(--foreground))"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="metrics.participation"
                      fill="hsl(226, 81%, 25%)"
                      name="Participation"
                    />
                    <Bar
                      dataKey="metrics.learning"
                      fill="hsl(226, 81%, 35%)"
                      name="Learning"
                    />
                    <Bar
                      dataKey="metrics.activity"
                      fill="hsl(43, 74%, 52%)"
                      name="Activity"
                    />
                    <Bar
                      dataKey="metrics.networking"
                      fill="hsl(43, 74%, 65%)"
                      name="Networking"
                    />
                    <Bar
                      dataKey="metrics.trade"
                      fill="hsl(210, 100%, 20%)"
                      name="Trade"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ChapterLeaderDashboard;

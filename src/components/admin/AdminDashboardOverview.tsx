import React, { useEffect, useState } from "react";
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
import {
  Users,
  Building,
  DollarSign,
  TrendingUp,
  Plus,
  Settings,
  FileText,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  adminService,
  type AdminMetrics,
  type ChapterWithStats,
} from "@/lib/services/adminService";
import { toast } from "sonner";

interface AdminDashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  onNavigate,
}) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [topChapters, setTopChapters] = useState<ChapterWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [metricsData, chaptersData] = await Promise.all([
        adminService.getAdminMetrics(),
        adminService.getTopChapters(4),
      ]);
      
      setMetrics(metricsData);
      setTopChapters(chaptersData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatChange = (value: number, isPercentage: boolean = false) => {
    const formatted = isPercentage ? `${value.toFixed(1)}%` : value.toString();
    const isPositive = value > 0;
    return {
      formatted: `${isPositive ? "+" : ""}${formatted}`,
      isPositive,
      icon: isPositive ? ArrowUpRight : ArrowDownRight,
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const systemMetrics = [
    {
      title: "Total Members",
      icon: Users,
      value: metrics.totalMembers.toLocaleString(),
      description: "Across all chapters",
      color: "text-primary",
      change: formatChange(metrics.memberGrowth, true),
      changeLabel: "from last month",
    },
    {
      title: "Active Chapters",
      icon: Building,
      value: metrics.activeChapters.toString(),
      description: "Operating chapters",
      color: "text-networking",
      change: formatChange(metrics.chapterGrowth),
      changeLabel: "new chapters",
    },
    {
      title: "Total Revenue",
      icon: DollarSign,
      value: formatCurrency(metrics.totalRevenue),
      description: "Business passed",
      color: "text-trade",
      change: formatChange(metrics.revenueGrowth, true),
      changeLabel: "this month",
    },
    {
      title: "Payment Success",
      icon: Activity,
      value: `${metrics.successfulPayments.toFixed(1)}%`,
      description: "Success rate",
      color: "text-success",
      change: {
        formatted: "All systems operational",
        isPositive: true,
        icon: Activity,
      },
    },
  ];

  const systemAlerts = [
    {
      type: "Payments",
      message: `${Math.floor(
        metrics.failedPayments * 10
      )} failed transactions need review`,
      priority: "high",
      action: () => onNavigate("trades"),
    },
    {
      type: "Users",
      message: "New user registrations pending approval",
      priority: "medium",
      action: () => onNavigate("users"),
    },
    {
      type: "Reports",
      message: "Monthly reports ready for generation",
      priority: "low",
      action: () => onNavigate("reports"),
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-warning";
      default:
        return "bg-info";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Administrator Dashboard</h2>
          <p className="text-muted-foreground">
            System-wide overview and management controls
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate("reports")}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button onClick={() => onNavigate("chapters")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Chapter
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((metric) => {
          const Icon = metric.icon;
          const ChangeIcon = metric.change.icon;
          return (
            <Card
              key={metric.title}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mb-2">
                  {metric.description}
                </p>
                <div className="flex items-center">
                  <ChangeIcon
                    className={`h-3 w-3 mr-1 ${
                      metric.change.isPositive
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      metric.change.isPositive
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {metric.change.formatted} {metric.changeLabel}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Chapters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Chapters
            </CardTitle>
            <CardDescription>
              Chapters ranked by revenue and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topChapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{chapter.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Led by{" "}
                        {chapter.leader?.full_name || "No leader assigned"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(chapter.total_revenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {chapter.member_count} members
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => onNavigate("chapters")}
            >
              View All Chapters
            </Button>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Items requiring administrative attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${getPriorityColor(
                        alert.priority
                      )}`}
                    ></div>
                    <div>
                      <p className="font-medium">{alert.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={alert.action}>
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">New Members</span>
                <span className="text-sm font-medium">
                  +{Math.floor(metrics.memberGrowth * 10)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Revenue Growth</span>
                <span className="text-sm font-medium">
                  +{metrics.revenueGrowth}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Chapter Expansion</span>
                <span className="text-sm font-medium">
                  +{metrics.chapterGrowth} chapters
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Successful</span>
                <span className="text-sm font-medium text-success">
                  {metrics.successfulPayments.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending</span>
                <span className="text-sm font-medium text-warning">
                  {metrics.pendingPayments.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Failed</span>
                <span className="text-sm font-medium text-destructive">
                  {metrics.failedPayments}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Daily Active Users</span>
                <span className="text-sm font-medium">
                  {metrics.dailyActiveUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Metrics Submitted</span>
                <span className="text-sm font-medium">
                  {metrics.metricsSubmitted.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Reports Generated</span>
                <span className="text-sm font-medium">
                  {metrics.reportsGenerated}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;

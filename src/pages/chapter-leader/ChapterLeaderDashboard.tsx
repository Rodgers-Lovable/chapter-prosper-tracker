import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import ChapterLeaderLayout from '@/components/chapter-leader/ChapterLeaderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  GraduationCap, 
  Activity, 
  DollarSign,
  Plus,
  TrendingUp,
  Calendar,
  UserCheck,
  AlertCircle,
  ArrowUpIcon,
  ArrowDownIcon,
  BarChart3,
  FileText,
  Bell
} from 'lucide-react';
import { chapterLeaderService, ChapterStats, ChapterActivity } from '@/lib/services/chapterLeaderService';

const ChapterLeaderDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ChapterStats | null>(null);
  const [activities, setActivities] = useState<ChapterActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.chapter_id) return;

      setLoading(true);
      try {
        const [statsResult, activitiesResult] = await Promise.all([
          chapterLeaderService.getChapterStats(profile.chapter_id),
          chapterLeaderService.getChapterActivity(profile.chapter_id, 10)
        ]);

        if (statsResult.error) {
          console.error('Error fetching stats:', statsResult.error);
          toast({
            title: "Error fetching chapter statistics",
            description: "Please try refreshing the page",
            variant: "destructive"
          });
        } else {
          setStats(statsResult.data);
        }

        if (activitiesResult.error) {
          console.error('Error fetching activities:', activitiesResult.error);
        } else {
          setActivities(activitiesResult.data || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error loading dashboard",
          description: "Please try refreshing the page",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile?.chapter_id, toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatChange = (change: number, isPercentage: boolean = false) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;
    const formattedChange = isPercentage ? `${Math.abs(change)}%` : Math.abs(change).toString();
    
    return (
      <div className={`flex items-center text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
        <Icon className="h-3 w-3 mr-1" />
        {isPositive ? '+' : '-'}{formattedChange}
      </div>
    );
  };

  const getActivityIcon = (type: string, metricType?: string) => {
    if (type === 'trade') return <DollarSign className="h-3 w-3" />;
    if (type === 'metric') {
      switch (metricType) {
        case 'learning': return <GraduationCap className="h-3 w-3" />;
        case 'participation': return <UserCheck className="h-3 w-3" />;
        default: return <Activity className="h-3 w-3" />;
      }
    }
    return <Activity className="h-3 w-3" />;
  };

  const getActivityColor = (type: string, metricType?: string) => {
    if (type === 'trade') return 'bg-trade';
    if (type === 'metric') {
      switch (metricType) {
        case 'learning': return 'bg-learning';
        case 'participation': return 'bg-participation';
        case 'networking': return 'bg-networking';
        default: return 'bg-activity';
      }
    }
    return 'bg-activity';
  };

  if (loading) {
    return (
      <ChapterLeaderLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
      </ChapterLeaderLayout>
    );
  }

  const chapterMetrics = [
    {
      title: 'Total Members',
      icon: Users,
      value: stats?.totalMembers?.toString() || '0',
      description: 'Active members',
      color: 'text-primary',
      change: stats?.monthlyGrowth.members || 0
    },
    {
      title: 'Avg Participation',
      icon: UserCheck,
      value: `${stats?.avgParticipation || 0}%`,
      description: 'Member participation',
      color: 'text-participation',
      change: stats?.monthlyGrowth.participation || 0,
      isPercentage: true
    },
    {
      title: 'Learning Hours',
      icon: GraduationCap,
      value: stats?.totalLearningHours?.toString() || '0',
      description: 'Total this month',
      color: 'text-learning',
      change: stats?.monthlyGrowth.learningHours || 0
    },
    {
      title: 'Chapter Revenue',
      icon: DollarSign,
      value: formatCurrency(stats?.totalRevenue || 0),
      description: 'Business passed',
      color: 'text-trade',
      change: stats?.monthlyGrowth.revenue || 0,
      isCurrency: true
    }
  ];

  const pendingActions = [
    { type: 'Members', description: 'Check inactive members', priority: 'medium' },
    { type: 'Reports', description: 'Monthly chapter report due', priority: 'high' },
    { type: 'Trades', description: 'Review pending trade declarations', priority: 'medium' },
  ];

  return (
    <ChapterLeaderLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Chapter Leader Dashboard</h2>
            <p className="text-muted-foreground">
              {profile?.business_name || 'Chapter'} - Overview and Management
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/chapter-leader/notifications'}>
              <Calendar className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
            <Button onClick={() => window.location.href = '/chapter-leader/members'}>
              <Plus className="mr-2 h-4 w-4" />
              Manage Members
            </Button>
          </div>
        </div>

        {/* Chapter Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {chapterMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title}>
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
                  <div className="flex items-center pt-2">
                    {formatChange(
                      metric.change, 
                      metric.isPercentage
                    )}
                    <span className="text-xs text-muted-foreground ml-1">
                      from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Chapter Activity
              </CardTitle>
              <CardDescription>
                Latest member activities and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length > 0 ? activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type, activity.metric_type)}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.user.full_name} {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getActivityIcon(activity.type, activity.metric_type)}
                      {activity.type === 'trade' ? 'Trade' : activity.metric_type || 'Activity'}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Pending Actions
              </CardTitle>
              <CardDescription>
                Items requiring your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        action.priority === 'high' ? 'bg-destructive' : 'bg-warning'
                      }`}></div>
                      <div>
                        <p className="font-medium">{action.type}</p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const routes: Record<string, string> = {
                          'Members': '/chapter-leader/members',
                          'Reports': '/chapter-leader/reports',
                          'Trades': '/chapter-leader/trades'
                        };
                        window.location.href = routes[action.type] || '/chapter-leader';
                      }}
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used chapter management tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => window.location.href = '/chapter-leader/metrics'}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">View Metrics</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => window.location.href = '/chapter-leader/trades'}
              >
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Manage Trades</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => window.location.href = '/chapter-leader/reports'}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">Generate Report</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => window.location.href = '/chapter-leader/notifications'}
              >
                <Bell className="h-6 w-6" />
                <span className="text-sm">Send Notifications</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterLeaderDashboard;
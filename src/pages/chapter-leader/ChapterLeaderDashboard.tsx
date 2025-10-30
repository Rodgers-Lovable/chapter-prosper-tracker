import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Link } from 'react-router-dom';
import ChapterLeaderLayout from '@/components/chapter-leader/ChapterLeaderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  const [chapterName, setChapterName] = useState<string>('');
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.chapter_id) return;

      setLoading(true);
      try {
        const [statsResult, activitiesResult, chapterNameResult, pendingActionsResult] = await Promise.all([
          chapterLeaderService.getChapterStats(profile.chapter_id),
          chapterLeaderService.getChapterActivity(profile.chapter_id, 10),
          chapterLeaderService.getChapterName(profile.chapter_id),
          chapterLeaderService.getPendingActions(profile.chapter_id)
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

        if (chapterNameResult.error) {
          console.error('Error fetching chapter name:', chapterNameResult.error);
        } else {
          setChapterName(chapterNameResult.data || '');
        }

        if (pendingActionsResult.error) {
          console.error('Error fetching pending actions:', pendingActionsResult.error);
        } else {
          setPendingActions(pendingActionsResult.data || []);
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

    // Set up realtime subscriptions for live updates
    if (!profile?.chapter_id) return;

    const metricsChannel = supabase
      .channel('chapter-metrics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metrics',
          filter: `chapter_id=eq.${profile.chapter_id}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const tradesChannel = supabase
      .channel('chapter-trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `chapter_id=eq.${profile.chapter_id}`
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(tradesChannel);
    };
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


  return (
    <ChapterLeaderLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Chapter Leader Dashboard</h2>
            <p className="text-muted-foreground">
              {chapterName || 'Chapter'} - Overview and Management
            </p>
            {chapterName && (
              <Badge variant="outline" className="mt-1">
                {chapterName}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Link to="/chapter-leader/notifications">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Send Reminder
              </Button>
            </Link>
            <Button asChild>
              <Link to="/chapter-leader/members">
                <Users className="mr-2 h-4 w-4" />
                Manage Members
              </Link>
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
                {pendingActions.length > 0 ? pendingActions.map((action, index) => (
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
                    <Link to={
                      action.type === 'Members' ? '/chapter-leader/members' :
                      action.type === 'Reports' ? '/chapter-leader/reports' :
                      action.type === 'Trades' ? '/chapter-leader/trades' :
                      '/chapter-leader'
                    }>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No pending actions at this time</p>
                )}
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
              <Link to="/chapter-leader/metrics">
                <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">View Metrics</span>
                </Button>
              </Link>
              <Link to="/chapter-leader/trades">
                <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                  <DollarSign className="h-6 w-6" />
                  <span className="text-sm">Manage Trades</span>
                </Button>
              </Link>
              <Link to="/chapter-leader/reports">
                <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Generate Report</span>
                </Button>
              </Link>
              <Link to="/chapter-leader/notifications">
                <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                  <Bell className="h-6 w-6" />
                  <span className="text-sm">Send Notifications</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterLeaderDashboard;
import React from 'react';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  AlertCircle
} from 'lucide-react';

const ChapterLeaderDashboard = () => {
  const { profile } = useAuth();

  const chapterMetrics = [
    {
      title: 'Total Members',
      icon: Users,
      value: '42',
      description: 'Active members',
      color: 'text-primary',
      change: '+3 this month'
    },
    {
      title: 'Avg Participation',
      icon: UserCheck,
      value: '88%',
      description: 'Meeting attendance',
      color: 'text-participation',
      change: '+2% from last month'
    },
    {
      title: 'Learning Hours',
      icon: GraduationCap,
      value: '342',
      description: 'Total this month',
      color: 'text-learning',
      change: '+45 hours'
    },
    {
      title: 'Chapter Revenue',
      icon: DollarSign,
      value: 'KSh 2.3M',
      description: 'Business passed',
      color: 'text-trade',
      change: '+KSh 400K'
    }
  ];

  const topPerformers = [
    { name: 'Sarah Kimani', metric: 'Trade', value: 'KSh 180K', role: 'Real Estate' },
    { name: 'David Mwangi', metric: 'Networking', value: '25 meetings', role: 'Finance' },
    { name: 'Grace Wanjiku', metric: 'Learning', value: '18 hours', role: 'Marketing' },
  ];

  const pendingActions = [
    { type: 'Invoice', description: 'Review 3 pending invoices', priority: 'high' },
    { type: 'Approval', description: '2 new member applications', priority: 'medium' },
    { type: 'Report', description: 'Monthly chapter report due', priority: 'high' },
  ];

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Chapter Leader Dashboard</h2>
            <p className="text-muted-foreground">
              Nairobi Central Chapter - Overview and Management
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
                    <TrendingUp className="h-3 w-3 text-success mr-1" />
                    <span className="text-xs text-success">
                      {metric.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performers This Month
              </CardTitle>
              <CardDescription>
                Leading members in each PLANT category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {performer.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        <p className="text-sm text-muted-foreground">{performer.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        {performer.metric}
                      </Badge>
                      <p className="text-sm font-medium">{performer.value}</p>
                    </div>
                  </div>
                ))}
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
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Activity Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Chapter Activity</CardTitle>
            <CardDescription>
              Latest member activities and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-trade rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sarah Kimani recorded KSh 80,000 trade with John Doe</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <Badge variant="outline">Trade</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-networking rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">David Mwangi completed 5 one-on-one meetings</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
                <Badge variant="outline">Networking</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-learning rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Chapter completed 40 learning hours this week</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
                <Badge variant="outline">Learning</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ChapterLeaderDashboard;
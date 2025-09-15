import React from 'react';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Network
} from 'lucide-react';

const AdministratorDashboard = () => {
  const { profile } = useAuth();

  const systemMetrics = [
    {
      title: 'Total Members',
      icon: Users,
      value: '1,248',
      description: 'Across all chapters',
      color: 'text-primary',
      change: '+12% from last month'
    },
    {
      title: 'Active Chapters',
      icon: Building,
      value: '15',
      description: 'Operating chapters',
      color: 'text-networking',
      change: '+2 new chapters'
    },
    {
      title: 'Total Revenue',
      icon: DollarSign,
      value: 'KSh 15.6M',
      description: 'Business passed',
      color: 'text-trade',
      change: '+KSh 2.1M this month'
    },
    {
      title: 'System Health',
      icon: Activity,
      value: '98.2%',
      description: 'Uptime this month',
      color: 'text-success',
      change: 'All systems operational'
    }
  ];

  const topChapters = [
    { name: 'Nairobi Central', members: 42, revenue: 'KSh 2.3M', leader: 'James Kinyua' },
    { name: 'Mombasa', members: 38, revenue: 'KSh 1.8M', leader: 'Fatuma Ahmed' },
    { name: 'Kisumu', members: 35, revenue: 'KSh 1.5M', leader: 'Peter Ochieng' },
    { name: 'Nakuru', members: 28, revenue: 'KSh 1.2M', leader: 'Mary Njeri' },
  ];

  const systemAlerts = [
    { type: 'Payment', message: '5 failed MPESA transactions need review', priority: 'high' },
    { type: 'User', message: '12 new member applications pending approval', priority: 'medium' },
    { type: 'System', message: 'Monthly reports generation scheduled for tonight', priority: 'low' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-warning';
      default: return 'bg-info';
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Administrator Dashboard</h2>
            <p className="text-muted-foreground">
              System-wide overview and management controls
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Chapter
            </Button>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemMetrics.map((metric) => {
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
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{chapter.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Led by {chapter.leader}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{chapter.revenue}</p>
                      <p className="text-sm text-muted-foreground">
                        {chapter.members} members
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(alert.priority)}`}></div>
                      <div>
                        <p className="font-medium">{alert.type}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
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
                  <span className="text-sm font-medium">+156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Revenue Growth</span>
                  <span className="text-sm font-medium">+15.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Chapter Expansion</span>
                  <span className="text-sm font-medium">+2 chapters</span>
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
                  <span className="text-sm font-medium text-success">98.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pending</span>
                  <span className="text-sm font-medium text-warning">1.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Failed</span>
                  <span className="text-sm font-medium text-destructive">0.5%</span>
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
                  <span className="text-sm font-medium">892</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Metrics Submitted</span>
                  <span className="text-sm font-medium">2,341</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reports Generated</span>
                  <span className="text-sm font-medium">89</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdministratorDashboard;
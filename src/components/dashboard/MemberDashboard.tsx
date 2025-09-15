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
  Calendar
} from 'lucide-react';

const MemberDashboard = () => {
  const { profile } = useAuth();

  const metrics = [
    {
      title: 'Participation',
      icon: Users,
      value: '85%',
      description: 'Attendance rate',
      color: 'participation',
      change: '+5% from last month'
    },
    {
      title: 'Learning',
      icon: GraduationCap,
      value: '12',
      description: 'Hours this month',
      color: 'learning',
      change: '+3 hours from last month'
    },
    {
      title: 'Activity',
      icon: Activity,
      value: '8',
      description: 'Referrals given',
      color: 'activity',
      change: '+2 from last month'
    },
    {
      title: 'Networking',
      icon: Network,
      value: '15',
      description: '1:1 meetings',
      color: 'networking',
      change: '+5 from last month'
    },
    {
      title: 'Trade',
      icon: DollarSign,
      value: 'KSh 125,000',
      description: 'Business passed',
      color: 'trade',
      change: '+KSh 25,000 from last month'
    }
  ];

  const getMetricColor = (color: string) => {
    const colors = {
      participation: 'text-participation',
      learning: 'text-learning',
      activity: 'text-activity',
      networking: 'text-networking',
      trade: 'text-trade'
    };
    return colors[color as keyof typeof colors] || 'text-primary';
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {profile?.full_name}!</h2>
            <p className="text-muted-foreground">
              Here's your PLANT metrics overview for this month
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Metrics
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${getMetricColor(metric.color)}`} />
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

        {/* Chapter Info */}
        {profile?.chapter_id && (
          <Card>
            <CardHeader>
              <CardTitle>Chapter Information</CardTitle>
              <CardDescription>
                Your current chapter membership details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nairobi Central Chapter</p>
                  <p className="text-sm text-muted-foreground">
                    Member since January 2024
                  </p>
                </div>
                <Badge variant="outline">Active Member</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Chapter Meeting</p>
                    <p className="text-sm text-muted-foreground">Tomorrow, 9:00 AM</p>
                  </div>
                  <Badge variant="outline">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Training Workshop</p>
                    <p className="text-sm text-muted-foreground">Friday, 2:00 PM</p>
                  </div>
                  <Badge variant="secondary">Optional</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Gave referral to John Doe</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-learning rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Completed training module</p>
                    <p className="text-xs text-muted-foreground">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-trade rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Recorded KSh 50,000 trade</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default MemberDashboard;
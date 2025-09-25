import React from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate, useLocation, Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  DollarSign,
  FileText,
  Bell,
  TrendingUp
} from 'lucide-react';

interface ChapterLeaderLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    path: '/chapter-leader',
    icon: LayoutDashboard,
    description: 'Chapter overview and metrics'
  },
  {
    name: 'Members',
    path: '/chapter-leader/members',
    icon: Users,
    description: 'Manage chapter members'
  },
  {
    name: 'Metrics',
    path: '/chapter-leader/metrics',
    icon: BarChart3,
    description: 'PLANT metrics monitoring'
  },
  {
    name: 'Trades',
    path: '/chapter-leader/trades',
    icon: DollarSign,
    description: 'Trade and payment oversight'
  },
  {
    name: 'Reports',
    path: '/chapter-leader/reports',
    icon: FileText,
    description: 'Generate chapter reports'
  },
  {
    name: 'Notifications',
    path: '/chapter-leader/notifications',
    icon: Bell,
    description: 'Send member reminders'
  }
];

const ChapterLeaderLayout: React.FC<ChapterLeaderLayoutProps> = ({ children }) => {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || profile.role !== 'chapter_leader') {
    return <Navigate to="/dashboard" replace />;
  }

  const currentPath = location.pathname;

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-card p-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Chapter Leader</h2>
            </div>
            <Badge variant="secondary" className="text-xs">
              {profile.business_name || 'Chapter Management'}
            </Badge>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || 
                (item.path !== '/chapter-leader' && currentPath.startsWith(item.path));
              
              return (
                <Link key={item.path} to={item.path} className="block">
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-3",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className={cn(
                        "text-xs",
                        isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Quick Stats Card */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members:</span>
                  <span className="font-medium">42</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This Month:</span>
                  <span className="font-medium">KSh 2.3M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participation:</span>
                  <span className="font-medium text-success">88%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AppLayout>
  );
};

export default ChapterLeaderLayout;
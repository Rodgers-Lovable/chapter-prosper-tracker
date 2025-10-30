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
  User,
  BarChart3,
  DollarSign,
  Trophy,
  FileText
} from 'lucide-react';

interface MemberLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onNavigate?: (section: string) => void;
  summary?: {
    participation: number;
    learning: number;
    activity: number;
    networking: number;
    trade: number;
  };
}

const navigationItems = [
  {
    id: 'overview',
    name: 'Overview',
    icon: LayoutDashboard,
    description: 'Dashboard and quick stats'
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: User,
    description: 'Manage your profile'
  },
  {
    id: 'metrics',
    name: 'Metrics',
    icon: BarChart3,
    description: 'Track PLANT metrics'
  },
  {
    id: 'trades',
    name: 'Trades',
    icon: DollarSign,
    description: 'Declare and view trades'
  },
  {
    id: 'leaderboard',
    name: 'Rankings',
    icon: Trophy,
    description: 'Chapter leaderboard'
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: FileText,
    description: 'Generate reports'
  }
];

const MemberLayout: React.FC<MemberLayoutProps> = ({ 
  children, 
  activeSection = 'overview', 
  onNavigate,
  summary 
}) => {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  const totalScore = summary ? 
    summary.participation + summary.learning + summary.activity + summary.networking + summary.trade 
    : 0;

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-card p-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Member Portal</h2>
            </div>
            <Badge variant="secondary" className="text-xs">
              {profile.business_name || profile.full_name}
            </Badge>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onNavigate?.(item.id)}
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
              );
            })}
          </nav>

          {/* Quick Stats Card */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Your PLANT Score</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-lg text-primary">{totalScore}</span>
                </div>
                {summary && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Participation:</span>
                      <span className="font-medium">{summary.participation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Learning:</span>
                      <span className="font-medium">{summary.learning}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Activity:</span>
                      <span className="font-medium">{summary.activity}</span>
                    </div>
                  </>
                )}
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

export default MemberLayout;

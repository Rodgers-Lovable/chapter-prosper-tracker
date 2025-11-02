import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Navigate, useLocation, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building,
  CreditCard,
  FileText,
  Shield,
  Mail,
} from "lucide-react";
import {
  AdminMetrics,
  adminService,
  ChapterWithStats,
} from "@/lib/services/adminService";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

const navigationItems = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    description: "System overview and analytics",
  },
  {
    id: "users",
    name: "User Management",
    icon: Users,
    description: "Manage user accounts",
  },
  {
    id: "chapters",
    name: "Chapter Management",
    icon: Building,
    description: "Manage chapters and leaders",
  },
  {
    id: "trades",
    name: "Trades & Payments",
    icon: CreditCard,
    description: "Monitor trade activities",
  },
  {
    id: "reports",
    name: "Reports & Invoices",
    icon: FileText,
    description: "Generate system reports",
  },
  {
    id: "audit",
    name: "Audit Trail",
    icon: Shield,
    description: "View system activity logs",
  },
  {
    id: "notifications",
    name: "Notifications",
    icon: Mail,
    description: "Send system notifications",
  },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeSection = "dashboard",
  onNavigate,
}) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { profile, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    loadOverviewData();
  });

  const loadOverviewData = async () => {
    try {
      setIsLoading(true);

      const adminMetrics = await adminService.getAdminMetrics();

      setMetrics(adminMetrics);
    } catch (error) {
      console.error("Error loading overview data:", error);
      toast.error("Failed to load overview data");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!profile || profile.role !== "administrator") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-card p-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Administrator</h2>
            </div>
            <Badge variant="secondary" className="text-xs">
              System Management
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
                    <div
                      className={cn(
                        "text-xs",
                        isActive
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
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
              <h3 className="font-medium mb-2">System Overview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Users:</span>
                  {/* <span className="font-medium">{metrics.totalMembers}</span> */}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chapters:</span>
                  {/* <span className="font-medium">{metrics.activeChapters}</span> */}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Trades:</span>
                  <span className="font-medium text-success">
                    {/* {metrics.totalRevenue} */}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AppLayout>
  );
};

export default AdminLayout;

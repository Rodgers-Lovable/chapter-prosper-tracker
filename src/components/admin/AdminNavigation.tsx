import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building, 
  CreditCard,
  FileText,
  Shield,
  Mail,
  BarChart3,
  Home
} from 'lucide-react';

interface AdminNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({ activeTab, onTabChange }) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'chapters', label: 'Chapter Management', icon: Building },
    { id: 'trades', label: 'Trades & Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports & Invoices', icon: FileText },
    { id: 'audit', label: 'Audit Trail', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Mail }
  ];

  return (
    <Card className="mb-6 shadow-md border-border">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminNavigation;
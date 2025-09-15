import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import AdminNavigation from '@/components/admin/AdminNavigation';
import AdminDashboardOverview from '@/components/admin/AdminDashboardOverview';
import UserManagement from '@/components/admin/UserManagement';

const AdministratorDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardOverview onNavigate={setActiveTab} />;
      case 'users':
        return <UserManagement />;
      case 'chapters':
        return <div className="p-8 text-center text-muted-foreground">Chapter Management - Coming Soon</div>;
      case 'trades':
        return <div className="p-8 text-center text-muted-foreground">Trade & Payment Management - Coming Soon</div>;
      case 'reports':
        return <div className="p-8 text-center text-muted-foreground">Reports & Invoices - Coming Soon</div>;
      case 'audit':
        return <div className="p-8 text-center text-muted-foreground">Audit Trail - Coming Soon</div>;
      case 'notifications':
        return <div className="p-8 text-center text-muted-foreground">Notifications - Coming Soon</div>;
      default:
        return <AdminDashboardOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <AdminNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default AdministratorDashboard;
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboardOverview from '@/components/admin/AdminDashboardOverview';
import UserManagement from '@/components/admin/UserManagement';
import ChapterManagement from '@/components/admin/ChapterManagement';
import TradeManagement from '@/components/admin/TradeManagement';
import ReportsManagement from '@/components/admin/ReportsManagement';
import AuditTrail from '@/components/admin/AuditTrail';
import NotificationManagement from '@/components/admin/NotificationManagement';

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
        return <ChapterManagement />;
      case 'trades':
        return <TradeManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'audit':
        return <AuditTrail />;
      case 'notifications':
        return <NotificationManagement />;
      default:
        return <AdminDashboardOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeSection={activeTab} onNavigate={setActiveTab}>
      <div className="p-4 md:p-6">
        {renderContent()}
      </div>
    </AdminLayout>
  );
};

export default AdministratorDashboard;
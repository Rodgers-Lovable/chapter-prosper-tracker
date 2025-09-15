import React from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import MemberDashboard from '@/components/dashboard/MemberDashboard';
import ChapterLeaderDashboard from '@/components/dashboard/ChapterLeaderDashboard';
import AdministratorDashboard from '@/components/dashboard/AdministratorDashboard';
import LoadingSpinner from '@/components/ui/loading-spinner';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return <LoadingSpinner />;
  }

  switch (profile.role) {
    case 'administrator':
      return <AdministratorDashboard />;
    case 'chapter_leader':
      return <ChapterLeaderDashboard />;
    case 'member':
    default:
      return <MemberDashboard />;
  }
};

export default Dashboard;
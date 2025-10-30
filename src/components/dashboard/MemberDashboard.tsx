import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import MemberLayout from '@/components/member/MemberLayout';
import ProfileManagement from '@/components/member/ProfileManagement';
import MetricsInput from '@/components/member/MetricsInput';
import MetricsChart from '@/components/member/MetricsChart';
import MetricsHistory from '@/components/member/MetricsHistory';
import TradeDeclaration from '@/components/member/TradeDeclaration';
import TradesPanel from '@/components/member/TradesPanel';
import Leaderboard from '@/components/member/Leaderboard';
import ReportsPanel from '@/components/member/ReportsPanel';
import { metricsService, MetricEntry, MetricsSummary } from '@/lib/services/metricsService';
import { tradesService, TradeWithProfiles } from '@/lib/services/tradesService';

const MemberDashboard = () => {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [trades, setTrades] = useState<TradeWithProfiles[]>([]);
  const [summary, setSummary] = useState<MetricsSummary>({
    participation: 0, learning: 0, activity: 0, networking: 0, trade: 0
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!profile?.id || !profile?.chapter_id) return;
    
    setLoading(true);
    try {
      const [metricsResult, tradesResult, summaryResult, leaderboardResult] = await Promise.all([
        metricsService.getUserMetrics(profile.id),
        tradesService.getUserTrades(profile.id),
        metricsService.getMetricsSummary(profile.id),
        metricsService.getChapterLeaderboard(profile.chapter_id)
      ]);

      if (metricsResult.data) setMetrics(metricsResult.data);
      if (tradesResult.data) setTrades(tradesResult.data);
      if (summaryResult.data) setSummary(summaryResult.data);
      if (leaderboardResult.data) setLeaderboard(leaderboardResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Welcome back, {profile?.full_name}!</h2>
              <p className="text-muted-foreground">
                Manage your PLANT metrics, trades, and business networking activities
              </p>
            </div>
            <MetricsChart 
              metrics={metrics} 
              chartType={chartType} 
              onChartTypeChange={setChartType} 
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TradesPanel trades={trades.slice(0, 5)} isLoading={loading} />
              <Leaderboard 
                data={leaderboard.slice(0, 5)} 
                currentUserId={profile?.id || ''} 
                isLoading={loading} 
              />
            </div>
          </div>
        );
      case 'profile':
        return <ProfileManagement onUpdate={loadData} />;
      case 'metrics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetricsInput onMetricAdded={loadData} />
              <div className="space-y-6">
                <MetricsChart 
                  metrics={metrics} 
                  chartType={chartType} 
                  onChartTypeChange={setChartType} 
                />
              </div>
            </div>
            <MetricsHistory metrics={metrics} isLoading={loading} />
          </div>
        );
      case 'trades':
        return (
          <div className="space-y-6">
            <TradeDeclaration onTradeAdded={loadData} />
            <TradesPanel trades={trades} isLoading={loading} />
          </div>
        );
      case 'leaderboard':
        return (
          <Leaderboard 
            data={leaderboard} 
            currentUserId={profile?.id || ''} 
            isLoading={loading} 
          />
        );
      case 'reports':
        return (
          <ReportsPanel 
            metrics={metrics}
            trades={trades}
            summary={summary}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MemberLayout 
      activeSection={activeSection} 
      onNavigate={setActiveSection}
      summary={summary}
    >
      <div className="p-4 md:p-6">
        {renderContent()}
      </div>
    </MemberLayout>
  );
};

export default MemberDashboard;
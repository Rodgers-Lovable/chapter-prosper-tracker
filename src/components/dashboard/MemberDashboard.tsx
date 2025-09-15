import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Welcome back, {profile?.full_name}!</h2>
          <p className="text-muted-foreground">
            Manage your PLANT metrics, trades, and business networking activities
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="leaderboard">Rankings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="profile">
            <ProfileManagement onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="trades" className="space-y-6">
            <TradeDeclaration onTradeAdded={loadData} />
            <TradesPanel trades={trades} isLoading={loading} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard 
              data={leaderboard} 
              currentUserId={profile?.id || ''} 
              isLoading={loading} 
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsPanel 
              metrics={metrics}
              trades={trades}
              summary={summary}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MemberDashboard;
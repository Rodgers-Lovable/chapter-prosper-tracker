import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import ChapterLeaderLayout from '@/components/chapter-leader/ChapterLeaderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { chapterLeaderService, ChapterStats, ChapterMember } from '@/lib/services/chapterLeaderService';
import { useToast } from '@/hooks/use-toast';

const ChapterMetrics = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ChapterStats | null>(null);
  const [members, setMembers] = useState<ChapterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.chapter_id) {
      fetchChapterData();
    }
  }, [profile?.chapter_id]);

  const fetchChapterData = async () => {
    if (!profile?.chapter_id) return;

    setLoading(true);
    setError(null);
    
    try {
      const [statsResult, membersResult] = await Promise.all([
        chapterLeaderService.getChapterStats(profile.chapter_id),
        chapterLeaderService.getChapterMembers(profile.chapter_id, 1, 50)
      ]);

      if (statsResult.error) {
        throw new Error(statsResult.error);
      }
      if (membersResult.error) {
        throw new Error(membersResult.error);
      }

      setStats(statsResult.data);
      setMembers(membersResult.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chapter data';
      setError(errorMessage);
      toast({
        title: "Error loading metrics",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTopPerformers = () => {
    return members
      .filter(m => m.metrics?.total > 0)
      .sort((a, b) => (b.metrics?.total || 0) - (a.metrics?.total || 0))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <ChapterLeaderLayout>
        <div className="p-4 md:p-6">
          <LoadingSpinner />
        </div>
      </ChapterLeaderLayout>
    );
  }

  if (error) {
    return (
      <ChapterLeaderLayout>
        <div className="p-4 md:p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </ChapterLeaderLayout>
    );
  }

  const activeMembers = members.filter(m => !m.isInactive).length;
  const participationRate = members.length > 0 ? Math.round((activeMembers / members.length) * 100) : 0;
  const topPerformer = getTopPerformers()[0];

  return (
    <ChapterLeaderLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-secondary" />
          <h2 className="text-2xl font-bold text-foreground">PLANT Metrics Monitoring</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Metrics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats?.totalLearningHours || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.monthlyGrowth.learningHours > 0 ? '+' : ''}
                {stats?.monthlyGrowth.learningHours.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeMembers}</div>
              <p className="text-xs text-muted-foreground">{participationRate}% participation rate</p>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Participation</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats?.avgParticipation.toFixed(1) || '0.0'}</div>
              <p className="text-xs text-muted-foreground">Points per member</p>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {topPerformer?.full_name?.split(' ')[0] || 'None'}
              </div>
              <p className="text-xs text-muted-foreground">
                {topPerformer?.metrics?.total || 0} points total
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Chapter Metrics Overview</CardTitle>
            <CardDescription>Monitor PLANT metrics across your chapter members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4 text-foreground">Metrics by Type</h4>
                  <div className="space-y-4">
                    {[
                      { 
                        name: 'Participation', 
                        value: stats?.avgParticipation || 0,
                        color: 'bg-gradient-to-r from-primary to-primary/80',
                        textColor: 'text-primary'
                      },
                      { 
                        name: 'Learning Hours', 
                        value: stats?.totalLearningHours || 0,
                        color: 'bg-gradient-to-r from-secondary to-secondary/80',
                        textColor: 'text-secondary'
                      },
                      { 
                        name: 'Members', 
                        value: stats?.totalMembers || 0,
                        color: 'bg-gradient-to-r from-accent to-accent/80',
                        textColor: 'text-accent'
                      },
                      { 
                        name: 'Revenue', 
                        value: Math.round(stats?.totalRevenue || 0),
                        color: 'bg-gradient-to-r from-success to-success/80',
                        textColor: 'text-success'
                      }
                    ].map((metric) => {
                      const maxValue = Math.max(
                        stats?.avgParticipation || 0,
                        stats?.totalLearningHours || 0,
                        stats?.totalMembers || 0,
                        Math.round(stats?.totalRevenue || 0) / 1000 // Scale revenue for display
                      );
                      const percentage = maxValue > 0 ? Math.round((metric.value / maxValue) * 100) : 0;
                      
                      return (
                        <div key={metric.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{metric.name}</span>
                             <span className={`text-sm font-bold ${metric.textColor}`}>
                               {metric.name === 'Revenue' ? formatCurrency(metric.value) : metric.value}
                             </span>
                          </div>
                          <div className="relative">
                            <Progress 
                              value={percentage} 
                              className="h-2"
                            />
                            <div 
                              className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${metric.color}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4 text-foreground">Top Contributors</h4>
                  <div className="space-y-3">
                    {getTopPerformers().length > 0 ? (
                      getTopPerformers().map((member, index) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">{index + 1}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">
                                {member.full_name || 'Unknown Member'}
                              </span>
                              <div className="text-xs text-muted-foreground">
                                P:{member.metrics?.participation || 0} L:{member.metrics?.learning || 0} 
                                A:{member.metrics?.activity || 0} N:{member.metrics?.networking || 0} 
                                T:{member.metrics?.trade || 0}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-secondary">
                              {member.metrics?.total || 0}
                            </span>
                            <div className="text-xs text-muted-foreground">total</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No metrics data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-border">
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-foreground">Compliance Overview</h5>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active members:</span>
                    <Badge variant="outline" className="text-success border-success">
                      {activeMembers} / {members.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Participation rate:</span>
                    <Badge variant="outline" className="text-primary border-primary">
                      {participationRate}%
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-foreground">Growth Trends</h5>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly growth:</span>
                    <Badge 
                      variant="outline" 
                      className={stats?.monthlyGrowth.learningHours >= 0 ? "text-success border-success" : "text-destructive border-destructive"}
                    >
                      {stats?.monthlyGrowth.learningHours > 0 ? '+' : ''}{stats?.monthlyGrowth.learningHours.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Metrics are updated in real-time and reflect member activity across all PLANT categories. 
                  Use this data to identify engagement patterns and support member growth.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterMetrics;
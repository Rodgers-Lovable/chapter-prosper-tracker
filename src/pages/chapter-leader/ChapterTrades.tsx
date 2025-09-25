import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import ChapterLeaderLayout from '@/components/chapter-leader/ChapterLeaderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, TrendingUp, AlertTriangle, FileText, Download, RefreshCw } from 'lucide-react';
import { chapterLeaderService, ChapterStats, ChapterTrade } from '@/lib/services/chapterLeaderService';
import { useToast } from '@/hooks/use-toast';

const ChapterTrades = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ChapterStats | null>(null);
  const [trades, setTrades] = useState<ChapterTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.chapter_id) {
      fetchChapterTradesData();
    }
  }, [profile?.chapter_id]);

  const fetchChapterTradesData = async () => {
    if (!profile?.chapter_id) return;

    setLoading(true);
    setError(null);
    
    try {
      const [statsResult, tradesResult] = await Promise.all([
        chapterLeaderService.getChapterStats(profile.chapter_id),
        chapterLeaderService.getChapterTrades(profile.chapter_id, 1, 20)
      ]);

      if (statsResult.error) {
        throw new Error(statsResult.error);
      }
      if (tradesResult.error) {
        throw new Error(tradesResult.error);
      }

      setStats(statsResult.data);
      setTrades(tradesResult.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chapter trades';
      setError(errorMessage);
      toast({
        title: "Error loading trades",
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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge variant="outline" className="text-success border-success">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
      case 'invoiced':
        return <Badge variant="outline" className="text-info border-info">Invoiced</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-destructive border-destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'M';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const pendingTrades = trades.filter(t => t.status === 'pending').length;
  const paidTrades = trades.filter(t => t.status === 'paid').length;
  const totalTradesCount = trades.length;
  const successRate = totalTradesCount > 0 ? Math.round((paidTrades / totalTradesCount) * 100) : 0;

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

  return (
    <ChapterLeaderLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-secondary" />
            <h2 className="text-2xl font-bold text-foreground">Trade & Payment Oversight</h2>
          </div>
          <Button onClick={fetchChapterTradesData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalTradesCount}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.monthlyGrowth.revenue > 0 ? '+' : ''}
                {stats?.monthlyGrowth.revenue.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{pendingTrades}</div>
              <p className="text-xs text-muted-foreground">
                {pendingTrades > 0 ? 'Require attention' : 'All up to date'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{successRate}%</div>
              <p className="text-xs text-muted-foreground">Payment completion</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">Chapter Trade Activities</CardTitle>
                <CardDescription>Monitor and manage trade declarations from chapter members</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trades.length > 0 ? (
                trades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials(trade.user?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {trade.user?.full_name || 'Unknown Member'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {trade.description || 'No description provided'}
                          </p>
                          {trade.beneficiary_member && (
                            <p className="text-xs text-muted-foreground">
                              To: {trade.beneficiary_member.full_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right mr-6">
                      <p className="font-bold text-secondary">
                        {formatCurrency(trade.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trade.created_at).toLocaleDateString('en-KE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      {trade.mpesa_reference && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {trade.mpesa_reference}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(trade.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No trades found</h3>
                  <p className="text-muted-foreground">
                    No trade declarations have been made by chapter members yet.
                  </p>
                </div>
              )}
              
              {trades.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      All trade declarations from your chapter members. Monitor payment status 
                      and ensure compliance with PLANT metrics tracking requirements.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        View All
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ChapterLeaderLayout>
  );
};

export default ChapterTrades;